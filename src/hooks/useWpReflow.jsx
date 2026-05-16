// src/hooks/useWpReflow.jsx
import { useEffect } from "react";

export function useWpReflow(deps = []) {
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
    return () => cancelAnimationFrame(raf);
  }, deps);
}
