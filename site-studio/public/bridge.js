(() => {
  const STYLE_ID = "__site_studio_overrides__";
  const HOVER_ID = "__site_studio_hover__";

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function uniqueSelector(el) {
    if (!el || el === document.documentElement) return "html";
    if (el.id) return `#${cssEscape(el.id)}`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      let part = node.tagName.toLowerCase();
      const classes = [...node.classList].filter(c => !c.startsWith("__site_studio")).slice(0, 3);
      if (classes.length) part += "." + classes.map(cssEscape).join(".");
      const parent = node.parentElement;
      if (parent) {
        const same = [...parent.children].filter(x => x.tagName === node.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      const candidate = parts.join(" > ");
      try { if (document.querySelectorAll(candidate).length === 1) return candidate; } catch {}
      node = parent;
    }
    return parts.join(" > ");
  }

  function ensureStyle(id) {
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    return style;
  }

  function highlight(el) {
    const selector = uniqueSelector(el);
    ensureStyle(HOVER_ID).textContent = `${selector}{outline:2px solid #5b8cff!important;outline-offset:2px!important;}`;
  }

  document.addEventListener("click", event => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    event.stopPropagation();
    const element = event.target;
    highlight(element);
    const style = getComputedStyle(element);
    window.parent.postMessage({
      type: "SITE_STUDIO_SELECT",
      selector: uniqueSelector(element),
      text: (element.textContent || "").trim().slice(0, 140),
      computed: {
        "font-family": style.fontFamily,
        "font-size": style.fontSize,
        "font-weight": style.fontWeight,
        "line-height": style.lineHeight,
        "letter-spacing": style.letterSpacing,
        "text-align": style.textAlign,
        color: style.color,
        width: style.width,
        "max-width": style.maxWidth,
        "min-height": style.minHeight,
        padding: style.padding,
        margin: style.margin,
        gap: style.gap,
        "border-radius": style.borderRadius,
        border: style.border,
        background: style.background,
        "box-shadow": style.boxShadow,
        display: style.display,
        position: style.position,
        top: style.top,
        left: style.left,
        "z-index": style.zIndex,
        transform: style.transform === "none" ? "" : style.transform,
        opacity: style.opacity
      }
    }, "*");
  }, true);

  window.addEventListener("message", event => {
    const data = event.data || {};
    if (data.type === "SITE_STUDIO_APPLY_CSS") ensureStyle(STYLE_ID).textContent = data.css || "";
  });

  window.parent.postMessage({ type: "SITE_STUDIO_READY" }, "*");
})();
