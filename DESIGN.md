# Apple-Inspired Design System — Industry English

> Source: principles distilled from Apple.com (consumer electronics).
> External reference URL `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/apple/DESIGN.md` returned 404 at the time of fetching; this file captures the directives we are working to.

## Philosophy
Premium white space. Cinematic alternating sections. Content-first typography.
Subtle motion. No textures, no gradients in backgrounds. Hairlines, not shadows.

---

## Color Tokens

| Token            | Value      | Usage                                  |
| ---------------- | ---------- | -------------------------------------- |
| `--apple-white`  | `#ffffff`  | Primary light section background       |
| `--apple-black`  | `#000000`  | Primary dark / immersive section bg    |
| `--apple-gray`   | `#f5f5f7`  | Secondary section background           |
| `--apple-fg`     | `#1d1d1f`  | Body text on light                     |
| `--apple-fg-2`   | `#6e6e73`  | Secondary text on light                |
| `--apple-line`   | `#d2d2d7`  | Hairline borders, dividers             |
| `--apple-blue`   | `#0071e3`  | Default link / CTA                     |
| `--apple-blue-d` | `#2997ff`  | Link / CTA on dark backgrounds         |
| `--apple-link`   | `#0066cc`  | Inline "Learn more" links              |

Sections **alternate** white / gray / black. No gradients. No textures.

---

## Industry Accent (preserved)

The base UI is Apple-neutral. Only `--accent` swaps per industry.

- Default / Digital Marketing → `#0071e3` (Apple blue, dark variant `#2997ff`)
- F&B → `#b07e1e` amber, dark variant `#d99a39`

---

## Typography

```
font-family: "SF Pro Display", "SF Pro Text",
             -apple-system, BlinkMacSystemFont,
             "Helvetica Neue", Helvetica, Arial,
             sans-serif;
```

| Role           | Size     | Weight | Line-height | Letter-spacing |
| -------------- | -------- | ------ | ----------- | -------------- |
| Hero           | 80px     | 600    | 1.05        | -0.5px         |
| Headline       | 56px     | 600    | 1.07        | -0.28px        |
| Section Title  | 40px     | 600    | 1.10        | -0.32px        |
| Sub-title      | 24px     | 600    | 1.20        | -0.20px        |
| Body           | 17px     | 400    | 1.47        | -0.022em       |
| Small          | 14px     | 400    | 1.43        | -0.016em       |
| Caption        | 12px     | 400    | 1.33        | normal         |
| Eyebrow        | 12px     | 500    | 1.33        | 0.06em (UPPER) |

Headlines may be center-aligned. **Body text stays left-aligned.**
Never use `font-weight ≥ 800`.

---

## Layout

- Max content width: **980px** (some hero sections may break out to ~1080px).
- Generous vertical rhythm: section padding `96px` desktop / `64px` mobile.
- Outer page padding: `22px` mobile, `48px+` desktop.
- Content centered horizontally; copy blocks themselves left-aligned.

---

## Components

### Buttons
- Pill: `border-radius: 980px`.
- Primary (filled blue): `bg: var(--accent)`, white text, `padding: 12px 22px`.
- Secondary (outline): transparent, accent text, accent border.
- Tertiary (text link): accent text + `›` chevron.
- Hover: 0.04 brightness lift, no transform.

### Cards
- **No drop shadows.**
- Differentiation via background color shifts (`white` ↔ `gray` ↔ `black`).
- Border radius: `12–18px` (never above `0.75rem` = 12px hard limit, except pills).
- Hairline border `1px solid var(--apple-line)` only when needed for clarity.

### Navigation
- Sticky top.
- Glassmorphism: `backdrop-filter: blur(20px) saturate(180%);`
  background `rgba(255, 255, 255, 0.72)` light / `rgba(0, 0, 0, 0.72)` over dark.
- Border-bottom hairline only.

### Form Fields
- Pill or 12px radius. Light gray fill `#f5f5f7`. Focus ring = `var(--accent)`.

### Drag / Drop
- Dotted border (`1.5px dashed var(--apple-line)`), white background.
- On dragover: switch border to accent.

---

## Motion

Allowed:
- Fade in / out (`opacity 200–400ms ease-out`).
- Slide up (`translateY 8–16px → 0`).
- Color/background transitions (`200ms ease-out`).

Banned:
- Bounce, scale, rotate.
- Pulsing rings.
- Continuous animations (no infinite loops, except a quiet recording dot).

---

## Do / Don't

**Do**
- Alternate section backgrounds for cinematic flow.
- Center headlines, left-align body.
- Use hairlines and color contrast for separation.
- Generous whitespace.

**Don't**
- Apply textures, patterns, or background gradients.
- Use border-radius above `0.75rem` (12px) except for pill controls.
- Use `font-weight ≥ 800`.
- Center body copy.
- Add drop shadows on cards.
