import { locations } from "../locations";

export function getRegionConfig(currentRegion) {
  if (!currentRegion) return null;

  const slug = currentRegion.toLowerCase().replace(/\s+/g, "");

  return locations.find((item) => item.slug === slug) || null;
}
