---
name: Hustle Hub
description: A calm, keyboard-first command center for daily engineering work.
colors:
  signal-ink: 'oklch(0.205 0 0)'
  white-field: 'oklch(1 0 0)'
  quiet-gray: 'oklch(0.88 0 0)'
  utility-gray: 'oklch(0.45 0 0)'
  border-mist: 'oklch(0.922 0 0)'
  action-blue: 'oklch(0.62 0.16 250)'
  critical-red: 'oklch(0.6 0.25 27.325)'
  night-field: 'oklch(0.145 0 0)'
  night-surface: 'oklch(0.205 0 0)'
  night-muted: 'oklch(0.269 0 0)'
  night-text: 'oklch(0.985 0 0)'
typography:
  headline:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.875rem'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 'normal'
  body:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 'normal'
  label:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 'normal'
  shortcut:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
    fontSize: '0.625rem'
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 'normal'
rounded:
  sm: '0.75rem'
  md: '0.875rem'
  lg: '1rem'
  xl: '1.25rem'
  pill: '9999px'
spacing:
  xs: '0.25rem'
  sm: '0.5rem'
  md: '0.75rem'
  lg: '1rem'
  xl: '1.5rem'
components:
  button-primary:
    backgroundColor: '{colors.signal-ink}'
    textColor: '{colors.white-field}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
    height: '2.25rem'
  button-outline:
    backgroundColor: '{colors.white-field}'
    textColor: '{colors.signal-ink}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
    height: '2.25rem'
  input:
    backgroundColor: '{colors.white-field}'
    textColor: '{colors.signal-ink}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0.25rem 0.75rem'
    height: '2.25rem'
  card:
    backgroundColor: '{colors.white-field}'
    textColor: '{colors.signal-ink}'
    rounded: '{rounded.xl}'
    padding: '1.5rem'
  badge:
    backgroundColor: '{colors.quiet-gray}'
    textColor: '{colors.signal-ink}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '0.125rem 0.5rem'
---

# Design System: Hustle Hub

## 1. Overview

**Creative North Star: "The Precision Console"**

Hustle Hub is a calm, compact operational surface. It should feel like a carefully tuned console: information arrives from several systems, but hierarchy, spacing, and state make the next useful action obvious. The visual system is deliberately restrained so dense work remains readable rather than decorative.

Precision comes from consistent alignment, compact controls, explicit state, and immediate keyboard feedback. Responsive behavior is structural: the dashboard stacks on narrow screens and resolves into three focused columns at the extra-large breakpoint. Motion is limited to short state transitions, loading feedback, and overlays.

The system explicitly rejects the feel of a generic list app with little attention paid to fast scanning, information hierarchy, or precision.

**Key Characteristics:**

- Restrained monochrome surfaces with semantic color reserved for meaning.
- Compact, repeated alignment patterns that reward fast scanning.
- Keyboard-visible focus states and shortcuts treated as first-class UI.
- Flat surfaces at rest, with light depth only where interaction or layering requires it.
- Structural responsiveness rather than fluid display typography.

## 2. Colors

Signal Ink and White Field establish a high-contrast working canvas. Quiet Gray separates secondary surfaces, Action Blue communicates information, and Critical Red is reserved for destructive or failed states. Dark mode inverts the hierarchy without introducing a new accent vocabulary.

### Primary

- **Signal Ink** (`oklch(0.205 0 0)`): Primary actions, selected controls, and the strongest light-theme emphasis.
- **Action Blue** (`oklch(0.62 0.16 250)`): Informational tokens and states that require recognition without alarm.
- **Critical Red** (`oklch(0.6 0.25 27.325)`): Errors, destructive actions, and invalid input only.

### Neutral

- **White Field** (`oklch(1 0 0)`): Main light-theme background and surface color.
- **Quiet Gray** (`oklch(0.88 0 0)`): Muted fills and low-emphasis surface separation.
- **Utility Gray** (`oklch(0.45 0 0)`): Secondary text that must remain readable during fast scanning.
- **Border Mist** (`oklch(0.922 0 0)`): Dividers, field outlines, and container boundaries.
- **Night Field** (`oklch(0.145 0 0)`), **Night Surface** (`oklch(0.205 0 0)`), and **Night Muted** (`oklch(0.269 0 0)`): Dark-theme depth layers.
- **Night Text** (`oklch(0.985 0 0)`): Primary content on dark surfaces.

### Named Rules

**The Semantic Color Rule.** Saturated color must communicate information, status, selection, or risk. It is never ambient decoration.

**The One Active Voice Rule.** Signal Ink marks the dominant action or selected state. Competing active controls on the same surface are prohibited.

## 3. Typography

