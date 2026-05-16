// api/ip-location.js
export default async function handler(req, res) {
  try {
    // ✅ Helpers: decode URL-encoded + normalizar UTF-8 (tildes/ñ/ç/etc) sin romper si ya viene limpio
    function safeDecode(value) {
      if (!value) return null;

      // Si viene como array (raro pero posible), tomar el primero
      const raw = Array.isArray(value) ? value[0] : value;

      try {
        const decoded = decodeURIComponent(raw);
        return decoded.normalize("NFC");
      } catch {
        // Si no estaba encoded o vino "raro", devolver tal cual normalizado si se puede
        try {
          return String(raw).normalize("NFC");
        } catch {
          return String(raw);
        }
      }
    }

    // 1) IP real del usuario (primer valor de x-forwarded-for)
    const xff = req.headers["x-forwarded-for"];
    const ip = Array.isArray(xff)
      ? xff[0]
      : typeof xff === "string"
      ? xff.split(",")[0].trim()
      : req.socket?.remoteAddress;

    // 2) Intentar geo directo de Vercel (si está disponible)
    const vercelGeo = {
      city: safeDecode(req.headers["x-vercel-ip-city"]),
      region: safeDecode(req.headers["x-vercel-ip-country-region"]),
      country: safeDecode(req.headers["x-vercel-ip-country"]),
      latitude: req.headers["x-vercel-ip-latitude"],
      longitude: req.headers["x-vercel-ip-longitude"],
    };

    // Si Vercel ya trae geo, respondemos rápido (sin depender de terceros)
    // Nota: a veces estos headers no vienen en local/dev.
    if (vercelGeo.country || vercelGeo.city) {
      return res.status(200).json({
        success: true,
        ip,
        city: vercelGeo.city || null,
        region: vercelGeo.region || null,
        country: vercelGeo.country || null,
        latitude: vercelGeo.latitude ? Number(vercelGeo.latitude) : null,
        longitude: vercelGeo.longitude ? Number(vercelGeo.longitude) : null,
        source: "vercel-geo",
      });
    }

    // 3) Fallback: pedir a ipwho.is usando la IP REAL del usuario
    // (así ipwho.is geolocaliza correctamente al visitante)
    if (!ip) {
      return res.status(200).json({ success: false });
    }

    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}`
    );
    const data = await response.json();

    return res.status(200).json({
      ...data,
      // ✅ asegurar texto limpio también en fallback
      city: safeDecode(data?.city) || data?.city || null,
      region: safeDecode(data?.region) || data?.region || null,
      country: safeDecode(data?.country) || data?.country || null,
      source: "ipwhois-by-client-ip",
    });
  } catch (error) {
    return res.status(200).json({ success: false });
  }
}
