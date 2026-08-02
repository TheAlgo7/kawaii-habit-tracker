---
name: Kawaii Habit Tracker
description: A sunlit pocket garden for gentle, imperfect routines.
colors:
  canvas-day: "oklch(96.4% 0.024 80)"
  surface-day: "oklch(98.5% 0.015 82)"
  ink-day: "oklch(30% 0.045 18)"
  muted-ink-day: "oklch(46% 0.035 35)"
  persimmon: "oklch(53% 0.14 38)"
  sage: "oklch(62% 0.075 137)"
  sage-soft: "oklch(91% 0.05 130)"
  warm-divider: "oklch(84% 0.035 74)"
  canvas-night: "oklch(20% 0.035 278)"
  surface-night: "oklch(25% 0.04 276)"
  ink-night: "oklch(94% 0.025 82)"
  lantern-gold: "oklch(80% 0.105 78)"
  danger: "oklch(51% 0.16 28)"
typography:
  display:
    fontFamily: "Georgia, Iowan Old Style, Palatino Linotype, serif"
    fontSize: "clamp(2rem, 8vw, 3.55rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Georgia, Iowan Old Style, Palatino Linotype, serif"
    fontSize: "clamp(1.55rem, 5.5vw, 2.35rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, SF Pro Rounded, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, SF Pro Rounded, Segoe UI, system-ui, sans-serif"
    fontSize: "0.69rem"
    fontWeight: 820
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  control-sm: "0.45rem"
  field: "0.72rem"
  surface: "0.9rem"
  scene: "1.2rem"
  pill: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  section: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.persimmon}"
    textColor: "{colors.surface-day}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0.72rem 1.08rem"
    height: "2.85rem"
  button-secondary:
    backgroundColor: "{colors.surface-day}"
    textColor: "{colors.ink-day}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0.72rem 1.08rem"
    height: "2.85rem"
  field:
    backgroundColor: "{colors.surface-day}"
    textColor: "{colors.ink-day}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0.68rem 0.78rem"
    height: "2.9rem"
  bottom-navigation:
    backgroundColor: "{colors.surface-day}"
    textColor: "{colors.muted-ink-day}"
    typography: "{typography.label}"
    rounded: "{rounded.surface}"
    padding: "0.42rem"
---

# Design System: Kawaii Habit Tracker

## Overview

**Creative North Star: "The Sunlit Storybook Garden"**

The interface should feel like opening a quiet illustrated journal beside a sunny window. Painterly scenes carry emotion, editorial plum typography gives the experience dignity, and crisp interface controls preserve speed and trust. The visual language is cozy, playful, and reassuring, but never infantile.

The daily loop is phone-first and deliberately sparse: one atmospheric scene, one clear agenda, and immediate care feedback. Tablets become a two-page spread with the world on one side and the agenda on the other. Moonlit Nook changes the light, not the product identity. All three themes preserve the same spacing, hierarchy, icons, and interaction model.

The system explicitly rejects emoji collage interfaces, neon game dashboards, corporate performance tracking, childish toy chrome, generic AI pastel-card compositions, and guilt-driven streak mechanics.

**Key Characteristics:**

- Painterly atmosphere paired with precise, accessible controls.
- Editorial serif headings and quiet humanist interface type.
- Warm paper, persimmon action, sage completion, and plum ink.
- Open rows and dividers before nested card stacks.
- Botanical first-party icons instead of platform emoji.
- Responsive phone and tablet composition, never a stretched phone mockup.

## Colors

The daylight palette is warm paper under botanical light; the night palette is aubergine paper lit by sage and lantern gold.

### Primary

- **Pressed Persimmon:** Reserved for the active tab, primary actions, current-day accents, and the smallest important emphasis on each screen.

### Secondary

- **Garden Sage:** Communicates care, completion, recovery, and healthy growth. It is the success language, never a decorative wash across every surface.
- **Soft Sage Paper:** Supports progress panels, selected comfort controls, and quiet empty states.

