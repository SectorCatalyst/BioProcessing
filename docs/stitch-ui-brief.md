# Stitch UI Brief

Use this brief in Google Stitch to generate the UI direction for this application. This project is already implemented in Next.js, so the goal is not to invent a new product. The goal is to generate a stronger visual system and a cleaner application shell that can be applied to the existing calculator.

## Stitch Prompt

```text
Design a complete web application UI for an existing product called “Bioprocess Development ROI Calculator.”

This is a client-facing application for pharma, biotech, and CDMO teams estimating the business value of digital bioprocess workflow improvements.

Do not design a landing page.
Do not design a generic admin dashboard.
Do not simplify this into a marketing site.
Design a full application interface for a real working calculator.

Visual direction:
Create a premium futuristic industrial analytics interface using the Yokogawa corporate color palette.
The result should feel advanced, precise, technical, and elegant, while still being readable and client-facing.
Think modern control-room software, industrial intelligence system, or high-end operational analytics platform.
Avoid crypto aesthetics, purple cyberpunk, noisy gradients, and cluttered enterprise dashboard tropes.

Brand colors:
- Yokogawa Yellow: #FFEE00
- Yokogawa Blue: #004F9B
- Yokogawa Green: #00A04C
- Yokogawa Indigo: #00316C

Color rules:
- Primary actions and major emphasis should use Yokogawa Blue
- Deep premium surfaces and structural framing should use Yokogawa Indigo
- Success and positive system indicators should use Yokogawa Green
- Yokogawa Yellow should be used sparingly for accent, emphasis, or attention moments
- Never use white text on yellow
- Never use yellow text on white
- White text should only appear on blue, indigo, green, or dark surfaces
- Keep the palette disciplined and premium

Theme:
Use a dark futuristic theme.
The background should feel layered and atmospheric, not flat black.
Use deep indigo and blue surfaces, clean line work, subtle glows, restrained depth, and precise card framing.
Use rounded corners but keep the overall feeling sharp and controlled.

Typography:
Use a modern technical sans-serif.
Strong hierarchy.
Large numeric readouts.
Compact uppercase labels for metadata.
Readable and polished, not playful.

Application structure:
1. A premium top hero/control area for the active scenario
2. Large ROI percentage readout
3. Scenario switcher for Conservative, Expected, Aggressive
4. Readiness / confidence indicator
5. Short business summary sentence showing payback or business impact
6. KPI cards for:
   - Total Investment
   - 3-Year ROI
   - Payback Period
   - NPV
   - Annual Direct Value
   - Annual Capacity Value
   - Annual Strategic Value
   - 3-Year Net Benefit
7. Scenario comparison section
8. Sample Data card with:
   - dataset selector
   - Load Sample Data
   - Restore My Inputs
9. Quick Actions card with:
   - Copy Scenario
   - Refresh Results
   - Reset Inputs
10. Main application workspace with tabs:
   - Overview
   - Inputs
   - Assumptions
   - Change Notes
   - Export

Within the workspace:
- Overview should include KPI cards, charts, and estimate review content
- Inputs should use clean accordion-based form sections
- Assumptions should show a refined structured table
- Change Notes should include a note form and recent activity list
- Export should include export actions and session metadata

UX priorities:
- Make complexity feel organized and calm
- The first screen should immediately communicate ROI and confidence
- Use strong alignment and clean spacing
- Make actions obvious
- Make status, scenario state, and active controls feel tactile
- Keep charts visually integrated into the system
- The result should feel like a production-ready Next.js + Tailwind + shadcn application

Important constraints:
- Do not create a homepage / hero-marketing experience
- Do not use empty decorative sections
- Do not make it look like a finance trading terminal
- Do not add random illustrations
- This is a working enterprise calculator UI, not a promotional concept
```

## Required Screens

Ask Stitch to generate at least these views:

1. Lead capture gate
   - Contact form
   - Sample session entry point
   - Short explanation of why contact is required

2. Main calculator workspace
   - Hero ROI panel
   - Scenario controls
   - Sample data card
   - Quick actions card
   - Overview tab active

3. Inputs workspace
   - Accordion-based form sections
   - Clean field styling
   - Validation/error state example

4. Assumptions workspace
   - Structured table / register view

5. Change notes workspace
   - Form + activity feed

6. Export workspace
   - JSON / CSV / PDF actions
   - export metadata panel

## Existing Product Constraints

The design must support these existing product concepts:

- Three scenarios: Conservative, Expected, Aggressive
- Separated value categories:
  - Direct value
  - Capacity value
  - Strategic value
- Lead capture gate before calculator access
- Sample data loading
- Export actions
- Review/readiness and confidence indicators
- Charts and structured tables

## Export Requirements

When you export from Stitch, prioritize one of these:

1. Figma export with clear layers and components
2. HTML/CSS export
3. High-resolution screenshots for each screen if no structured export is available

Ideal deliverables:

- desktop main workspace
- desktop inputs view
- desktop assumptions view
- desktop change notes view
- desktop export view
- mobile or tablet responsive version of the main workspace

## What To Hand Back For Integration

Once you have the Stitch output, provide one of the following:

- exported HTML/CSS
- Figma export or share link
- screenshots of the final chosen screens
- any generated design tokens, spacing rules, or component notes

After that, the implementation work can be applied directly into:

- `/Users/troysullivan/Documents/BioProcessing ROI Calculator/components/calculator-app.tsx`
- `/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/globals.css`
- `/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/layout.tsx`

## Notes

- Stitch does not appear to expose a documented public API I can call directly from this environment.
- This brief is the fastest way to generate the UI externally and then bring it back here for implementation.
