// src/Layout.jsx

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Footer } from "./components/Footer/Footer";
import { useWpAssets } from "./hooks/useWpAssets";
import { useWpGlobalAssets } from "./hooks/useWpGlobalAssets";
import { HeaderTemp } from "./components/Header/HeaderTemp";
import { useEffect, useState, useRef, useMemo } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { useIPLocation } from "./hooks/useIPLocation";
import { getRegionConfig } from "./helpers/getRegionConfig";
import { locations } from "./locations";
import { useWpBodyAttributesFromWp } from "./hooks/useWpBodyAttributesFromWp";
import line_special from "./assets/separator_special.webp";

import { buildCityIndex, isCitySlug, slugifyCity } from "./helpers/cityIndex";

const IS_DEV = import.meta.env.DEV;
const log = IS_DEV ? (...a) => console.log(...a) : () => {};
const warn = IS_DEV ? (...a) => console.warn(...a) : () => {};


const GET_LAYOUT = gql`
  query GetLayout {
    bodyAttributes
    salientLogo
    topMenu {
      label url target kind objectType objectId regions
      children { label url target kind objectType objectId regions }
    }
    mainMenu {
      label url target kind objectType objectId regions
      children { label url target kind objectType objectId regions }
    }
    menuCA {
      label url target kind objectType objectId regions
      children { label url target kind objectType objectId regions }
    }
    menuUS {
      label url target kind objectType objectId regions
      children { label url target kind objectType objectId regions }
    }
  }
`;

const CITY_INDEX = buildCityIndex();

const GLOBAL_DEFAULT_CITY = "Vancouver";
const GLOBAL_DEFAULT_PHONE = "604-888-8888";
const GLOBAL_DEFAULT_REGION = "lowermainland";

const findCityEntryByName = (cityName) => {
  if (!cityName) return null;
  const normalized = cityName.toString().trim().toLowerCase();

  for (const region of locations) {
    const found = region.cities.find(
      (c) => (c.name || "").toString().trim().toLowerCase() === normalized
    );

    if (found) {
      return {
        cityName: found.name,
        phone: found.phone,
        regionName: region.region,
        regionSlug: region.slug,
      };
    }
  }

  return null;
};

const findCityEntryBySlug = (citySlug) => {
  if (!citySlug) return null;
  const target = citySlug.toString().trim().toLowerCase();

  for (const region of locations) {
    for (const c of region.cities) {
      const s = slugifyCity(c.name);
      if (s === target) {
        return {
          cityName: c.name,
          phone: c.phone,
          regionName: region.region,
          regionSlug: region.slug,
        };
      }
    }
  }

  return null;
};

const getRegionFromLocations = (regionValue) => {
  if (!regionValue) return null;
  const normalized = regionValue.trim().toLowerCase();

  return locations.find(
    (r) => r.slug === normalized || r.region?.toLowerCase() === normalized
  );
};

const normalizeRegionSlug = (regionValue) => {
  if (!regionValue) return "";
  const rd = getRegionFromLocations(regionValue);
  if (rd?.slug) return rd.slug.toString().trim().toLowerCase();
  return regionValue.toString().trim().toLowerCase();
};

