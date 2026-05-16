import { bd_location } from "../bd_locations";

export function isCityInList(city) {
  if (!city) return false;

  return bd_location.some(
    (item) => item.city.toLowerCase() === city.toLowerCase()
  );
}
