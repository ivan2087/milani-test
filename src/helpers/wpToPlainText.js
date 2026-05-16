// src/helpers/wpToPlainText.js

/**
 * Convierte HTML/Excerpt de WP a texto limpio:
 * - remueve tags HTML
 * - decodifica entidades (&amp;, &#8221;, etc.)
 * - elimina shortcodes [vc_row ...], [vc_column ...], [caption]...[/caption], etc.
 * - elimina basura tipo "vc_" que quede suelta
 * - recorta a maxLen
 */
export function wpToPlainText(input = "", maxLen = 140) {
  if (!input) return "";

  let text = String(input);

  // 1) Quitar tags HTML
  text = text.replace(/<[^>]*>/g, " ");

  // 2) Decodificar entidades HTML (&#8221; -> ”, &amp; -> &)
  if (typeof document !== "undefined") {
    const txt = document.createElement("textarea");
    txt.innerHTML = text;
    text = txt.value;
  }

  // Normalizar comillas “raras” a comillas simples (opcional)
  text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // 3) Eliminar shortcodes completos: [foo ...] y [/foo]
  //    (incluye vc_*, nectar_*, etc.)
  text = text.replace(/\[\/?[a-zA-Z0-9_-]+(?:\s+[^\]]*)?\]/g, " ");

  // 4) Fallback: cuando el excerpt corta el shortcode y NO llega a cerrar con ]
  //    Ej: "[vc_column column_padding="no-extra-padding" ... "
  //    Removemos líneas que empiecen con "[vc_" o "[nectar_"
  text = text.replace(/^\s*\[(vc|nectar|wpb|raw_html)[^\n\r]*$/gim, " ");

  // 5) Limpieza extra: si quedaron tokens tipo "vc_column" o "wpb_row" sueltos en texto
  text = text.replace(/\b(vc|wpb|nectar)_[a-z0-9_-]+\b/gi, " ");

  // 6) Normalizar espacios
  text = text.replace(/\s+/g, " ").trim();

  // 7) Clamp
  if (!maxLen || text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd().replace(/\s+\S*$/, "") + "…";
}