### Tertiary

- **Lantern Gold:** Marks tiny versions, warmth, and special night-theme highlights. It must not compete with persimmon for the primary action.

### Neutral

- **Oat Canvas:** The daylight app background and the visual equivalent of warm sketchbook paper.
- **Raised Cream:** Modal, input, and navigation surfaces that need gentle separation from the canvas.
- **Editorial Plum:** Primary text and headings. It replaces pure black with a warmer, more authored voice.
- **Quiet Umber:** Supporting copy, metadata, and helper text.
- **Warm Divider:** One-pixel boundaries between rows. Dividers carry more structure than boxes.
- **Moonlit Aubergine:** The true dark-theme canvas. It is deep and calm, never a purple gradient spectacle.
- **Night Paper:** Raised dark surfaces with enough contrast to remain legible at low brightness.
- **Moon Cream:** Primary text in Moonlit Nook.

### Named Rules

**The One Warm Action Rule.** Persimmon should occupy less than roughly ten percent of a screen. Its rarity makes the next action obvious.

**The State Before Decoration Rule.** Sage means completion or growth, gold means tiny or warm emphasis, and danger red means destructive action. Never use these roles interchangeably.

**The No Pure Extremes Rule.** Pure white and pure black are prohibited for large surfaces or primary text. Use the warm semantic tokens.

## Typography

**Display Font:** Georgia, with Iowan Old Style and Palatino Linotype fallbacks

**Body Font:** Inter when available, then SF Pro Rounded, Segoe UI, and system UI

**Label Font:** The body stack in a compact uppercase treatment

**Character:** The serif is literary and calm, giving the garden the feeling of a treasured storybook. The sans stack stays familiar and exceptionally readable for rapid daily interaction.

### Hierarchy

- **Display** (600, fluid 2rem to 3.55rem, 1.08): Scene greetings and onboarding promises only.
- **Headline** (600, fluid 1.55rem to 2.35rem, 1.08): Page and section titles.
- **Title** (760, 0.86rem to 1rem, 1.35): Habit, goal, and settings-row names in the body stack.
- **Body** (400 to 710, 0.78rem to 1rem, 1.5): Instructions, tiny versions, and conversational copy. Keep long reading lines below 65 characters.
- **Label** (820, 0.69rem, 0.12em, uppercase): Section kickers, dates, and time-of-day groups. Never use it for sentences.

### Named Rules

**The Editorial Split Rule.** Serif type expresses place and meaning. Sans type expresses action and state. Buttons, inputs, and navigation labels must never use the display serif.

**The Two-Weight Rule.** Most screens should use only regular body copy and strong labels. Extra weights are prohibited unless they create a real hierarchy change.

## Elevation

The system is flat by default and gains depth through tonal layers, one-pixel warm borders, and open dividers. Shadows are ambient, wide, and low-opacity. They identify a floating bottom navigation, modal, scene panel, or selected control; they never turn every row into a floating card.

### Shadow Vocabulary

- **Ambient lift** (`0 18px 50px oklch(32% 0.04 40 / 0.13)`): App frame, dialogs, and exceptional floating feedback.
- **Quiet lift** (`0 8px 24px oklch(32% 0.035 40 / 0.09)`): Selected controls, art panels, and the tablet navigation dock.
- **Night ambient** (`0 22px 60px oklch(8% 0.03 285 / 0.48)`): Dark-theme dialogs and frames only.

### Named Rules

**The Flat Agenda Rule.** Habit rows, task rows, history rows, and settings rows use dividers, not individual shadows.

**The Atmosphere Has Depth Rule.** Illustration scenes may use overlays, blur, and ambient shadow for readable text. The controls placed on them remain crisp and bounded.

## Components

### Buttons

