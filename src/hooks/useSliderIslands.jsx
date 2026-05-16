// src/hooks/useSliderIslands.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MilaniSlider } from "../components/MilaniSlider/MilaniSlider";

const preloadLcpImage = (nodes) => {
  const firstNode = nodes[0];
  if (!firstNode) return;
  try {
    const slides = JSON.parse(firstNode.getAttribute("data-slides") || "[]");
    const firstImg = slides[0]?.image;
    if (!firstImg) return;

    let imgUrl = firstImg;
    try { imgUrl = new URL(firstImg).pathname; } catch {}

    if (document.querySelector(`link[rel="preload"][href="${imgUrl}"]`)) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = imgUrl;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
  } catch {}
};

export function useSliderIslands({ html, cssReady }) {
  const [portals, setPortals] = useState([]);

  useEffect(() => {
    if (!html || !cssReady) return;

    const nodes = document.querySelectorAll(
      ".milani-slider-placeholder[data-milani-slider]"
    );

    preloadLcpImage(nodes);

    let raf = requestAnimationFrame(() => {
      const nodes = document.querySelectorAll(
        ".milani-slider-placeholder[data-milani-slider]"
      );
      if (!nodes.length) return;

      const next = [];
      nodes.forEach((node) => {
        try {
          const rawSlides = node.getAttribute("data-slides");
          const rawConfig = node.getAttribute("data-config");
          if (!rawSlides) return;
          const slides = JSON.parse(rawSlides);
          const config = rawConfig ? JSON.parse(rawConfig) : {};
          node.innerHTML = "";
          next.push(
            createPortal(
              <MilaniSlider slides={slides} config={config} />,
              node,
              node.getAttribute("data-milani-slider")
            )
          );
        } catch (e) {
          console.error("[MilaniSlider] parse error", e);
        }
      });
      setPortals(next);
    });

    return () => {
      cancelAnimationFrame(raf);
      setPortals([]);
    };
  }, [html, cssReady]);

  return portals;
}
