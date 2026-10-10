"""Build ToddIrvine.ca into plain HTML files in dist/.

Run locally with:  python build.py
Cloudflare Pages runs:  pip install -r requirements.txt && python build.py

Content lives in content/ (YAML and Markdown), settings in site.yaml,
layouts in templates/, and CSS, fonts and images in static/.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
ACCENTS = ("green", "blue")


def load_yaml(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def make_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(ROOT / "templates"),
        autoescape=select_autoescape(["html"]),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def write(path: Path, html: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")


def build() -> None:
    site = load_yaml(ROOT / "site.yaml")
    if site.get("accent") not in ACCENTS:
        sys.exit(f"site.yaml: accent must be one of {ACCENTS}")

    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(ROOT / "static", DIST)

    env = make_env()
    home = load_yaml(ROOT / "content" / "home.yaml")

    def render_home(out: Path, accent: str, path: str) -> None:
        html = env.get_template("home.html").render(
            site=site, page=home, accent=accent, current_path=path
        )
        write(out, html)

    render_home(DIST / "index.html", site["accent"], "/")

    if not site.get("live"):
        # Preview-only copies of the homepage in each accent colour, for choosing one.
        for accent in ACCENTS:
            render_home(DIST / "preview" / accent / "index.html", accent, "/")

    # Keep the whole site out of search engines until launch.
    headers = []
    if not site.get("live"):
        headers += ["/*", "  X-Robots-Tag: noindex, nofollow", ""]
    headers += [
        "/*",
        "  X-Content-Type-Options: nosniff",
        "  Referrer-Policy: strict-origin-when-cross-origin",
        "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
        "",
        "/fonts/*",
        "  Cache-Control: public, max-age=31536000, immutable",
        "",
    ]
    write(DIST / "_headers", "\n".join(headers))

    robots = (
        f"User-agent: *\nAllow: /\n\nSitemap: {site['base_url']}/sitemap.xml\n"
        if site.get("live")
        else "User-agent: *\nDisallow: /\n"
    )
    write(DIST / "robots.txt", robots)

    print(f"Built {sum(1 for _ in DIST.rglob('*.html'))} pages into {DIST}")


if __name__ == "__main__":
    build()
