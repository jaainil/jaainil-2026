---
name: Jainil Prajapati — Portfolio
description: Personal portfolio as a brick instruction booklet — sky-blue pages, black keylines, pieces and steps.
colors:
  page-sky: "#aee1ff"
  paper: "#ffffff"
  ink: "#10151b"
  keyline: "#111111"
  piece-red: "#e53935"
  piece-red-deep: "#b3211e"
  marker-yellow: "#ffcd00"
  action-blue: "#147bd1"
  action-blue-deep: "#0d5ea8"
  plate-gray: "#d9d9d9"
  plate-shade: "#b9bdc1"
  ghost-blue: "#7fa8cc"
  surface-elevated: "#f3f8fe"
  text-secondary: "#33404e"
  text-muted: "#4a5b6b"
  hover-wash: "#e7f4ff"
  link-blue: "#0d5ea8"
  footer-ink: "#10151b"
  footer-border: "#2a3644"
  footer-text: "#b9c6d2"
  dark-page: "#0f1b2d"
  dark-paper: "#17273e"
  dark-ink: "#eaf3fe"
  dark-keyline: "#dbe9f7"
  dark-piece: "#ff6b62"
  dark-action: "#5aa9f0"
typography:
  display:
    fontFamily: "Rubik Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Rubik Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Rubik Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
  body:
    fontFamily: "Rubik Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Rubik Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "24px"
  lg: "32px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.action-blue-deep}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "14px 24px"
  button-danger:
    backgroundColor: "{colors.piece-red}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "14px 24px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "24px 28px"
  chip-category:
    backgroundColor: "{colors.marker-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: Jainil Prajapati — Portfolio

## Overview

**Creative North Star: "The Instruction Booklet"**

The site is a brick build-instruction manual for an engineer. Every page is a printed instruction sheet: sky-blue paper, black keylines around every element, chunky rounded numerals counting the steps, and pieces (colored squares) that show what each step adds. Projects are taught, not listed: each build is a numbered sequence where every step names only the piece that step contributed. The dark theme is the same booklet under a work lamp — deep navy pages, light ink, identical piece colors tuned for contrast. Depth is printed, not lit: a hard black offset under each element, like a sticker pressed on the page. There is no monospace anywhere; the terminal aesthetic of the previous design is the explicit anti-reference.

**Key Characteristics:**
- 2px black keyline border on every interactive or container element
- Hard offset shadows (0 2–4px 0 keyline, zero blur), hover lifts the piece
- Sky-blue page ground, white paper cards, four piece colors with fixed roles
- Giant 900-weight numerals as section and step markers
- Isometric brick diagrams annotated with leader lines and dashed guides
- One authored motion: pieces drop into their seats on load

## Colors

A four-color piece palette on sky-blue paper, with black ink and keylines. Each piece color has exactly one job.

