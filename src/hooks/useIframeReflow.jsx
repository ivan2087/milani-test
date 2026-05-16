// src/hooks/useIframeReflow.jsx
import { useEffect } from "react";

export default function useIframeReflow(html) {
  useEffect(() => {
    if (!html) return;

    // ❌ NO forzar reload de iframe en Salient
    // Salient maneja internamente iframes y sliders

    console.log("ℹ️ useIframeReflow: omitido para compatibilidad Salient");
  }, [html]);
}
