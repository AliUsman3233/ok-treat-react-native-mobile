# Assets Folder (src/assets)

This folder contains all static assets for the OkTreat mobile app.

## 📁 Structure

```
src/assets/
├── icons/          ← SVG icon files
│   ├── home.svg
│   ├── calendar.svg
│   ├── paw.svg
│   └── ...
├── images/         ← PNG/JPG image files
│   ├── logo.png
│   ├── splash.png
│   └── ...
└── index.js        ← Central export file
```

## 🎨 Icon Guidelines

### File Format
- **Preferred**: SVG (scalable, small file size)
- **Alternative**: PNG (for complex images)

### Naming Convention
- Use kebab-case: `home-icon.svg`, `paw-print.svg`
- Be descriptive: `dog-walking.svg` not `icon1.svg`

### Size Standards
- **Icons**: 24x24px (standard)
- **Large Icons**: 32x32px or 48x48px
- **Images**: Original size (will be scaled in code)

### Color
- **Single color SVGs**: Remove fill attribute (for dynamic coloring)
- **Multi-color SVGs**: Keep colors in file
- **Images**: Full color

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd oktreat-mobile
npm install react-native-svg react-native-svg-transformer
```

### 2. Add Your Files
- Place SVG files in `icons/`
- Place PNG/JPG files in `images/`

### 3. Export in index.js
```javascript
export { default as HomeIcon } from './icons/home.svg';
export const Logo = require('./images/logo.png');
```

### 4. Use in Code
```javascript
import { HomeIcon, Logo } from '../assets';

<HomeIcon width={24} height={24} fill="#FF6B6B" />
<Image source={Logo} style={styles.logo} />
```

## 📝 Required Icons

### Navigation (5)
- home.svg, calendar.svg, grid.svg, message.svg, user.svg

### Features (15)
- paw.svg, qr-code.svg, coin.svg, heart.svg, bell.svg, search.svg, filter.svg, map-pin.svg, phone.svg, video.svg, camera.svg, star.svg, shield.svg, settings.svg, help.svg

### Services (5)
- dog-walking.svg, pet-sitting.svg, grooming.svg, training.svg, veterinary.svg

### Actions (10)
- plus.svg, minus.svg, edit.svg, delete.svg, check.svg, close.svg, arrow-left.svg, arrow-right.svg, chevron-down.svg, chevron-up.svg

## 🔗 Resources

- **Full Setup Guide**: `oktreat-mobile/SETUP_SVG_ICONS.md`
- **Icon Component**: `src/components/Icon.js`
- **Free Icons**: Heroicons, Feather Icons, Ionicons

---

*See SETUP_SVG_ICONS.md for detailed configuration*
