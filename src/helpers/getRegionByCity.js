// helpers/getRegionByCity.js

import { locations } from "../locations";

// Esta funcion solo recibe la ciudad y devulve la region para la cual pertenece, la estructura de region-ciudad esta en locations.js

export function getRegionByCity(city) {
  if (!city) return "okanagan"; // Si no hay ciudad retornamos okanagan

  const normalizedCity = city.toLowerCase();

  for (const region of locations) {
    const found = region.cities.find(
      c => c.name.toLowerCase() === normalizedCity
    );
    if (found) {
      return region.region.toLowerCase().replace(/\s+/g, "");
    }
  }

  return "okanagan";
}
