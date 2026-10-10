"""Build ToddIrvine.ca into plain HTML files in dist/.

Run locally with:  python build.py
Cloudflare Pages runs:  pip install -r requirements.txt && python build.py

Content lives in content/ (YAML, with Markdown inside text fields), settings in
site.yaml, layouts in templates/, and CSS, fonts and images in static/.
"""

from __future__ import annotations

import html
import re
import shutil
import sys
from pathlib import Path

import markdown
import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from markupsafe import Markup

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
ACCENTS = ("green", "blue")


def load_yaml(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def md(text: str) -> Markup:
    """Markdown text from a content file, as HTML."""
    return Markup(markdown.markdown(text or ""))


def plain(text: str) -> str:
    """Markdown text with the formatting removed (for structured data)."""
    stripped = re.sub(r"<[^>]+>", "", markdown.markdown(text or ""))
    return html.unescape(stripped).strip()


def faq_entities(sections: list[dict]) -> list[dict]:
    return [
        {
            "@type": "Question",
            "name": item["q"],
            "acceptedAnswer": {"@type": "Answer", "text": plain(item["a"])},
        }
        for section in sections
        for item in section["items"]
    ]


def agent_schema(site: dict, areas: list[str]) -> dict:
    """schema.org data describing Todd, for search engines and AI tools."""
    b = site["brokerage"]
    return {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "name": site["agent"]["name"],
        "url": site["base_url"] + "/",
        "telephone": site["agent"]["phone_tel"],
        "email": site["agent"]["email"],
        "image": site["base_url"] + "/img/todd-portrait-standing-800.jpg",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": b["street"],
            "addressLocality": b["city"],
            "addressRegion": b["province_code"],
            "postalCode": b["postal"],
            "addressCountry": "CA",
        },
        "areaServed": [{"@type": "Place", "name": a} for a in areas],
    }


def make_env() -> Environment:
    env = Environment(
        loader=FileSystemLoader(ROOT / "templates"),
        autoescape=select_autoescape(["html"]),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    env.filters["md"] = md
    env.globals["faq_entities"] = faq_entities
    env.globals["agent_schema"] = agent_schema
    return env


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def out_path(url_path: str) -> Path:
    """'/buyers/' -> dist/buyers/index.html"""
    clean = url_path.strip("/")
    return DIST / clean / "index.html" if clean else DIST / "index.html"


def build() -> None:
    site = load_yaml(ROOT / "site.yaml")
    if site.get("accent") not in ACCENTS:
        sys.exit(f"site.yaml: accent must be one of {ACCENTS}")

    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(ROOT / "static", DIST)

    env = make_env()
    results = load_yaml(ROOT / "content" / "results.yaml")
    common = {"site": site, "results": results}

    # Homepage
    home = load_yaml(ROOT / "content" / "home.yaml")
    home_tpl = env.get_template("home.html")
    write(out_path("/"), home_tpl.render(**common, page=home, accent=site["accent"], current_path="/"))
    if not site.get("live"):
        # Preview-only copies of the homepage in each accent colour.
        for accent in ACCENTS:
            write(out_path(f"/preview/{accent}/"),
                  home_tpl.render(**common, page=home, accent=accent, current_path="/"))

    # Content pages: one YAML file per page in content/pages/
    page_tpl = env.get_template("page.html")
    paths_seen: set[str] = {"/"}
    for file in sorted((ROOT / "content" / "pages").glob("*.yaml")):
        page = load_yaml(file)
        path = page["path"]
        if path in paths_seen:
            sys.exit(f"{file.name}: path {path} is used twice")
        paths_seen.add(path)
        write(out_path(path), page_tpl.render(**common, page=page, accent=site["accent"], current_path=path))

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
