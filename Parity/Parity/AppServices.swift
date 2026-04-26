import Apollo
import Foundation
import Observation
import Security

@Observable
final class AppContainer {
    let storage: SecureStorageService
    let graphQL: GraphQLService
    let demoData: DemoDataService
    let localization: LocalizationService
    let preferences: AppPreferences
    let session: SessionViewModel

    init(
        storage: SecureStorageService,
        graphQL: GraphQLService,
        demoData: DemoDataService,
        localization: LocalizationService,
        preferences: AppPreferences
    ) {
        self.storage = storage
        self.graphQL = graphQL
        self.demoData = demoData
        self.localization = localization
        self.preferences = preferences
        self.session = SessionViewModel(
            storage: storage,
            graphQL: graphQL,
            demoData: demoData,
            localization: localization
        )
    }

    static func live() -> AppContainer {
        let storage = SecureStorageService()
        let localization = LocalizationService(storage: storage)
        let preferences = AppPreferences(storage: storage)
        return AppContainer(
            storage: storage,
            graphQL: GraphQLService(),
            demoData: DemoDataService(),
            localization: localization,
            preferences: preferences
        )
    }

    static func preview() -> AppContainer {
        let storage = SecureStorageService(suiteName: "preview.parity")
        let localization = LocalizationService(storage: storage)
        let preferences = AppPreferences(storage: storage)
        return AppContainer(
            storage: storage,
            graphQL: GraphQLService(),
            demoData: DemoDataService(),
            localization: localization,
            preferences: preferences
        )
    }
}

@Observable
final class AppPreferences {
    private let storage: SecureStorageService
    var settings: AppSettings

    init(storage: SecureStorageService) {
        self.storage = storage
        self.settings = storage.settings()
    }

    func updatePollingInterval(_ interval: TimeInterval) {
        settings.pollingInterval = interval
        storage.saveSettings(settings)
    }

    func updateTheme(_ theme: AppTheme) {
        settings.theme = theme
        storage.saveSettings(settings)
    }

    func updateLocale(_ locale: AppLocale) {
        settings.localeIdentifier = locale.rawValue
        storage.saveSettings(settings)
    }
}

final class SecureStorageService {
    private let defaults: UserDefaults
    private let keychain = KeychainStore()

    private enum DefaultsKey {
        static let servers = "unraid.servers"
        static let activeServerId = "unraid.activeServerId"
        static let settings = "unraid.settings"
        static let demoMode = "unraid.demoMode"
        static let lastDashboard = "unraid.lastDashboard"
    }

    init(suiteName: String? = nil) {
        if let suiteName, let defaults = UserDefaults(suiteName: suiteName) {
            self.defaults = defaults
        } else {
            self.defaults = .standard
        }
    }

    func servers() -> [SavedServer] {
        decode([SavedServer].self, forKey: DefaultsKey.servers) ?? []
    }

    func saveServers(_ servers: [SavedServer]) {
        encode(servers, forKey: DefaultsKey.servers)
    }

    func addServer(_ server: SavedServer, apiKey: String, makeActive: Bool) throws {
        var updated = servers().filter { $0.id != server.id }
        updated.append(server)
        saveServers(updated)
        try keychain.set(apiKey, account: keychainAccount(for: server.id))
        if makeActive {
            setActiveServerId(server.id)
        }
    }

    func removeServer(id: String) throws {
        saveServers(servers().filter { $0.id != id })
        try keychain.delete(account: keychainAccount(for: id))
        if activeServerId() == id {
            setActiveServerId(nil)
        }
    }

    func activeServerId() -> String? {
        defaults.string(forKey: DefaultsKey.activeServerId)
    }

    func setActiveServerId(_ id: String?) {
        if let id {
            defaults.set(id, forKey: DefaultsKey.activeServerId)
        } else {
            defaults.removeObject(forKey: DefaultsKey.activeServerId)
        }
    }

    func activeServer() -> SavedServer? {
        guard let id = activeServerId() else { return nil }
        return servers().first { $0.id == id }
    }

    func credentials(for server: SavedServer) throws -> UnraidCredentials {
        let apiKey = try keychain.string(account: keychainAccount(for: server.id))
        return UnraidCredentials(
            serverURL: server.serverURL,
            apiKey: apiKey,
            allowsSelfSignedCertificate: server.allowsSelfSignedCertificate
        )
    }

