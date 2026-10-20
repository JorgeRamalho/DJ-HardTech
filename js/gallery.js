(() => {
  const BASE = "assets/gallery/";
  const ASSET_REV = "2";
  const TILTS = ["tilt-left", "", "tilt-right", "lift"];

  function assetBase() {
    const link = document.querySelector('link[rel="stylesheet"][href*="styles.css"]');
    if (!link) return "";
    return link.getAttribute("href").replace(/css\/styles\.css.*$/, "");
  }

  function resolvePath(file) {
    return `${assetBase()}${BASE}${file}?v=${ASSET_REV}`;
  }

  function resolveDataUrl() {
    return `${assetBase()}data/gallery.json`;
  }

  function frameMarkup(item, index, compact) {
    const tilt = TILTS[index % TILTS.length];
    const span = item.span || "md";
    const src = resolvePath(item.file);
    const safeCaption = item.caption.replace(/"/g, "&quot;");
    const caption = compact
      ? ""
      : `<figcaption><span>${item.caption}</span><a href="${item.post}" rel="noopener noreferrer">Post</a></figcaption>`;
    return `<figure class="frame ${tilt} span-${span}">
      <a class="frame-link" href="${item.post}" target="_blank" rel="noopener noreferrer" data-lightbox="${src}" data-caption="${safeCaption}">
        <img src="${src}" width="640" height="640" alt="${safeCaption}" loading="lazy" decoding="async">
      </a>
      ${caption}
    </figure>`;
  }

  function renderWall(node, items, compact) {
    node.classList.add("photo-wall", "ready");
    node.innerHTML = items.map((item, index) => frameMarkup(item, index, compact)).join("");
  }

  function renderCollage(node, items) {
    node.classList.add("stage-collage", "ready");
    const positions = ["one", "two", "three", "four"];
    node.innerHTML = items.slice(0, 4).map((item, index) => {
      const src = resolvePath(item.file);
      return `<div class="collage-piece ${positions[index]}"><img src="${src}" alt="" loading="lazy" decoding="async"></div>`;
    }).join("");
  }

  function renderStrip(node, items) {
    node.classList.add("photo-strip", "ready");
    const doubled = items.concat(items);
    const track = doubled.map((item) => {
      const src = resolvePath(item.file);
      const safeCaption = item.caption.replace(/"/g, "&quot;");
      return `<figure class="strip-frame"><img src="${src}" alt="${safeCaption}" loading="lazy" decoding="async"></figure>`;
    }).join("");
    node.innerHTML = `<div class="strip-track">${track}</div>`;
  }

  function mountLightbox() {
    if (document.querySelector("[data-photo-lightbox]")) return;
    const dialog = document.createElement("dialog");
    dialog.className = "photo-lightbox";
    dialog.dataset.photoLightbox = "";
    dialog.innerHTML =
      '<form method="dialog"><button class="btn ghost" type="submit" aria-label="Fechar">Fechar</button></form><figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(dialog);
    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-lightbox]");
      if (!link) return;
      event.preventDefault();
      const img = dialog.querySelector("img");
      const cap = dialog.querySelector("figcaption");
      img.src = link.dataset.lightbox;
      img.alt = link.dataset.caption || "";
      cap.textContent = link.dataset.caption || "";
      if (!dialog.open) dialog.showModal();
    });
  }

  function pickItems(all, node) {
    const ids = (node.dataset.photoIds || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length) {
      const map = new Map(all.map((item) => [item.id, item]));
      return ids.map((id) => map.get(id)).filter(Boolean);
    }
    const tag = node.dataset.photoFilter;
    let list = tag && tag !== "all" ? all.filter((item) => item.tag === tag) : all;
    const limit = Number(node.dataset.photoLimit || 0);
    if (limit > 0) list = list.slice(0, limit);
    return list;
  }

  async function initGalleries() {
    mountLightbox();
    const nodes = [...document.querySelectorAll("[data-photo-wall]")];
    if (!nodes.length) return;
    let data;
    try {
      const res = await fetch(resolveDataUrl());
      if (!res.ok) throw new Error("fetch failed");
      data = await res.json();
    } catch {
      nodes.forEach((node) => node.classList.add("photo-wall-error"));
      return;
    }
    nodes.forEach((node) => {
      const items = pickItems(data.items, node);
      const layout = node.dataset.photoLayout || "wall";
      const compact = node.dataset.photoCompact === "true";
      if (layout === "collage") renderCollage(node, items);
      else if (layout === "strip") renderStrip(node, items);
      else renderWall(node, items, compact);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGalleries);
  } else {
    initGalleries();
  }
})();
