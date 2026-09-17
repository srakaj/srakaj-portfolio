# SRAKAJ Site Studio

A local visual website editor for GitHub-hosted static sites, designed around:

- `srakaj/srakaj-portfolio` (`srakaj.com`)
- `srakaj/opportunity-radar`

The editor runs only on `127.0.0.1`, loads a repository preview through GitHub, lets you click elements directly in the preview, applies CSS changes live, and writes them back only after you explicitly press **Publish to GitHub**.

## Version 0.1 controls

- project-wide colour tokens
- global serif and sans-serif fonts
- a large Google Fonts/system-font catalogue
- font size, weight, line height, letter spacing and alignment
- text colour
- width, max-width and min-height
- padding, margin and gap
- borders, radii, backgrounds and shadows
- display and position
- top/left offsets, z-index, transform and opacity
- desktop, tablet and mobile previews
- multiple HTML pages
- persistent local drafts by repository and branch

Published edits are isolated in a clearly marked `SITE STUDIO OVERRIDES` block in the project's normal stylesheet. Existing CSS stays intact, and every publication is a normal Git commit.

## Start on Windows

1. Install Node.js 20 or newer if necessary.
2. Clone/download this repository and switch to the `site-studio-v1` branch while testing the prototype.
3. Open the `site-studio` folder.
4. Double-click `start-site-studio.bat` or run `node server.mjs`.
5. Open `http://127.0.0.1:4317`.

The current build uses only Node's built-in modules, so there is no dependency installation step.

## Authentication and safety

Reading the current public sites does not require authentication. Publishing is designed to use GitHub authentication locally. Preview changes never touch GitHub until **Publish to GitHub** is explicitly used.

The editor modifies only the configured CSS file. It does not alter the Opportunity Radar's Python logic or data files.

## Planned extensions

Useful next additions are drag-and-drop positioning, visual flex/grid controls, hover-state editing, gradients and background images, reusable theme presets, before/after comparison, branch/PR publishing, and automatic discovery of new static GitHub repositories.
