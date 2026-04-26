import Foundation
import Observation

@Observable
final class SessionViewModel {
    private let storage: SecureStorageService
    private let graphQL: GraphQLService
    private let demoData: DemoDataService
    private let localization: LocalizationService

    var state: SessionState = .loading
    var activeServerName: String?
    var activeServerURL: String?
    var isDemoMode = false
    var errorMessage: String?
    var isWorking = false

    init(
        storage: SecureStorageService,
        graphQL: GraphQLService,
        demoData: DemoDataService,
        localization: LocalizationService
    ) {
        self.storage = storage
        self.graphQL = graphQL
        self.demoData = demoData
        self.localization = localization
    }

    func restoreSession() async {
        guard state == .loading else { return }

        if storage.isDemoMode() {
            signInDemo()
            return
        }

        guard let server = storage.activeServer(), let credentials = try? storage.credentials(for: server) else {
            state = .signedOut
            return
        }

        graphQL.updateCredentials(credentials)
        activeServerName = server.name
        activeServerURL = server.serverURL
        isDemoMode = false
        state = .signedIn
    }

    func login(serverURL: String, apiKey: String, allowsSelfSignedCertificate: Bool = false) async {
        errorMessage = nil
        let trimmedURL = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedKey = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedURL.isEmpty else {
            errorMessage = localization.text("login.errorNoServerIP")
            return
        }
        guard !trimmedKey.isEmpty else {
            errorMessage = localization.text("login.errorNoApiKey")
            return
        }

        isWorking = true
        defer { isWorking = false }

        let credentials = UnraidCredentials(
            serverURL: trimmedURL,
            apiKey: trimmedKey,
            allowsSelfSignedCertificate: allowsSelfSignedCertificate
        )
        do {
            try await graphQL.validate(credentials: credentials)
            let server = SavedServer(
                name: defaultServerName(from: trimmedURL),
                serverURL: trimmedURL,
                allowsSelfSignedCertificate: allowsSelfSignedCertificate
            )
            try storage.addServer(server, apiKey: trimmedKey, makeActive: true)
            storage.setDemoMode(false)
            graphQL.updateCredentials(credentials)
            activeServerName = server.name
            activeServerURL = server.serverURL
            isDemoMode = false
            state = .signedIn
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func enableDemoMode() {
        errorMessage = nil
        isWorking = false
        storage.setDemoMode(true)
        signInDemo()
    }

    func logout() {
        errorMessage = nil
        storage.clearSession()
        graphQL.updateCredentials(nil)
        activeServerName = nil
        activeServerURL = nil
        isDemoMode = false
        state = .signedOut
    }

    func switchServer(_ server: SavedServer) async throws {
        let credentials = try storage.credentials(for: server)
        try await graphQL.validate(credentials: credentials)
        storage.setActiveServerId(server.id)
        storage.setDemoMode(false)
        graphQL.updateCredentials(credentials)
        activeServerName = server.name
        activeServerURL = server.serverURL
        isDemoMode = false
        state = .signedIn
    }

    func addServer(_ server: SavedServer, apiKey: String) async throws {
        let credentials = UnraidCredentials(
            serverURL: server.serverURL,
            apiKey: apiKey,
            allowsSelfSignedCertificate: server.allowsSelfSignedCertificate
        )
        try await graphQL.validate(credentials: credentials)
        let makeActive = storage.servers().isEmpty || storage.activeServerId() == nil
        try storage.addServer(server, apiKey: apiKey, makeActive: makeActive)

        if makeActive {
            storage.setDemoMode(false)
            graphQL.updateCredentials(credentials)
            activeServerName = server.name
            activeServerURL = server.serverURL
            isDemoMode = false
            state = .signedIn
        }
    }

    private func signInDemo() {
        graphQL.updateCredentials(nil)
        activeServerName = localization.text("app.demoServer")
        activeServerURL = nil
        isDemoMode = true
        state = .signedIn
    }

    private func defaultServerName(from urlString: String) -> String {
        URL(string: urlString)?.host ?? "Unraid Server"
    }
}

@Observable
final class DashboardViewModel {
    private let graphQL: GraphQLService
    private let storage: SecureStorageService
    private let demoData: DemoDataService
    private let session: SessionViewModel

    var dashboard: DashboardData?
    var isLoading = false
    var errorMessage: String?

    init(graphQL: GraphQLService, storage: SecureStorageService, demoData: DemoDataService, session: SessionViewModel) {
        self.graphQL = graphQL
        self.storage = storage
        self.demoData = demoData
        self.session = session
    }

    func load() async {
        if session.isDemoMode {
            dashboard = demoData.dashboard
            errorMessage = nil
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let data = try await graphQL.dashboard()
            dashboard = data
            storage.saveLastDashboard(data)
            errorMessage = nil
        } catch {
            dashboard = storage.lastDashboard()
            errorMessage = error.localizedDescription
        }
    }

    func setArrayStarted(_ started: Bool) async {
        guard !session.isDemoMode else {
            errorMessage = nil
            return
        }

        do {
            if started {
                try await graphQL.startArray()
            } else {
                try await graphQL.stopArray()
            }
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

@Observable
final class DockerViewModel {
    private let graphQL: GraphQLService
    private let demoData: DemoDataService
    private let session: SessionViewModel

    var containers: [DockerContainer] = []
    var searchText = ""
    var isLoading = false
    var errorMessage: String?
    var actionMessage: String?

    init(graphQL: GraphQLService, demoData: DemoDataService, session: SessionViewModel) {
        self.graphQL = graphQL
        self.demoData = demoData
        self.session = session
    }

    var filteredContainers: [DockerContainer] {
        guard !searchText.isEmpty else { return containers }
        return containers.filter {
            $0.displayName.localizedCaseInsensitiveContains(searchText) ||
            ($0.image ?? "").localizedCaseInsensitiveContains(searchText) ||
            ($0.status ?? "").localizedCaseInsensitiveContains(searchText) ||
            ($0.state ?? "").localizedCaseInsensitiveContains(searchText)
        }
    }

    func load() async {
        if session.isDemoMode {
            containers = demoData.dockerContainers
            errorMessage = nil
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            containers = try await graphQL.dockerContainers()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func setRunning(_ running: Bool, container: DockerContainer) async {
        guard !session.isDemoMode else {
            actionMessage = "Docker actions are disabled in demo mode."
            return
        }
        do {
            if running {
                try await graphQL.startContainer(id: container.id)
            } else {
                try await graphQL.stopContainer(id: container.id)
            }
            await load()
            actionMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

@Observable
final class VMsViewModel {
    private let graphQL: GraphQLService
    private let demoData: DemoDataService
    private let session: SessionViewModel

    var vms: [VirtualMachine] = []
    var searchText = ""
    var isLoading = false
    var errorMessage: String?
    var actionMessage: String?

    init(graphQL: GraphQLService, demoData: DemoDataService, session: SessionViewModel) {
        self.graphQL = graphQL
        self.demoData = demoData
        self.session = session
    }

    var filteredVMs: [VirtualMachine] {
        guard !searchText.isEmpty else { return vms }
        return vms.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            ($0.state ?? "").localizedCaseInsensitiveContains(searchText)
        }
    }

    func load() async {
        if session.isDemoMode {
            vms = demoData.virtualMachines
            errorMessage = nil
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            vms = try await graphQL.virtualMachines()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func setRunning(_ running: Bool, vm: VirtualMachine) async {
        guard !session.isDemoMode else {
            actionMessage = "VM actions are disabled in demo mode."
            return
        }
        do {
            if running {
                try await graphQL.startVM(id: vm.id)
            } else {
                try await graphQL.stopVM(id: vm.id)
            }
            await load()
            actionMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

@Observable
final class NotificationsViewModel {
    private let graphQL: GraphQLService
    private let demoData: DemoDataService
    private let session: SessionViewModel

    var payload: NotificationPayload?
    var selectedType: NotificationListType = .unread
    var importanceFilter: NotificationImportanceFilter = .all
    var isLoading = false
    var errorMessage: String?

    init(graphQL: GraphQLService, demoData: DemoDataService, session: SessionViewModel) {
        self.graphQL = graphQL
        self.demoData = demoData
        self.session = session
    }

    func load() async {
        if session.isDemoMode {
            payload = filteredDemoPayload()
            errorMessage = nil
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            payload = try await graphQL.notifications(type: selectedType, importance: importanceFilter)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func filteredDemoPayload() -> NotificationPayload {
        let raw = demoData.notifications
        let list = raw.list.filter { item in
            item.type == selectedType.rawValue &&
            (importanceFilter == .all || item.importance == importanceFilter.rawValue)
        }
        return NotificationPayload(overview: raw.overview, list: list)
    }
}

@Observable
final class SettingsViewModel {
    private let preferences: AppPreferences
    let localization: LocalizationService
    let session: SessionViewModel

    var settings: AppSettings

    init(preferences: AppPreferences, localization: LocalizationService, session: SessionViewModel) {
        self.preferences = preferences
        self.localization = localization
        self.session = session
        self.settings = preferences.settings
    }

    func updatePollingInterval(_ interval: TimeInterval) {
        preferences.updatePollingInterval(interval)
        settings = preferences.settings
    }

    func updateTheme(_ theme: AppTheme) {
        preferences.updateTheme(theme)
        settings = preferences.settings
    }

    func updateLocale(_ locale: AppLocale) {
        preferences.updateLocale(locale)
        settings = preferences.settings
        localization.setLocale(locale)
    }
}

@Observable
final class ServerManagementViewModel {
    private let storage: SecureStorageService
    private let session: SessionViewModel

    var servers: [SavedServer] = []
    var activeServerId: String?
    var errorMessage: String?
    var isWorking = false

    init(storage: SecureStorageService, session: SessionViewModel) {
        self.storage = storage
        self.session = session
        reload()
    }

    func reload() {
        servers = storage.servers()
        activeServerId = storage.activeServerId()
    }

    func addServer(
        name: String,
        serverURL: String,
        apiKey: String,
        allowsSelfSignedCertificate: Bool
    ) async {
        errorMessage = nil
        let server = SavedServer(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Unraid Server" : name,
            serverURL: serverURL.trimmingCharacters(in: .whitespacesAndNewlines),
            allowsSelfSignedCertificate: allowsSelfSignedCertificate
        )

        isWorking = true
        defer { isWorking = false }

        do {
            try await session.addServer(server, apiKey: apiKey.trimmingCharacters(in: .whitespacesAndNewlines))
            reload()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func makeActive(_ server: SavedServer) async {
        errorMessage = nil
        isWorking = true
        defer { isWorking = false }

        do {
            try await session.switchServer(server)
            reload()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func remove(_ server: SavedServer) {
        do {
            let wasActive = activeServerId == server.id
            try storage.removeServer(id: server.id)
            if wasActive {
                session.logout()
            }
            reload()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