export function Layout() {

  useWpAssets();
  useWpGlobalAssets();

  useEffect(() => {
    document.body.classList.add("material", "wpb-js-composer", "vc_responsive");
  }, []);

  const { data, loading } = useQuery(GET_LAYOUT, {
    fetchPolicy: "cache-first",
  });
  const bodyData = data;

  useWpBodyAttributesFromWp({ data: bodyData });

  const [layoutReady, setLayoutReady] = useState(false);
  const [ipResolved, setIpResolved] = useState(false);

  const [currentLocation, setCurrentLocation] = useState(
    localStorage.getItem("currentLocation") || GLOBAL_DEFAULT_CITY
  );

  const [currentPhone, setCurrentPhone] = useState(
    localStorage.getItem("currentPhone") || GLOBAL_DEFAULT_PHONE
  );

  const [currentRegion, setCurrentRegion] = useState(() => {
    const saved = localStorage.getItem("currentRegion");
    const value = saved && saved.length ? saved : GLOBAL_DEFAULT_REGION;
    const normalized = normalizeRegionSlug(value);

    try {
      if (normalized && normalized !== value) {
        localStorage.setItem("currentRegion", normalized);
      }
    } catch {}

    return normalized || GLOBAL_DEFAULT_REGION;
  });

  const navigate = useNavigate();
  const locationRouter = useLocation();
  const regionConfig = getRegionConfig(currentRegion);

  const [locationRefreshTick, setLocationRefreshTick] = useState(0);

  useEffect(() => {
    const onRefresh = () => setLocationRefreshTick((v) => v + 1);
    window.addEventListener("milani:location-refresh", onRefresh);

    return () => {
      window.removeEventListener("milani:location-refresh", onRefresh);
    };
  }, []);

  useEffect(() => {
    if (!locationRouter.pathname) return;

    const applySearchClass = () => {
      const parts = (locationRouter.pathname || "/").split("/").filter(Boolean);
      const isSearch =
        locationRouter.pathname.startsWith("/search") ||
        parts[1] === "search";

      if (isSearch) {
        document.body.classList.add("is-search");
      } else {
        document.body.classList.remove("is-search");
      }
    };

    const raf = requestAnimationFrame(applySearchClass);
    return () => cancelAnimationFrame(raf);
  }, [locationRouter.pathname]);

  const paintLoopRef = useRef({
    interval: null,
    raf1: null,
    raf2: null,
    key: null,
    schedule: null,
    observer: null,
  });

  const { location, loadingLocation } = useIPLocation();

  useEffect(() => {
    if (loadingLocation) return;
    log("🌍 IP LOCATION", location);
  }, [loadingLocation, location]);

  const RESERVED_ROOTS = new Set(["search", "category", "home"]);

  const getPathParts = () =>
    (locationRouter.pathname || "/").split("/").filter(Boolean);

  const getFirstSegment = () => {
    const parts = getPathParts();
    return parts[0] || null;
  };

  const isHomeLikeRoute = useMemo(() => {
    const pathname = locationRouter.pathname || "/";
    const parts = pathname.split("/").filter(Boolean);

    if (pathname === "/" || pathname === "/home" || pathname === "/home/") {
      return true;
    }

    if (parts.length === 1 && parts[0] && isCitySlug(parts[0], CITY_INDEX)) {
      return true;
    }

    if (
      pathname === "/okanagan" ||
      pathname === "/calgary" ||
      pathname === "/edmonton" ||
      pathname === "/lowermainland" ||
      pathname === "/vancouverisland"
    ) {
      return true;
    }

    return false;
  }, [locationRouter.pathname]);

  useEffect(() => {
    const parts = getPathParts();
    if (parts.length < 2) return;

    const a = parts[0];
    const b = parts[1];

    if (isCitySlug(a, CITY_INDEX) && isCitySlug(b, CITY_INDEX)) {
      warn("🟧 [Milani] Doble ciudad en URL detectada → limpiar:", a, b);
      navigate(`/${b}`, { replace: true, state: locationRouter.state });
    }
  }, [locationRouter.pathname, navigate, locationRouter.state]);

  useEffect(() => {
    const first = getFirstSegment();
    if (!first) return;
    if (RESERVED_ROOTS.has(first)) return;

    if (isCitySlug(first, CITY_INDEX)) {
      const entry = findCityEntryBySlug(first);

      if (entry) {
        log("🟦 [Milani] URL city detectada:", first, "→", entry);
        setCurrentLocation(entry.cityName);
        setCurrentPhone(entry.phone || GLOBAL_DEFAULT_PHONE);

        const regionSlug = normalizeRegionSlug(
          entry.regionSlug || GLOBAL_DEFAULT_REGION
        );

        setCurrentRegion(regionSlug);
        localStorage.setItem("currentLocation", entry.cityName);
        localStorage.setItem("currentPhone", entry.phone || GLOBAL_DEFAULT_PHONE);
        localStorage.setItem("currentRegion", regionSlug);
      }

      setIpResolved(true);
      return;
    }

    log("🟪 [Milani] Global route detectada (no city):", first);

    setCurrentLocation((prev) => prev || GLOBAL_DEFAULT_CITY);
    setCurrentPhone((prev) => prev || GLOBAL_DEFAULT_PHONE);
    setCurrentRegion((prev) =>
      normalizeRegionSlug(prev || GLOBAL_DEFAULT_REGION)
    );

    if (!localStorage.getItem("currentLocation")) {
      localStorage.setItem("currentLocation", GLOBAL_DEFAULT_CITY);
    }
    if (!localStorage.getItem("currentPhone")) {
      localStorage.setItem("currentPhone", GLOBAL_DEFAULT_PHONE);
    }
    if (!localStorage.getItem("currentRegion")) {
      localStorage.setItem("currentRegion", GLOBAL_DEFAULT_REGION);
    } else {
      const fixed = normalizeRegionSlug(
        localStorage.getItem("currentRegion") || ""
      );
      if (fixed) localStorage.setItem("currentRegion", fixed);
    }

    setIpResolved(true);
  }, [locationRouter.pathname, navigate]);

  useEffect(() => {
    if (ipResolved) return;
    if (locationRouter.state?.skipCityRedirect) {
      setIpResolved(true);
      return;
    }
    if (locationRouter.state?.skipRegionRedirect) {
      setIpResolved(true);
      return;
    }
    if (locationRouter.pathname !== "/") return;
    if (loadingLocation) return;

    if (!location) {
      unstable_batchedUpdates(() => {
        setCurrentLocation(GLOBAL_DEFAULT_CITY);
        setCurrentPhone(GLOBAL_DEFAULT_PHONE);
        setCurrentRegion(GLOBAL_DEFAULT_REGION);
      });
      localStorage.setItem("currentLocation", GLOBAL_DEFAULT_CITY);
      localStorage.setItem("currentPhone", GLOBAL_DEFAULT_PHONE);
      localStorage.setItem("currentRegion", GLOBAL_DEFAULT_REGION);
      setIpResolved(true);
      return;
    }

    const ipCityRaw = (location.city || location.ciudad || "")
      .toString()
      .trim();

    if (!ipCityRaw) {
      unstable_batchedUpdates(() => {
        setCurrentLocation(GLOBAL_DEFAULT_CITY);
        setCurrentPhone(GLOBAL_DEFAULT_PHONE);
        setCurrentRegion(GLOBAL_DEFAULT_REGION);
      });
      localStorage.setItem("currentLocation", GLOBAL_DEFAULT_CITY);
      localStorage.setItem("currentPhone", GLOBAL_DEFAULT_PHONE);
      localStorage.setItem("currentRegion", GLOBAL_DEFAULT_REGION);
      setIpResolved(true);
      return;
    }

    const match = findCityEntryByName(ipCityRaw);

    if (match) {
      const citySlug = slugifyCity(match.cityName);

      log(
        "🟩 [Milani] IP city válida → redirect:",
        match.cityName,
        "=>",
        citySlug
      );

      const regionSlug = normalizeRegionSlug(
        match.regionSlug || GLOBAL_DEFAULT_REGION
      );

      unstable_batchedUpdates(() => {
        setCurrentLocation(match.cityName);
        setCurrentPhone(match.phone || GLOBAL_DEFAULT_PHONE);
        setCurrentRegion(regionSlug);
      });
      localStorage.setItem("currentLocation", match.cityName);
      localStorage.setItem("currentPhone", match.phone || GLOBAL_DEFAULT_PHONE);
      localStorage.setItem("currentRegion", regionSlug);

      navigate(`/${citySlug}`, { replace: true });
      setIpResolved(true);
      return;
    }

    log("🟨 [Milani] IP city NO coincide → GLOBAL Vancouver:", ipCityRaw);

    unstable_batchedUpdates(() => {
      setCurrentLocation(GLOBAL_DEFAULT_CITY);
      setCurrentPhone(GLOBAL_DEFAULT_PHONE);
      setCurrentRegion(GLOBAL_DEFAULT_REGION);
    });
    localStorage.setItem("currentLocation", GLOBAL_DEFAULT_CITY);
    localStorage.setItem("currentPhone", GLOBAL_DEFAULT_PHONE);
    localStorage.setItem("currentRegion", GLOBAL_DEFAULT_REGION);
    setIpResolved(true);
  }, [
    ipResolved,
    loadingLocation,
    location,
    locationRouter.pathname,
    locationRouter.state,
    navigate,
  ]);

  useEffect(() => {
    setLayoutReady(true);
  }, []);

  useEffect(() => {
    if (!layoutReady) return;

    if (!paintLoopRef.current) {
      paintLoopRef.current = {
        interval: null,
        raf1: null,
        raf2: null,
        key: null,
        schedule: null,
        observer: null,
      };
    }

    if (paintLoopRef.current.schedule) {
      clearTimeout(paintLoopRef.current.schedule);
      paintLoopRef.current.schedule = null;
    }

    if (paintLoopRef.current.observer) {
      paintLoopRef.current.observer.disconnect();
      paintLoopRef.current.observer = null;
    }

    const applyOfferFiltering = () => {
      const blocks = Array.from(document.querySelectorAll(".milani-offers"));
      if (!blocks.length) return false;

      const activeCitySlug = slugifyCity(currentLocation || "");
      const activeRegionSlug = (currentRegion || "").toString().trim().toLowerCase();

      const parseCsvToSet = (v, type = "city") => {
        if (!v) return new Set();

        const items = v
          .toString()
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

        if (type === "region") {
          return new Set(items.map((x) => x.toLowerCase()));
        }

        return new Set(items.map((x) => slugifyCity(x)));
      };

      const getMode = (el) => {
        const rawCity = (el.getAttribute("data-city") || "").trim();
        const rawRegions = (el.getAttribute("data-regions") || "").trim();

        if (!rawCity && !rawRegions) return "global";
        if (rawCity) return "city";
        if (rawRegions) return "region";
        return "global";
      };

      const pickSafeRemovalNode = (offerEl) => {
        const candidates = [
          offerEl.closest(".wpb_text_column.wpb_content_element"),
          offerEl.closest(".wpb_column"),
          offerEl.closest(".vc_column-inner"),
          offerEl.closest(".wpb_wrapper"),
          offerEl.closest(".wpb_row, .vc_row, .full-width-section"),
          offerEl.closest('[id^="fws_"]'),
        ].filter(Boolean);

        for (const node of candidates) {
          if (node.querySelectorAll(".milani-offers").length === 1) {
            return node;
          }
        }

        return offerEl;
      };

      blocks.forEach((block) => {
        const mode = getMode(block);
        const targetNode = pickSafeRemovalNode(block);

        if (mode === "global") {
          targetNode.style.display = "";
          return;
        }

        if (mode === "city") {
          const allowed = parseCsvToSet(block.getAttribute("data-city"), "city");
          const keep = allowed.size > 0 && allowed.has(activeCitySlug);
          targetNode.style.display = keep ? "" : "none";
          return;
        }

        if (mode === "region") {
          const allowed = parseCsvToSet(block.getAttribute("data-regions"), "region");
          const keep = allowed.size > 0 && allowed.has(activeRegionSlug);
          targetNode.style.display = keep ? "" : "none";
          return;
        }
      });

      return true;
    };

    paintLoopRef.current.schedule = setTimeout(() => {
      paintLoopRef.current.schedule = null;

      const nextKey = [
        locationRouter.pathname,
        locationRefreshTick,
        currentRegion || "",
        currentLocation || "",
        currentPhone || "",
      ].join("|");

      if (paintLoopRef.current.key === nextKey) return;
      paintLoopRef.current.key = nextKey;

      const runApply = () => {
        applyOfferFiltering();
      };

      paintLoopRef.current.raf1 = requestAnimationFrame(() => {
        paintLoopRef.current.raf2 = requestAnimationFrame(() => {
          runApply();
        });
      });

      const observer = new MutationObserver((mutations) => {
        let shouldRecheck = false;

        for (const mutation of mutations) {
          if (mutation.type !== "childList") continue;

          const added = Array.from(mutation.addedNodes || []);
          const found = added.some((node) => {
            if (!(node instanceof Element)) return false;
            return (
              node.matches?.(".milani-offers") ||
              node.querySelector?.(".milani-offers")
            );
          });

          if (found) {
            shouldRecheck = true;
            break;
          }
        }

        if (!shouldRecheck) return;

        runApply();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      paintLoopRef.current.observer = observer;
    }, 120);

    return () => {
      if (paintLoopRef.current?.schedule) {
        clearTimeout(paintLoopRef.current.schedule);
        paintLoopRef.current.schedule = null;
      }

      if (paintLoopRef.current?.raf1) {
        cancelAnimationFrame(paintLoopRef.current.raf1);
        paintLoopRef.current.raf1 = null;
      }

      if (paintLoopRef.current?.raf2) {
        cancelAnimationFrame(paintLoopRef.current.raf2);
        paintLoopRef.current.raf2 = null;
      }

      if (paintLoopRef.current?.observer) {
        paintLoopRef.current.observer.disconnect();
        paintLoopRef.current.observer = null;
      }
    };
  }, [
    layoutReady,
    locationRouter.pathname,
    locationRefreshTick,
    currentRegion,
    currentLocation,
    currentPhone,
  ]);

  const [showFormModal, setShowFormModal] = useState(false);
  const switchFormModal = () => setShowFormModal((v) => !v);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const switchLoginModal = () => setShowLoginModal((v) => !v);

  useEffect(() => {
    const REGIONS = [
      "okanagan",
      "calgary",
      "lowermainland",
      "edmonton",
      "vancouverisland",
    ];

    const getActiveCitySlug = () => {
      const parts = (locationRouter.pathname || "/").split("/").filter(Boolean);
      const maybe = parts[0];
      if (!maybe) return null;
      if (isCitySlug(maybe, CITY_INDEX)) return maybe;
      return null;
    };

    const withCityPath = (rawPath) => {
      if (!rawPath) return rawPath;

      const activeCity = getActiveCitySlug();
      if (!activeCity) return rawPath;

      const parts = rawPath.split("/").filter(Boolean);

      if (parts[0] && isCitySlug(parts[0], CITY_INDEX)) return rawPath;
      if (parts[0] && REGIONS.includes(parts[0])) return rawPath;

      return `/${activeCity}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;
    };

    const scrollAfterNavigate = (hash) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (hash && hash.startsWith("#") && hash.length > 1) {
            const id = decodeURIComponent(hash.slice(1));
            const el = document.getElementById(id) || document.querySelector(hash);

            if (el && el.scrollIntoView) {
              el.scrollIntoView({ behavior: "auto", block: "start" });
              return;
            }
          }

          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });
      });
    };

    const onDocClick = (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      if (
        a.target === "_blank" ||
        a.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const href = a.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let url;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      e.preventDefault();

      let path = url.pathname + (url.search || "") + (url.hash || "");
      path = withCityPath(path);

      navigate(path, { state: locationRouter.state });
      scrollAfterNavigate(url.hash);
    };

    document.addEventListener("click", onDocClick, true);

    return () => {
      document.removeEventListener("click", onDocClick, true);
    };
  }, [navigate, locationRouter.state, locationRouter.pathname]);

  useEffect(() => {
    const SUCCESS_TEXT = "Message sent successfully.";
    const SENDING_TEXT = "SENDING...";
    const FAKE_SEND_DELAY = 900;
    const MESSAGE_DURATION = 5000;

    const ensureStatusEl = (form, submitBtn) => {
      let statusEl = form.querySelector("[data-cf7-headless-status]");

      if (!statusEl) {
        statusEl = document.createElement("div");
        statusEl.setAttribute("data-cf7-headless-status", "true");
        statusEl.style.cssText =
          "margin-top:10px;font-size:14px;font-weight:600;display:none;";
        (submitBtn?.parentElement || form).appendChild(statusEl);
      }

      return statusEl;
    };

    const setButtonState = (submitBtn, state) => {
      if (!submitBtn) return;

      if (!submitBtn.dataset.originalText) {
        submitBtn.dataset.originalText =
          submitBtn.value || submitBtn.textContent || "Send";
      }

      if (state === "sending") {
        if (submitBtn.tagName === "INPUT") {
          submitBtn.value = SENDING_TEXT;
        } else {
          submitBtn.textContent = SENDING_TEXT;
        }

        submitBtn.disabled = true;
        return;
      }

      const original = submitBtn.dataset.originalText;

      if (submitBtn.tagName === "INPUT") {
        submitBtn.value = original;
      } else {
        submitBtn.textContent = original;
      }

      submitBtn.disabled = false;
    };

    const markInvalid = (input, message) => {
      if (!input) return;

      try {
        input.setCustomValidity(message || "");
      } catch {}

      input.classList.add("wpcf7-not-valid");

      const wrap =
        input.closest(".wpcf7-form-control-wrap") ||
        input.parentElement ||
        input;

      let tip = wrap.querySelector(".wpcf7-not-valid-tip");

      if (!tip) {
        tip = document.createElement("span");
        tip.className = "wpcf7-not-valid-tip";
        wrap.appendChild(tip);
      }

      tip.textContent = message || "This field is required.";
    };

    const clearInvalid = (form) => {
      form.querySelectorAll(".wpcf7-not-valid").forEach((el) => {
        el.classList.remove("wpcf7-not-valid");
        try {
          if (typeof el.setCustomValidity === "function") {
            el.setCustomValidity("");
          }
        } catch {}
      });

      form.querySelectorAll(".wpcf7-not-valid-tip").forEach((el) => el.remove());
    };

    const validateCf7Form = (form) => {
      clearInvalid(form);

      const selectors = [
        "[required]",
        "[aria-required='true']",
        ".wpcf7-validates-as-required",
      ];

      const fields = Array.from(
        form.querySelectorAll(selectors.join(","))
      ).filter((el) => {
        const tag = el.tagName?.toLowerCase();
        return ["input", "textarea", "select"].includes(tag) && !el.disabled;
      });

      let firstInvalid = null;
      let ok = true;

      for (const el of fields) {
        const type = (el.getAttribute("type") || "").toLowerCase();
        const val = (el.value || "").trim();

        if (type === "checkbox" || type === "radio") {
          const name = el.getAttribute("name");
          if (!name) continue;

          const checked = Array.from(
            form.querySelectorAll(`[name="${CSS.escape(name)}"]`)
          ).some((x) => x.checked);

          if (!checked) {
            ok = false;
            if (!firstInvalid) firstInvalid = el;
            markInvalid(el, "Please make a selection.");
          }
          continue;
        }

        if (el.tagName.toLowerCase() === "select") {
          if (!val) {
            ok = false;
            if (!firstInvalid) firstInvalid = el;
            markInvalid(el, "Please select an option.");
          }
          continue;
        }

        if (!val) {
          ok = false;
          if (!firstInvalid) firstInvalid = el;
          markInvalid(el, "This field is required.");
          continue;
        }

        if (type === "email" || el.classList.contains("wpcf7-validates-as-email")) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            ok = false;
            if (!firstInvalid) firstInvalid = el;
            markInvalid(el, "Please enter a valid email address.");
            continue;
          }
        }
      }

      if (typeof form.checkValidity === "function" && !form.checkValidity()) {
        ok = false;
      }

      if (!ok) {
        try {
          form.reportValidity();
        } catch {}

        if (firstInvalid?.focus) firstInvalid.focus();
      }

      return ok;
    };

    const onSubmit = (e) => {
      const form = e.target;
      if (!form || !form.classList?.contains("wpcf7-form")) return;

      if (!validateCf7Form(form)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      e.preventDefault();
      e.stopPropagation();

      if (window.history?.replaceState) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search
        );
      }

      const submitBtn = form.querySelector(
        "input.wpcf7-submit, button.wpcf7-submit"
      );
      const statusEl = ensureStatusEl(form, submitBtn);

      setButtonState(submitBtn, "sending");
      statusEl.style.display = "none";

      setTimeout(() => {
        try {
          form.reset();
        } catch {}

        statusEl.textContent = SUCCESS_TEXT;
        statusEl.style.color = "#CE2229";
        statusEl.style.display = "block";
        setButtonState(submitBtn, "idle");

        setTimeout(() => {
          statusEl.style.display = "none";
        }, MESSAGE_DURATION);
      }, FAKE_SEND_DELAY);

      return false;
    };

    const onInput = (e) => {
      const form = e.target?.closest?.(".wpcf7-form");
      if (!form) return;

      const el = e.target;
      if (!el) return;

      el.classList.remove("wpcf7-not-valid");

      try {
        if (typeof el.setCustomValidity === "function") {
          el.setCustomValidity("");
        }
      } catch {}

      const wrap = el.closest(".wpcf7-form-control-wrap") || el.parentElement || el;
      wrap?.querySelector?.(".wpcf7-not-valid-tip")?.remove();
    };

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);

    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
    };
  }, []);

  useEffect(() => {
    const handleNectarCTA = (e) => {
      const btnLogin = e.target.closest(".btn_showmodallogin");
      const btnForm = e.target.closest(".btn_showmodal");

      if (!btnLogin && !btnForm) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (btnLogin) {
        setShowLoginModal(true);
        setShowFormModal(false);
        return;
      }

      if (btnForm) {
        setShowFormModal(true);
        setShowLoginModal(false);
      }
    };

    document.addEventListener("click", handleNectarCTA, true);

    return () => {
      document.removeEventListener("click", handleNectarCTA, true);
    };
  }, [locationRouter.pathname, setShowFormModal, setShowLoginModal]);

  useEffect(() => {
    const safeJsonParse = (raw) => {
      if (!raw) return null;

      try {
        return JSON.parse(
          raw
            .replaceAll("&quot;", '"')
            .replaceAll("&#034;", '"')
            .replaceAll("&#039;", "'")
            .trim()
        );
      } catch {
        return null;
      }
    };

    const getWpBaseUrl = () => {
      const envBase = (import.meta.env.VITE_WP_BASE_URL || "").replace(/\/$/, "");
      if (envBase) return envBase;

      const graphqlUrl = (import.meta.env.VITE_WORDPRESS_GRAPHQL_URL || "").trim();

      try {
        if (graphqlUrl) return new URL(graphqlUrl).origin.replace(/\/$/, "");
      } catch {}

      if (window?.nectarLove?.rooturl) {
        return String(window.nectarLove.rooturl).replace(/\/$/, "");
      }

      return window.location.origin;
    };

    const toFrontendUrl = (rawUrl) => {
      if (!rawUrl) return rawUrl;

      try {
        const u = new URL(rawUrl, getWpBaseUrl());
        return `${window.location.origin}${u.pathname}${u.search}${u.hash}`;
      } catch {
        return rawUrl;
      }
    };

    const getAdminAjaxUrl = () => {
      if (window?.nectar_ajax?.ajaxurl) return window.nectar_ajax.ajaxurl;
      if (window?.ajaxurl) return window.ajaxurl;
      if (window?.nectarLove?.ajaxurl) return window.nectarLove.ajaxurl;
      return `${getWpBaseUrl()}/wp-admin/admin-ajax.php`;
    };

    const tryAdminAjax = async ({ wrap, page }) => {
      const adminAjax = getAdminAjaxUrl();
      const query = safeJsonParse(wrap.getAttribute("data-query")) || {};
      const elSettings = safeJsonParse(wrap.getAttribute("data-el-settings")) || {};

      const payloadBase = {
        query: JSON.stringify(query),
        el_settings: JSON.stringify(elSettings),
        page: String(page),
      };

      const nonce =
        window?.nectar_ajax?.nonce || window?.nectar_frontend?.nonce || null;

      if (nonce) payloadBase.nonce = nonce;

      for (const action of [
        "nectar_post_grid_load_more",
        "nectar_ajax_post_grid_load_more",
        "nectar_post_grid_ajax_load_more",
        "nectar_get_more_posts",
        "nectar_load_more",
      ]) {
        const fd = new FormData();
        fd.append("action", action);

        Object.entries(payloadBase).forEach(([k, v]) => fd.append(k, v));

        try {
          const res = await fetch(adminAjax, {
            method: "POST",
            body: fd,
            credentials: "include",
          });

          const text = await res.text();

          if (
            res.ok &&
            typeof text === "string" &&
            (text.includes("nectar-post-grid-item") ||
              text.includes("nectar-post-grid"))
          ) {
            return { html: text, action };
          }
        } catch {}
      }

      return null;
    };

    const tryRestFallback = async ({ wrap }) => {
      const query = safeJsonParse(wrap.getAttribute("data-query")) || {};
      const perPage = parseInt(query.posts_per_page || "24", 10);
      const nextOffset = parseInt(query.offset || "0", 10) + perPage;

      const res = await fetch(
        `${getWpBaseUrl()}/wp-json/wp/v2/posts?per_page=${perPage}&offset=${nextOffset}&_embed=1`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error(`REST failed ${res.status}`);

      return {
        posts: await res.json(),
        nextOffset,
      };
    };

    const appendHtmlItems = ({ wrap, html }) => {
      const grid = wrap.querySelector(".nectar-post-grid");
      if (!grid) return false;

      const tmp = document.createElement("div");
      tmp.innerHTML = html;

      tmp.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("javascript:")
        ) {
          return;
        }

        a.setAttribute("href", toFrontendUrl(href));
      });

      const newItems = tmp.querySelectorAll(".nectar-post-grid-item");
      if (!newItems.length) return false;

      newItems.forEach((item) => grid.appendChild(item));
      return true;
    };

    const appendRestItemsBasic = ({ wrap, posts }) => {
      const grid = wrap.querySelector(".nectar-post-grid");
      if (!grid) return false;

      posts.forEach((p) => {
        const title = p?.title?.rendered || "";
        const link = toFrontendUrl(p?.link || "#");
        const media = p?._embedded?.["wp:featuredmedia"]?.[0];
        const img =
          media?.media_details?.sizes?.large?.source_url ||
          media?.source_url ||
          null;

        const cat = (p?._embedded?.["wp:term"]?.[0] || [])?.[0];
        const catName = cat?.name || "";
        const catLink = toFrontendUrl(cat?.link || "#");
        const catSlug = cat?.slug || "";

        const item = document.createElement("div");
        item.className = "nectar-post-grid-item nectar-underline animated-in";
        item.setAttribute("data-post-id", String(p?.id || ""));
        item.setAttribute("data-has-img", img ? "true" : "false");

        item.innerHTML = `
          <div class="inner">
            <div class="nectar-post-grid-item-bg-wrap">
              <div class="nectar-post-grid-item-bg-wrap-inner">
                <a class="bg-wrap-link" href="${link}">
                  <span class="screen-reader-text">${title}</span>
                </a>
                <div class="nectar-post-grid-item-bg">
                  ${
                    img
                      ? `<img loading="lazy" decoding="async" src="${img}" alt="">`
                      : ``
                  }
                </div>
              </div>
            </div>
            <div class="content">
              <a class="nectar-post-grid-link" href="${link}">
                <span class="screen-reader-text">${title}</span>
              </a>
              ${
                catName
                  ? `<span class="meta-category"><a class="${catSlug} style-underline" href="${catLink}">${catName}</a></span>`
                  : ``
              }
              <div class="item-main">
                <span class="post-heading nectar-inherit-h3">
                  <a href="${link}"><span>${title}</span></a>
                </span>
              </div>
            </div>
          </div>
        `;

        grid.appendChild(item);
      });

      return true;
    };

    const getOrInitState = (wrap) => {
      if (!wrap.__nectarLoadMoreState) {
        wrap.__nectarLoadMoreState = {
          page: 1,
          busy: false,
          done: false,
        };
      }

      return wrap.__nectarLoadMoreState;
    };

    const onClick = async (e) => {
      const btn = e.target.closest(
        ".nectar-post-grid-wrap .load-more-wrap .load-more"
      );

      if (!btn) return;

      const wrap = btn.closest(".nectar-post-grid-wrap");
      if (!wrap) return;

      e.preventDefault();
      e.stopPropagation();

      const st = getOrInitState(wrap);
      if (st.busy || st.done) return;

      st.busy = true;

      btn.classList.add("loading", "is-disabled");
      btn.setAttribute("aria-busy", "true");
      btn.setAttribute("aria-disabled", "true");
      btn.style.pointerEvents = "none";

      if (!btn.dataset.originalText) {
        btn.dataset.originalText = btn.textContent || "Load More";
      }

      btn.textContent = "Loading...";

      try {
        st.page += 1;

        const ajaxResult = await tryAdminAjax({
          wrap,
          page: st.page,
        });

        if (ajaxResult?.html) {
          appendHtmlItems({ wrap, html: ajaxResult.html });

          if (!ajaxResult.html.includes("nectar-post-grid-item")) {
            st.done = true;
            btn.closest(".load-more-wrap")?.remove?.();
          }

          return;
        }

        const rest = await tryRestFallback({ wrap });

        if (!rest?.posts?.length) {
          st.done = true;
          btn.closest(".load-more-wrap")?.remove?.();
          return;
        }

        appendRestItemsBasic({ wrap, posts: rest.posts });

        const q = safeJsonParse(wrap.getAttribute("data-query")) || {};
        q.offset = String(rest.nextOffset);
        wrap.setAttribute("data-query", JSON.stringify(q));

        if (rest.posts.length < parseInt(q.posts_per_page || "24", 10)) {
          st.done = true;
          btn.textContent = "No more posts";

          setTimeout(() => {
            btn.closest(".load-more-wrap")?.remove?.();
          }, 400);
        }
      } catch (err) {
        warn("Load more failed", err);
        st.page = Math.max(1, st.page - 1);
      } finally {
        st.busy = false;
        btn.classList.remove("loading", "is-disabled");
        btn.setAttribute("aria-busy", "false");
        btn.removeAttribute("aria-disabled");
        btn.style.pointerEvents = "";

        if (!st.done) {
          btn.textContent = btn.dataset.originalText || "Load More";
        }
      }
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [locationRouter.pathname]);

  if (loading || !data) return (
    <div style={{ minHeight: "100vh" }}>
      {/* Placeholder del header — mismo color y altura mínima que el header real */}
      <div style={{ height: "var(--header-height, 110px)", background: "#ce2229", width: "100%" }} />
      <div style={{ minHeight: "60vh" }} />
    </div>
  );

  return (
    <>
      <HeaderTemp
        data={data}
        switchFormModal={switchFormModal}
        showFormModal={showFormModal}
        setShowFormModal={setShowFormModal}
        switchLoginModal={switchLoginModal}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        currentLocation={currentLocation}
        setCurrentLocation={setCurrentLocation}
        currentPhone={currentPhone}
        setCurrentPhone={setCurrentPhone}
        currentRegion={currentRegion}
        setCurrentRegion={setCurrentRegion}
      />

      <div className="ocm-effect-wrap">
        <div className="ocm-effect-wrap-inner">
          <div id="ajax-content-wrap">
            <div className="container-wrap">
              <div className="container main-content" role="main">
                <div className="row">
                  <Outlet
                    context={{
                      currentLocation,
                      currentRegion,
                      layoutReady,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="full-line" className="full-width-section">
        <div className="container">
          <div className="line_special">
            <img src={line_special} alt="" />
          </div>
        </div>
      </div>

      {regionConfig?.footer && (
        <div
          id="footer-location"
          className="full-width-section"
          style={{
            backgroundImage: `url(${regionConfig.footer.background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="container">
            <div className="nectar-responsive-text font_size_desktop_31px nectar-link-underline-effect">
              <h3>{regionConfig.footer.label}</h3>
            </div>
          </div>
        </div>
      )}

      <Footer
        switchFormModal={switchFormModal}
        currentPhone={currentPhone}
        currentLocation={currentLocation}
      />
    </>
  );
}