/**
 * Runtime Configuration Utilities
 * 
 * Diese Datei stellt Funktionen bereit, die Environment Variables zur Laufzeit lesen,
 * nicht zur Build-Zeit. Das ist wichtig, damit die Werte in Production (z.B. Railway)
 * korrekt geladen werden, auch wenn sie beim Build nicht verfügbar waren.
 */

/**
 * Liest die Backend API URL zur Laufzeit
 */
export function getBackendBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Im Browser: Versuche zuerst aus window.__ENV zu lesen (falls gesetzt)
    const envApiUrl = (window as any).__ENV?.NEXT_PUBLIC_API_URL;
    if (envApiUrl) return envApiUrl;
  }
  // Fallback zu process.env (wird zur Build-Zeit ersetzt)
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
}

/**
 * Liest die Keycloak URL zur Laufzeit
 */
export function getKeycloakBaseUrl(): string {
  if (typeof window !== "undefined") {
    const envKeycloakUrl = (window as any).__ENV?.NEXT_PUBLIC_KEYCLOAK_URL;
    if (envKeycloakUrl) return envKeycloakUrl;
  }
  return process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:9090";
}

/**
 * Liest die Base URL (Frontend URL) zur Laufzeit
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    const envBaseUrl = (window as any).__ENV?.NEXT_PUBLIC_BASE_URL;
    if (envBaseUrl) return envBaseUrl;
    // Fallback zu window.location.origin wenn verfügbar
    if (window.location && window.location.origin) {
      const envValue = process.env.NEXT_PUBLIC_BASE_URL;
      if (envValue && !envValue.includes('localhost')) {
        return envValue;
      }
      return window.location.origin;
    }
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

/**
 * Liest den Keycloak Realm zur Laufzeit
 */
export function getKeycloakRealm(): string {
  if (typeof window !== "undefined") {
    const envRealm = (window as any).__ENV?.NEXT_PUBLIC_KEYCLOAK_REALM;
    if (envRealm) return envRealm;
  }
  return process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "gym-review";
}

/**
 * Liest die Keycloak Client ID zur Laufzeit
 */
export function getKeycloakClientId(): string {
  if (typeof window !== "undefined") {
    const envClientId = (window as any).__ENV?.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
    if (envClientId) return envClientId;
  }
  return process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "gym-review-app";
}

