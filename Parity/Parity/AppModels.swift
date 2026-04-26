import Foundation

enum SessionState: Equatable {
    case loading
    case signedOut
    case signedIn
}

struct UnraidCredentials: Codable, Equatable {
    var serverURL: String
    var apiKey: String
    var allowsSelfSignedCertificate: Bool = false
}

struct SavedServer: Codable, Identifiable, Equatable {
    var id: String
    var name: String
    var serverURL: String
    var allowsSelfSignedCertificate: Bool

    init(
        id: String = UUID().uuidString,
        name: String,
        serverURL: String,
        allowsSelfSignedCertificate: Bool = false
    ) {
        self.id = id
        self.name = name
        self.serverURL = serverURL
        self.allowsSelfSignedCertificate = allowsSelfSignedCertificate
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case serverURL
        case allowsSelfSignedCertificate
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        serverURL = try container.decode(String.self, forKey: .serverURL)
        allowsSelfSignedCertificate = try container.decodeIfPresent(Bool.self, forKey: .allowsSelfSignedCertificate) ?? false
    }
}

enum AppTheme: String, Codable, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }
}

enum NotificationListType: String, Codable, CaseIterable, Identifiable {
    case unread = "UNREAD"
    case archive = "ARCHIVE"

    var id: String { rawValue }
}

enum NotificationImportanceFilter: String, Codable, CaseIterable, Identifiable {
    case all = "ALL"
    case alert = "ALERT"
    case warning = "WARNING"
    case info = "INFO"

    var id: String { rawValue }
}

struct AppSettings: Codable, Equatable {
    var pollingInterval: TimeInterval = 5
    var theme: AppTheme = .system
    var localeIdentifier: String?
}

enum AppLocale: String, CaseIterable, Identifiable, Codable {
    case en
    case es
    case fr
    case de
    case pt
    case zhHans = "zh-Hans"
    case ja
    case it
    case ko
    case ru
    case nl
    case pl
    case tr
    case ar
    case sv

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .en: "English"
        case .es: "Español"
        case .fr: "Français"
        case .de: "Deutsch"
        case .pt: "Português"
        case .zhHans: "简体中文"
        case .ja: "日本語"
        case .it: "Italiano"
        case .ko: "한국어"
        case .ru: "Русский"
        case .nl: "Nederlands"
        case .pl: "Polski"
        case .tr: "Türkçe"
        case .ar: "العربية"
        case .sv: "Svenska"
        }
    }
}

struct GraphQLResponse<T: Decodable>: Decodable {
    var data: T?
    var errors: [GraphQLServerError]?
}

struct GraphQLServerError: Decodable, Error, LocalizedError {
    var message: String

    var errorDescription: String? { message }
}

struct HealthCheckResponse: Decodable {
    var info: HealthInfo?
}

struct HealthInfo: Decodable {
    var os: OSInfo?
}

struct DashboardData: Codable, Equatable {
    var info: SystemInfo?
    var metrics: Metrics?
    var array: ArrayInfo?
    var docker: DockerInfo?
    var shares: [Share]?
    var vars: Vars?
    var registration: Registration?
}

struct DashboardResponse: Decodable {
    var info: SystemInfo?
    var metrics: Metrics?
    var array: ArrayInfo?
    var docker: DockerInfo?
    var shares: [Share]?
    var vars: Vars?
    var registration: Registration?

    var dashboardData: DashboardData {
        DashboardData(
            info: info,
            metrics: metrics,
            array: array,
            docker: docker,
            shares: shares,
            vars: vars,
            registration: registration
        )
    }
}

struct SystemInfo: Codable, Equatable {
    var time: String?
    var os: OSInfo?
    var cpu: CPUInfo?
    var baseboard: Baseboard?
    var devices: Devices?
    var versions: Versions?
}

struct OSInfo: Codable, Equatable {
    var platform: String?
    var distro: String?
    var release: String?
    var uptime: FlexibleString?
    var hostname: String?
    var kernel: String?
}

struct CPUInfo: Codable, Equatable {
    var manufacturer: String?
    var brand: String?
    var cores: Int?
    var threads: Int?
    var speed: Double?
    var flags: String?
}

struct Baseboard: Codable, Equatable {
    var manufacturer: String?
    var model: String?
    var version: String?
    var memMax: Int?
    var memSlots: Int?
}

struct Devices: Codable, Equatable {
    var network: [NetworkInterface]?
}

