function getRuntimeBaseUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.__YBAM_BASE_PATH__ || "";
}

function normalizeBasePath(value) {
  if (!value || value === "/") {
    return "";
  }

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

const rawBaseUrl = getRuntimeBaseUrl() || import.meta.env.BASE_URL || "/";

export const basePath = normalizeBasePath(rawBaseUrl);

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
