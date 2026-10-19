#!/usr/bin/env python3
"""Verify the blog import and, optionally, a Jekyll build.

Run: python3 tools/check-blog.py [--site /path/to/jekyll/output]
The source check reconstructs every original post by reversing only the
documented migration edits and title capitalization, then compares it with
the recorded source hash.
No downloaded snapshot, network access, or third-party modules are required.
"""

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = "{http://www.sitemaps.org/schemas/sitemap/0.9}"


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.canonical_urls = []
        self.feed_links = []
        self.refresh_targets = []
        self.hrefs = []
        self.times = []
        self._time = None

    def handle_starttag(self, tag, attrs):
        self.references.extend(value for key, value in attrs
                               if key in ("href", "src") and value)
        attrs = dict(attrs)
        if tag == "link" and "canonical" in (attrs.get("rel") or "").split():
            self.canonical_urls.append(attrs.get("href"))
        if (tag == "link" and "alternate" in (attrs.get("rel") or "").lower().split()
                and (attrs.get("type") or "").split(";")[0].strip().lower()
                in ("application/atom+xml", "application/rss+xml")):
            self.feed_links.append(attrs.get("href"))
        if tag == "meta" and (attrs.get("http-equiv") or "").lower() == "refresh":
            match = re.fullmatch(r"\s*0\s*;\s*url\s*=\s*(.+?)\s*",
                                 attrs.get("content") or "", re.I)
            self.refresh_targets.append(match.group(1).strip("\"'") if match else None)
        if tag == "a":
            self.hrefs.append(attrs.get("href"))
        if tag == "time":
            self._time = [attrs.get("datetime"), ""]

    def handle_data(self, data):
        if self._time is not None:
            self._time[1] += data

    def handle_endtag(self, tag):
        if tag == "time" and self._time is not None:
            self.times.append(self._time)
            self._time = None


def digest(data):
    return hashlib.sha256(data).hexdigest()


