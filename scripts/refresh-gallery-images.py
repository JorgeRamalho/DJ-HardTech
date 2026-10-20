"""Baixa JPEG reais (og:image / CDN) de cada post — não screenshot da página."""
import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GALLERY = ROOT / "assets" / "gallery"
DATA = ROOT / "data" / "gallery.json"

PICK_IMAGE_JS = """
async () => {
  const og = document.querySelector('meta[property="og:image"]')?.content;
  const imgs = [...document.querySelectorAll('img')]
    .map((img) => img.currentSrc || img.src)
    .filter((s) => s && (s.includes('cdninstagram') || s.includes('fbcdn')))
    .filter((s) => !/150x150|s150x150|profile/.test(s));
  imgs.sort((a, b) => b.length - a.length);
  return og || imgs[0] || null;
}
"""


def page_url(item: dict) -> str:
    if item["id"] == "profile":
        return "https://www.instagram.com/hardtech_dj/"
    return item["post"].rstrip("/") + "/"


def main() -> int:
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    GALLERY.mkdir(parents=True, exist_ok=True)
    ok = 0
    fail: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            locale="pt-BR",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()

        for item in payload["items"]:
            url = page_url(item)
            out = GALLERY / item["file"]
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_timeout(2000)
                img_url = page.evaluate(PICK_IMAGE_JS)
                if not img_url:
                    fail.append(f"{item['id']}: sem URL de imagem")
                    continue
                response = context.request.get(img_url, headers={"Referer": url})
                if not response.ok:
                    fail.append(f"{item['id']}: HTTP {response.status}")
                    continue
                body = response.body()
                if len(body) < 3000:
                    fail.append(f"{item['id']}: arquivo pequeno ({len(body)} B)")
                    continue
                if body[:3] != b"\xff\xd8\xff" and body[:4] != b"\x89PNG":
                    fail.append(f"{item['id']}: não parece imagem")
                    continue
                out.write_bytes(body)
                ok += 1
                print(f"OK  {item['id']:16} {len(body):>7} B  {out.name}")
            except Exception as exc:  # noqa: BLE001
                fail.append(f"{item['id']}: {exc}")

        browser.close()

    print(f"\n{ok}/{len(payload['items'])} em {GALLERY}")
    if fail:
        print("Falhas:")
        for line in fail:
            print(" -", line)
    return 0 if not fail else 1


if __name__ == "__main__":
    sys.exit(main())
