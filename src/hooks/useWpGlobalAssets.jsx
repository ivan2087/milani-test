// src/hooks/useWpGlobalAssets.jsx

import { useEffect, useRef, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const GET_GLOBALS = gql`
  query GetMilaniGlobals {
    bodyAttributes
    milaniCompiledGlobalCss
    enqueuedStyles
  }
`;

function ensureStyleTag(id, position = "append") {
  if (typeof document === "undefined") return null;

  let el = document.getElementById(id);
  if (el) return el;

  el = document.createElement("style");
  el.id = id;

  if (position === "prepend" && document.head.firstChild) {
    document.head.insertBefore(el, document.head.firstChild);
  } else {
    document.head.appendChild(el);
  }

  return el;
}

function normalizeUrl(url = "") {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return String(url || "");
  }
}

if (typeof window !== "undefined") {
  ensureStyleTag("wp-global-styles", "prepend");
}

function signalSplashReady() {
  if (typeof window.__milaniFadeOutSplash === "function") {
    window.__milaniFadeOutSplash();
    window.__milaniFadeOutSplash = null;
  }
}

export function useWpGlobalAssets() {
  const [cssReady, setCssReady] = useState(false);
  const signaledRef = useRef(false);

  const { data } = useQuery(GET_GLOBALS, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-only",
    errorPolicy: "all",
  });

  useEffect(() => {
    if (!data) return;

    const finalCss = data?.milaniCompiledGlobalCss || "";
    const globalEl = ensureStyleTag("wp-global-styles", "prepend");

    if (globalEl && globalEl.textContent !== finalCss) {
      globalEl.textContent = finalCss;
    }

    if (!signaledRef.current) {
      signaledRef.current = true;
      setCssReady(true);
      signalSplashReady();
    }

    const existingLinks = new Set(
      Array.from(document.querySelectorAll("link[data-wp-dynamic='true']")).map(
        (el) => normalizeUrl(el.href)
      )
    );

    const EXCLUDE_PATTERNS = [
      '/woocommerce/',
      '/plugins/fullpage',
      '/plugins/twentytwenty',
      '/plugins/box-roll',
      '/plugins/leaflet',
      '/plugins/select2',
      '/plugins/lenis',
      '/plugins/caroufredsel',
      '/plugins/owl-carousel',
      '/blog/masonry',
      '/blog/standard',
      '/blog/auto-masonry',
      '/off-canvas/',
      '/build/non-responsive',
      '/build/ascend',
      '/build/skin-original',
      '/build/woocommerce',
      '/build/search',
      '/build/single',
      'font-awesome-legacy',
      'iconsmind',
      'steadysets',
      'linecon',
      '/font/arrows_styles',
      '/header/header-layout-centered',
      '/header/header-layout-menu-left',
      '/header/header-layout-left',
      '/header/header-perma-transparent',
      '/header/header-secondary-nav',
    ];

    const pendingLinks = (data?.enqueuedStyles || []).filter((href) => {
      if (!href) return false;
      if (existingLinks.has(normalizeUrl(href))) return false;
      if (href.includes("fonts.googleapis.com") || href.includes("fonts.gstatic.com")) return false;
      if (EXCLUDE_PATTERNS.some((p) => href.includes(p))) return false;
      return true;
    });

    pendingLinks.forEach((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.wpDynamic = "true";

      document.head.appendChild(link);
      existingLinks.add(normalizeUrl(href));
    });
  }, [data]);

  return {
    cssReady,
    bodyAttributes: data?.bodyAttributes || "",
  };
}