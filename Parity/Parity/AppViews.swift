import Foundation
import SwiftUI

struct LoadingStateView: View {
    var message: String

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
            Text(message)
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.background)
    }
}

struct LoginView: View {
    let session: SessionViewModel
    @Environment(LocalizationService.self) private var localization
    @State private var serverURL = ""
    @State private var apiKey = ""
    @State private var allowsSelfSignedCertificate = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        Image(systemName: "server.rack")
                            .font(.system(size: 48, weight: .semibold))
                            .foregroundStyle(.blue)
                            .accessibilityHidden(true)

                        Text(localization.text("login.title"))
                            .font(.largeTitle.bold())

                        Text(localization.text("login.subtitle"))
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }

                    VStack(spacing: 16) {
                        TextField(localization.text("login.serverIP"), text: $serverURL)
                            .keyboardType(.URL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textContentType(.URL)
                            .accessibilityLabel(localization.text("login.serverIP"))

                        SecureField(localization.text("login.apiKey"), text: $apiKey)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .accessibilityLabel(localization.text("login.apiKey"))

                        Toggle(localization.text("native.allowSelfSignedCertificate"), isOn: $allowsSelfSignedCertificate)
                            .font(.callout)
                    }
                    .textFieldStyle(.roundedBorder)

                    Text(localization.text("native.sslLoginHint"))
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    if let message = session.errorMessage {
                        ErrorBanner(message: message)
                    }

                    Button {
                        Task {
                            await session.login(
                                serverURL: serverURL,
                                apiKey: apiKey,
                                allowsSelfSignedCertificate: allowsSelfSignedCertificate
                            )
                        }
                    } label: {
                        Label(localization.text("login.connect"), systemImage: "checkmark.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .disabled(session.isWorking)

                    HStack {
                        Rectangle().frame(height: 1).foregroundStyle(Color(uiColor: .separator))
                        Text(localization.text("login.or"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Rectangle().frame(height: 1).foregroundStyle(Color(uiColor: .separator))
                    }

                    Button {
                        session.enableDemoMode()
                    } label: {
                        Label(localization.text("login.tryDemo"), systemImage: "play.circle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                    .disabled(session.isWorking)

                    Text(localization.text("login.footer"))
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    Text(localization.text("native.demoReviewNote"))
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(24)
                .frame(maxWidth: 560)
            }
            .frame(maxWidth: .infinity)
            .background(.background)
        }
    }
}

struct MainTabView: View {
    let container: AppContainer

    var body: some View {
        TabView {
            DashboardView(container: container)
                .tabItem { Label(container.localization.text("dashboard.title"), systemImage: "gauge.with.dots.needle.67percent") }

            DockerView(container: container)
                .tabItem { Label(container.localization.text("docker.title"), systemImage: "shippingbox") }

            VMsView(container: container)
                .tabItem { Label(container.localization.text("vms.title"), systemImage: "desktopcomputer") }

            NotificationsView(container: container)
                .tabItem { Label(container.localization.text("notifications.title"), systemImage: "bell") }

            SettingsView(container: container)
                .tabItem { Label(container.localization.text("settings.title"), systemImage: "gearshape") }
        }
    }
}

struct DashboardView: View {
    let container: AppContainer
    @Environment(LocalizationService.self) private var localization
    @State private var viewModel: DashboardViewModel

    init(container: AppContainer) {
        self.container = container
        _viewModel = State(initialValue: DashboardViewModel(
            graphQL: container.graphQL,
            storage: container.storage,
            demoData: container.demoData,
            session: container.session
        ))
    }

    var body: some View {
        @Bindable var viewModel = viewModel

        NavigationStack {
            List {
                if container.session.isDemoMode {
                    DemoBanner(message: localization.text("dashboard.demoModeSubtext"))
                }

                if let dashboard = viewModel.dashboard {
                    if let info = dashboard.info {
                        Section(localization.text("dashboard.systemOverview")) {
                            MetricRow(title: localization.text("dashboard.processor"), value: info.cpu?.brand ?? "-")
                            MetricRow(title: localization.text("native.hostname"), value: info.os?.hostname ?? "-")
                            MetricRow(title: localization.text("native.unraid"), value: info.versions?.core?.unraid ?? "-")
                        }
                    }

                    Section(localization.text("dashboard.performanceTrends")) {
                        MetricRow(title: localization.text("dashboard.cpuUsage"), value: percent(viewModel.dashboard?.metrics?.cpu?.percentTotal))
                        MetricRow(title: localization.text("dashboard.memoryUsage"), value: percent(viewModel.dashboard?.metrics?.memory?.percentTotal))
                    }

                    if let array = dashboard.array {
                        Section(localization.text("dashboard.arrayStatus")) {
                            MetricRow(title: localization.text("dashboard.status"), value: array.state ?? "-")
                            MetricRow(title: localization.text("dashboard.arrayDisks"), value: "\(array.disks?.count ?? 0)")
                            MetricRow(title: localization.text("dashboard.cacheDrives"), value: "\(array.caches?.count ?? 0)")
                        }

                        Section(localization.text("dashboard.arrayControl")) {
                            Button(localization.text("dashboard.start")) {
                                Task { await viewModel.setArrayStarted(true) }
                            }
                            .disabled(container.session.isDemoMode || array.state?.localizedCaseInsensitiveCompare("STARTED") == .orderedSame)

                            Button(localization.text("dashboard.stop"), role: .destructive) {
                                Task { await viewModel.setArrayStarted(false) }
                            }
                            .disabled(container.session.isDemoMode || array.state?.localizedCaseInsensitiveCompare("STOPPED") == .orderedSame)
                        }
                    }

                    if let shares = dashboard.shares, !shares.isEmpty {
                        Section(localization.text("dashboard.shares")) {
                            ForEach(shares) { share in
                                MetricRow(title: share.name, value: share.comment ?? "-")
                            }
                        }
                    }
                } else if viewModel.isLoading {
                    LoadingStateView(message: localization.text("loadingMessages.systemInfo"))
                } else {
                    ContentUnavailableView(localization.text("common.noData"), systemImage: "server.rack")
                }

                if let message = viewModel.errorMessage {
                    ErrorBanner(message: message)
                }
            }
            .navigationTitle(localization.text("dashboard.title"))
            .refreshable { await viewModel.load() }
            .task(id: container.preferences.settings.pollingInterval) {
                await runAutoRefresh(preferences: container.preferences) {
                    await viewModel.load()
                }
            }
        }
    }

    private func percent(_ value: Double?) -> String {
        guard let value else { return "-" }
        return "\(Int(value.rounded()))%"
    }
}

struct DockerView: View {
    let container: AppContainer
    @Environment(LocalizationService.self) private var localization
    @State private var viewModel: DockerViewModel

    init(container: AppContainer) {
        self.container = container
        _viewModel = State(initialValue: DockerViewModel(graphQL: container.graphQL, demoData: container.demoData, session: container.session))
    }

    var body: some View {
        @Bindable var viewModel = viewModel

        NavigationStack {
            List {
                if container.session.isDemoMode {
                    DemoBanner(message: localization.text("dashboard.demoModeSubtext"))
                }

                if viewModel.filteredContainers.isEmpty, !viewModel.isLoading {
                    ContentUnavailableView(localization.text("docker.noContainers"), systemImage: "shippingbox")
                }

                ForEach(viewModel.filteredContainers) { container in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(container.displayName)
                                .font(.headline)
                            Text(container.image ?? container.status ?? "-")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        StatusPill(text: container.state ?? "-", isActive: container.isRunning)
                    }
                    .swipeActions {
                        if !self.container.session.isDemoMode {
                            Button(localization.text("docker.start")) {
                                Task { await viewModel.setRunning(true, container: container) }
                            }
                            .tint(.green)

                            Button(localization.text("docker.stop"), role: .destructive) {
                                Task { await viewModel.setRunning(false, container: container) }
                            }
                        }
                    }
                }

                if let message = viewModel.actionMessage {
                    DemoBanner(message: message)
                }

                if let message = viewModel.errorMessage {
                    ErrorBanner(message: message)
                }
            }
            .navigationTitle(localization.text("docker.title"))
            .searchable(text: $viewModel.searchText, prompt: localization.text("docker.searchContainers"))
            .refreshable { await viewModel.load() }
            .task(id: container.preferences.settings.pollingInterval) {
                await runAutoRefresh(preferences: container.preferences) {
                    await viewModel.load()
                }
            }
        }
    }
}

struct VMsView: View {
    let container: AppContainer
    @Environment(LocalizationService.self) private var localization
    @State private var viewModel: VMsViewModel

    init(container: AppContainer) {
        self.container = container
        _viewModel = State(initialValue: VMsViewModel(graphQL: container.graphQL, demoData: container.demoData, session: container.session))
    }

    var body: some View {
        @Bindable var viewModel = viewModel

        NavigationStack {
            List {
                if container.session.isDemoMode {
                    DemoBanner(message: localization.text("dashboard.demoModeSubtext"))
                }

                if viewModel.filteredVMs.isEmpty, !viewModel.isLoading {
                    ContentUnavailableView(localization.text("vms.noVMs"), systemImage: "desktopcomputer")
                }

                ForEach(viewModel.filteredVMs) { vm in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(vm.name)
                                .font(.headline)
                            Text(vm.id)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        StatusPill(text: vm.state ?? "-", isActive: vm.isRunning)
                    }
                    .swipeActions {
                        if !container.session.isDemoMode {
                            Button(localization.text("vms.start")) {
                                Task { await viewModel.setRunning(true, vm: vm) }
                            }
                            .tint(.green)

                            Button(localization.text("vms.stop"), role: .destructive) {
                                Task { await viewModel.setRunning(false, vm: vm) }
                            }
                        }
                    }
                }

                if let message = viewModel.actionMessage {
                    DemoBanner(message: message)
                }

                if let message = viewModel.errorMessage {
                    ErrorBanner(message: message)
                }
            }
            .navigationTitle(localization.text("vms.title"))
            .searchable(text: $viewModel.searchText, prompt: localization.text("vms.searchVMs"))
            .refreshable { await viewModel.load() }
            .task(id: container.preferences.settings.pollingInterval) {
                await runAutoRefresh(preferences: container.preferences) {
                    await viewModel.load()
                }
            }
        }
    }
}

struct NotificationsView: View {
    let container: AppContainer
    @Environment(LocalizationService.self) private var localization
    @Environment(\.openURL) private var openURL
    @State private var viewModel: NotificationsViewModel

    init(container: AppContainer) {
        self.container = container
        _viewModel = State(initialValue: NotificationsViewModel(graphQL: container.graphQL, demoData: container.demoData, session: container.session))
    }

    var body: some View {
        @Bindable var viewModel = viewModel

        NavigationStack {
            List {
                if container.session.isDemoMode {
                    DemoBanner(message: localization.text("dashboard.demoModeSubtext"))
                }

                Section {
                    Picker(localization.text("notifications.title"), selection: $viewModel.selectedType) {
                        Text(localization.text("notifications.unread")).tag(NotificationListType.unread)
                        Text(localization.text("notifications.archived")).tag(NotificationListType.archive)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: viewModel.selectedType) { _, _ in
                        Task { await viewModel.load() }
                    }

                    Picker(localization.text("notifications.info"), selection: $viewModel.importanceFilter) {
                        Text(localization.text("notifications.all")).tag(NotificationImportanceFilter.all)
                        Text(localization.text("notifications.alerts")).tag(NotificationImportanceFilter.alert)
                        Text(localization.text("notifications.warnings")).tag(NotificationImportanceFilter.warning)
                        Text(localization.text("notifications.info")).tag(NotificationImportanceFilter.info)
                    }
                    .onChange(of: viewModel.importanceFilter) { _, _ in
                        Task { await viewModel.load() }
                    }
                }

                if let overview = viewModel.payload?.overview {
                    Section(localization.text("notifications.summary")) {
                        MetricRow(title: localization.text("notifications.unread"), value: "\(overview.unread?.total ?? 0)")
                        MetricRow(title: localization.text("notifications.archived"), value: "\(overview.archive?.total ?? 0)")
                    }
                }

                if viewModel.isLoading, viewModel.payload == nil {
                    LoadingStateView(message: localization.text("loadingMessages.notifications"))
                } else if let notifications = viewModel.payload?.list, !notifications.isEmpty {
                    Section(localization.text("notifications.title")) {
                        ForEach(notifications) { notification in
                            Button {
                                if let link = notification.link, let url = URL(string: link) {
                                    openURL(url)
                                }
                            } label: {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text(notification.title ?? notification.subject ?? localization.text("notifications.title"))
                                            .font(.headline)
                                        Spacer()
                                        StatusPill(text: notification.importance?.lowercased() ?? localization.text("notifications.info"), isActive: notification.importance == "ALERT")
                                    }
                                    if let subject = notification.subject {
                                        Text(displaySubject(from: subject))
                                            .font(.subheadline.weight(.medium))
                                            .foregroundStyle(.blue)
                                    }
                                    if let description = notification.description {
                                        Text(description)
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Text(notification.formattedTimestamp ?? localization.text("notifications.unknownTime"))
                                        .font(.caption)
                                        .foregroundStyle(.tertiary)
                                }
                                .foregroundStyle(.primary)
                            }
                        }
                    }
                } else if !viewModel.isLoading {
                    ContentUnavailableView(localization.text("notifications.noNotifications"), systemImage: "bell")
                }

                if let message = viewModel.errorMessage {
                    ErrorBanner(message: message)
                }
            }
            .navigationTitle(localization.text("notifications.title"))
            .refreshable { await viewModel.load() }
            .task(id: container.preferences.settings.pollingInterval) {
                await runAutoRefresh(preferences: container.preferences) {
                    await viewModel.load()
                }
            }
        }
    }

    private func displaySubject(from rawSubject: String) -> String {
        let pattern = #"^(?:Notice|Alert|Warning)\s*\[[^\]]+\]\s*-\s*(.+?)\s*(?:\[[^\]]+\])?$"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: rawSubject, range: NSRange(rawSubject.startIndex..., in: rawSubject)),
              match.numberOfRanges > 1,
              let range = Range(match.range(at: 1), in: rawSubject) else {
            return rawSubject
        }

        return rawSubject[range].split(separator: " ").map { word in
            word.prefix(1).uppercased() + word.dropFirst().lowercased()
        }.joined(separator: " ")
    }
}

