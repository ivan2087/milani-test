// src/hooks/useWpBodyAttributesFromWp.js
import { useEffect } from "react";

/**
 * ✅ Sincroniza bodyAttributes SOLO en la primera carga
 * 🔒 NO reemplaza clases existentes (merge seguro)
 * 🔒 No limpia className
 * 🔒 No rompe Salient init.js
 */
export function useWpBodyAttributesFromWp({ data }) {
  useEffect(() => {
    if (!data?.bodyAttributes) return;

    // 🛡️ Ejecutar SOLO una vez por hard reload
    if (window.__WP_BODY_SYNC_DONE__) return;
    window.__WP_BODY_SYNC_DONE__ = true;

    try {
      const attrs = data.bodyAttributes
        .replace(/\\\"/g, '"')
        .replace(/\s{2,}/g, " ")
        .trim();

      const parser = new DOMParser();
      const temp = parser.parseFromString(
        `<body ${attrs}></body>`,
        "text/html"
      );

      const wpBody = temp.body;
      if (!wpBody) return;

      // =====================================================
      // 🔹 MERGE CLASES (NO REEMPLAZAR)
      // =====================================================
      const existingClasses = document.body.className
        .split(" ")
        .filter(Boolean);

      const wpClasses =
        wpBody.getAttribute("class")?.split(" ").filter(Boolean) || [];

      const merged = Array.from(
        new Set([...existingClasses, ...wpClasses])
      );

      document.body.className = merged.join(" ");

      // =====================================================
      // 🔹 MERGE data-* (sin borrar otros)
      // =====================================================
      for (const attr of wpBody.attributes) {
        if (attr.name.startsWith("data-")) {
          document.body.setAttribute(attr.name, attr.value);
        }
      }

      console.log("✅ Body sync (safe merge) aplicado");

      // Reflow mínimo seguro
      window.dispatchEvent(new Event("resize"));
    } catch (err) {
      console.warn("⚠️ Error aplicando bodyAttributes:", err);
    }
  }, [data?.bodyAttributes]);
}
