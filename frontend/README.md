# TrainFlow Frontend

A modern, bilingual (English/Arabic), animated landing page for TrainFlow - the Intelligent Training, Renewal & Talent Progression Platform.

## Structure

### Directory Organization

```
frontend/src/
├── components/
│   ├── landing/              # Landing page sections
│   │   ├── Hero.tsx         # Hero section with CTA buttons
│   │   ├── Features.tsx      # 10 module features overview
│   │   ├── Enterprise.tsx    # Enterprise features
│   │   ├── KPIs.tsx         # Key performance indicators
│   │   ├── Workflow.tsx      # 7-step renewal workflow
│   │   ├── Integrations.tsx  # Enterprise system integrations
│   │   ├── AI.tsx           # AI-powered features
│   │   ├── Security.tsx      # Security & compliance
│   │   ├── FAQ.tsx          # Frequently asked questions
│   │   └── Footer.tsx       # Footer with links
│   └── LanguageSwitcher.tsx # Language toggle (EN/AR)
├── i18n/                     # Internationalization
│   ├── en.ts               # English translations
│   ├── ar.ts               # Arabic translations
│   └── index.ts            # i18n utilities
├── pages/
│   └── Landing.tsx         # Main landing page
└── [other folders]         # Components, hooks, stores, etc.
```

## Features

### 🌍 Bilingual Support
- **English (LTR)** and **Arabic (RTL)** support via language switcher
- All text stored in i18n files for easy maintenance
- Automatic `dir="rtl"` / `dir="ltr"` toggle on language change
- Persistent language preference via localStorage

### 🎨 Design & Animation
- **Framer Motion** animations for smooth transitions
- Fade-in, slide-up, parallax, and scroll-triggered effects
- Animated hero section with gradient background
- Floating shape animations
- Hover elevation effects on cards

### 📦 Components Used
- **ShadCN UI**: Cards, Buttons, Accordion, Navigation
- **Tailwind CSS**: Responsive grid layout, styling
- **Lucide React**: Icons throughout the site
- **Framer Motion**: All animations

### 📱 Responsive Design
- Mobile-first approach
- Responsive grids (1 col → 2 col → 3 col)
- Touch-friendly buttons and interactions
- Optimized typography for all screen sizes

## Sections

1. **Hero** - Main banner with title, subtitle, and CTA buttons
2. **Features** - 10 module overview with icons
3. **Enterprise** - 6 enterprise-grade features
4. **KPIs** - 3 animated KPI cards (completion rate, alerts, readiness)
5. **Workflow** - 7-step renewal process visualization
6. **Integrations** - Supported ERP/HCM systems
7. **AI** - 4 AI-powered capabilities
8. **Security** - 6 security & compliance features
9. **FAQ** - 6 bilingual Q&A items with accordion
10. **Footer** - Navigation and contact

## How to Add New Languages

To support additional languages:

1. Create a new translation file in `src/i18n/` (e.g., `fr.ts` for French)
2. Copy the structure from `en.ts` or `ar.ts`
3. Update `src/i18n/index.ts`:

```typescript
import { fr } from "./fr";

export const languages: Record<Language, typeof en> = {
  en,
  ar,
  fr,  // Add new language
};
```

4. Update `LanguageSwitcher.tsx` to include the new language button
5. Update the `Language` type in `i18n/index.ts` to include `"fr"`

## Customization

### Colors & Typography
- Edit `index.css` or Tailwind config for brand colors
- Modify Framer Motion variants in each component for different animations
- Adjust spacing and padding in TailwindCSS classes

### Content
- All text lives in `src/i18n/en.ts` and `src/i18n/ar.ts`
- Update translations without touching component code
- Add/remove sections by modifying the `Landing.tsx` page

### Components
Each landing component is self-contained and can be:
- Reused independently
- Styled individually
- Modified without affecting others

## Running the Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ShadCN UI** - Component library
- **Framer Motion** - Animations
- **Lucide React** - Icons

## i18n Management

All translations are managed in the `src/i18n/` folder:

- `en.ts` - English translations (default)
- `ar.ts` - Arabic translations
- `index.ts` - Language switcher logic and exports

Language selection is:
- Persistent (saved to localStorage)
- Applied globally (affects `document.dir` and `document.lang`)
- Integrated into all components via the `language` prop

## Browser Support

Works on all modern browsers supporting:
- ES6+ JavaScript
- CSS Grid and Flexbox
- CSS Custom Properties
- LocalStorage

## License

© 2024 TrainFlow. All rights reserved.
