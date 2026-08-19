const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

let accessToken = null;

let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  constructor(status, message, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function refreshAccessToken() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include", // required so the refresh cookie is sent
  });

  if (!res.ok) {
    accessToken = null;
    throw new ApiError(res.status, "Your session has expired.");
  }

  const data = await res.json();
  accessToken = data.access_token;
  return data;
}

// Used at startup to restore the session from the refresh cookie.
export async function tryRestoreSession() {
  try {
    refreshPromise = refreshPromise ?? refreshAccessToken();
    await refreshPromise;
    return true;
  } catch {
    return false;
  } finally {
    refreshPromise = null;
  }
}

async function request(path, options = {}, _retry = false) {
  const headers = new Headers(options.headers ?? {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.ok) {
    return res;
  }

  const isAuthEndpoint =
    path.startsWith("/auth/refresh") || path.startsWith("/auth/login");

  if (res.status === 401 && !_retry && !isAuthEndpoint) {
    try {
      refreshPromise = refreshPromise ?? refreshAccessToken();
      await refreshPromise;
    } catch (err) {
      refreshPromise = null;
      throw err;
    } finally {
      refreshPromise = null;
    }
    return request(path, options, true);
  }

  const payload = await parseBody(res).catch(() => null);
  throw new ApiError(res.status, errorMessage(payload, res.status), payload);
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");
  const res = await request(path, { ...options, headers });
  return parseBody(res);
}


export async function apiDownload(path, options = {}) {
  const res = await request(path, options);
  return {
    blob: await res.blob(),
    filename: filenameFrom(res.headers.get("Content-Disposition")),
  };
}

function filenameFrom(header) {
  if (!header) return null;
  const match = /filename="?([^"';]+)"?/i.exec(header);
  return match ? match[1].trim() : null;
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function errorMessage(payload, status) {
  const detail = payload?.detail;

  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item?.msg)
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join(". ");
    }
  }
  return `Request failed (${status}).`;
}

async function parseBody(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}