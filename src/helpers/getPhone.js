import { bd_location } from "../bd_locations";


export const getPhone = (city) => {
  if (!city) return null;

  const normalizedCity = city.trim().toLowerCase();

  const location = bd_location.find(
    (item) => item.city.toLowerCase() === normalizedCity
  );

  return location ? location.phone : null;
};
