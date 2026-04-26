# Localization Implementation

## Overview

This directory contains all translation files for the Parity app, supporting multiple languages for a global audience.

## Quick Start

```typescript
import { useLocalization } from '@/src/providers/localization-provider';

function MyComponent() {
  const { t } = useLocalization();
  
  return <Text>{t('login.title')}</Text>;
}
```

## Available Languages

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| es | Spanish | Español |
| fr | French | Français |
| de | German | Deutsch |
| pt | Portuguese | Português |
| zh | Chinese (Simplified) | 简体中文 |
| ja | Japanese | 日本語 |

## File Structure

- `index.ts` - Exports all translations and type definitions
- `en.ts` - English (default/fallback language)
- `es.ts` - Spanish translations
- `fr.ts` - French translations
- `de.ts` - German translations
- `pt.ts` - Portuguese translations
- `zh.ts` - Chinese (Simplified) translations
- `ja.ts` - Japanese translations

## Translation Categories

Each language file contains the following sections:

- **common** - Shared UI elements (buttons, labels, etc.)
- **login** - Login screen text
- **dashboard** - Dashboard screen text
- **docker** - Docker management screen
- **vms** - Virtual Machines screen
- **servers** - Server management screen
- **notifications** - Notifications screen
- **settings** - Settings screen
- **errors** - Error messages
- **loadingMessages** - Loading state messages

## Adding Translations

When adding new text to the app:

1. Add the English translation to `en.ts` first
2. Copy the same structure to all other language files
3. Translate the text appropriately for each language
4. Use the translation key in your component: `t('section.key')`

## Language Selection

Users can change their language preference in the Settings screen (when implemented). The app automatically:

1. Detects the device's language on first launch
2. Falls back to the closest supported language
3. Saves the user's preference for future sessions
4. Uses English as the ultimate fallback

## TypeScript Support

All translation keys are type-checked at compile time, preventing typos and missing translations.

For complete documentation, see `/workspace/docs/LOCALIZATION.md`