    func settings() -> AppSettings {
        decode(AppSettings.self, forKey: DefaultsKey.settings) ?? AppSettings()
    }

    func saveSettings(_ settings: AppSettings) {
        encode(settings, forKey: DefaultsKey.settings)
    }

    func isDemoMode() -> Bool {
        defaults.bool(forKey: DefaultsKey.demoMode)
    }

    func setDemoMode(_ enabled: Bool) {
        defaults.set(enabled, forKey: DefaultsKey.demoMode)
    }

    func saveLastDashboard(_ dashboard: DashboardData?) {
        encode(dashboard, forKey: DefaultsKey.lastDashboard)
    }

    func lastDashboard() -> DashboardData? {
        decode(DashboardData.self, forKey: DefaultsKey.lastDashboard)
    }

    func clearSession() {
        setActiveServerId(nil)
        setDemoMode(false)
    }

    private func keychainAccount(for serverId: String) -> String {
        "unraid.apiKey.\(serverId)"
    }

    private func encode<T: Encodable>(_ value: T, forKey key: String) {
        if let data = try? JSONEncoder().encode(value) {
            defaults.set(data, forKey: key)
        }
    }

    private func decode<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
        guard let data = defaults.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }
}

private final class KeychainStore {
    private let service = "com.parity.unraid"

    func set(_ value: String, account: String) throws {
        let data = Data(value.utf8)
        let query = baseQuery(account: account)
        SecItemDelete(query as CFDictionary)

        var attributes = query
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        let status = SecItemAdd(attributes as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError(status: status) }
    }

    func string(account: String) throws -> String {
        var query = baseQuery(account: account)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data, let value = String(data: data, encoding: .utf8) else {
            throw KeychainError(status: status)
        }
        return value
    }

    func delete(account: String) throws {
        let status = SecItemDelete(baseQuery(account: account) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw KeychainError(status: status) }
    }

    private func baseQuery(account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
    }
}

private struct KeychainError: LocalizedError {
    var status: OSStatus
    var errorDescription: String? {
        SecCopyErrorMessageString(status, nil) as String? ?? "Keychain error \(status)"
    }
}

final class GraphQLService {
    private var credentials: UnraidCredentials?
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func updateCredentials(_ credentials: UnraidCredentials?) {
        self.credentials = credentials
    }

    func validate(credentials: UnraidCredentials) async throws {
        _ = try await perform(
            query: GraphQLOperations.healthCheck,
            variables: nil,
            credentials: credentials,
            responseType: HealthCheckResponse.self
        )
    }

    func dashboard() async throws -> DashboardData {
        let response = try await perform(
            query: GraphQLOperations.dashboard,
            variables: nil,
            credentials: requiredCredentials(),
            responseType: DashboardResponse.self
        )
        return response.dashboardData
    }

    func dockerContainers() async throws -> [DockerContainer] {
        let response = try await perform(
            query: GraphQLOperations.dockerContainers,
            variables: nil,
            credentials: requiredCredentials(),
            responseType: DockerContainersResponse.self
        )
        return response.docker?.containers ?? []
    }

    func virtualMachines() async throws -> [VirtualMachine] {
        let response = try await perform(
            query: GraphQLOperations.vms,
            variables: nil,
            credentials: requiredCredentials(),
            responseType: VMsResponse.self
        )
        return response.vms.map(\.domain)
    }

    func notifications(
        type: NotificationListType,
        importance: NotificationImportanceFilter
    ) async throws -> NotificationPayload {
        var filter: [String: Any] = [
            "type": type.rawValue,
            "offset": 0,
            "limit": 50
        ]
        if importance != .all {
            filter["importance"] = importance.rawValue
        }
        let variables: [String: Any] = [
            "filter": filter
        ]
        let response = try await perform(
            query: GraphQLOperations.notifications,
            variables: variables,
            credentials: requiredCredentials(),
            responseType: NotificationsResponse.self
        )
        return response.notifications
    }

    func startContainer(id: String) async throws {
        try await runMutation(GraphQLOperations.startContainer, id: id)
    }

    func stopContainer(id: String) async throws {
        try await runMutation(GraphQLOperations.stopContainer, id: id)
    }

    func startVM(id: String) async throws {
        try await runMutation(GraphQLOperations.startVM, id: id)
    }

