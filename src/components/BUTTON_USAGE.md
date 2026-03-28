# Button Component Usage Guide

## Overview
Reusable button components for consistent UI across the app.

## Components

### 1. Button (Default Export)
Main button component with text and optional icons.

### 2. IconButton (Named Export)
Circular button with only an icon.

---

## Button Component

### Basic Usage

```javascript
import Button from '../components/Button';

<Button title="Continue" onPress={handlePress} />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | - | Button text |
| `onPress` | function | - | Click handler |
| `type` | string | 'primary' | Button style type |
| `size` | string | 'medium' | Button size |
| `icon` | component | - | Icon component |
| `iconPosition` | string | 'right' | Icon position ('left' or 'right') |
| `disabled` | boolean | false | Disabled state |
| `fullWidth` | boolean | false | Full width button |
| `style` | object | - | Custom button styles |
| `textStyle` | object | - | Custom text styles |

### Button Types

#### Primary (default)
Pink background with blue text - main action button
```javascript
<Button title="Proceed" type="primary" onPress={handleContinue} />
```
- Background: `#FFC2EB`
- Text: `#32A6D8`
- Use for: Primary actions, main CTAs

#### Secondary
Blue background with white text - secondary action button
```javascript
<Button title="Submit" type="secondary" onPress={handleSubmit} />
```
- Background: `#32A6D8`
- Text: `#FFFFFF`
- Use for: Secondary actions, confirmations

#### Outline
Transparent background with blue border and text
```javascript
<Button title="Cancel" type="outline" onPress={handleCancel} />
```
- Background: Transparent
- Border: `#32A6D8`
- Text: `#32A6D8`
- Use for: Cancel actions, alternative options

#### Text
Text-only button with no background
```javascript
<Button title="Skip" type="text" onPress={handleSkip} />
```
- Background: Transparent
- Text: `#8A8A8A`
- Use for: Skip, dismiss, tertiary actions

### Button Sizes

#### Small
```javascript
<Button title="OK" size="small" />
```
- Height: 40px
- Padding: 20px horizontal, 10px vertical
- Font size: 12px

#### Medium (default)
```javascript
<Button title="Continue" size="medium" />
```
- Height: 56px
- Padding: 32px horizontal, 20px vertical
- Font size: 14px

#### Large
```javascript
<Button title="Get Started" size="large" />
```
- Height: 64px
- Padding: 40px horizontal, 24px vertical
- Font size: 16px

### With Icons

#### Icon on Right (default)
```javascript
import ArrowIcon from '../assets/icons/arrow.svg';

<Button 
  title="Next" 
  icon={<ArrowIcon width={20} height={20} />}
  iconPosition="right"
/>
```

#### Icon on Left
```javascript
<Button 
  title="Back" 
  icon={<BackIcon width={20} height={20} />}
  iconPosition="left"
/>
```

### Full Width
```javascript
<Button title="Continue" fullWidth />
```

### Disabled State
```javascript
<Button title="Submit" disabled />
```

---

## IconButton Component

### Basic Usage

```javascript
import { IconButton } from '../components/Button';
import NextArrowIcon from '../assets/icons/next_arrow_btn_icon.svg';

<IconButton
  icon={<NextArrowIcon width={24} height={24} />}
  onPress={handleNext}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | component | - | Icon component (required) |
| `onPress` | function | - | Click handler |
| `size` | number | 56 | Button diameter |
| `backgroundColor` | string | '#32A6D8' | Background color |
| `style` | object | - | Custom styles |

### Examples

#### Default (56px, blue)
```javascript
<IconButton
  icon={<NextArrowIcon width={24} height={24} />}
  onPress={handleNext}
/>
```

#### Custom Size and Color
```javascript
<IconButton
  icon={<CloseIcon width={20} height={20} />}
  onPress={handleClose}
  size={40}
  backgroundColor="#FF6B6B"
/>
```

#### With Custom Styles
```javascript
<IconButton
  icon={<MenuIcon width={24} height={24} />}
  onPress={handleMenu}
  style={{ marginTop: 20 }}
/>
```

---

## Real-World Examples

### Onboarding Screen
```javascript
import { IconButton } from '../components/Button';
import NextArrowIcon from '../assets/icons/next_arrow_btn_icon.svg';

<IconButton
  icon={<NextArrowIcon width={24} height={24} />}
  onPress={handleNext}
  size={56}
  backgroundColor="#32A6D8"
/>
```

### Language Screen
```javascript
import Button from '../components/Button';

<Button
  title="Proceed"
  onPress={handleContinue}
  type="primary"
  size="medium"
  fullWidth
/>
```

### Login Screen
```javascript
<Button
  title="Sign In"
  onPress={handleLogin}
  type="secondary"
  fullWidth
/>

<Button
  title="Create Account"
  onPress={handleRegister}
  type="outline"
  fullWidth
  style={{ marginTop: 12 }}
/>

<Button
  title="Skip for now"
  onPress={handleSkip}
  type="text"
/>
```

---

## Styling Tips

### Custom Button Color
```javascript
<Button
  title="Delete"
  onPress={handleDelete}
  style={{ backgroundColor: '#FF6B6B' }}
  textStyle={{ color: '#FFFFFF' }}
/>
```

### Custom Border Radius
```javascript
<Button
  title="Square Button"
  style={{ borderRadius: 8 }}
/>
```

### Add Shadow
```javascript
<Button
  title="Elevated"
  style={{
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }}
/>
```

---

## Best Practices

1. **Use appropriate types**: Primary for main actions, secondary for confirmations, outline for cancellations
2. **Consistent sizing**: Stick to the three predefined sizes for consistency
3. **Full width on mobile**: Use `fullWidth` for better touch targets on mobile
4. **Icon size**: Keep icons 20-24px for medium buttons, 16-20px for small
5. **Disabled state**: Always disable buttons during async operations
6. **Accessibility**: Provide meaningful button text for screen readers

---

## Color Reference

- Primary Background: `#FFC2EB` (Pink)
- Primary Text: `#32A6D8` (Blue)
- Secondary Background: `#32A6D8` (Blue)
- Secondary Text: `#FFFFFF` (White)
- Text Button: `#8A8A8A` (Gray)
- Disabled: 50% opacity

---

Created: February 11, 2026
