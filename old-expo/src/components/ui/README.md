# UI Components

This directory contains reusable UI components for the Anraid mobile application.

## Components

### CircularProgress

A circular progress indicator showing percentage with a label. Inspired by the UniFi mobile app design.

**Props:**
- `percentage` (number, required): The progress value (0-100)
- `size` (number, optional): The diameter of the circle in pixels. Default: 100
- `strokeWidth` (number, optional): The width of the progress ring. Default: 8
- `label` (string, required): The text label shown below the circle
- `color` (string, optional): Custom color for the progress ring. Auto-calculated based on percentage if not provided

**Example:**
```tsx
import { CircularProgress } from '@/src/components/ui/circular-progress';

<CircularProgress
  percentage={75}
  label="RAM usage"
  size={90}
/>
```

**Color Logic:**
- Green (`#34c759`): < 75%
- Orange (`#ff9500`): 75-89%
- Red (`#ff3b30`): ≥ 90%

---

### ProgressBar

A horizontal progress bar with optional label and percentage display.

**Props:**
- `percentage` (number, required): The progress value (0-100)
- `label` (string, optional): Label text shown above the bar
- `color` (string, optional): Custom color for the progress fill
- `height` (number, optional): Height of the progress bar. Default: 8
- `hideLabel` (boolean, optional): Hide the label and percentage text. Default: false

**Example:**
```tsx
import { ProgressBar } from '@/src/components/ui/progress-bar';

<ProgressBar
  percentage={65}
  label="Storage"
/>
```

---

### Card

A container component providing consistent styling for content sections.

**Props:**
- `children` (ReactNode, required): Content to be displayed in the card
- `style` (StyleProp<ViewStyle>, optional): Additional styles

**Example:**
```tsx
import { Card } from '@/src/components/ui/card';

<Card>
  <Text>Card content</Text>
</Card>
```

---

### StatItem

Displays a label-value pair in a consistent format.

**Props:**
- `label` (string, required): The descriptive label
- `value` (string | number, required): The value to display
- `unit` (string, optional): Optional unit suffix

**Example:**
```tsx
import { StatItem } from '@/src/components/ui/stat-item';

<StatItem label="CPU Cores" value="12" />
<StatItem label="Temperature" value="45" unit="°C" />
```

---

### LoadingScreen

Full-screen loading indicator with optional message.

**Props:**
- `message` (string, optional): Loading message to display

**Example:**
```tsx
import { LoadingScreen } from '@/src/components/ui/loading-screen';

<LoadingScreen message="Loading system information..." />
```

---

### ErrorMessage

Error display component with retry functionality.

**Props:**
- `message` (string, required): Error message to display
- `onRetry` (function, optional): Callback function when retry button is pressed

**Example:**
```tsx
import { ErrorMessage } from '@/src/components/ui/error-message';

<ErrorMessage
  message="Failed to load data"
  onRetry={() => refetch()}
/>
```

## Design System

### Colors

**Status Colors:**
- Success: `#34c759`
- Warning: `#ff9500`
- Error: `#ff3b30`
- Info: `#007aff`

**Text Colors (Light Mode):**
- Primary: `#000000`
- Secondary: `#6e6e73`

**Text Colors (Dark Mode):**
- Primary: `#ffffff`
- Secondary: `#8e8e93`

**Background Colors (Light Mode):**
- Screen: `#f2f2f7`
- Card: `#ffffff`
- Divider: `#e5e5ea`

**Background Colors (Dark Mode):**
- Screen: `#000000`
- Card: `#1c1c1e`
- Divider: `#38383a`

### Typography

- **Title**: 24-28px, bold
- **Card Title**: 13-18px, semi-bold (600-700), uppercase with letter spacing
- **Body**: 14-15px, normal/medium
- **Caption**: 12-13px, normal
- **Small**: 11px, semi-bold

### Spacing

- **Card padding**: 16px
- **Section margin**: 16-20px
- **Element gap**: 8-12px
- **Content padding**: 16px

## Best Practices

1. **Consistent Spacing**: Use multiples of 4 for spacing (4, 8, 12, 16, 20, etc.)
2. **Dark Mode**: Always use `useColorScheme` hook and provide both light and dark variants
3. **Accessibility**: Ensure sufficient color contrast for text
4. **Performance**: Use `React.memo` for components that render frequently
5. **Type Safety**: Always define proper TypeScript interfaces for props