### Primary
- **Action Blue** (#147bd1, dark #5aa9f0): controls and links. Buttons, active filter tabs, focus rings, text links (link-blue #0d5ea8 in light for contrast).

### Secondary
- **Piece Red** (#e53935, dark #ff6b62): marks the new piece. Step numerals for the current role, "added in this step" emphasis, the dropping brick in the hero diagram, the primary email action, the reading-progress bar.

### Tertiary
- **Marker Yellow** (#ffcd00, same both themes): position markers. The "Open to full-time roles" badge, "You are here" tab, category chips, theme toggle, back-to-top, copy toast. Never used for body-size text on sky ground.

### Neutral
- **Page Sky** (#aee1ff): the page ground in light mode.
- **Paper White** (#ffffff): cards, sheets, call-outs, the Builds section band.
- **Ink** (#10151b): all text and the keyline ink (#111111 for borders).
- **Plate Gray** (#d9d9d9): the baseplate color in diagrams, scrollbar thumb.
- **Ghost Blue** (#7fa8cc): dashed guide borders on stud-grid frames and dividers.
- **Footer Ink** (#10151b ground, #b9c6d2 text): the colophon footer.
- Dark theme swaps: page #0f1b2d, paper #17273e, ink #eaf3fe, keyline #dbe9f7.

### Named Rules
**The Piece Rule.** Red marks the piece a step adds; yellow marks where the build stands; blue works the controls. A color never borrows another's job.
**The Keyline Rule.** Every interactive element and container carries a 2px keyline border and a hard offset shadow. If it has no keyline, it is not part of the kit.

## Typography

**Display Font:** Rubik Variable (fallback: system sans)
**Body Font:** Rubik Variable — one family, weight does all the work

**Character:** Rounded-terminal geometric grotesque; heavy weights read as toy-instruction lettering without becoming comic. No monospace, no serif, no second family.

### Hierarchy
- **Display** (900, clamp(3rem–4.5rem), 0.95 line-height, -0.025em tracking): the name on the cover, section h2s at 3xl/4xl.
- **Step Numerals** (900, 6xl–7xl): step numbers and build numbers, red when current, ink when past.
- **Title** (800, xl–2xl): card and step headings, tight leading.
- **Body** (400–500, base–lg, relaxed leading): 65–75ch measure on article sheets.
- **Label** (900, xs, +0.05em, uppercase): tiny compartment headers and chip text only — never as an eyebrow above a heading.

### Named Rules
**The One Family Rule.** Rubik carries every role from hero to chip text. Weight 400–900, nothing else.

## Layout

Single centered column, max-width 72rem (max-w-6xl) with 16/24px side gutters. Sections stack in booklet order; the Builds section is a full-bleed white paper band to pace the scroll between blue pages. Section rhythm is 56px (py-14) above and below. Grids: builds and notes at 1/2/3 columns; parts inventory at 1/2/3 columns as one divided panel, not separate cards. Article sheets read at max 72ch centered.

### Named Rules
**The Full-Bleed Separator Rule.** Section dividers are 2px keyline lines spanning the entire viewport width, never stopping at the container edge.

## Elevation & Depth

Depth is printed, not lit. The only shadow in the system is the hard offset: `box-shadow: 0 Npx 0 var(--keyline)` with zero blur, N = 2 for small controls, 3 for buttons, 4 for cards and panels. Hover lifts an element with `translateY(-1 to -2px)`; the shadow stays put, so the piece visibly rises off the page. No blur, no ambient glow, no layered elevations.

### Shadow Vocabulary
- **Control lift** (`0 2px 0 var(--keyline)`): nav tabs, chips, small toggles.
- **Button lift** (`0 3px 0 var(--keyline)`): all buttons, the TOC dock, stamp cards.
- **Card lift** (`0 4px 0 var(--keyline)`): cards, panels, sheets, the inventory grid.

## Shapes

Rounded but crisp: cards 16px, buttons and inputs 12px, chips 6–10px. The 2px keyline border is universal and always the same ink as text. Dashed variants of the keyline (2px dashed ghost-blue) mean "guide" — empty seats, stud-grid frames, divider rules inside cards. The stamp component rotates ±1.2deg with a dashed inner border to read as a rubber stamp on the page. Isometric diagrams use 2:1 dimetric projection with 2px keylined edges and ellipse studs.

## Components

### Buttons
- **Shape:** rounded-xl (12px), 2px keyline, button-lift shadow.
- **Primary:** action-blue ground, white text, bold. Hover: -2px lift.
- **Secondary:** paper ground, ink text. Same geometry.
- **Danger/Email:** piece-red ground, white text — reserved for the email action.
- **Focus:** 3px action-blue outline, 2px offset.

### Chips
- **Category chip:** marker-yellow ground, ink text, 2px keyline, uppercase 900 at 11px.
- **Piece chip:** paper ground, ink text, keyline — lists what a step added.

### Cards / Containers
- **Corner:** 16px. **Ground:** paper. **Border:** 2px keyline. **Shadow:** card lift. **Padding:** 24–28px. Images inside cards are edge-to-edge with a 2px keyline bottom border.

### Inputs / Fields
- **Style:** paper ground, 2px keyline, control-lift shadow, 12px radius, icon left.
- **Focus:** global 3px blue outline; no glow.

### Navigation
- Header tabs: keyline pills on the sky ground; active section scrolls, not highlighted. Mobile: hamburger (keyline square) opens a stacked sheet of full-width pills. Sticky with 2px keyline bottom edge.

### TOC Dock (signature)
- Fixed bottom-center pill: collapsed shows the current heading with a brick glyph and chevron; expands upward into a numbered contents panel. Active entry's number chip fills piece-red. Closes on pick, Escape, or outside click.

### Isometric Diagram (signature)
- SVG bricks from real 2:1 dimetric math; three faces per brick (top/right/left shades), ellipse studs, 2px keyline edges. Dashed red seat diamond and drop arrow mark where the piece lands; leader-line labels annotate parts directly, no legends.

## Do's and Don'ts

### Do:
- **Do** keep every claim next to its artifact link — evidence is the design.
- **Do** use dashed keylines for guides, seats, and ghost states.
- **Do** keep dark mode as the navy work-lamp booklet with the same piece hues.
- **Do** theme browser chrome from the palette: selection marker-yellow, focus blue, scrollbars plate-gray.

### Don't:
- **Don't** reintroduce the old anti-references: pulsing status dots, `//` section labels, uppercase tracking-widest micro-labels, mono type, fake ID cards, "STATUS: ACTIVE" rows.
- **Don't** use blur or ambient shadows; the only shadow is the hard keyline offset.
- **Don't** add a second display face or a serif; Rubik does everything.
- **Don't** use red or yellow as body-text colors on the sky ground — contrast fails; they mark pieces, not prose.
