export function wpUrlToClientPath(url) {
  if (!url) return '/';
  try {
    const u = new URL(url); // <-- convierte el string en un objeto URL nativo del navegador
    // Ejemplo: new URL('http://milani.local/air-conditioning/')
    // u.pathname === '/air-conditioning/'

    // Quita el slash final (más limpio visualmente)
    return u.pathname.replace(/\/$/, '') || '/';
  } catch {
    // Si la URL ya venía como relativa (ej. "/air-conditioning/"),
    // no entra al try (porque no es una URL completa)
    return url.replace(/\/$/, '') || '/';
  }
}

// "http://milani.local/air-conditioning/" ==> "/air-conditioning"