    func stopVM(id: String) async throws {
        try await runMutation(GraphQLOperations.stopVM, id: id)
    }

    func startArray() async throws {
        try await runMutation(GraphQLOperations.startArray)
    }

    func stopArray() async throws {
        try await runMutation(GraphQLOperations.stopArray)
    }

    private func runMutation(_ query: String, id: String? = nil) async throws {
        let variables = id.map { ["id": $0] }
        let response = try await perform(
            query: query,
            variables: variables,
            credentials: requiredCredentials(),
            responseType: EmptyGraphQLData.self
        )
        _ = response
    }

    private func requiredCredentials() throws -> UnraidCredentials {
        guard let credentials else { throw GraphQLClientError.missingCredentials }
        return credentials
    }

    private func perform<T: Decodable>(
        query: String,
        variables: [String: Any]?,
        credentials: UnraidCredentials,
        responseType: T.Type
    ) async throws -> T {
        guard let url = URL(string: credentials.serverURL.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            throw GraphQLClientError.invalidURL
        }

        var payload: [String: Any] = ["query": query]
        if let variables {
            payload["variables"] = variables
        }

        var request = URLRequest(url: url, timeoutInterval: 10)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(credentials.apiKey, forHTTPHeaderField: "x-api-key")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let requestSession = credentials.allowsSelfSignedCertificate
            ? URLSession(
                configuration: .ephemeral,
                delegate: SelfSignedCertificateDelegate(host: url.host),
                delegateQueue: nil
            )
            : session

        let (data, response) = try await requestSession.data(for: request)
        if credentials.allowsSelfSignedCertificate {
            requestSession.finishTasksAndInvalidate()
        }
        if let httpResponse = response as? HTTPURLResponse, !(200..<300).contains(httpResponse.statusCode) {
            throw GraphQLClientError.httpStatus(httpResponse.statusCode)
        }

        let graphQLResponse = try JSONDecoder().decode(GraphQLResponse<T>.self, from: data)
        if let firstError = graphQLResponse.errors?.first {
            throw firstError
        }
        guard let data = graphQLResponse.data else {
            throw GraphQLClientError.emptyData
        }
        return data
    }
}

private final class SelfSignedCertificateDelegate: NSObject, URLSessionDelegate {
    private let host: String?

    init(host: String?) {
        self.host = host
    }

    nonisolated func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping @Sendable (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              challenge.protectionSpace.host == host,
              let trust = challenge.protectionSpace.serverTrust else {
            completionHandler(.performDefaultHandling, nil)
            return
        }

        completionHandler(.useCredential, URLCredential(trust: trust))
    }
}

private struct EmptyGraphQLData: Decodable {}

enum GraphQLClientError: LocalizedError {
    case missingCredentials
    case invalidURL
    case httpStatus(Int)
    case emptyData

    var errorDescription: String? {
        switch self {
        case .missingCredentials:
            "Missing server credentials."
        case .invalidURL:
            "The server URL is invalid."
        case .httpStatus(let status):
            "Server returned HTTP \(status)."
        case .emptyData:
            "The server returned an empty GraphQL response."
        }
    }
}

final class DemoDataService {
    var dashboard: DashboardData {
        DashboardData(
            info: SystemInfo(
                time: ISO8601DateFormatter().string(from: Date()),
                os: OSInfo(platform: "linux", distro: "Unraid", release: "Demo", uptime: .number(245_000), hostname: "demo-tower", kernel: "demo"),
                cpu: CPUInfo(manufacturer: "Intel", brand: "Demo Xeon", cores: 8, threads: 16, speed: 3.2, flags: nil),
                baseboard: Baseboard(manufacturer: "Parity", model: "Demo Board", version: "1.0", memMax: 128, memSlots: 4),
                devices: Devices(network: [NetworkInterface(iface: "eth0", model: "Demo NIC", vendor: "Parity", mac: "00:00:00:00:00:00", virtual: false, speed: "10Gbps", dhcp: true)]),
                versions: Versions(core: CoreVersions(unraid: "7.0-demo", api: "demo", kernel: "demo"))
            ),
            metrics: Metrics(
                cpu: CPUMetrics(percentTotal: 37, cpus: nil),
                memory: MemoryMetrics(total: .number(68_719_476_736), used: .number(28_319_476_736), free: .number(40_400_000_000), available: .number(40_400_000_000), percentTotal: 42)
            ),
            array: ArrayInfo(
                state: "STARTED",
                capacity: ArrayCapacity(kilobytes: DiskCapacity(total: 24, used: 14, free: 10), disks: DiskCapacity(total: 6, used: 4, free: 2)),
                disks: [
                    Disk(name: "disk1", size: .string("8 TB"), status: "active", temp: 34, device: "sdb", fsType: "xfs", type: "data"),
                    Disk(name: "disk2", size: .string("8 TB"), status: "active", temp: 35, device: "sdc", fsType: "xfs", type: "data")
                ],
                caches: [Disk(name: "cache", size: .string("2 TB"), status: "active", temp: 31, device: "nvme0n1", fsType: "btrfs", type: "cache")],
                boot: Disk(name: "flash", size: .string("32 GB"), status: "active", temp: nil, device: "usb", fsType: "vfat", type: "boot")
            ),
            docker: DockerInfo(containers: dockerContainers),
            shares: [Share(name: "Media", size: 8, used: 5, free: 3, comment: "Demo media share")],
            vars: Vars(name: "Parity Demo", version: "1.0"),
            registration: Registration(type: "Trial", state: "Active")
        )
    }

