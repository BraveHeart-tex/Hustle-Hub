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
  warning-amber: 'oklch(0.68 0.15 75)'
  positive-green: 'oklch(0.62 0.14 155)'
  night-field: 'oklch(0.145 0 0)'
  night-surface: 'oklch(0.205 0 0)'
  night-muted: 'oklch(0.269 0 0)'
  night-text: 'oklch(0.985 0 0)'
typography:
  headline:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
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
  sm: '0.25rem'
  md: '0.375rem'
  lg: '0.5rem'
  xl: '0.75rem'
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
    padding: '1rem'
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
- One shared shape, state, and elevation vocabulary across extension pages and host-mounted controls.
- Structural responsiveness rather than fluid display typography.

## 2. Colors

Signal Ink and White Field establish a high-contrast working canvas. Quiet Gray separates secondary surfaces, Action Blue communicates information, and Critical Red is reserved for destructive or failed states. Warning Amber and Positive Green are narrow operational exceptions for warning and completed/success states. Dark mode remaps the same semantic roles rather than introducing a new accent vocabulary.

### Primary

- **Signal Ink** (`oklch(0.205 0 0)`): Primary actions, selected controls, and the strongest light-theme emphasis.
- **Action Blue** (`oklch(0.62 0.16 250)`): Informational tokens and states that require recognition without alarm.
- **Critical Red** (`oklch(0.6 0.25 27.325)`): Errors, destructive actions, and invalid input only.
- **Warning Amber** (`oklch(0.68 0.15 75)`): Blocking caution or pending-risk states only.
- **Positive Green** (`oklch(0.62 0.14 155)`): Successful, approved, resolved, or completed states only.

### Neutral

- **White Field** (`oklch(1 0 0)`): Main light-theme background and surface color.
- **Quiet Gray** (`oklch(0.88 0 0)`): Muted fills and low-emphasis surface separation.
- **Utility Gray** (`oklch(0.45 0 0)`): Secondary text that must remain readable during fast scanning.
- **Border Mist** (`oklch(0.922 0 0)`): Dividers, field outlines, and container boundaries.
- **Night Field** (`oklch(0.145 0 0)`), **Night Surface** (`oklch(0.205 0 0)`), and **Night Muted** (`oklch(0.269 0 0)`): Dark-theme depth layers.
- **Night Text** (`oklch(0.985 0 0)`): Primary content on dark surfaces.

### Canonical Semantic Token Contract

Components consume semantic roles, never palette utilities or raw color values. The canonical CSS roles are:

- **Surfaces and content:** `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `muted`, `muted-foreground`, `border`, and `input`.
- **Actions and selection:** `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `accent`, `accent-foreground`, and `ring`.
- **Operational states:** `info`, `info-foreground`, `warning`, `warning-foreground`, `success`, `success-foreground`, `destructive`, and `destructive-foreground`.
- **Layering:** `overlay` for scrims plus named shadow and z-index tokens from the Elevation section.

Every foreground/background pair must be mapped and contrast-checked independently in light and dark themes. Selected, hover, pressed, disabled, and focus-visible states require parity across both themes.

### Named Rules

**The Semantic Color Rule.** Saturated color must communicate information, status, selection, or risk. It is never ambient decoration.

**The Provider Color Exception.** Official Jira and GitLab marks may retain their brand colors. Provider color does not set surrounding component chrome, text, borders, or hover states.

**The No Palette Utilities Rule.** Product UI must not encode meaning with utilities such as `blue-500`, `green-600`, or raw hex/HSL values. Map the meaning to a semantic role first. Dynamic colors supplied by an external system, such as GitLab labels, are data and must include a readable fallback treatment.

**The One Active Voice Rule.** Signal Ink marks the dominant action or selected state. Competing active controls on the same surface are prohibited.

## 3. Typography

