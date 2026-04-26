# Contributing to Parity

Thank you for your interest in contributing to Parity! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Public or private harassment
- Publishing others' private information
- Any conduct that could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- pnpm package manager
- Git for version control
- A code editor (VS Code recommended)
- An Unraid server for testing (or use demo mode)
- iOS/Android development environment (optional, for native builds)

### First-Time Contributors

If this is your first contribution:

1. Look for issues labeled `good first issue` or `help wanted`
2. Read through the [Architecture Guide](docs/ARCHITECTURE.md)
3. Familiarize yourself with the codebase structure
4. Join our community discussions

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/parity.git
cd parity

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/parity.git
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Development Server

```bash
pnpm start
```

### 4. Run on Device/Emulator

```bash
# iOS (requires macOS)
pnpm ios

# Android
pnpm android

# Web
pnpm web
```

### 5. Configure Test Server

For testing, you can either:

- Use demo mode (no Unraid server required)
- Connect to your Unraid server with API key
- Set up a local Unraid test environment

---

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Fixes** - Fix issues reported in GitHub Issues
2. **New Features** - Implement features from the roadmap
3. **Documentation** - Improve or add documentation
4. **UI/UX Improvements** - Enhance the user interface
5. **Performance Optimizations** - Make the app faster
6. **Tests** - Add unit or integration tests
7. **Translations** - Add support for new languages (future)

### Contribution Workflow

1. **Check existing issues** - Avoid duplicate work
2. **Create an issue** - Discuss your idea before starting
3. **Fork the repository** - Work on your own copy
4. **Create a branch** - Use descriptive branch names
5. **Make your changes** - Follow coding standards
6. **Test thoroughly** - Ensure nothing breaks
7. **Submit a pull request** - Provide clear description

---

## Coding Standards

### TypeScript

- **Always use TypeScript** - No plain JavaScript files
- **Explicit types** - Avoid `any` type when possible
- **Interfaces over types** - Use interfaces for objects
- **Proper naming** - Use PascalCase for types/interfaces

```typescript
// Good
interface ServerConfig {
  serverIP: string;
  apiKey: string;
}

// Avoid
type ServerConfig = {
  serverIP: any;
  apiKey: any;
}
```

### React Components

- **Functional components** - Use hooks, not class components
- **Props interfaces** - Define explicit prop types
- **Component file naming** - Use kebab-case for files, PascalCase for components
- **Export patterns** - Use named exports for components

```typescript
// Good - circular-progress.tsx
interface CircularProgressProps {
  percentage: number;
  label: string;
  size?: number;
}

export function CircularProgress({ percentage, label, size = 100 }: CircularProgressProps) {
  // Component logic
}
```

### File Organization

```
feature-name/
├── component-name.tsx       # Main component
├── component-name.test.tsx  # Tests
├── types.ts                 # Type definitions
└── utils.ts                 # Helper functions
```

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: Max 100 characters (soft limit)
- **Trailing commas**: Required for multi-line

Run the linter to check your code:

```bash
pnpm lint
```

### Component Patterns

#### Custom Hooks

```typescript
// Good naming: use prefix
export function useServerData(serverId: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Hook logic
  
  return { data, loading };
}
```

#### Service Functions

```typescript
// Service pattern
export class AuthService {
  static async validateCredentials(credentials: Credentials): Promise<boolean> {
    // Validation logic
  }
}
```

#### Error Handling

```typescript
// Always handle errors gracefully
try {
  const result = await fetchData();
  return result;
} catch (error) {
  console.error('Failed to fetch data:', error);
  throw new Error('User-friendly error message');
}
```

---

## Commit Guidelines

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

#### Examples

```bash
# Feature
git commit -m "feat(docker): add container log viewer"

# Bug fix
git commit -m "fix(auth): resolve timeout issue on slow connections"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Multiple paragraphs
git commit -m "feat(notifications): add push notification support

- Integrate Firebase Cloud Messaging
- Add notification settings screen
- Implement quiet hours feature

Closes #123"
```

### Commit Best Practices

- Write clear, concise commit messages
- Keep commits focused on a single change
- Reference issue numbers when applicable
- Use present tense ("add feature" not "added feature")

---

## Pull Request Process

### Before Submitting

1. **Update from upstream** - Sync with latest main branch
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes** - Ensure everything works
   ```bash
   pnpm lint
   pnpm test  # when tests are available
   ```

3. **Update documentation** - If you changed APIs or added features

4. **Add tests** - For new features or bug fixes

### Submitting a Pull Request

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill out the PR template**:
   - Clear description of changes
   - Link to related issues
   - Screenshots (for UI changes)
   - Testing performed
   - Breaking changes (if any)

