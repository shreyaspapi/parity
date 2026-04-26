//
//  ContentView.swift
//  Parity
//
//  Created by Sangeeta Papinwar on 26/04/26.
//

import SwiftUI

struct ContentView: View {
    @Environment(AppContainer.self) private var container

    var body: some View {
        Group {
            switch container.session.state {
            case .loading:
                LoadingStateView(message: container.localization.text("common.loading"))
            case .signedOut:
                LoginView(session: container.session)
            case .signedIn:
                MainTabView(container: container)
            }
        }
        .preferredColorScheme(container.preferences.settings.theme.preferredColorScheme)
        .task {
            await container.session.restoreSession()
        }
    }
}

private extension AppTheme {
    var preferredColorScheme: ColorScheme? {
        switch self {
        case .system:
            nil
        case .light:
            .light
        case .dark:
            .dark
        }
    }
}

#Preview {
    let container = AppContainer.preview()
    ContentView()
        .environment(container)
        .environment(container.localization)
}
