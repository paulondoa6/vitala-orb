# Vitala App Shell

A premium mobile-first layout with a minimal top bar, floating bottom navigation, and a glowing center Scan action button. Smooth Framer Motion transitions between tabs.

## Layout structure

```
┌─────────────────────────────┐
│  [        Vitala     ◉ ]    │  TopBar (sticky, blurred)
├─────────────────────────────┤
│                             │
│       Active tab view       │  AnimatePresence content
│                             │
│                             │
│                             │
│   ⚡   🗺   ⦿   📈   👤      │  Floating BottomNav (glass)
└─────────────────────────────┘
```

## Components (reusable)

- `AppShell` — wraps top bar, animated content area, and bottom nav. Used by any page that needs the shell.
- `TopBar` — centered "Vitala" wordmark, right-aligned profile avatar (shadcn `Avatar`), backdrop blur, thin bottom hairline.
- `BottomNav` — floating pill, glassmorphism (`backdrop-blur-xl`, translucent surface), soft layered shadows, rounded-full. Holds 5 nav items in this order: Flash (home), Map, Scan (center), Activity, Profile.
- `NavItem` — icon + tiny label, scale + color transition on active, subtle indicator dot above active icon.
- `ScanButton` — larger circular primary button, raised above the nav bar (negative margin), glowing pulse halo (animated ring), gradient fill, strong shadow. Triggers a scan action / route.
- `TabTransition` — wraps page content in `AnimatePresence` with fade + slight Y/scale motion between tabs.

## Design language

- Premium, minimal, mobile-first.
- Glass surfaces: `bg-background/60 backdrop-blur-xl border border-white/10`.
- Soft shadows: layered, low-opacity, larger blur for floating elements.
- Rounded: `rounded-3xl` for nav, `rounded-full` for Scan.
- Color tokens added to `index.css` (HSL): `--primary` shifted to a vibrant accent (e.g. mint/violet), `--glow` for the scan halo, plus subtle gradients via Tailwind config.
- Lucide icons: `Zap`, `Map`, `ScanLine`, `Activity`, `User`.

## Interactions / motion

- Tab change: content fades + translates 8px with `AnimatePresence` (mode="wait").
- Active nav item: icon scales to 1.1, color shifts to primary, indicator dot fades in (Framer `layoutId` for shared transition).
- Scan button: continuous pulsing halo (Framer `animate` loop, opacity + scale), tap = spring scale-down.
- Top bar: fades in on mount; avatar has subtle hover/tap scale.

## Routing

- React Router routes for `/` (Flash), `/map`, `/scan`, `/activity`, `/profile` — all rendered inside `AppShell`.
- Each tab gets a placeholder page component with a title so transitions are visible.

## Files to add/modify

- `src/components/layout/AppShell.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/layout/NavItem.tsx`
- `src/components/layout/ScanButton.tsx`
- `src/components/layout/TabTransition.tsx`
- `src/pages/{Home,Map,Scan,Activity,Profile}.tsx` (placeholder content)
- `src/App.tsx` — register routes inside `AppShell`
- `src/index.css` + `tailwind.config.ts` — add glow color, pulse keyframes, glass shadow utility
- `package.json` — add `framer-motion`

## Technical notes

- Framer Motion via `motion/react` style imports from `framer-motion`.
- Bottom nav uses `fixed bottom-4 inset-x-4` with safe-area padding (`pb-[env(safe-area-inset-bottom)]`).
- Scan button positioned with `-translate-y-1/3` relative to the nav for the floating-above effect.
- Active route detected with `useLocation()`; `layoutId` shares the highlight pill between items.
- All colors via semantic tokens — no hardcoded hex in components.