    var dockerContainers: [DockerContainer] {
        [
            DockerContainer(id: "demo-plex", names: ["plex"], image: "plexinc/pms-docker", state: "running", status: "Up 4 hours", autoStart: true, ports: nil, created: .number(Date().timeIntervalSince1970)),
            DockerContainer(id: "demo-backup", names: ["backup"], image: "restic/restic", state: "exited", status: "Exited", autoStart: false, ports: nil, created: .number(Date().timeIntervalSince1970))
        ]
    }

    var virtualMachines: [VirtualMachine] {
        [
            VirtualMachine(id: "vm-home-assistant", name: "Home Assistant", state: "running"),
            VirtualMachine(id: "vm-ubuntu", name: "Ubuntu Lab", state: "shutoff")
        ]
    }

    var notifications: NotificationPayload {
        NotificationPayload(
            overview: NotificationOverview(
                unread: NotificationCounts(info: 2, warning: 1, alert: 0, total: 3),
                archive: NotificationCounts(info: 12, warning: 2, alert: 1, total: 15)
            ),
            list: [
                UnraidNotification(id: "demo-note-1", title: "Parity Demo", subject: "Notice [UNRAID] - array health report [PASS]", description: "All demo disks are online.", importance: "INFO", type: "UNREAD", link: nil, timestamp: nil, formattedTimestamp: "Just now"),
                UnraidNotification(id: "demo-note-2", title: "Docker Update", subject: "Warning [DOCKER] - container update available", description: "A demo container has an update available.", importance: "WARNING", type: "UNREAD", link: nil, timestamp: nil, formattedTimestamp: "5 minutes ago"),
                UnraidNotification(id: "demo-note-3", title: "Previous Alert", subject: "Alert [ARRAY] - disk temperature [OK]", description: "Archived demo alert for reviewer navigation.", importance: "ALERT", type: "ARCHIVE", link: nil, timestamp: nil, formattedTimestamp: "Yesterday")
            ]
        )
    }
}

@Observable
final class LocalizationService {
    private let storage: SecureStorageService
    private(set) var locale: AppLocale

    init(storage: SecureStorageService) {
        self.storage = storage
        let saved = storage.settings().localeIdentifier
        self.locale = saved.flatMap(AppLocale.init(rawValue:)) ?? Self.bestDeviceLocale()
    }

    var availableLocales: [AppLocale] {
        AppLocale.allCases
    }

    func setLocale(_ locale: AppLocale) {
        self.locale = locale
        var settings = storage.settings()
        settings.localeIdentifier = locale.rawValue
        storage.saveSettings(settings)
    }

    func text(_ key: String) -> String {
        String(localized: String.LocalizationValue(key), bundle: .main, locale: Locale(identifier: locale.rawValue))
    }

    private static func bestDeviceLocale() -> AppLocale {
        let preferred = Locale.preferredLanguages
        for identifier in preferred {
            if let exact = AppLocale(rawValue: identifier) {
                return exact
            }
            let language = Locale(identifier: identifier).language.languageCode?.identifier
            if language == "zh" {
                return .zhHans
            }
            if let language, let match = AppLocale(rawValue: language) {
                return match
            }
        }
        return .en
    }
}
