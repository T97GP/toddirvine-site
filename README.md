# ToddIrvine.ca

The website for Todd Richard Irvine, REALTOR® with Real Broker in Grande Prairie, Alberta.

## How it's built

A small Python script (`build.py`) turns the content and templates into plain HTML pages in `dist/`.
Plain HTML loads fast and can be read by search engines and AI tools without running scripts.

| Folder or file | What's in it |
| --- | --- |
| `site.yaml` | Contact details, menu, accent colour, and the `live` switch |
| `content/` | Page words (YAML and Markdown) |
| `templates/` | Page layouts (Jinja2) |
| `static/` | CSS, the Lora heading font, logos and photos |
| `dist/` | The built site (created by the build, not stored in Git) |

## Preview mode

While `live: false` in `site.yaml`:

- every page sends `noindex` so search engines stay away;
- `robots.txt` blocks crawling;
- "Preview note" boxes explain unfinished parts;
- `/preview/green/` and `/preview/blue/` show the homepage in each accent colour.

Set `live: true` at launch.

## Cloudflare Pages settings

- Build command: `pip install -r requirements.txt && python build.py`
- Build output directory: `dist`
- Python version comes from `.python-version`.
- Secrets (for example `LOFTY_API_KEY`) are added as encrypted environment variables in the Pages project, never in this repository.

## Build locally

```
pip install -r requirements.txt
python build.py
python -m http.server --directory dist 8000
```

## Fonts

Lora (headings) is licensed under the SIL Open Font License 1.1. The file in `static/fonts/` is the original font, compressed to WOFF and otherwise unchanged. Body text uses each device's system font.
