import { useEffect } from "react";

const WP_BASE = (import.meta.env.VITE_WP_BASE_URL || "").replace(/\/$/, "");

const ALWAYS_SCRIPTS = [
  `${WP_BASE}/wp-content/themes/salient/js/build/third-party/jquery.easing.min.js`,
  `${WP_BASE}/wp-content/themes/salient/js/build/third-party/superfish.js`,
  `${WP_BASE}/wp-content/themes/salient/js/build/third-party/jquery.fancybox.js`,
  `${WP_BASE}/wp-content/themes/salient/js/build/third-party/imagesLoaded.min.js`,
  `${WP_BASE}/wp-content/themes/salient/js/build/third-party/waypoints.js`,
  `${WP_BASE}/wp-content/themes/salient/js/build/priority.js`,
  `${WP_BASE}/wp-content/themes/salient/js/build/init.js`,
  `${WP_BASE}/wp-content/plugins/js_composer_salient/assets/js/dist/js_composer_front.min.js`,
];

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.defer = true;
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

export function useWpAssets() {
  useEffect(() => {
    if (window.__WP_CRITICAL_LOADED__) return;
    window.__WP_CRITICAL_LOADED__ = true;

    const ensureSalientDom = () => {
      if (!document.querySelector("#page-header-bg")) {
        const el = document.createElement("div");
        el.id = "page-header-bg";
        el.setAttribute("data-parallax", "1");
        el.style.display = "none";
        document.body.appendChild(el);
      }
      if (!document.querySelector("#header-outer")) {
        const el = document.createElement("div");
        el.id = "header-outer";
        el.style.display = "none";
        document.body.appendChild(el);
      }
    };

    const load = async () => {
      let attempts = 0;
      while (!window.jQuery && attempts < 50) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      ensureSalientDom();

      for (const src of ALWAYS_SCRIPTS) {
        await loadScript(src);
      }

      window.dispatchEvent(new Event("resize"));
      window.jQuery?.(document).trigger("vc_reload");

      if (window.Nectar && typeof window.Nectar.init === "function") {
        window.Nectar.init();
      }
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => load(), { timeout: 2000 });
    } else {
      setTimeout(load, 1000);
    }
  }, []);
}