4. **Respond to feedback** - Address review comments promptly

### PR Title Format

Follow the same convention as commit messages:

```
feat(docker): add container log viewer
fix(auth): resolve timeout issue
docs(api): update GraphQL documentation
```

### Review Process

- Maintainers will review your PR
- You may be asked to make changes
- Once approved, your PR will be merged
- Your contribution will be acknowledged in release notes

---

## Reporting Bugs

### Before Reporting

1. **Search existing issues** - Check if already reported
2. **Try latest version** - Ensure bug exists in current release
3. **Reproduce the issue** - Confirm it's reproducible

### Bug Report Template

When creating a bug report, include:

**Title**: Clear, descriptive title

**Description**:
- What happened
- What you expected to happen
- Steps to reproduce

**Environment**:
- App version
- Device (iPhone 15, Samsung Galaxy S24, etc.)
- OS version (iOS 17, Android 14, etc.)
- Unraid version

**Logs/Screenshots**:
- Console errors
- Screenshots or screen recordings
- Relevant log excerpts

**Example**:

```markdown
## Bug: Docker containers not loading on Android

### Description
When opening the Docker tab, the loading spinner appears indefinitely and 
containers never load. This occurs only on Android devices.

### Steps to Reproduce
1. Open app on Android device
2. Navigate to Docker tab
3. Observe loading spinner

### Expected Behavior
Docker containers should load within 2-3 seconds

### Environment
- App version: 1.0.0
- Device: Samsung Galaxy S23
- OS: Android 14
- Unraid: 7.2.0

### Logs
```
Error: Network request failed
at screens/docker-screen.tsx:45
```

### Screenshots
[Attach screenshot]
```

---

## Suggesting Features

### Feature Request Template

**Title**: Clear feature name

**Problem Statement**:
- What problem does this solve?
- Who would benefit?

**Proposed Solution**:
- How should it work?
- UI/UX considerations

**Alternatives Considered**:
- Other approaches you thought of

**Additional Context**:
- Mockups, examples, references

**Example**:

```markdown
## Feature Request: Historical Performance Graphs

### Problem
Users cannot view historical CPU/RAM usage to identify patterns or issues 
over time. This makes troubleshooting intermittent problems difficult.

### Proposed Solution
Add a graphs section showing:
- CPU usage over 1h/6h/24h/7d
- RAM usage trends
- Network traffic history
- Disk I/O patterns

Users should be able to:
- Zoom and pan the graphs
- Toggle metrics on/off
- Export data as CSV

### Alternatives
- Link to external Grafana dashboard
- Simple table of historical values

### Additional Context
Similar to UniFi mobile app's insights section.
[Mockup image]
```

---

## Documentation

### Types of Documentation

1. **Code Comments** - Explain complex logic
2. **README Updates** - Keep main README current
3. **API Documentation** - Document GraphQL queries
4. **Architecture Docs** - Explain design decisions
5. **User Guides** - Help end users

### Documentation Standards

- Write clear, concise English
- Use code examples when helpful
- Keep documentation up-to-date with code changes
- Include screenshots for UI features
- Link to related documentation

### Where to Add Documentation

- **Code changes**: Update inline comments
- **New features**: Update README and relevant docs
- **API changes**: Update `docs/API.md`
- **Architecture**: Update `docs/ARCHITECTURE.md`
- **Bug fixes**: Update `docs/TROUBLESHOOTING.md`

---

## Development Tips

### Useful Commands

```bash
# Clear cache and restart
pnpm start --clear

# Run on specific device
pnpm android --device "device-name"
pnpm ios --simulator "iPhone 15 Pro"

# Generate GraphQL types
pnpm codegen

# Check TypeScript errors
tsc --noEmit

# Format code (if using Prettier)
pnpm format
```

### Debugging

- Use React Native Debugger
- Check console logs in terminal
- Use Expo DevTools
- Enable Remote JS Debugging
- Use Flipper for advanced debugging

### Testing Locally

- Test on both iOS and Android
- Test with real Unraid server
- Test with demo data
- Test offline functionality
- Test on different screen sizes

---

## Getting Help

If you need assistance:

- **Documentation**: Check `docs/` folder
- **Discussions**: Use GitHub Discussions
- **Issues**: Comment on relevant issue
- **Community**: Join Unraid forums

---

## Recognition

Contributors will be:

- Listed in release notes
- Acknowledged in the repository
- Mentioned in the README (for significant contributions)

Thank you for contributing to Parity and helping make Unraid mobile management better for everyone!

