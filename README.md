# Bioprocessing Cheat Sheet Site

Static Swiss-style learning site that explains upstream and downstream bioprocessing as a strategic cheat sheet with no vendor framing.

## Run

### Option 1: Open directly
1. Open `/Users/troysullivan/Documents/BioProcessing/index.html` in a browser.

### Option 2: Local static server
1. From `/Users/troysullivan/Documents/BioProcessing`, run:
   ```bash
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000`.

No build tools, frameworks, CDNs, trackers, or analytics are used.

## File Structure

```text
/Users/troysullivan/Documents/BioProcessing
├── index.html
├── assets
│   ├── diagrams.svg
│   ├── hero-bioprocessing.png
│   └── favicon.svg
├── css
│   └── styles.css
├── js
│   └── main.js
└── README.md
```

## Design System

### Grid
- 12-column CSS Grid at desktop with max content width `1280px`.
- Column gap uses spacing token `--space-2` (`16px`).
- Breakpoints:
  - `1440px`
  - `1024px`
  - `768px`
  - `480px`
- Mobile collapses to single-column layout while preserving section hierarchy.

### Typography
- Primary sans: local `Geist` with system fallback stack.
- Technical mono: local `Geist Mono` with system monospace fallback stack.
- Scale:
  - `H1`: `clamp(3.2rem, 7.2vw, 5.8rem)`
  - `H2`: `clamp(2.1rem, 3.6vw, 3rem)`
  - `H3`: `clamp(1.35rem, 2.1vw, 1.9rem)`
  - `Body`: `1.125rem`
  - `Small`: `1rem`
  - `Caption`: `0.8125rem`

### Spacing
- 8pt token scale via CSS variables:
  - `--space-1: 8px`
  - `--space-2: 16px`
  - `--space-3: 24px`
  - `--space-4: 32px`
  - `--space-5: 40px`
  - `--space-6: 48px`
  - `--space-8: 64px`
  - `--space-10: 80px`
  - `--space-12: 96px`
  - `--space-14: 112px`

### Colors
- `--color-background: #fbfaf6`
- `--color-foreground: #111111`
- `--color-muted: #645f57`
- `--color-border: #d5cfc4`
- `--color-accent: #0e5e73`

Accent is used only for emphasis rules and selected diagram elements.

### Components
- Sticky minimal top navigation with active section state.
- Section header block (number + title).
- Definition callout for acronyms/key concepts.
- Compare grid (upstream vs downstream).
- Diagram block with caption (inline SVG).
- Glossary term row (alphabetical list, concise definitions).

## Accessibility and UX Notes

- Semantic structure: `header`, `nav`, `main`, `section`, `footer`.
- Skip-to-content link for keyboard users.
- Visible focus states on interactive elements.
- High-contrast neutral palette.
- `prefers-reduced-motion` support for users sensitive to motion.
- Print stylesheet for clean cheat-sheet output.