- **Shape:** Fully rounded for primary and secondary actions; circular for completion and icon-only actions. Touch targets are at least 44 by 44 CSS pixels.
- **Primary:** Pressed Persimmon with warm cream text, medium padding, and one short verb-led label.
- **Hover / Focus:** Hover deepens the semantic color. Keyboard focus uses a three-pixel accent outline with a three-pixel offset. Active state scales to 97 percent.
- **Secondary / Ghost:** Secondary buttons use a warm border and raised paper. Ghost actions have no resting container and gain a soft semantic tint on hover.

### Chips

- **Style:** Conversation starters and small action choices use pill geometry, one-pixel warm borders, and body-stack labels.
- **State:** Selection changes border, soft background, icon, and `aria-pressed`; color alone is never the only signal.

### Cards / Containers

- **Corner Style:** Gently irregular illustrated tiles or 0.9rem to 1.2rem surfaces.
- **Background:** Warm raised cream by day and Night Paper after dark.
- **Shadow Strategy:** Flat for ordinary content; Quiet Lift for selected controls and artwork; Ambient Lift for modal layers.
- **Border:** One warm pixel. Dashed borders are reserved for empty or still-growing states.
- **Internal Padding:** 0.75rem to 1.2rem, with 2rem between major sections.

### Inputs / Fields

- **Style:** Raised paper, one-pixel warm border, 0.72rem corners, and a minimum 2.9rem height. Mobile text inputs render at 16px or larger to prevent iOS zoom.
- **Focus:** Persimmon border plus a three-pixel soft persimmon ring.
- **Error / Disabled:** Errors use the danger token and adjacent text. Disabled choices reduce opacity but retain readable labels.

### Navigation

- The phone layout uses four equal bottom tabs with a 44px-plus target, icon, and visible label. The active tab receives both a persimmon icon and a soft filled background.
- Tablets use the same four-tab model as a centered floating dock inside the app frame. Navigation is never reduced to icons alone.
- Page headers pair one small illustrated mark with a serif title and a quiet subtitle. Settings remains a familiar gear icon at the far edge.

### Habit Row

- Each habit combines a first-party botanical tile, name, tiny version, seven dated state marks, a menu action, and one large completion circle.
- Full care uses sage with a check. Tiny care uses gold with a leaf. Rest uses a dashed state. Today receives a separate outline.
- Completion feedback appears inline with Undo, so acknowledgment stays next to the action and never interrupts the session.

## Do's and Don'ts

### Do:

- **Do** let the approved watercolor garden carry atmosphere while every interactive control remains real HTML with visible states.
- **Do** use Pressed Persimmon for one primary action and Garden Sage for completion.
- **Do** preserve 44px touch targets, three-pixel keyboard focus, readable state labels, reduced motion, and 200 percent zoom.
- **Do** use open rows, one-pixel dividers, and progressive disclosure before adding another card.
- **Do** preserve the exact same information architecture in Sunlit Garden, Moonlit Nook, and Matcha Study.
- **Do** compose tablets as a deliberate two-page spread when space allows.

### Don't:

- **Don't** build an **emoji collage interface where platform glyphs substitute for a designed asset system**. All product icons and collectibles must belong to the first-party botanical family.
- **Don't** use **neon gamer dashboards, heavy RPG terminology, multiple currencies, punishment, or loss mechanics**. This garden grows through care, not grinding.
- **Don't** make a **corporate productivity dashboard that turns self-care into performance management**. Percentages explain history; they do not rank the person.
- **Don't** create a **childish toy interface that reduces readability, dignity, or all-ages appeal**. Warmth is not baby talk.
- **Don't** ship **generic AI-generated pastel cards, decorative glass effects, or inconsistent controls**. Generated art may supply atmosphere only after it is translated into a coherent, accessible system.
- **Don't** use **streak systems that shame users, reset their identity to zero, or make rest feel like failure**. Rest and tiny versions remain visible parts of the rhythm.
- **Don't** turn Moonlit Nook into a purple gradient, neon accent, or glassmorphism theme. It is the same paper garden under lantern light.
- **Don't** place serif display type inside buttons, fields, tabs, chips, or dense data labels.
