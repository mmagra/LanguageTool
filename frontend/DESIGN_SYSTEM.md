# Spoken Edge Design System

Spoken Edge uses a restrained enterprise SaaS system: slate neutrals, white or slate-900 surfaces, one blue primary accent, thin borders, modest radius, and Inter typography. Tailwind v4 tokens live in `src/index.css` under `@theme`; dark mode is class-based on `document.documentElement` and persisted with `spoken-edge-theme`.

## Tokens

- Background: `bg-slate-50`, dark `bg-slate-950`
- Surface: `bg-white border border-slate-200 shadow-sm`, dark `dark:bg-slate-900 dark:border-slate-800 dark:shadow-none`
- Primary: `primary-600` is `#2563eb`; hover uses `primary-700`
- Text: headings `text-slate-900 dark:text-slate-50`, body `text-slate-700 dark:text-slate-300`, muted `text-slate-500 dark:text-slate-400`
- Radius: controls `rounded-lg`, cards/modals `rounded-xl`, avatars/pills `rounded-full`
- Motion: `transition-colors duration-200`; global reduced-motion rules are defined in `src/index.css`

## Canonical Components

Use the shared components in `src/components/common` before adding page-local variants:

- `Button`: primary, secondary, ghost, danger
- `Card`: bordered surface with optional padding
- `Badge`: neutral, primary, success, warning, danger
- `FormField`: labelled input with error and icon support
- `PageHeader`: title, subtitle, actions, breadcrumbs
- `Pagination`, `EmptyState`, `LoadingState`, `ErrorState`, `ConfirmDialog`

## Before / After Class Examples

Card:
`bg-white rounded-2xl shadow-xl p-8`
to
`bg-white rounded-xl border border-slate-200 shadow-sm p-6 dark:bg-slate-900 dark:border-slate-800`

Button:
`bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-md`
to
`bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors`

Header:
`bg-white shadow-lg`
to
`sticky top-0 h-16 bg-white/95 border-b border-slate-200 backdrop-blur dark:bg-slate-900/95 dark:border-slate-800`

Sidebar item:
`rounded-xl bg-primary-600 text-white`
to
`rounded-lg text-slate-600 hover:bg-slate-50 active:bg-slate-100 active:border-l-2 active:border-primary-600 dark:text-slate-400`

Input:
`bg-slate-50 rounded-xl focus:bg-white focus:ring-primary-500`
to
`bg-white border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-slate-900 dark:border-slate-700`

Table:
`shadow-xl rounded-2xl overflow-hidden`
to
`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800`

Modal:
`rounded-2xl shadow-2xl`
to
`rounded-xl border border-slate-200 shadow-lg dark:bg-slate-900 dark:border-slate-800`

Page title:
`text-3xl font-bold`
to
`text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50`
