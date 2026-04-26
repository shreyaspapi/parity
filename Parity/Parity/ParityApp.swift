//
//  ParityApp.swift
//  Parity
//
//  Created by Sangeeta Papinwar on 26/04/26.
//

import SwiftUI

@main
struct ParityApp: App {
    @State private var container = AppContainer.live()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(container)
                .environment(container.localization)
        }
    }
}
