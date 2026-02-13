# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A reusable markdown-to-slides presentation template. Drop in markdown files, optionally configure via `slideshow.json`, and get a working slideshow with themes, navigation, and module support — zero code changes required.

## Architecture

- **Content**: Markdown `.md` files are the source of truth for slide content
- **Config**: `slideshow.json` defines the title, default theme, and module list
- **Presentation**: `index.html` is a self-contained single-page app (HTML + CSS + JS) using marked.js
- **Slide splitting**: Content is divided into slides by `---` horizontal rules in the markdown

## Two Modes of Operation

### Config mode (primary)
If `slideshow.json` exists, it drives everything:
```json
{
  "title": "My Presentation",
  "theme": "c",
  "modules": [
    { "title": "Welcome", "file": "00.md" },
    { "title": "Deep Dive", "file": "01-details.md" }
  ]
}
```
- `title` — sets the browser tab title
- `theme` — default theme (`a`, `b`, or `c`), overridden by user's localStorage choice
- `modules` — ordered list; filenames can be anything

### Auto-discovery fallback
If no `slideshow.json` is found, the app tries fetching `00.md`, `01.md`, `02.md`, etc. sequentially, stopping at the first 404. Module titles are extracted from the first `# heading` in each file.

## Development

Requires a local server (Fetch API won't work with file://):

```bash
python -m http.server 8000
# or
npx serve
```

Then open http://localhost:8000

## Adding Content

1. Create or edit `.md` files
2. Use `---` on its own line to create slide breaks
3. Standard markdown renders automatically (headings, lists, code blocks, tables, blockquotes, images)
4. Update `slideshow.json` to register modules (or use numbered filenames for auto-discovery)

## Keyboard Navigation

- `←` `→` — Previous/next slide
- `Space` — Next slide
- `Esc` — Module selector
- `O` — Slide overview grid
- `1` `2` `3` — Switch themes

## Theming System

Three switchable themes controlled via body class (`.theme-a`, `.theme-b`, `.theme-c`):

| Theme | Class | Display Font | Body Font |
|-------|-------|--------------|-----------|
| Refined Literary | `.theme-a` | Literata | Outfit |
| Technical Precision | `.theme-b` | Sora | Newsreader |
| Bold Editorial | `.theme-c` | Bricolage Grotesque | Instrument Sans |

All theming uses CSS custom properties (`--bg-page`, `--text-primary`, `--accent-primary`, `--font-display`, etc.). Theme preference persists in localStorage under `slideshow-theme`.