struct NetworkInterface: Codable, Equatable, Identifiable {
    var id: String { iface }
    var iface: String
    var model: String?
    var vendor: String?
    var mac: String?
    var virtual: Bool?
    var speed: String?
    var dhcp: Bool?
}

struct Versions: Codable, Equatable {
    var core: CoreVersions?
}

struct CoreVersions: Codable, Equatable {
    var unraid: String?
    var api: String?
    var kernel: String?
}

struct Metrics: Codable, Equatable {
    var cpu: CPUMetrics?
    var memory: MemoryMetrics?
}

struct CPUMetrics: Codable, Equatable {
    var percentTotal: Double?
    var cpus: [CPUCore]?
}

struct CPUCore: Codable, Equatable {
    var percentTotal: Double?
    var percentUser: Double?
    var percentSystem: Double?
    var percentIdle: Double?
}

struct MemoryMetrics: Codable, Equatable {
    var total: FlexibleString?
    var used: FlexibleString?
    var free: FlexibleString?
    var available: FlexibleString?
    var percentTotal: Double?
}

struct ArrayInfo: Codable, Equatable {
    var state: String?
    var capacity: ArrayCapacity?
    var disks: [Disk]?
    var caches: [Disk]?
    var boot: Disk?
}

struct ArrayCapacity: Codable, Equatable {
    var kilobytes: DiskCapacity?
    var disks: DiskCapacity?
}

struct DiskCapacity: Codable, Equatable {
    var total: Double?
    var used: Double?
    var free: Double?
}

struct Disk: Codable, Equatable, Identifiable {
    var id: String { name }
    var name: String
    var size: FlexibleString?
    var status: String?
    var temp: Double?
    var device: String?
    var fsType: String?
    var type: String?
    var fsSize: Double?
    var fsFree: Double?
    var fsUsed: Double?
}

struct DockerInfo: Codable, Equatable {
    var containers: [DockerContainer]?
}

struct DockerContainersResponse: Decodable {
    var docker: DockerInfo?
}

struct DockerContainer: Codable, Equatable, Identifiable {
    var id: String
    var names: [String]
    var image: String?
    var state: String?
    var status: String?
    var autoStart: Bool?
    var ports: [DockerPort]?
    var created: FlexibleString?

    var displayName: String {
        names.first?.trimmingCharacters(in: CharacterSet(charactersIn: "/")) ?? id
    }

    var isRunning: Bool {
        state?.localizedCaseInsensitiveCompare("running") == .orderedSame
    }
}

struct DockerPort: Codable, Equatable {
    var privatePort: Int?
    var publicPort: Int?
    var type: String?
}

struct VMsResponse: Decodable {
    var vms: [VMNode]
}

struct VMNode: Codable, Equatable {
    var domain: VirtualMachine
}

struct VirtualMachine: Codable, Equatable, Identifiable {
    var id: String
    var name: String
    var state: String?

    var isRunning: Bool {
        state?.localizedCaseInsensitiveCompare("running") == .orderedSame
    }
}

struct NotificationsResponse: Decodable {
    var notifications: NotificationPayload
}

struct NotificationPayload: Codable, Equatable {
    var overview: NotificationOverview?
    var list: [UnraidNotification]
}

struct NotificationOverview: Codable, Equatable {
    var unread: NotificationCounts?
    var archive: NotificationCounts?
}

struct NotificationCounts: Codable, Equatable {
    var info: Int?
    var warning: Int?
    var alert: Int?
    var total: Int?
}

struct UnraidNotification: Codable, Equatable, Identifiable {
    var id: String
    var title: String?
    var subject: String?
    var description: String?
    var importance: String?
    var type: String?
    var link: String?
    var timestamp: String?
    var formattedTimestamp: String?
}

struct Share: Codable, Equatable, Identifiable {
    var id: String { name }
    var name: String
    var size: Double?
    var used: Double?
    var free: Double?
    var comment: String?
}

struct Vars: Codable, Equatable {
    var name: String?
    var version: String?
}

struct Registration: Codable, Equatable {
    var type: String?
    var state: String?
}

enum FlexibleString: Codable, Equatable, CustomStringConvertible {
    case string(String)
    case number(Double)

    var description: String {
        switch self {
        case .string(let value): value
        case .number(let value): value.formatted()
        }
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let string = try? container.decode(String.self) {
            self = .string(string)
        } else {
            self = .number(try container.decode(Double.self))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        }
    }
}
