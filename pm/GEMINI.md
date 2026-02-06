# Gemini CLI Project Context: PM + AI

This project is a specialized educational course titled "Product Management in the AI Era." It is designed as an interactive slideshow application that presents deep-dive modules on PM fundamentals, responsibilities, and the transformative impact of AI on the discipline.

## Directory Overview

The project is structured as a content-first documentation site or presentation tool. It uses Markdown for educational content and a custom-built HTML/JavaScript viewer for presentation.

- **Purpose:** To provide high-quality learning materials for product managers looking to understand their role in modern, AI-augmented environments.
- **Audience:** Product managers, aspiring PMs, and cross-functional partners.
- **Content Type:** Long-form educational modules, frameworks, and interactive assignments.

## Key Files

### Core Application
- **`index.html`**: The main entry point and single-page application (SPA). It contains the CSS (Design System), the layout (Sidebar + Slide Area), and the JavaScript logic to fetch and render Markdown content using `marked.js`.

### Educational Modules
- **`01-what-is-product-management.md`**: Covers PM definitions, the "three lenses" of value, and how the role varies by company stage.
- **`02-day-to-day-responsibilities.md`**: Details the PM lifecycle, from discovery to execution and analysis.
- **`03-ai-impact-on-product-management.md`**: Explores how AI changes product strategy, discovery, and the PM's daily toolkit.
- **`04-interactive-assignment.md`**: Provides a practical exercise or case study for learners.

### Developer Context
- **`CLAUDE.md`**: Instructional context for AI assistants, detailing architecture and development guidelines.
- **`.claude/settings.local.json`**: Local environment settings.

## Usage & Development

### Running the Project
Since the application uses the Fetch API to load Markdown files, it requires a local web server to avoid CORS restrictions.

```bash
# Recommended: Python 3 server
python -m http.server 8000

# Alternative: Node.js server
npx serve
```
Access the application at `http://localhost:8000` (or the port provided by `serve`).

### Navigation
- **`←` / `→`**: Navigate through slides within a module.
- **`↑` / `↓`**: Switch between modules.
- **`Esc`**: Toggle the slide overview grid.
- **`Space`**: Advance to the next slide.

### Content Conventions
- **Slide Separation**: Modules are split into slides using three dashes (`---`) on their own line.
- **Styling**: The UI uses CSS custom properties for theming. Key components include `.highlight-box`, `.framework-card`, and `.comparison`.
- **Dynamic Loading**: Modules are defined in the `modules` array within `index.html`. To add or remove modules, update this array and ensure the corresponding `.md` file exists.

## Design System
- **Typography**: 
  - Display: *Fraunces* (Serif)
  - Body: *IBM Plex Sans* (Sans-Serif)
  - Code: *IBM Plex Mono* (Monospace)
- **Colors**:
  - Primary Accent: `#c45d35` (Terracotta)
  - Secondary Accent: `#4a9eff` (Blue)
  - Background: Dark theme (Warm neutrals)