struct SettingsView: View {
    let container: AppContainer
    @Environment(LocalizationService.self) private var localization
    @State private var viewModel: SettingsViewModel

    init(container: AppContainer) {
        self.container = container
        _viewModel = State(initialValue: SettingsViewModel(preferences: container.preferences, localization: container.localization, session: container.session))
    }

    var body: some View {
        @Bindable var viewModel = viewModel

        NavigationStack {
            List {
                Section(localization.text("settings.serverInformation")) {
                    MetricRow(title: localization.text("settings.activeServer"), value: container.session.activeServerName ?? localization.text("settings.notConnected"))
                    MetricRow(
                        title: localization.text("settings.serverUrl"),
                        value: container.session.isDemoMode ? localization.text("native.demoNoConnection") : (container.session.activeServerURL ?? "-")
                    )
                    NavigationLink(localization.text("settings.manageSavedServers")) {
                        ServersView(container: container)
                    }
                }

                Section(localization.text("settings.appearance")) {
                    Picker(localization.text("settings.theme"), selection: $viewModel.settings.theme) {
                        Text(localization.text("settings.automatic")).tag(AppTheme.system)
                        Text(localization.text("settings.light")).tag(AppTheme.light)
                        Text(localization.text("settings.dark")).tag(AppTheme.dark)
                    }
                    .onChange(of: viewModel.settings.theme) { _, theme in
                        viewModel.updateTheme(theme)
                    }

                    Picker(localization.text("settings.language"), selection: Binding(
                        get: { localization.locale },
                        set: { viewModel.updateLocale($0) }
                    )) {
                        ForEach(localization.availableLocales) { locale in
                            Text(locale.displayName).tag(locale)
                        }
                    }
                }

                Section(localization.text("settings.dataRefresh")) {
                    Picker(localization.text("settings.pollingFrequency"), selection: $viewModel.settings.pollingInterval) {
                        Text(localization.text("native.seconds3")).tag(TimeInterval(3))
                        Text(localization.text("native.seconds5")).tag(TimeInterval(5))
                        Text(localization.text("native.seconds10")).tag(TimeInterval(10))
                        Text(localization.text("native.seconds15")).tag(TimeInterval(15))
                        Text(localization.text("native.seconds30")).tag(TimeInterval(30))
                        Text(localization.text("native.minute1")).tag(TimeInterval(60))
                        Text(localization.text("native.disabled")).tag(TimeInterval(0))
                    }
                    .onChange(of: viewModel.settings.pollingInterval) { _, interval in
                        viewModel.updatePollingInterval(interval)
                    }
                }

                Section(localization.text("settings.actions")) {
                    Button(role: .destructive) {
                        container.session.logout()
                    } label: {
                        Label(localization.text("settings.logout"), systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle(localization.text("settings.title"))
        }
    }
}

struct ServersView: View {
    let container: AppContainer
    @Environment(LocalizationService.self) private var localization
    @State private var viewModel: ServerManagementViewModel
    @State private var showingAddServer = false

    init(container: AppContainer) {
        self.container = container
        _viewModel = State(initialValue: ServerManagementViewModel(storage: container.storage, session: container.session))
    }

    var body: some View {
        List {
            if viewModel.servers.isEmpty {
                ContentUnavailableView(localization.text("servers.noSavedServers"), systemImage: "server.rack")
            }

            ForEach(viewModel.servers) { server in
                HStack {
                    VStack(alignment: .leading) {
                        Text(server.name)
                            .font(.headline)
                        Text(server.serverURL)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if viewModel.activeServerId == server.id {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    }
                }
                .swipeActions {
                    Button(localization.text("servers.makeActive")) {
                        Task { await viewModel.makeActive(server) }
                    }
                    .tint(.blue)

                    Button(localization.text("servers.remove"), role: .destructive) {
                        viewModel.remove(server)
                    }
                }
            }

            if let message = viewModel.errorMessage {
                ErrorBanner(message: message)
            }
        }
        .navigationTitle(localization.text("servers.title"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingAddServer = true
                } label: {
                    Label(localization.text("servers.addServer"), systemImage: "plus")
                }
            }
        }
        .sheet(isPresented: $showingAddServer) {
            AddServerView(viewModel: viewModel)
        }
        .onAppear { viewModel.reload() }
    }
}

struct AddServerView: View {
    let viewModel: ServerManagementViewModel
    @Environment(\.dismiss) private var dismiss
    @Environment(LocalizationService.self) private var localization
    @State private var name = ""
    @State private var serverURL = ""
    @State private var apiKey = ""
    @State private var allowsSelfSignedCertificate = false

    var body: some View {
        NavigationStack {
            Form {
                TextField(localization.text("servers.name"), text: $name)
                TextField(localization.text("servers.serverUrl"), text: $serverURL)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                SecureField(localization.text("servers.apiKey"), text: $apiKey)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                Toggle(localization.text("native.allowSelfSignedCertificate"), isOn: $allowsSelfSignedCertificate)

                Text(localization.text("native.sslLoginHint"))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .navigationTitle(localization.text("servers.addNewServer"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(localization.text("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(localization.text("common.save")) {
                        Task {
                            await viewModel.addServer(
                                name: name,
                                serverURL: serverURL,
                                apiKey: apiKey,
                                allowsSelfSignedCertificate: allowsSelfSignedCertificate
                            )
                            if viewModel.errorMessage == nil {
                                dismiss()
                            }
                        }
                    }
                    .disabled(serverURL.isEmpty || apiKey.isEmpty || viewModel.isWorking)
                }
            }
        }
    }
}

struct MetricRow: View {
    var title: String
    var value: String

    var body: some View {
        HStack {
            Text(title)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.trailing)
        }
        .accessibilityElement(children: .combine)
    }
}

struct ErrorBanner: View {
    var message: String

    var body: some View {
        Label(message, systemImage: "exclamationmark.triangle.fill")
            .font(.callout)
            .foregroundStyle(.red)
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.red.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
            .accessibilityElement(children: .combine)
    }
}

struct DemoBanner: View {
    var message: String

    var body: some View {
        Label(message, systemImage: "play.circle.fill")
            .font(.callout)
            .foregroundStyle(.blue)
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.blue.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
            .accessibilityElement(children: .combine)
    }
}

struct StatusPill: View {
    var text: String
    var isActive: Bool

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .foregroundStyle(isActive ? .green : .secondary)
            .background((isActive ? Color.green : Color.secondary).opacity(0.15), in: Capsule())
    }
}

@MainActor
private func runAutoRefresh(preferences: AppPreferences, action: @escaping () async -> Void) async {
    await action()

    while !Task.isCancelled {
        let interval = preferences.settings.pollingInterval
        guard interval > 0 else { return }

        try? await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
        guard !Task.isCancelled else { return }
        await action()
    }
}
