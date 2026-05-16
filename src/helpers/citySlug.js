// src/helpers/citySlug.js
// =========================================================
// 🟢 HELPER: City name -> slug (URL-safe)
// - "Central Saanich" => "central-saanich"
// - mantiene números
// - limpia tildes/diacríticos
// =========================================================

export function cityToSlug(name) {
  if (!name) return "";

  return name
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD") // separa letras de sus diacríticos (tildes/ñ/etc)
    .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-") // cualquier separador -> "-"
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}