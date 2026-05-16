// src/components/CityGlobalSection/CityGlobalSection.jsx
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useLocation } from "react-router-dom";
import DOMPurify from "dompurify";

// 🟢 NUEVO: city helpers (slug/name -> slug válido)
import {
  buildCityIndex,
  normalizeCityToken,
  isCitySlug,
} from "../../helpers/cityIndex";

// =========================================================
// 🟢 CITY INDEX (slug -> config)
// =========================================================
const CITY_INDEX = buildCityIndex();

// GraphQL query para traer un Global Section por slug
const GET_GLOBAL_SECTION = gql`
  query GetGlobalSection($slug: String!) {
    salientGlobalSection(slug: $slug) {
      title
      slug
      contentRendered
    }
  }
`;

export function CityGlobalSection() {
  const routerLocation = useLocation();

  // =========================================================
  // 🟢 NUEVO: ciudad desde URL (/:city/...) o GLOBAL "/"
  // - Si no hay ciudad o no es válida → Vancouver por defecto
  // =========================================================
  const getCityFromPath = () => {
    const parts = (routerLocation.pathname || "/").split("/").filter(Boolean);
    const first = parts[0];

    // rutas reservadas (no son ciudad)
    if (!first || first === "search" || first === "category" || first === "home") {
      return "vancouver";
    }

    // si coincide con city list (slug o name)
    if (isCitySlug(first, CITY_INDEX)) {
      return normalizeCityToken(first);
    }

    // ciudad inválida → global default
    return "vancouver";
  };

  const city = getCityFromPath();
  const slug = `${city}`;

  const { data, loading, error } = useQuery(GET_GLOBAL_SECTION, {
    variables: { slug },
  });

  if (loading) return null;
  if (error) return <p>Error cargando el slider de ciudad.</p>;
  if (!data?.salientGlobalSection) return null;

  const html = DOMPurify.sanitize(
    data.salientGlobalSection.contentRendered || ""
  );

  return (
    <div
      id={`slider-${city}`}
      className="global-section"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}