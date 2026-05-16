// src/hooks/usePageCss.jsx
import { useEffect } from "react";

const stripConflictingGridRules = (css) => {
  if (!css) return css;
  return css.replace(
    /@media[^{]*min-width:\s*1000px[^{]*\{[^}]*\.vc_row-fluid\s+\.vc_col-sm-\d+[^}]*\}/g,
    "/* [milani] grid-gap rule removed to prevent column width override */"
  );
};

export function usePageCss(node, inlineStyles) {
  useEffect(() => {
    if (!node) return;

    const cssParts = [
      node.wpbCss,
      node.vcCustomCss,
      node.dynamicCss,
      inlineStyles,
      node.inlineDynamicCssGrouped?.emoji,
      node.inlineDynamicCssGrouped?.global,
      node.inlineDynamicCssGrouped?.main,
      stripConflictingGridRules(node.inlineDynamicCssGrouped?.dynamic),
      node.inlineDynamicCssGrouped?.file,
    ].filter(Boolean);

    if (!cssParts.length) return;

    const combinedCss = cssParts.join("\n\n");

    const styleId = `wp-page-css-${node.databaseId || node.id || "unknown"}`;
    let styleEl = document.getElementById(styleId);

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = combinedCss;

    return () => {
      const old = document.getElementById(styleId);
      if (old) old.remove();
    };
  }, [
    node?.id,
    node?.databaseId,
    node?.wpbCss,
    node?.vcCustomCss,
    node?.dynamicCss,
    node?.inlineDynamicCssGrouped,
    inlineStyles,
  ]);
}