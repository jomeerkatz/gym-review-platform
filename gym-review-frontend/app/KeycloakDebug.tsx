"use client";

/**
 * KeycloakDebug Komponente
 *
 * Diese Komponente dient nur zu Debug-Zwecken für die lokale Entwicklung.
 * Sie zeigt:
 * - Einen Button zum Login mit Keycloak
 * - Den aktuellen Login-Status
 * - Das Access Token (nur für Debugging - NICHT für Produktion!)
 *
 * WICHTIG: In Produktion sollte das Token niemals im UI angezeigt werden,
 * da es sensible Daten enthält und missbraucht werden könnte.
 */

import { useState, useEffect } from "react";
import {
  buildAuthUrl,
  getAccessToken,
  isLoggedIn,
  logout,
} from "./lib/keycloak";

export default function KeycloakDebug() {
  // State für Login-Status und Token
  const [loggedIn, setLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  /**
   * Beim Laden der Komponente prüfen wir, ob bereits ein Token vorhanden ist.
   * useEffect wird nach dem ersten Render ausgeführt.
   */
  useEffect(() => {
    checkLoginStatus();
  }, []);

  /**
   * Prüft den aktuellen Login-Status und lädt das Token.
   * Diese Funktion wird beim Laden der Komponente und nach Login/Logout aufgerufen.
   */
  const checkLoginStatus = () => {
    const isUserLoggedIn = isLoggedIn();
    setLoggedIn(isUserLoggedIn);

    if (isUserLoggedIn) {
      // Token aus localStorage laden und anzeigen
      const token = getAccessToken();
      setAccessToken(token);
    } else {
      setAccessToken(null);
    }
  };

  /**
   * Wird aufgerufen, wenn der Benutzer auf "Login mit Keycloak" klickt.
   * Baut die Keycloak Authorization URL und leitet den Browser dorthin weiter.
   */
  const handleLogin = async () => {
    try {
      // Authorization URL mit PKCE Parametern bauen
      const authUrl = await buildAuthUrl();

      // Browser zur Keycloak Login-Seite weiterleiten
      // Nach dem Login wird Keycloak den Benutzer zu /keycloak-callback zurückleiten
      window.location.href = authUrl;
    } catch (error) {
      console.error("Fehler beim Login:", error);
      alert(
        "Fehler beim Login: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    }
  };

  /**
   * Wird aufgerufen, wenn der Benutzer sich ausloggen möchte.
   * Ruft Keycloak's Logout-Endpoint auf, um die Server-Session zu invalidieren.
   */
  const handleLogout = async () => {
    await logout();
    // Note: logout() redirects to Keycloak, so this code won't be reached
    // Keycloak will redirect back to the app after logout
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold mb-4 text-black dark:text-zinc-50">
        Keycloak Debug Integration
      </h2>

      {/* Login-Status Anzeige */}
      <div className="mb-4">
        <p className="text-lg font-semibold text-black dark:text-zinc-50">
          Status:{" "}
          <span
            className={
              loggedIn
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }
          >
            {loggedIn ? "Logged in" : "Not logged in"}
          </span>
        </p>
      </div>

      {/* Logout Button (only show if logged in) */}
      {loggedIn && (
        <div className="mb-6">
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      )}

      {/* Access Token Anzeige (nur wenn eingeloggt) */}
      {loggedIn && accessToken && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-black dark:text-zinc-50">
            Access Token (for debugging purposes only):
          </h3>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg border border-zinc-300 dark:border-zinc-700">
            <pre className="text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto whitespace-pre-wrap break-all">
              {accessToken}
            </pre>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            ⚠️ IMPORTANT: This token should never be displayed in the UI in
            production!
          </p>
        </div>
      )}

      {/* Note */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> This component is only intended for local
          development and debugging. In production, security aspects such as
          token refresh, secure storage, and CSRF protection should be
          implemented.
        </p>
      </div>
    </div>
  );
}
