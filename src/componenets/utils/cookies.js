// Minimal cookie helper for client-side token storage.
// Note: client-side cookies cannot be HttpOnly. For maximum security,
// set the cookie from the server with Set-Cookie HttpOnly attribute.
export function setCookie(name, value, days = 7, path = "/") {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=${path}`;
}

export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function removeCookie(name, path = "/") {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=${new Date(
    0
  ).toUTCString()}; path=${path}`;
}

export default { setCookie, getCookie, removeCookie };
