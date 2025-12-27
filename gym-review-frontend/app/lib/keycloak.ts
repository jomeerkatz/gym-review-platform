/**
 * Keycloak Debug Utilities
 *
 * Diese Datei enthält Hilfsfunktionen für die Keycloak-Integration.
 * WICHTIG: Diese Implementierung ist nur für lokale Entwicklung und Debugging gedacht.
 * In Produktion sollten Sicherheitsaspekte wie Token-Refresh, sichere Speicherung
 * und CSRF-Schutz implementiert werden.
 */

// Keycloak Konfiguration
const KEYCLOAK_BASE_URL = "http://localhost:9090";
const REALM = "gym-review";
const CLIENT_ID = "gym-review-app";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/keycloak-callback`;

// Endpoints
export const AUTH_ENDPOINT = `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/auth`;
export const TOKEN_ENDPOINT = `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/token`;

// LocalStorage Keys
const STORAGE_KEY_ACCESS_TOKEN = "kc_access_token";
const STORAGE_KEY_TOKEN_EXPIRY = "kc_token_expiry";
const STORAGE_KEY_ID_TOKEN = "kc_id_token"; // ID token for logout
const SESSION_KEY_CODE_VERIFIER = "kc_code_verifier"; // Wird in sessionStorage gespeichert

/**
 * Generiert einen zufälligen String für PKCE (Proof Key for Code Exchange)
 * Dies ist eine Sicherheitsmaßnahme für Public Clients (ohne Client Secret).
 */
function generateRandomString(length: number): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Erstellt einen SHA256 Hash und kodiert ihn als Base64URL.
 * Dies wird für den PKCE code_challenge verwendet.
 */
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Kodiert einen Uint8Array als Base64URL String.
 * Base64URL ist wie Base64, aber mit URL-sicheren Zeichen (- und _ statt + und /).
 */
function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generiert PKCE Parameter (code_verifier und code_challenge).
 * Der code_verifier wird in sessionStorage gespeichert, damit wir ihn später
 * im Callback verwenden können.
 *
 * @returns Promise mit code_verifier und code_challenge
 */
export async function generatePKCE(): Promise<{
  verifier: string;
  challenge: string;
}> {
  // Code Verifier: zufälliger String (43-128 Zeichen)
  const verifier = generateRandomString(128);

  // Code Challenge: SHA256 Hash des Verifiers, Base64URL kodiert
  const challenge = await sha256(verifier);

  // Verifier in sessionStorage speichern (wird im Callback benötigt)
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY_CODE_VERIFIER, verifier);
  }

  return { verifier, challenge };
}

/**
 * Holt den gespeicherten code_verifier aus sessionStorage.
 * Wird im Callback verwendet, um den Authorization Code gegen ein Token zu tauschen.
 */
export function getCodeVerifier(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY_CODE_VERIFIER);
}

/**
 * Löscht den code_verifier aus sessionStorage.
 * Sollte nach erfolgreichem Token-Austausch aufgerufen werden.
 */
export function clearCodeVerifier(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY_CODE_VERIFIER);
}

/**
 * Baut die Keycloak Authorization URL mit allen notwendigen Parametern.
 * Diese URL wird verwendet, um den Benutzer zur Keycloak Login-Seite zu leiten.
 *
 * @param codeChallenge - Der PKCE code_challenge (SHA256 Hash des Verifiers)
 * @returns Die vollständige Authorization URL
 */
export async function buildAuthUrl(): Promise<string> {
  // PKCE Parameter generieren
  const { challenge } = await generatePKCE();

  // URL Parameter zusammenbauen
  const params = new URLSearchParams({
    response_type: "code", // Authorization Code Flow
    client_id: CLIENT_ID, // Unsere Client ID
    redirect_uri: REDIRECT_URI, // Wohin Keycloak nach dem Login weiterleitet
    scope: "openid", // OpenID Connect Scope
    code_challenge: challenge, // PKCE: Challenge (Hash des Verifiers)
    code_challenge_method: "S256", // PKCE: SHA256 als Hash-Methode
  });

  // Vollständige URL zurückgeben
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Speichert das Access Token und ID Token in localStorage.
 * Zusätzlich wird das Ablaufdatum gespeichert, damit wir prüfen können,
 * ob das Token noch gültig ist.
 *
 * @param accessToken - Das Access Token von Keycloak
 * @param idToken - Das ID Token von Keycloak (optional, für Logout benötigt)
 * @param expiresIn - Gültigkeitsdauer in Sekunden (optional)
 */
export function saveAccessToken(
  accessToken: string,
  expiresIn?: number,
  idToken?: string
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, accessToken);

  // ID Token speichern (wird für Logout benötigt)
  if (idToken) {
    localStorage.setItem(STORAGE_KEY_ID_TOKEN, idToken);
  }

  // Ablaufdatum berechnen und speichern (falls expiresIn angegeben)
  if (expiresIn) {
    const expiryTime = Date.now() + expiresIn * 1000; // Jetzt + expiresIn Sekunden
    localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, expiryTime.toString());
  }
}

/**
 * Holt das Access Token aus localStorage.
 *
 * @returns Das Access Token oder null, falls keines vorhanden ist
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
}

/**
 * Prüft, ob ein Access Token vorhanden und noch nicht abgelaufen ist.
 *
 * @returns true, wenn ein gültiges Token vorhanden ist, sonst false
 */
export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;

  const token = getAccessToken();
  if (!token) return false;

  // Prüfe, ob Token abgelaufen ist
  const expiryStr = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
  if (expiryStr) {
    const expiryTime = parseInt(expiryStr, 10);
    if (Date.now() >= expiryTime) {
      // Token ist abgelaufen - entfernen
      clearAccessToken();
      return false;
    }
  }

  return true;
}

/**
 * Entfernt das Access Token, ID Token und Ablaufdatum aus localStorage.
 * Wird verwendet, um den Benutzer auszuloggen.
 */
export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEY_ID_TOKEN);
}

/**
 * Logs out the user from Keycloak and clears local tokens.
 * Calls Keycloak's logout endpoint to invalidate the server-side session.
 * After logout, Keycloak will redirect back to the home page.
 */
export async function logout(): Promise<void> {
  if (typeof window === "undefined") return;

  // Get ID token before clearing (needed for logout)
  const idToken = localStorage.getItem(STORAGE_KEY_ID_TOKEN);

  // Clear local tokens first
  clearAccessToken();

  // Build Keycloak logout URL
  const logoutUrl = new URL(
    `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/logout`
  );

  // Add id_token_hint if available (required by Keycloak)
  if (idToken) {
    logoutUrl.searchParams.set("id_token_hint", idToken);
  }

  // Add post_logout_redirect_uri
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  logoutUrl.searchParams.set("post_logout_redirect_uri", `${baseUrl}/`);

  // Redirect to Keycloak logout endpoint
  // Keycloak will invalidate the session and redirect back to the home page
  window.location.href = logoutUrl.toString();
}

/**
 * Tauscht einen Authorization Code gegen ein Access Token.
 * Diese Funktion wird im Callback verwendet, nachdem Keycloak den Code zurückgegeben hat.
 *
 * @param code - Der Authorization Code aus der URL
 * @returns Promise mit der Token-Response von Keycloak
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  id_token?: string;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
}> {
  const codeVerifier = getCodeVerifier();

  if (!codeVerifier) {
    throw new Error(
      "Code verifier nicht gefunden. Bitte Login erneut versuchen."
    );
  }

  // POST Request an den Token Endpoint
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code", // Authorization Code Flow
      code: code, // Der Code aus der URL
      redirect_uri: REDIRECT_URI, // Muss mit der ursprünglichen Redirect URI übereinstimmen
      client_id: CLIENT_ID, // Unsere Client ID
      code_verifier: codeVerifier, // PKCE: Der ursprüngliche Verifier
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Token-Austausch fehlgeschlagen: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  // Code Verifier löschen (wird nicht mehr benötigt)
  clearCodeVerifier();

  return data;
}