def output_path(site, route):
    path = site / unquote(urlparse(route).path).lstrip("/")
    return path / "index.html" if path.is_dir() or route.endswith("/") else path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, help="also verify generated site files")
    args = parser.parse_args()
    manifest = json.loads((ROOT / "tools/blog-migration-manifest.json").read_text())
    errors = []

    def require(condition, message):
        if not condition:
            errors.append(message)

    for route in manifest["removed_routes"]:
        require(not (ROOT / route.lstrip("/")).exists(),
                f"Removed feed remains in source: {route}")

    for post in manifest["posts"]:
        path = ROOT / post["destination_path"]
        text = path.read_text()
        expected_header = ("layout: blog_post\npermalink: " + post["permalink"] + "\n"
                           + 'display_date: "' + post["display_date"] + '"\n')
        require(expected_header in text, f"{path}: missing imported layout/permalink")
        reconstructed = text.replace(expected_header, "layout: post\n", 1)
        frontmatter, separator, body = reconstructed.partition("\n---\n")
        require(bool(separator) and frontmatter.startswith("---\n"),
                f"{path}: missing post frontmatter")
        expected_title = 'title:  "' + post["display_title"] + '"'
        original_title = 'title:  "' + post["original_title"] + '"'
        frontmatter, title_count = re.subn(
            r"(?m)^" + re.escape(expected_title) + r"$",
            lambda match: original_title, frontmatter, count=1)
        require(title_count == 1, f"{path}: missing expected capitalized title")
        reconstructed = frontmatter + separator + body
        reconstructed = re.sub(
            r"\{\{ '/blog/images/([^']+)' \| relative_url \}\}",
            r"{{ site.baseurl }}/images/\1", reconstructed)
        require(digest(reconstructed.encode()) == post["original_sha256"],
                f"{path}: content differs from original beyond the documented edits")
        require("{{ site.baseurl }}" not in text, f"{path}: old image prefix remains")
        published_date = datetime.strptime(post["original_date"],
                                            "%Y-%m-%d %H:%M:%S %z").astimezone(timezone.utc)
        require(post["display_date"] == published_date.date().isoformat(),
                f"{path}: display_date differs from the original published UTC date")

    for image in manifest["images"]:
        path = ROOT / image["destination_path"]
        expected_hash = image.get("optimized_sha256", image["sha256"])
        require(path.is_file() and digest(path.read_bytes()) == expected_hash,
                f"{path}: missing image or image bytes changed")
        if "optimized_bytes" in image:
            require(path.is_file() and path.stat().st_size == image["optimized_bytes"],
                    f"{path}: image size differs from the recorded optimized size")

    if args.site:
        site = args.site.resolve()
        origin = manifest["canonical_origin"]
        host = urlparse(origin).netloc
        for route in manifest["preserved_routes"] + list(manifest["redirect_routes"]):
            require(output_path(site, route).is_file(), f"Missing historical URL: {route}")
        for route in manifest["removed_routes"]:
            require(not output_path(site, route).exists(),
                    f"Removed feed remains in built site: {route}")
        for route, target in manifest["redirect_routes"].items():
            path = output_path(site, route)
            if not path.is_file():
                continue
            redirect = References()
            redirect.feed(path.read_text())
            require(redirect.refresh_targets == [target],
                    f"{route}: refresh must redirect immediately to {target}")
            require(redirect.canonical_urls == [origin + target],
                    f"{route}: canonical URL must point to {origin + target}")
            require(target in redirect.hrefs,
                    f"{route}: missing fallback link to {target}")
        for image in manifest["images"]:
            path = output_path(site, image["url"])
            expected_hash = image.get("optimized_sha256", image["sha256"])
            require(path.is_file() and digest(path.read_bytes()) == expected_hash,
                    f"{path}: built image bytes changed")
            if "optimized_bytes" in image:
                require(path.is_file() and path.stat().st_size == image["optimized_bytes"],
                        f"{path}: built image size differs from the recorded optimized size")
        for post in manifest["posts"]:
            path = output_path(site, post["permalink"])
            if not path.is_file():
                continue
            rendered = References()
            rendered.feed(path.read_text())
            original_date = datetime.strptime(post["original_date"],
                                              "%Y-%m-%d %H:%M:%S %z").astimezone(timezone.utc)
            expected_label = f"{original_date:%B} {original_date.day}, {original_date.year}"
            require(any(date == post["display_date"] and label.strip() == expected_label
                        for date, label in rendered.times),
                    f"{path}: visible and machine-readable dates must preserve {expected_label}")

        def check_reference(reference, base, context):
            parsed = urlparse(urljoin(base, reference))
            if parsed.scheme not in ("http", "https"):
                return
            require(not (parsed.netloc == "pslou.github.io" and
                         parsed.path.startswith("/blog")),
                    f"{context}: depends on the old project site: {reference}")
            if parsed.netloc == host:
                require(output_path(site, parsed.path).is_file(),
                        f"{context}: broken internal link: {reference}")

        for path in sorted((site / "blog").rglob("*.html")):
            text = path.read_text()
            require("github.com/pslou/blog" not in text,
                    f"{path}: rendered page depends on old repository")
            refs = References()
            refs.feed(text)
            require(not refs.feed_links, f"{path}: Atom/RSS autodiscovery remains")
            base = origin + "/" + str(path.relative_to(site))
            for reference in refs.references:
                check_reference(reference, base, str(path))

        expected_posts = {origin + post["permalink"] for post in manifest["posts"]}
        path = site / "blog/sitemap.xml"
        try:
            sitemap = ElementTree.parse(path).getroot()
            locations = {node.text for node in sitemap.iter(SITEMAP + "loc")}
            require(expected_posts.issubset(locations), f"{path}: missing post URLs")
            for location in locations:
                require(bool(location and location.startswith(origin + "/blog/")),
                        f"{path}: invalid absolute sitemap URL: {location}")
                if location:
                    check_reference(location, origin, str(path))
        except (OSError, ElementTree.ParseError) as error:
            errors.append(f"{path}: invalid sitemap XML: {error}")

    for error in errors:
        print(error, file=sys.stderr)
    scope = "source and built URLs" if args.site else "source"
    print(f"Blog {scope}: {len(manifest['posts'])} posts, "
          f"{len(manifest['images'])} images, {len(errors)} issue(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
