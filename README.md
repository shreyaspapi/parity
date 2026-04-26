# Parity

Parity is a native SwiftUI iOS app for monitoring and managing Unraid servers from iPhone and iPad.

The current app lives in `Parity/Parity`. The previous Expo/React Native app has been preserved in `old-expo` for reference during the migration.

## Features

- Native SwiftUI app using MVVM-style view models and service layers.
- Unraid GraphQL login with API key authentication.
- Support for HTTP, trusted HTTPS, and opt-in self-signed HTTPS certificates.
- Dashboard with system, performance, array, share, and array-control entry points.
- Docker and VM lists with search, refresh, and start/stop controls.
- Notifications with unread/archive and importance filters.
- Multi-server storage with API keys stored in Keychain.
- Demo mode for App Store review and local exploration without a server.
- In-app language selection backed by a Swift String Catalog.
- Light, dark, and system appearance settings.

## Project Structure

```text
Parity/
  Parity.xcodeproj      Native SwiftUI Xcode project
  Parity/               SwiftUI app source, assets, localization, GraphQL docs

old-expo/               Legacy Expo app kept for migration reference
```

## Requirements

- Xcode 26.2 or newer
- iOS 26.2 SDK
- An Unraid server with the Unraid API available
- An API key created on the server

The app uses Apollo iOS as a Swift Package dependency. The current request layer sends GraphQL documents through `URLSession` while keeping the operation files and Apollo package in place for generated-operation adoption.

## Running the App

1. Open `Parity/Parity.xcodeproj` in Xcode.
2. Select the `Parity` scheme.
3. Choose an iPhone or iPad simulator/device.
4. Build and run.

Command-line build:

```sh
xcodebuild -project "Parity/Parity.xcodeproj" -scheme "Parity" -destination "generic/platform=iOS" build
```

## Connecting to Unraid

On your Unraid server, create an API key:

```sh
unraid-api apikey --create --name "Parity App"
```

In the app, enter the full GraphQL URL and API key.

Examples:

```text
https://tower.local:3001/graphql
https://192.168.1.100:3001/graphql
http://192.168.1.100:3001/graphql
```

Leave "Allow self-signed certificate" off for normal HTTPS. Enable it only for a trusted local server using a self-signed certificate.

## API Permissions

Recommended read permissions:

- `info`
- `metrics`
- `array`
- `shares`
- `vars`
- `registration`
- `docker`
- `vms`
- `notifications`

Optional control permissions:

- `array.setState`
- `docker.start`
- `docker.stop`
- `vm.start`
- `vm.stop`

Without control permissions, monitoring can still work but start/stop actions may fail.

## Demo Mode

Demo mode is available from the login screen. It uses local sample data and does not require a server, API key, or network connection.

This path is intended for App Store review and for quickly exploring the app UI. Destructive or infrastructure-changing actions are disabled in demo mode.

## Localization

Localized strings live in `Parity/Parity/Localizable.xcstrings`.

Supported languages:

- English
- Spanish
- French
- German
- Portuguese
- Simplified Chinese
- Japanese
- Italian
- Korean
- Russian
- Dutch
- Polish
- Turkish
- Arabic
- Swedish

## Legacy Expo App

The original Expo implementation is in `old-expo`. It remains useful for comparing feature parity, GraphQL query behavior, UI copy, and localization keys while the SwiftUI app continues to evolve.

## Notes

- Credentials are stored in Keychain.
- Non-secret settings are stored in UserDefaults.
- Local HTTP/LAN connections are supported for Unraid deployments that do not use public TLS.
