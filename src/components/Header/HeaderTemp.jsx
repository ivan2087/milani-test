import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link, NavLink } from "react-router-dom";
import lupa from "./../../assets/lupa.svg";
import locationsvg from "./../../assets/location.svg";
import wassp from "./../../assets/Phone.svg";
import { wpUrlToClientPath } from "../../helpers/wpUrlToClientPath";

// Modales — carga diferida: no bloquean el bundle inicial
const ZipModal               = lazy(() => import("./ZipModal").then(m => ({ default: m.ZipModal })));
const FormModal              = lazy(() => import("./FormModal").then(m => ({ default: m.FormModal })));
const BookServiceStepperModal = lazy(() => import("./BookServiceStepperModal").then(m => ({ default: m.BookServiceStepperModal })));
const LoginModal             = lazy(() => import("./LoginModal").then(m => ({ default: m.LoginModal })));
import logo from "./../../assets/milani_logo_footer_mobil.svg";
import wsspIcon from "./../../assets/Phone.svg";
import { useStickyFooterBar } from "../../hooks/useStickyFooterBar";
import { useNavigate, useLocation } from "react-router-dom";

import {
  buildCityIndex,
  slugifyCity,
  normalizeCityToken,
  isCitySlug,
} from "../../helpers/cityIndex";

const CITY_INDEX = buildCityIndex();

function normalizeServicePath(url) {
  if (!url || typeof url !== "string") {
    return {
      path: "/",
      wasService: false,
    };
  }

  const path = wpUrlToClientPath(url);

  if (path.startsWith("/service/")) {
    return {
      path: path.replace("/service", ""),
      wasService: true,
    };
  }

  return {
    path,
    wasService: false,
  };
}

const decodeHtmlEntities = (str) => {
  if (!str || typeof str !== "string") return str;
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
};

const normalizeRegionList = (regions) => {
  if (!Array.isArray(regions)) return [];
  return regions
    .map((r) => (r || "").toString().trim().toLowerCase())
    .filter(Boolean);
};

const itemMatchesRegion = (item, currentRegion) => {
  const allowedRegions = normalizeRegionList(item?.regions);
  const activeRegion = (currentRegion || "").toString().trim().toLowerCase();

  // sin regiones = global = siempre visible
  if (!allowedRegions.length) return true;

  // tiene regiones, entonces sí se filtra
  if (!activeRegion) return false;

  return allowedRegions.includes(activeRegion);
};

const filterMenuTreeByRegion = (items = [], currentRegion) => {
  return (items || [])
    .filter((item) => itemMatchesRegion(item, currentRegion))
    .map((item) => ({
      ...item,
      children: filterMenuTreeByRegion(item.children || [], currentRegion),
    }));
};

