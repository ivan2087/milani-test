// src/hooks/useIPLocation.js
import { useEffect, useState } from "react";
import axios from "axios";

const CACHE_KEY = "milani_ip_location";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (Date.now() < expires) return data;
    localStorage.removeItem(CACHE_KEY);
  } catch {}
  return null;
}

function writeCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, expires: Date.now() + CACHE_TTL })
    );
  } catch {}
}

export function useIPLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setLoadingLocation(false);
      setLocation(null);
      return;
    }

    const cached = readCache();
    if (cached) {
      setLocation(cached);
      setLoadingLocation(false);
      return;
    }

    async function fetchLocation() {
      try {
        const res = await axios.get("/api/ip-location");

        if (!res.data || res.data.success === false) {
          throw new Error("IP service failed");
        }

        const locationData = {
          city: res.data.city,
          region: res.data.region,
          country: res.data.country,
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          ip: res.data.ip,
        };

        writeCache(locationData);
        setLocation(locationData);
      } catch (err) {
        setError("No se pudo obtener la ubicación por IP");
        setLocation(null);
      } finally {
        setLoadingLocation(false);
      }
    }

    fetchLocation();
  }, []);

  return { location, error, loadingLocation };
}