**Display Font:** System sans (`ui-sans-serif`, `system-ui`, `sans-serif`)
**Body Font:** System sans (`ui-sans-serif`, `system-ui`, `sans-serif`)
**Label/Mono Font:** System monospace (`ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `monospace`)

**Character:** A single system sans keeps the product immediate and familiar. Monospace is functional punctuation for identifiers, template variables, and keyboard hints—not a decorative theme.

### Hierarchy

- **Headline** (600, `1.875rem`, `1.25`): Editable note titles and the rare screen-level heading.
- **Title** (700, `1.25rem`, `1.4`): Product identity and major page anchors.
- **Section title** (600, `1.125rem`, `1.4`): Dashboard source headings and dialog titles.
- **Body** (400–500, `0.875rem`, `1.5`): Work-item titles, controls, and supporting content.
- **Label** (500, `0.75rem`, `1.25`): Metadata, statuses, and compact secondary information.
- **Shortcut** (500, `0.625rem`, `1`): Keyboard commands and terse machine-like identifiers.

### Named Rules

**The Dense, Not Tiny Rule.** Density comes from spacing and hierarchy. Primary work-item content stays at `0.875rem`; smaller sizes are reserved for metadata.

**The Functional Mono Rule.** Monospace may identify keys, issue IDs, code, or variables. It must never replace the interface's body voice.

## 4. Elevation

The system is flat by default. Borders and tonal shifts establish most structure; small shadows sharpen interactive edges, cards, and selected segmented controls. Large elevation belongs only to true overlays such as dialogs.

### Shadow Vocabulary

- **Interactive edge** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): Buttons, inputs, and keyboard caps.
- **Surface separation** (`0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): Cards and selected navigation states.
- **Overlay lift** (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): Dialogs and sheets only.

### Named Rules

**The Flat-by-Default Rule.** A resting surface does not earn depth merely by being rectangular. Shadow must clarify interaction, selection, or an overlay layer.

## 5. Components

Components are compact and precise. Shared shape, state, focus, and density rules make controls disappear into the workflow.

### Buttons

- **Shape:** Gently curved (`0.875rem`) with a compact default height (`2.25rem`). Icon-only controls use a square (`2rem`) footprint.
- **Primary:** Signal Ink background, White Field text, medium `0.875rem` label, and `0.5rem 1rem` padding.
- **Hover / Focus:** Hover changes tone rather than geometry. Keyboard focus uses a visible `3px` ring at 50% ring color.
- **Secondary / Ghost:** Secondary controls use quiet tonal fills; outline controls use a boundary and White Field; ghost controls reveal their fill on hover or focus.
- **Disabled:** Disable pointer interaction and reduce opacity to 50%.

### Chips

- **Style:** Compact `0.75rem` labels with `0.125rem 0.5rem` padding. Status color is semantic; neutral metadata uses Quiet Gray.
- **State:** Active filter chips use Signal Ink. Inactive filters use the outline-button treatment.

### Cards / Containers

- **Corner Style:** Broad but controlled (`1.25rem`) on primary cards; nested list rows use smaller radii.
- **Background:** White Field in light mode and Night Surface in dark mode.
- **Shadow Strategy:** Surface separation only; overlays use the stronger overlay token.
- **Border:** One-pixel Border Mist boundary.
- **Internal Padding:** `1.5rem` for canonical cards, reduced to `1rem` in dense work-item groups.

### Inputs / Fields

- **Style:** Compact (`2.25rem`) fields with a one-pixel border, transparent-to-surface fill, `0.75rem` horizontal padding, and `0.875rem` corners.
- **Focus:** A visible `3px` ring and ring-colored border; focus must never depend on color alone when a shape or outline can reinforce it.
- **Error / Disabled:** Critical Red marks invalid boundaries; disabled fields reduce opacity and retain their label.

### Navigation

- **Style:** A compact segmented control in the top bar. Active destinations use the main background, strongest text, and a small structural shadow; inactive destinations remain muted until hover or focus.
- **Keyboard:** Every destination and action must remain reachable in a logical tab order. Existing hotkeys are shown with compact keyboard caps where discovery matters.
- **Responsive treatment:** Dashboard content stacks by default and becomes a three-column command surface at `80rem`; controls must remain usable before that transition.

### Keyboard Shortcut Keys

- **Style:** A `1.25rem`-high monospace cap with a Quiet Gray fill, Border Mist outline, small shadow, and centered `0.625rem` text.
- **Behavior:** Shortcut hints support discoverability; they never replace accessible names or standard focus navigation.

## 6. Do's and Don'ts

### Do:

- **Do** organize each source around a clear title, compact metadata, and a nearby next action.
- **Do** preserve `0.875rem` as the primary dense-content size and reserve `0.625–0.75rem` for metadata and keyboard hints.
- **Do** use the `3px` focus ring consistently so every interactive workflow is fully operable by keyboard.
- **Do** reserve Action Blue and Critical Red for semantic information and state.
- **Do** keep routine state transitions at `150ms` and overlay transitions at `200ms`.

### Don't:

- **Don't** make Hustle Hub feel like a generic list app with little attention paid to fast scanning, information hierarchy, or precision.
- **Don't** rely on color alone to communicate status, priority, or selection; pair it with text, icons, or structure.
- **Don't** hide focus indicators or create mouse-only actions.
- **Don't** add decorative motion, page-load choreography, or delays that interrupt the work loop.
- **Don't** introduce a new component shape or interaction vocabulary when an existing button, field, chip, menu, or dialog already fits.
