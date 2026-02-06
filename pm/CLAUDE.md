# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive slideshow course teaching product management in the AI era. Contains five educational modules delivered through a markdown-to-slides presentation system.

## Architecture

- **Content**: Markdown files (`00-intro.md` through `05-*.md`) contain the course material
- **Presentation**: `index.html` is a single-page app that fetches and renders markdown using marked.js
- **Slide splitting**: Content is divided into slides by `---` horizontal rules in the markdown
- **Module registry**: The `modules` array in `index.html` defines available modules and their source files

## Development

Requires a local server (Fetch API won't work with file://):

```bash
python -m http.server 8000
# or
npx serve
```

Then open http://localhost:8000

## Keyboard Navigation

- `←` `→` — Previous/next slide
- `Space` — Next slide
- `Esc` — Module selector
- `O` — Slide overview grid
- `1` `2` `3` — Switch themes

## Theming System

Three switchable themes controlled via body class (`.theme-a`, `.theme-b`, `.theme-c`):

| Theme | Class | Display Font | Body Font | Accent |
|-------|-------|--------------|-----------|--------|
| Warm Editorial | `.theme-a` | Fraunces | IBM Plex Sans | Terracotta `#c45d35` |
| Clean Modern | `.theme-b` | Source Serif 4 | Inter | Blue `#1a6bff` |
| Bold Statement | `.theme-c` | Epilogue | DM Sans | Red `#e63e21` |

All theming uses CSS custom properties (`--bg-page`, `--text-primary`, `--accent-primary`, `--font-display`, etc.).

## Content Updates

1. Edit the source `.md` files — these are the source of truth
2. Use `---` on its own line to create slide breaks
3. Standard markdown renders automatically (headings, lists, code blocks, tables, blockquotes)
