'use client';

/**
 * Keycloak Callback Seite
 * 
 * Diese Seite wird von Keycloak nach erfolgreichem Login aufgerufen.
 * Der Ablauf:
 * 1. Keycloak leitet den Benutzer hierher mit einem Authorization Code in der URL weiter
 * 2. Wir lesen den Code aus der URL
 * 3. Wir tauschen den Code gegen ein Access Token
 * 4. Wir speichern das Token in localStorage
 * 5. Wir leiten den Benutzer zur Startseite weiter
 * 
 * Route: /keycloak-callback
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { exchangeCodeForToken, saveAccessToken } from '../lib/keycloak';

function KeycloakCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Diese Funktion wird ausgeführt, sobald die Komponente geladen ist.
     * Sie verarbeitet den Authorization Code und tauscht ihn gegen ein Token.
     */
    async function handleCallback() {
      try {
        // 1. Authorization Code aus der URL lesen
        // Keycloak fügt den Code als Query-Parameter "code" hinzu
        const code = searchParams.get('code');
        
        // Prüfen, ob ein Code vorhanden ist
        if (!code) {
          // Falls kein Code vorhanden ist, könnte der Benutzer den Login abgebrochen haben
          // oder es gab einen Fehler
          const error = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          
          if (error) {
            throw new Error(
              `Keycloak error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`
            );
          }
          
          throw new Error('No authorization code found in URL.');
        }

        // 2. Code gegen Access Token tauschen
        // Diese Funktion sendet einen POST Request an den Keycloak Token Endpoint
        // und verwendet dabei den gespeicherten code_verifier (PKCE)
        const tokenData = await exchangeCodeForToken(code);

        // 3. Access Token und ID Token in localStorage speichern
        // Das Token wird unter dem Key "kc_access_token" gespeichert
        // ID Token wird für Logout benötigt
        // Zusätzlich wird das Ablaufdatum gespeichert, falls vorhanden
        saveAccessToken(
          tokenData.access_token,
          tokenData.expires_in,
          tokenData.id_token
        );

        // 4. Status auf Erfolg setzen
        setStatus('success');

        // 5. Nach kurzer Verzögerung zur Startseite weiterleiten
        // Die Verzögerung gibt dem Benutzer kurz Zeit, die Erfolgsmeldung zu sehen
        setTimeout(() => {
          router.push('/');
        }, 1500);

      } catch (error) {
        // Error handling
        console.error('Error in callback:', error);
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Unknown error during token exchange'
        );
        
        // Redirect to home page after 3 seconds (even on error)
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    }

    // Callback-Funktion ausführen
    handleCallback();
  }, [searchParams, router]);

  // UI während des Ladens
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Processing login...
          </p>
        </div>
      </div>
    );
  }

  // UI bei Erfolg
  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
            Login successful!
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            You will be redirected to the home page...
          </p>
        </div>
      </div>
    );
  }

  // UI bei Fehler
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
          Login failed
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          {errorMessage}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          You will be redirected to the home page...
        </p>
      </div>
    </div>
  );
}

export default function KeycloakCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <KeycloakCallbackContent />
    </Suspense>
  );
}