export function HeaderTemp({
  data,
  switchFormModal,
  showFormModal,
  setShowFormModal,
  switchLoginModal,
  showLoginModal,
  setShowLoginModal,
  currentLocation,
  setCurrentLocation,
  currentPhone,
  setCurrentPhone,
  currentRegion,
  setCurrentRegion,
}) {
  const [openDropdown, setOpenDropDown] = useState(null);
  const { hiddenInFooter, visible } = useStickyFooterBar();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [q, setQ] = useState("");

  const [showToolTip, setShowToolTip] = useState(() => {
    return !localStorage.getItem("locationTooltipSeen");
  });

  const [showZipModal, setShowZipModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1000 : false
  );

  const [openSearch, setOpenSearch] = useState(false);

  useEffect(() => {
    if (openSearch) {
      setQ("");
    }
  }, [openSearch]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1000);
      if (window.innerWidth > 1000) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("currentLocation", currentLocation);
  }, [currentLocation]);

  useEffect(() => {
    if (!showToolTip) return;
    if (localStorage.getItem("locationTooltipSeen")) return;

    const timer = setTimeout(() => {
      localStorage.setItem("locationTooltipSeen", "true");
      setShowToolTip(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, [showToolTip]);

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.closest(".btn_estimate")) {
        setShowFormModal(true);
        setShowLoginModal(false);
        setShowOfferModal(false);
      }

      if (e.target.closest(".btn_estimate_login")) {
        setShowLoginModal(true);
        setShowFormModal(false);
        setShowOfferModal(false);
      }

      if (e.target.closest(".btn_getoffer")) {
        setShowOfferModal(true);
        setShowFormModal(false);
        setShowLoginModal(false);
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [setShowFormModal, setShowLoginModal]);

  const getActiveCitySlugFromUrl = () => {
    const parts = (routerLocation.pathname || "/").split("/").filter(Boolean);
    const first = parts[0];
    if (!first) return null;

    if (first === "search" || first === "category" || first === "home") return null;

    if (isCitySlug(first, CITY_INDEX)) {
      return normalizeCityToken(first);
    }

    return null;
  };

  const activeCitySlug = getActiveCitySlugFromUrl();

  const withCity = (path) => {
    if (!path) return path;

    if (!activeCitySlug) return path;
    if (path.startsWith(`/${activeCitySlug}`)) return path;

    return `/${activeCitySlug}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const rawMainItems = data.menuCA || data.mainMenu || [];
  const rawTopItems = data.topMenu || [];

  const topItems = useMemo(
    () => filterMenuTreeByRegion(rawTopItems, currentRegion),
    [rawTopItems, currentRegion]
  );

  const mainItems = useMemo(
    () => filterMenuTreeByRegion(rawMainItems, currentRegion),
    [rawMainItems, currentRegion]
  );

  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link
            to={activeCitySlug ? `/${activeCitySlug}` : "/"}
            state={{ skipCityRedirect: true, skipRegionRedirect: true }}
          >
            <div className="logo-block">
              <img
                src={data.salientLogo}
                alt="Milani Logo"
                className="logo"
                width="222"
                height="57"
              />
            </div>
          </Link>

          <nav className={`menus ${menuOpen ? "active" : ""}`}>
            <ul className="top-menu">
              {topItems.map((item, index) => {
                const children = item.children || [];
                const { path, wasService } = normalizeServicePath(item.url);

                return (
                  <li
                    className={`menu-item-top ${children.length ? "has-children" : ""} ${
                      openDropdown === `top-${index}` ? "open" : ""
                    }`}
                    key={`${item.label}-${index}`}
                    data-regions={(item.regions || []).join(",")}
                    onMouseEnter={!isMobile ? () => setOpenDropDown(`top-${index}`) : undefined}
                    onMouseLeave={!isMobile ? () => setOpenDropDown(null) : undefined}
                  >
                    <div className="menu-item-row">
                      <NavLink
                        to={withCity(path)}
                        state={{ wasService }}
                        className={({ isActive }) => `link ${isActive ? "active" : ""}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {decodeHtmlEntities(item.label)}
                      </NavLink>

                      {children.length > 0 && isMobile && (
                        <button
                          type="button"
                          className="submenu-toggle"
                          aria-label="Toggle submenu"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropDown(
                              openDropdown === `top-${index}` ? null : `top-${index}`
                            );
                          }}
                        >
                          <svg
                            width="14"
                            height="8"
                            viewBox="0 0 14 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13 1L7.70711 6.29289C7.31658 6.68342 6.68342 6.68342 6.29289 6.29289L0.999999 0.999999"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {children.length > 0 && (
                      <ul
                        className={`dropdown ${
                          openDropdown === `top-${index}` ? "show" : ""
                        }`}
                      >
                        {children.map((child, cIdx) => {
                          const { path: childPath, wasService: childWasService } =
                            normalizeServicePath(child.url);

                          return (
                            <li
                              key={`${child.label}-${cIdx}`}
                              data-regions={(child.regions || []).join(",")}
                            >
                              <NavLink
                                to={withCity(childPath)}
                                state={{ wasService: childWasService }}
                                className="dropdown-link"
                                onClick={() => {
                                  setMenuOpen(false);
                                  setOpenDropDown(null);
                                }}
                              >
                                {decodeHtmlEntities(child.label)}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}

              <button
                className="search-btn searh-btn-hidden-top"
                onClick={() => setOpenSearch(true)}
              >
                <img src={lupa} alt="lupa" />
              </button>
            </ul>

            <ul className="main-menu" style={{ listStyle: "none" }}>
              {mainItems.map((item, index) => {
                const children = item.children || [];
                const { path, wasService } = normalizeServicePath(item.url);

                return (
                  <li
                    key={`${item.label}-${index}`}
                    className={`menu-item ${openDropdown === index ? "open" : ""}`}
                    data-regions={(item.regions || []).join(",")}
                    onMouseEnter={!isMobile ? () => setOpenDropDown(index) : undefined}
                    onMouseLeave={!isMobile ? () => setOpenDropDown(null) : undefined}
                    style={{ listStyle: "none" }}
                  >
                    <div
                      className="menu-item-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <NavLink
                        to={withCity(path)}
                        state={{ wasService }}
                        className={({ isActive }) => `link ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setMenuOpen(false);
                          setOpenDropDown(null);
                        }}
                        style={{ flex: "1 1 auto" }}
                      >
                        {decodeHtmlEntities(item.label)}
                      </NavLink>

                      {children.length > 0 && (
                        <button
                          type="button"
                          aria-label="Toggle submenu"
                          className="submenu-toggle"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropDown(openDropdown === index ? null : index);
                          }}
                          style={{
                            flex: "0 0 auto",
                            background: "transparent",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            lineHeight: 0,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              transform:
                                openDropdown === index ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 150ms ease",
                              fontSize: "18px",
                            }}
                          >
                            <svg
                              width="14"
                              height="8"
                              viewBox="0 0 14 8"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13 1L7.70711 6.29289C7.31658 6.68342 6.68342 6.68342 6.29289 6.29289L0.999999 0.999999"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        </button>
                      )}
                    </div>

                    {children.length > 0 && (
                      <ul className={`dropdown ${openDropdown === index ? "show" : ""}`}>
                        {children.map((child, childIndex) => {
                          const { path: childPath, wasService: childWasService } =
                            normalizeServicePath(child.url);

                          return (
                            <li
                              key={`${child.label}-${childIndex}`}
                              data-regions={(child.regions || []).join(",")}
                            >
                              <NavLink
                                to={withCity(childPath)}
                                state={{ wasService: childWasService }}
                                className="dropdown-link"
                                onClick={() => {
                                  setMenuOpen(false);
                                  setOpenDropDown(null);
                                }}
                              >
                                {decodeHtmlEntities(child.label)}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="buttons-toggle">
            <button
              className="search-btn search-btn-hidden"
              onClick={() => setOpenSearch(true)}
            >
              <img src={lupa} alt="lupa" />
            </button>
            <button
              className={`menu-toggle ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((p) => !p)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <div id="search-outer" className={`search-overlay ${openSearch ? "active" : ""}`}>
        <div className="search-box">
          <form
            role="search"
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              const term = (q || "").trim();
              if (!term) return;
              setOpenSearch(false);

              const base = activeCitySlug ? `/${activeCitySlug}` : "";
              navigate(`${base}/search?s=${encodeURIComponent(term)}`);
            }}
          >
            <input
              type="text"
              aria-label="Search"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </form>
          <button className="close-search" onClick={() => setOpenSearch(false)}>
            ✕
          </button>
        </div>
      </div>

      <div
        id="stickyFooterBar"
        className={
          "headFooter sticky-headFooter " +
          (visible ? "visible " : "") +
          (hiddenInFooter ? "hidden" : "")
        }
      >
        <div className="container-footer">
          <div className="head">
            <figure className="figureFooter">
              <img src={logo} alt="logo sticky" className="imgFooter" width="180" height="48" />
            </figure>
            <div className="buttons">
              <div className="buttons-block">
                <a href={`tel:+1${currentPhone.replace(/\D/g, "")}`}>
                  <div className="button button-book">
                    <img src={wsspIcon} alt="whatsapp" className="btn-icon" />
                    <span>{currentPhone}</span>
                  </div>
                </a>

                <div className="button button-book" onClick={switchFormModal}>
                  BOOK NOW
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="header-below">
        <div className="header-container header-container--below">
          <div className="header-below__info">
            <h4 className="header-below__headline">
              Fast, Fair, and Reliable Service in <span>{currentLocation}.</span> 100% Guarantee
            </h4>
            <div className="header-below__details">
              <button className="location-btn" onClick={() => setShowToolTip(!showToolTip)}>
                <img src={locationsvg} alt="icono de ubicacion" />
                <div className="location-btn__text">
                  <p className="location-btn__city">{currentLocation}</p>
                </div>
              </button>

              <h6 className="header-below__subtitle">A Family Owned Canadian Business</h6>
            </div>

            {showToolTip && (
              <div className="location-tooltip">
                <h5 className="location-tooltip__title">
                  Want to see options closer to your home?
                </h5>
                <p className="location-tooltip__description">
                  Select your location to show available services in your area.
                </p>
                <div className="location-tooltip__buttons">
                  <button
                    className="tooltip-btn tooltip-btn--primary"
                    onClick={() => {
                      localStorage.setItem("locationTooltipSeen", "true");
                      setShowZipModal(true);
                      setShowToolTip(false);
                    }}
                  >
                    CHANGE LOCATION
                  </button>
                  <button
                    className="tooltip-btn tooltip-btn--secondary"
                    onClick={() => {
                      localStorage.setItem("locationTooltipSeen", "true");
                      setShowToolTip(false);
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="buttons-header">
            <a href={`tel:+1${currentPhone.replace(/\D/g, "")}`}>
              <button className="button">
                <img src={wassp} alt="phone" className="btn-icon" />
                <div>{currentPhone || "604-888-8888"}</div>
              </button>
            </a>
            <button className="button" onClick={switchFormModal}>
              BOOK NOW
            </button>
          </div>
        </div>

        <Suspense fallback={null}>
          <ZipModal
            isOpen={showZipModal}
            onClose={() => setShowZipModal(false)}
            currentLocation={currentLocation}
            currentPhone={currentPhone}
            currentRegion={currentRegion}
            setCurrentLocation={setCurrentLocation}
            showToolTip={showToolTip}
            setShowToolTip={setShowToolTip}
            setCurrentPhone={setCurrentPhone}
            setCurrentRegion={setCurrentRegion}
          />

          {showFormModal && (
            <BookServiceStepperModal
              setShowFormModal={setShowFormModal}
              currentPhone={currentPhone}
              currentLocation={currentLocation}
            />
          )}

          {showOfferModal && <FormModal setShowFormModal={setShowOfferModal} />}

          {showLoginModal && <LoginModal setShowLoginModal={setShowLoginModal} />}
        </Suspense>
      </div>
    </>
  );
}