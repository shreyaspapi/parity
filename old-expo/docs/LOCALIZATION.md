# Localization Guide

This app uses `expo-localization` and `i18n-js` for internationalization support.

## Supported Languages

The app currently supports the following languages:

- **English (en)** - Default
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch
- **Portuguese (pt)** - Português
- **Chinese Simplified (zh)** - 简体中文
- **Japanese (ja)** - 日本語

## Architecture

### Directory Structure

```
src/
  locales/
    index.ts          # Exports all translations and types
    en.ts             # English translations
    es.ts             # Spanish translations
    fr.ts             # French translations
    de.ts             # German translations
    pt.ts             # Portuguese translations
    zh.ts             # Chinese translations
    ja.ts             # Japanese translations
  providers/
    localization-provider.tsx  # i18n context provider
```

### How It Works

1. **LocalizationProvider**: Wraps the entire app and provides translation functions
2. **Translation Files**: Each language has a TypeScript file with a nested object structure
3. **Automatic Locale Detection**: The app detects the device's locale on first launch
4. **Fallback**: Falls back to English if a translation is missing or if the locale is unsupported

## Usage

### In Screens and Components

```typescript
import { useLocalization } from '@/src/providers/localization-provider';

function MyComponent() {
  const { t, locale, setLocale, availableLocales } = useLocalization();

  return (
    <View>
      {/* Basic translation */}
      <Text>{t('login.title')}</Text>

      {/* Translation with parameters */}
      <Text>{t('dashboard.uptime', { time: '5 days' })}</Text>

      {/* Current locale */}
      <Text>Current language: {locale}</Text>

      {/* Change locale */}
      <Button onPress={() => setLocale('es')}>
        Switch to Spanish
      </Button>
    </View>
  );
}
```

### Translation Key Structure

Translations are organized in a nested structure:

```typescript
{
  common: {
    loading: 'Loading...',
    error: 'Error',
    // ...
  },
  login: {
    title: 'Connect to Unraid',
    subtitle: 'Enter your server details',
    // ...
  },
  dashboard: {
    title: 'Dashboard',
    uptime: 'Uptime',
    // ...
  }
}
```

Access keys using dot notation: `t('category.key')`

## Adding New Languages

### 1. Create a New Translation File

Create a new file in `src/locales/` (e.g., `it.ts` for Italian):

```typescript
export default {
  common: {
    loading: 'Caricamento...',
    error: 'Errore',
    // ... translate all keys
  },
  // ... translate all sections
};
```

### 2. Register the Language

Update `src/locales/index.ts`:

```typescript
import it from './it';

export const translations = {
  en,
  es,
  fr,
  de,
  pt,
  zh,
  ja,
  it, // Add new language
};

export const localeNames: Record<LocaleCode, string> = {
  en: 'English',
  // ...
  it: 'Italiano', // Add language name
};
```

### 3. Test

The new language will automatically be available in the app.

## Adding New Translation Keys

### 1. Add to English Translation

Update `src/locales/en.ts`:

```typescript
export default {
  // ...
  newSection: {
    newKey: 'New translation text',
  },
};
```

### 2. Add to All Other Languages

Update the same key in all other language files (`es.ts`, `fr.ts`, `de.ts`, etc.)

### 3. Use in Code

```typescript
const { t } = useLocalization();
<Text>{t('newSection.newKey')}</Text>
```

## Best Practices

1. **Always use translation keys**: Never hardcode text in components
2. **Keep keys descriptive**: Use clear, hierarchical naming (e.g., `dashboard.systemOverview`)
3. **Group related translations**: Organize by screen or feature
4. **Provide context**: Add comments for translations that might be ambiguous
5. **Test all languages**: Verify UI layout works with longer/shorter text in different languages
6. **Use parameters for dynamic content**: `t('message', { name: userName })`

## Common Patterns

### Alert Messages

```typescript
Alert.alert(
  t('common.error'),
  t('errors.network'),
  [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.retry'), onPress: handleRetry }
  ]
);
```

### Form Labels and Placeholders

```typescript
<TextInput
  placeholder={t('login.serverIPPlaceholder')}
  // ...
/>
<Text>{t('login.serverIP')}</Text>
```

### Loading States

```typescript
<LoadingScreen message={t('loadingMessages.systemInfo')} />
```

### Button Labels

```typescript
<Button title={t('common.save')} onPress={handleSave} />
```

## Locale Storage

The selected locale is automatically saved to AsyncStorage and persists across app restarts.

## Device Locale Detection

On first launch, the app:
1. Checks AsyncStorage for a saved locale
2. If none found, detects the device's locale using `expo-localization`
3. Falls back to English if the device locale is not supported
4. Saves the detected/selected locale for future use

## TypeScript Support

All translation keys are type-safe. The TypeScript compiler will error if you try to use a non-existent key.

```typescript
// ✅ Correct
t('login.title')

// ❌ Will error: Property 'nonexistent' does not exist
t('login.nonexistent')
```

## Translation Resources

When adding new languages or improving translations:
- Use professional translation services for production apps
- Consider cultural context, not just literal translations
- Test with native speakers when possible
- Keep technical terms consistent (e.g., "Docker", "VM" remain the same)

## Troubleshooting

### Translations not updating

1. Ensure you're using the `t()` function from `useLocalization()`
2. Verify the translation key exists in all language files
3. Check that LocalizationProvider wraps your component tree

### Missing translations show keys

This is expected behavior when a translation is missing. Add the missing key to the appropriate language file.

### Locale not persisting

Check that AsyncStorage permissions are granted and the storage service is working correctly.
