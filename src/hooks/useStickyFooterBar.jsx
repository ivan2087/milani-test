// src/hooks/useStickyFooterBar.jsx
import { useEffect, useState } from "react";

export function useStickyFooterBar() {
  const [visible, setVisible] = useState(false);
  const [hiddenInFooter, setHiddenInFooter] = useState(false);

  useEffect(() => {
    const header = document.querySelector(".header");
    const headerBelow = document.querySelector(".header-below");
    const footer = document.querySelector("footer");

    if (!header || !headerBelow || !footer) {
      console.warn("ℹ️ StickyFooter: nodos no disponibles aún");
      return;
    }

    function onScroll() {
      const headerHeight =
        header.offsetHeight + headerBelow.offsetHeight;

      if (window.scrollY > headerHeight) {
        setVisible(true);
      } else {
        setVisible(false);
      }

      const footerTop = footer.getBoundingClientRect().top;
      setHiddenInFooter(footerTop <= window.innerHeight);
    }

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { visible, hiddenInFooter };
}

