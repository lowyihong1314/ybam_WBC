const rawBaseUrl = import.meta.env.BASE_URL || "/";

export const basePath = rawBaseUrl.replace(/\/+$/, "");

export function withBasePath(path = "/") {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(path)) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${cleanPath}` || "/";
}

export function originWithBasePath(origin) {
  return `${origin}${basePath}`;
}