**Display Font:** System sans (`ui-sans-serif`, `system-ui`, `sans-serif`)
**Body Font:** System sans (`ui-sans-serif`, `system-ui`, `sans-serif`)
**Label/Mono Font:** System monospace (`ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `monospace`)

**Character:** A single system sans keeps the product immediate and familiar. Monospace is functional punctuation for identifiers, template variables, and keyboard hints—not a decorative theme.

### Hierarchy

- **Headline** (600, `1.5rem`, `1.25`): Editable note titles and the rare screen-level heading.
- **Title** (600, `1.125rem`, `1.4`): Product identity and major page anchors.
- **Section title** (600, `1.125rem`, `1.4`): Dashboard source headings and dialog titles.
- **Body** (400–500, `0.875rem`, `1.5`): Work-item titles, controls, and supporting content.
- **Label** (500, `0.75rem`, `1.25`): Metadata, statuses, and compact secondary information.
- **Shortcut** (500, `0.625rem`, `1`): Keyboard commands and terse machine-like identifiers.

### Named Rules

**The Dense, Not Tiny Rule.** Density comes from spacing and hierarchy. Primary work-item content stays at `0.875rem`; smaller sizes are reserved for metadata.

**The Functional Mono Rule.** Monospace may identify keys, issue IDs, code, or variables. It must never replace the interface's body voice.

**The Editor Scale Rule.** Note prose uses a readable `1rem` body with a `1.65–1.75` line height and a `65–75ch` measure. Editor headings use the restrained sequence `1.5rem`, `1.25rem`, `1.125rem`, and `1rem`; the note title remains the only display-sized text on the page.

## 4. Elevation

The system is flat by default. Borders and tonal shifts establish resting structure. Small shadows may sharpen a pressed/selected control or a floating control that must separate from a host page. Large elevation belongs only to true overlays such as dialogs.

### Shadow Vocabulary

- **Resting surface** (`none`): Cards, rows, fields, and section containers at rest.
- **Interactive edge** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): Selected controls, pressed controls, keyboard caps, and host-page launchers where a border alone is insufficient.
- **Floating surface** (`0 4px 10px rgb(0 0 0 / 0.12)`): Menus, popovers, and floating toolbars.
- **Overlay lift** (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): Dialogs and sheets only.

### Layer Order

- **Base content:** `0`
- **Sticky page chrome:** `10`
- **Menus, popovers, and editor toolbars:** `50`
- **Dialogs, sheets, and scrims:** `100`
- **Host-page injected UI:** one documented integration layer above GitLab chrome; avoid arbitrary maximum z-index values inside individual components.

### Named Rules

**The Flat-by-Default Rule.** A resting surface does not earn depth merely by being rectangular. Shadow must clarify interaction, selection, or an overlay layer.

## 5. Components

Components are compact and precise. Shared shape, state, focus, and density rules make controls disappear into the workflow.

### Buttons

- **Shape:** Compact (`0.375rem`) with a default height of `2.25rem`. Icon-only controls use a square (`2rem`) visual footprint with a clear accessible name; expand the hit area when the control is isolated or used on a host page.
- **Primary:** Signal Ink background, White Field text, medium `0.875rem` label, and `0.5rem 1rem` padding.
- **Hover / Focus:** Hover changes tone rather than geometry. Keyboard focus uses a visible `3px` ring at 50% ring color.
- **Secondary / Ghost:** Secondary controls use quiet tonal fills; outline controls use a boundary and White Field; ghost controls reveal their fill on hover or focus.
- **Disabled:** Disable pointer interaction and reduce opacity to 50%.

### Chips

- **Style:** Compact `0.75rem` labels with `0.125rem 0.5rem` padding. Status color is semantic; neutral metadata uses Quiet Gray. Full pills are reserved for terse statuses, counts, and tags—not general actions or containers.
- **State:** Active filter chips use Signal Ink. Inactive filters use the outline-button treatment.

### Cards / Containers

- **Corner Style:** `0.75rem` on the few primary section containers; list rows and nested controls use `0.375–0.5rem`.
- **Background:** White Field in light mode and Night Surface in dark mode.
- **Shadow Strategy:** No shadow at rest. Menus, popovers, and dialogs use their corresponding layer token.
- **Border:** One-pixel Border Mist boundary.
- **Internal Padding:** `1rem` for section containers and `0.5–0.75rem` for dense work-item rows.

**The Row-Before-Card Rule.** Repeated work items are rows within one section container. Do not place each result, skeleton, empty state, or metadata group in its own elevated card.

### Inputs / Fields

- **Style:** Compact (`2.25rem`) fields with a one-pixel border, transparent-to-surface fill, `0.75rem` horizontal padding, and `0.875rem` corners.
- **Focus:** A visible `3px` ring and ring-colored border; focus must never depend on color alone when a shape or outline can reinforce it.
- **Error / Disabled:** Critical Red marks invalid boundaries; disabled fields reduce opacity and retain their label.

#### Asynchronous field states

`Input` and `Select` intentionally have no generic loading prop. Put `aria-busy` on the smallest containing form, field, or results region whose content is being updated. Keep the current value visible during refresh, and disable a field only while interaction is genuinely unavailable. Asynchronous selection and validation must also expose status text so progress and results are announced without replacing the field value.

```tsx
<form aria-busy={isValidating}>
  <Label htmlFor="project">Project</Label>
  <Select
    value={projectId}
    onValueChange={setProjectId}
    disabled={!canChangeProject}
  >
    <SelectTrigger id="project" aria-describedby="project-status">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {/* Keep the current options visible while refreshing. */}
    </SelectContent>
  </Select>
  <p id="project-status" role="status" aria-live="polite">
    {isValidating ? 'Checking project access…' : validationMessage}
  </p>
</form>
```

### Navigation

- **Style:** A compact segmented control in the top bar. Active destinations use the main background, strongest text, and a small structural shadow; inactive destinations remain muted until hover or focus.
- **Keyboard:** Every destination and action must remain reachable in a logical tab order. Existing hotkeys are shown with compact keyboard caps where discovery matters.
- **Responsive treatment:** Dashboard content stacks by default and becomes a three-column command surface at `80rem`; controls must remain usable before that transition.

### Keyboard Shortcut Keys

- **Style:** A `1.25rem`-high monospace cap with a Quiet Gray fill, Border Mist outline, small shadow, and centered `0.625rem` text.
- **Behavior:** Shortcut hints support discoverability; they never replace accessible names or standard focus navigation.

### Notes and TipTap

- **Structure:** The sidebar, note list, and editor are panes within one bounded workspace, separated by dividers rather than individual cards or shadows.
- **Narrow widths:** Below the width needed for three useful panes, show one or two panes at a time with an explicit back path. Fixed sidebar widths must not force horizontal scrolling or collapse the editor measure.
- **Editor focus:** The editor canvas uses a `focus-within` boundary or equally visible structural indicator. Individual toolbar actions retain the shared focus ring and expose accessible names, pressed state, and shortcuts where applicable.
- **Formatting UI:** The selection toolbar and slash menu use Popover-level elevation and the shared radius scale. Formatting buttons use the shared Button primitive or reproduce its focus, disabled, and active-state contract exactly.
- **Autosave:** Saving should remain quiet during normal operation; expose a compact saving, saved, or error message when persistence is delayed or fails. Never rely on silent debounce as the only feedback for failure.

### GitLab-Mounted Controls

- **Host coexistence:** Injected controls are an extension layer inside Shadow DOM, but they still use the same semantic tokens, typography, radii, and primitives as the new-tab workspace.
- **Launcher group:** Multiple bottom-right actions form one compact, ordered control group with consistent height and shape. Avoid a row of unrelated floating pills with separate shadows.
- **Shape and depth:** A host-page launcher may use a pill only when it includes a terse state label; icon launchers remain compact circles or squares. Popover internals are flat rows and sections—never nested `1rem+` rounded cards, blur, or decorative shadows.
- **Motion:** Host-page controls must not move on hover. Use color, border, or elevation changes so GitLab content remains spatially stable.
- **Layering:** Blur is reserved for a modal scrim if needed, not launcher or popover decoration. One integration-layer token governs the mounted group and its overlays.
- **Status color:** Translate GitLab/Jira workflow values into the operational semantic roles. Keep the provider's exact color only when displaying provider-owned label data, with text or an icon carrying the same meaning.

## 6. Do's and Don'ts

### Do:

- **Do** organize each source around a clear title, compact metadata, and a nearby next action.
- **Do** preserve `0.875rem` as the primary dense-content size and reserve `0.625–0.75rem` for metadata and keyboard hints.
- **Do** use the `3px` focus ring consistently so every interactive workflow is fully operable by keyboard.
- **Do** reserve Action Blue and Critical Red for semantic information and state.
- **Do** use Warning Amber and Positive Green only for operational warning and success/completion states.
- **Do** use rows, dividers, and tonal changes before introducing another card or shadow.
- **Do** keep routine state transitions at `150ms` and overlay transitions at `200ms`.

### Don't:

- **Don't** make Hustle Hub feel like a generic list app with little attention paid to fast scanning, information hierarchy, or precision.
- **Don't** rely on color alone to communicate status, priority, or selection; pair it with text, icons, or structure.
- **Don't** hide focus indicators or create mouse-only actions.
- **Don't** add decorative motion, page-load choreography, or delays that interrupt the work loop.
- **Don't** use blur, oversized pills, maximum z-index values, or nested rounded panels to make injected controls feel separate from GitLab.
- **Don't** remove focus rings from custom inputs, editor controls, or icon buttons without replacing them with an equally visible focus treatment.
- **Don't** introduce a new component shape or interaction vocabulary when an existing button, field, chip, menu, or dialog already fits.
