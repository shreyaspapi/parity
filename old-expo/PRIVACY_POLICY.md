# Privacy Policy for Parity

**Last Updated:** November 10, 2025

## Introduction

Parity ("we," "our," or "the app") is a mobile application for monitoring and managing Unraid servers. We are committed to protecting your privacy and being transparent about our data practices.

**Important:** Parity is designed with privacy in mind. We do not collect, store, or transmit any personal information to our servers. All data remains on your device and your Unraid servers.

## Information We Do NOT Collect

Parity does not collect, store, or transmit:

- Personal information (name, email, phone number, etc.)
- Analytics or usage data
- Device identifiers or advertising IDs
- Location data
- Browsing history or app usage patterns
- Crash reports or diagnostics
- Any other telemetry or tracking data

## Information Stored Locally on Your Device

The following information is stored exclusively on your device using secure local storage:

### Server Connection Details
- Server names (friendly labels you create)
- Server IP addresses or hostnames
- Port numbers
- API keys for authenticating with your Unraid servers

### Application Settings
- Theme preferences (light/dark mode)
- Notification preferences
- Auto-refresh settings
- Quiet hours configuration
- Biometric authentication preferences

### Cached Server Data
- System metrics (CPU, RAM, network usage)
- Disk status and health information
- Docker container information
- Virtual machine details
- Historical data for offline viewing

All locally stored data is:
- Encrypted using platform-native secure storage mechanisms
- Never transmitted to third parties
- Deleted when you uninstall the app
- Removable at any time through the app's settings

## Biometric Authentication

If you enable biometric authentication (Face ID, Touch ID, or Fingerprint):

- Biometric data is processed entirely by your device's operating system
- We do not have access to your biometric information
- We only receive a yes/no authentication result from the OS
- Your biometric data never leaves your device

## Data Transmission

Parity communicates directly with YOUR Unraid servers using the official Unraid API. This means:

### What We Send to Your Server
- API authentication requests using your API key
- Commands you initiate (start/stop containers, VMs, etc.)
- Queries for server status and metrics

### What Your Server Sends to the App
- System metrics and status information
- Docker container data
- Virtual machine information
- Array and disk health data

### Important Notes
- All communication occurs directly between the app and your Unraid server
- We (the app developers) do not receive or have access to this data
- The security of this communication depends on your API key and network configuration
- We recommend using HTTPS/SSL connections when available

## Push Notifications

If you enable push notifications:

- Notifications are generated locally on your device based on server metrics
- We use Expo's push notification service only as a delivery mechanism
- No notification content is analyzed or stored by us
- You can disable notifications at any time in the app settings

## Third-Party Services

Parity uses the following third-party services:

### Expo Platform
- **Purpose:** App framework and push notification delivery
- **Data Shared:** Device push tokens (if notifications are enabled)
- **Privacy Policy:** [https://expo.dev/privacy](https://expo.dev/privacy)

### Your Unraid Server
- **Purpose:** Source of all server management and monitoring data
- **Data Shared:** API keys, commands, and queries
- **Privacy:** Under your control and hosted on your infrastructure

## Children's Privacy

Parity is not directed at children under the age of 13. We do not knowingly collect information from children under 13.

## Data Security

We implement security measures including:

- Encrypted storage for API keys and sensitive data
- Secure communication protocols (HTTPS when available)
- No transmission of data to external servers
- Platform-native security features (Keychain on iOS, Keystore on Android)

## Your Rights and Choices

You have complete control over your data:

### Access Your Data
- All data is stored locally on your device
- Access it anytime through the app interface

### Delete Your Data
- Remove individual servers from Settings → Manage Servers
- Clear all data by uninstalling the app
- Use "Clear Cache" in app settings to remove cached metrics

### Export Your Data
- Server configuration can be manually noted or exported
- No cloud backup or sync features exist

### Disable Features
- Turn off notifications in Settings
- Disable biometric authentication
- Disable auto-refresh to limit data fetching

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last Updated" date above. Continued use of the app after changes constitutes acceptance of the updated policy.

## Open Source Transparency

Parity is open-source software. You can review our code to verify our privacy practices at:
- GitHub Repository: [https://github.com/yourusername/parity](https://github.com/yourusername/parity)

## Contact Us

If you have questions about this privacy policy or our data practices:

- **GitHub Issues:** [https://github.com/yourusername/parity/issues](https://github.com/yourusername/parity/issues)
- **GitHub Discussions:** [https://github.com/yourusername/parity/discussions](https://github.com/yourusername/parity/discussions)
- **Email:** [your-email@example.com](mailto:your-email@example.com)

## Data Protection Compliance

### GDPR (European Users)
Since we don't collect or process personal data on our servers, most GDPR requirements are not applicable. However:
- You have full control over data stored on your device
- You can delete all data by uninstalling the app
- We do not transfer data outside your device except to your own servers

### CCPA (California Users)
Under the CCPA:
- We do not sell personal information
- We do not collect personal information beyond what's stored locally
- You have the right to delete data stored on your device

### Other Jurisdictions
Our privacy-first approach complies with most data protection regulations worldwide, as we do not collect or process personal data centrally.

## Technical Details for Transparency

### Local Storage Technologies
- **iOS:** Secure Keychain for sensitive data, AsyncStorage for app preferences
- **Android:** Android Keystore for sensitive data, AsyncStorage for app preferences

### Network Connections
- Direct connections to user-specified Unraid servers only
- Optional: Expo push notification service for notification delivery
- No analytics, tracking, or advertising services

### Permissions Required
The app may request the following permissions:
- **Network Access:** To communicate with your Unraid server
- **Notifications:** To send you alerts about your server (optional)
- **Biometric Authentication:** To secure access to the app (optional)

---

## Summary

**Parity is a privacy-focused app that:**
- ✅ Stores all data locally on your device
- ✅ Communicates only with your Unraid servers
- ✅ Does not collect analytics or telemetry
- ✅ Does not sell or share your data
- ✅ Is open-source and transparent
- ✅ Gives you complete control over your data

**We do NOT:**
- ❌ Collect personal information
- ❌ Track your usage
- ❌ Store data on our servers
- ❌ Share data with third parties (except necessary services like push notifications)
- ❌ Use advertising or analytics

---

*This privacy policy is effective as of the date listed above and applies to all users of the Parity mobile application.*

