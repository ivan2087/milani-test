// src/helpers/cityIndex.js
import { locations } from "../locations";

/**
 * =========================================================
 * 🟢 CITY HELPERS (slugify + index)
 * =========================================================
 * Reglas:
 * - URL puede venir como "slug" o como "name"
 *   ej:
 *   /central-saanich
 *   /Central%20Saanich
 * - Nosotros lo normalizamos a slug para navegar de forma consistente
 *
 * IMPORTANT:
 * - No eliminar logs/comentarios en otros archivos.
 * - Este archivo no depende de React, es helper puro.
 */

/**
 * ✅ slugifyCity
 * Convierte:
 * - "Central Saanich" => "central-saanich"
 * - "  Vancouver  " => "vancouver"
 * - "Québec City" => "quebec-city"
 * - "Sturgeon County" => "sturgeon-county"
 */
export function slugifyCity(name) {
  if (!name) return "";

  // Normalizar unicode (tildes, ñ, etc) y luego remover diacríticos
  const clean = name
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Convertir separadores a "-"
  // Mantener letras/números, convertir cualquier bloque no alfanumérico a "-"
  const slug = clean
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug;
}

/**
 * ✅ normalizeCityToken
 * Recibe el primer segmento de la URL:
 * - "central-saanich"
 * - "Central%20Saanich"
 * - "Central Saanich"
 * y lo devuelve como slug "central-saanich"
 */
export function normalizeCityToken(token) {
  if (!token) return "";

  // decode seguro
  let raw = token;
  try {
    raw = decodeURIComponent(token);
  } catch {
    raw = token;
  }

  // Si ya viene con "-" probablemente es slug, igual lo slugificamos
  return slugifyCity(raw);
}

/**
 * ✅ buildCityIndex
 * Construye un índice:
 * {
 *   "central-saanich": { cityName, phone, regionSlug, regionName }
 *   "vancouver": { ... }
 * }
 */
export function buildCityIndex() {
  const index = {};

  (locations || []).forEach((region) => {
    (region?.cities || []).forEach((c) => {
      const slug = slugifyCity(c?.name);
      if (!slug) return;

      // Si hay duplicados de slug, nos quedamos con el primero.
      // (Si luego quieres, podemos loguear warning)
      if (!index[slug]) {
        index[slug] = {
          cityName: c?.name,
          phone: c?.phone,
          regionSlug: region?.slug,
          regionName: region?.region,
        };
      }
    });
  });

  return index;
}

/**
 * ✅ isCitySlug
 * Verifica si un "segmento" es una ciudad válida, aceptando slug o name.
 * Ojo: recibe CITY_INDEX ya construido.
 */
export function isCitySlug(segment, CITY_INDEX) {
  if (!segment || !CITY_INDEX) return false;

  const normalizedSlug = normalizeCityToken(segment);
  return !!CITY_INDEX[normalizedSlug];
}

/**
 * ✅ getCityFromSegment
 * Devuelve el entry del índice (o null), aceptando slug o name.
 */
export function getCityFromSegment(segment, CITY_INDEX) {
  if (!segment || !CITY_INDEX) return null;

  const normalizedSlug = normalizeCityToken(segment);
  return CITY_INDEX[normalizedSlug] || null;
}