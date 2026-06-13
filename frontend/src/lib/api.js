import { withBasePath } from "./basePath";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    const error = new Error(data.error || "Request failed");
    error.payload = data;
    throw error;
  }

  return data;
}

export async function fetchGuestData(version) {
  const [speakers, programme, committee] = await Promise.all([
    fetch(withBasePath(`/guest_and_member/speakers?version=${encodeURIComponent(version)}`)).then(parseJson),
    fetch(withBasePath(`/guest_and_member/programme?version=${encodeURIComponent(version)}`)).then(parseJson),
    fetch(withBasePath(`/guest_and_member/conference_members?version=${encodeURIComponent(version)}`)).then(parseJson),
  ]);

  return { speakers, programme, committee };
}

export async function loginWithToken(token) {
  const response = await fetch(withBasePath("/wbc/login_with_token"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ token }),
  });

  return parseJson(response);
}

export async function fetchRegisterData(token) {
  const response = await fetch(withBasePath("/wbc/get_all_register_data"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJson(response);
}

export async function submitRegistration(formData) {
  const response = await fetch(withBasePath("/wbc/register"), {
    method: "POST",
    body: formData,
  });

  return parseJson(response);
}

export async function reviewRecord(token, id, action) {
  const response = await fetch(withBasePath(`/wbc/register/${id}/review`), {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  return parseJson(response);
}

export async function deleteRecord(token, id) {
  const response = await fetch(withBasePath(`/wbc/register/${id}/delete`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJson(response);
}

export async function fetchCountryDialCodes() {
  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,idd",
    );
    const countries = await response.json();
    const result = {};

    countries.forEach((country) => {
      const name = country.name?.common;
      const root = country.idd?.root;
      const suffix = country.idd?.suffixes?.[0];
      if (name && root && suffix) {
        result[name] = `${root}${suffix}`;
      }
    });

    return result;
  } catch (error) {
    return {
      Malaysia: "+60",
      Singapore: "+65",
      China: "+86",
    };
  }
}

export function buildProtectedAssetUrl(path, token, params = {}) {
  const url = new URL(withBasePath(path), window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
}
