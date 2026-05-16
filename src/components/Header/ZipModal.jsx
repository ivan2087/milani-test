// src/components/Header/ZipModal.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { locations } from "../../locations";
import layerLupa from "./../../assets/Layer.svg";

// 🟢 NUEVO: slugify + normalizador city (acepta name o slug)
import {
  buildCityIndex,
  slugifyCity,
  normalizeCityToken,
  isCitySlug,
} from "../../helpers/cityIndex";

// =========================================================
// 🟢 CITY INDEX (slug -> config)
// =========================================================
const CITY_INDEX = buildCityIndex();

export function ZipModal({
  isOpen,
  onClose,
  setCurrentLocation,
  setCurrentPhone,
  setCurrentRegion,
  currentRegion,
  currentLocation,
  currentPhone,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  // Normalizar de Lower Mainland -> lowermaindland
  const regionToSlug = (region) => region.toLowerCase().replace(/\s+/g, "");

  const normalize = (v) => (v || "").toString().trim().toLowerCase();

  // =========================================================
  // 🟢 NUEVO: detectar ciudad actual desde URL (slug o name)
  // =========================================================
  const getActiveCitySlugFromUrl = () => {
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const first = parts[0];

    if (!first) return null;

    // rutas reservadas
    if (first === "search" || first === "category" || first === "home") return null;

    // es ciudad válida?
    if (isCitySlug(first, CITY_INDEX)) {
      return normalizeCityToken(first);
    }

    return null;
  };

  const activeCitySlug = getActiveCitySlugFromUrl();

  // =========================================================
  // 🟢 NUEVO: remover el prefijo de ciudad actual si existe
  // Ej:
  // - /abbotsford/plumbing => /plumbing
  // - /abbotsford => /
  // - /search => /search (no toca)
  // =========================================================
  const stripCityPrefix = (pathname) => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    if (!parts.length) return "/";

    const first = parts[0];

    // si el primer segmento es ciudad, lo quitamos
    if (isCitySlug(first, CITY_INDEX)) {
      parts.shift();
      const rest = "/" + parts.join("/");
      return rest === "/" ? "/" : rest;
    }

    // no era ciudad
    return pathname || "/";
  };

  const handleItem = (city, phone, region) => {
    const regionSlug = regionToSlug(region);
    const citySlug = slugifyCity(city);

    const sameRegion = normalize(currentRegion) === normalize(regionSlug);
    const sameCity = normalize(currentLocation) === normalize(city);
    const samePhone = normalize(currentPhone) === normalize(phone);

    // ✅ SIEMPRE persistimos (incluso si es la misma ciudad)
    localStorage.setItem("currentLocation", city);
    localStorage.setItem("currentPhone", phone);
    localStorage.setItem("currentRegion", regionSlug); // 👈 FIX: siempre slug

    // ✅ Si es exactamente lo mismo, NO navegues NI cambies región,
    // pero sí dispara refresh para repintar spans/service-locations.
    if (sameRegion && sameCity && samePhone) {
      window.dispatchEvent(new CustomEvent("milani:location-refresh"));
      onClose();
      return;
    }

    // ✅ Actualizar estados (siempre)
    setCurrentLocation(city);
    setCurrentPhone(phone);
    setCurrentRegion(regionSlug);

    // =========================================================
    // ✅ NUEVO: Navegación por CIUDAD
    // - Remueve ciudad anterior del path si existía
    // - Prefija con la nueva ciudad
    // - Mantiene el resto del path (plumbing, drainage, etc)
    // =========================================================
    const currentPath = location.pathname;

    // Limpia la ciudad anterior si existía (antes limpiabas región)
    const cleanPath = stripCityPrefix(currentPath);

    // Caso: si estabas justo en "/abbotsford" el cleanPath es "/"
    // entonces el destino será "/vancouver" (sin doble slash)
    const dest =
      cleanPath === "/" ? `/${citySlug}` : `/${citySlug}${cleanPath}`;

    navigate(dest, {
      state: location.state,
    });

    window.dispatchEvent(new CustomEvent("milani:location-refresh"));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>

          <div className="modal-header-custom">
            <img src={layerLupa} alt="" />
            <h6>Find services near you</h6>
          </div>

          <div className="modal-body-custom">
            {locations.map(({ region, cities }) => (
              <div key={region} className="modal-item">
                <h5 className="modal-item-title">{region}</h5>

                <div className="locations-grid">
                  {cities.map(({ name, phone }) => (
                    <div
                      key={name}
                      className="location-item"
                      onClick={() => handleItem(name, phone, region)}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}