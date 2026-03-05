# UI Improvement TODO

Current UI completeness: ~62%. This file tracks all planned visual and UX enhancements.

---

## 1. Theme Switcher (Dark / Light / System) ✅

- [x] Create `ThemeProvider` context that reads from `localStorage` (`theme` key) and applies `dark` class to `<html>`
- [x] Add `useTheme` hook exposing `{ theme, setTheme }` (values: `'light' | 'dark' | 'system'`)
- [x] Add theme toggle button in `Header.tsx` (Sun / Moon / Monitor icons from lucide-react)
- [x] Verify all shadcn/ui CSS variables in `globals.css` are correct for both `:root` (light) and `.dark`
- [x] Persist preference — on `system`, use `window.matchMedia('(prefers-color-scheme: dark)')` and listen for changes

---

## 2. Page Transition Animations ✅

- [x] CSS-based fade-in replaced with framer-motion per-route transitions
- [x] Install `framer-motion`: `cd frontend && npm install framer-motion`
- [x] `PageTransition` component created at `src/components/layout/PageTransition.tsx` — `AnimatePresence mode="wait"` + keyed `motion.div`
- [x] Preset: `{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: 'easeOut' } }`

---

## 3. Dashboard Improvements ✅

- [x] Animate `StatsCard` numbers counting up on load (`framer-motion` `useMotionValue` + `useSpring`)
- [x] Add entrance animation to each stats card with staggered delay (`staggerChildren: 0.08`)
- [x] `ProgressChart` — add chart loading skeleton that fades out when data arrives (`AnimatePresence` fade)
- [x] `ProgressHeatmap` — colour intensity scale legend already present (Less / 4 swatches / More)
- [x] Add a "Welcome back" banner on first login of the day (`WelcomeBackBanner.tsx`, uses `lastActiveDate` + sessionStorage to show once per day)

---

## 4. Sidebar Enhancements ✅

- [x] Add collapsible mobile sidebar — slide in from left with overlay backdrop on small screens (`MobileNav.tsx` + hamburger in `Header.tsx`)
- [x] Add active nav item indicator — left border accent bar (`border-l-[3px] border-primary`) + `bg-primary/10 text-primary` tint instead of full-background highlight; applied to both `Sidebar.tsx` and `MobileNav.tsx`
- [x] Add tooltip labels for icons when sidebar is collapsed — `TooltipProvider` wrapping all nav items in `Sidebar.tsx` with `side="right"`; tooltips become useful when collapsed icon-only mode is added
- [x] Animate nav item hover with subtle `scale(1.02)` transform — `hover:scale-[1.02] active:scale-[0.98] transition-all duration-150` on all nav items + user/logout buttons

---

## 5. Auth Pages (Login / Register) ✅

- [x] Replace plain form layout with a two-column split: left = branded gradient panel, right = form (`_auth.tsx` layout)
- [x] Add logo animation on page load (scale + fade in) — `motion.div` with `scale: 0.85→1` + `opacity: 0→1` on both desktop and mobile logos in `_auth.tsx`
- [x] Add floating label inputs (label moves up when focused/filled) — `FloatingInput` component at `src/components/ui/FloatingInput.tsx`, used in both login and register pages
- [x] Add password strength indicator on the register form — inline `PasswordStrength` component (4-segment bar: Weak/Fair/Good/Strong)
- [x] Add `animate-shake` on failed login attempt — `useAnimationControls` + `motion.form` on both login and register pages; shakes horizontally on auth error

---

## 6. Exam & Study Pages ✅

- [x] `ExamCard` — hover lift effect (`hover:-translate-y-1 hover:shadow-lg duration-200`)
- [x] Exam detail page — hero banner with gradient overlay; image if `imageUrl` present, else primary gradient; title/actions overlaid at bottom/top
- [x] `TopicViewer` — `ReadingProgressBar` component (`src/components/study/ReadingProgressBar.tsx`) fixed at top of viewport, tracks `<main>` scroll, shown only on Content tab
- [x] Topic list — animated status icon: `AnimatePresence mode="wait"` + spring bounce when status changes to COMPLETED
- [x] Chapter accordion — `AnimatePresence` + `motion.div` height animation (0→auto); chevron icon rotates 0→90° via `motion.span`

---

## 7. Practice Test UI ✅

- [x] Add question transition animation (slide left/right between questions)
- [x] Answer option — add ripple effect on selection
- [x] Timer — add colour change when time is low (yellow < 30%, red < 10%)
- [x] Results page — add confetti animation on high score (>= 80%)
- [x] Results page — add animated score ring (SVG circle with stroke-dashoffset animation)

---

## 8. AI Components ✅

- [x] `AiChatPanel` — add message bubble entrance animation (slide up + fade)
- [x] `AiChatPanel` — add glassmorphism panel style option (backdrop-blur + bg-opacity)
- [x] `AiQuestionGenerator` — add card flip animation on "Reveal Answer"
- [x] `AiTrendingWidget` — add pill shimmer/pulse animation on hover
- [x] Voice mode waveform — vary bar heights dynamically based on audio amplitude (Web Audio API `AnalyserNode`)

---

## 9. Loading & Skeleton States ✅

- [x] Audit every page — existing skeletons confirmed on all data-dependent pages
- [x] Create a global `PageLoader` spinner for initial route loads (`src/components/ui/PageLoader.tsx`)
- [x] Add `pendingComponent: PageLoader` on root route for global route loading
- [x] Skeleton shimmer — `skeleton-shimmer` class applied to `Skeleton` component (shimmer sweep animation)

---

## 10. Micro-interactions & Polish ✅

- [x] Button press: `active:scale-95` added to all buttons via `button.tsx` base class (`transition-all`)
- [x] Toast notifications — progress bar auto-dismiss indicator (shrinks left→right over 5s) + slide-in from right
- [x] Form inputs — focus ring transition animation (`transition-[box-shadow,border-color] duration-200`)
- [x] Badge/pill — bounce-in animation on first render (`animate-badge-bounce` keyframe in globals.css)
- [x] Empty states — SVG illustrations added (`EmptyState` now supports `illustration` prop: `empty | search | chart`)
- [x] 404 page — animated floating astronaut illustration with star field (added as `notFoundComponent` in `__root.tsx`)

---

## 11. Typography & Spacing

- [ ] Import a better font pair — e.g. `Inter` for body, `Cal Sans` or `Clash Display` for headings (via Fontsource)
- [ ] Audit heading hierarchy across all pages for consistency
- [ ] Add consistent section spacing utility class (replace ad-hoc `space-y-6` with a layout wrapper)

---

## 12. Mobile Responsiveness

- [x] Sidebar — hamburger menu + slide-out drawer implemented (`MobileNav.tsx`, closes on Escape/backdrop)
- [ ] Dashboard stats grid — verify 2-column layout looks good on 375px screens
- [ ] `AiChatPanel` — on mobile, make it full-width instead of fixed 400px
- [ ] Practice test — make question and options stack vertically on small screens
- [ ] Tables (admin, progress) — add horizontal scroll or card-based mobile view

---

## Priority Order

1. ~~Theme switcher~~ ✅ Done
2. ~~Mobile sidebar drawer~~ ✅ Done (MobileNav.tsx implemented)
3. ~~Page transitions~~ ✅ Done (framer-motion PageTransition component)
4. ~~Dashboard stats animations~~ ✅ Done (count-up, stagger, chart skeleton, welcome banner)
5. ~~Auth page redesign~~ ✅ Done (two-column layout, logo animation, floating labels, password strength, shake on error)
6. Everything else
