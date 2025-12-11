"use client";

import KeycloakDebug from "./KeycloakDebug";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getAccessToken,
  buildAuthUrl,
  isLoggedIn,
  logout,
} from "./lib/keycloak";
import { GymSummaryDto, PageResponse } from "./lib/types";

// Backend configuration
const BACKEND_BASE_URL = "http://localhost:8080";
const SEARCH_GYMS_ENDPOINT = `${BACKEND_BASE_URL}/api/gyms`;
const PHOTOS_ENDPOINT = `${BACKEND_BASE_URL}/api/photos`;

// Gym Card Component
function GymCard({ gym }: { gym: GymSummaryDto }) {
  const [imageError, setImageError] = useState(false);
  const firstPhoto = gym.photos && gym.photos.length > 0 ? gym.photos[0] : null;
  const imageUrl = firstPhoto ? `${PHOTOS_ENDPOINT}/${firstPhoto.url}` : null;

  // Calculate star rating (0-5 scale)
  const rating = gym.averageRating ?? 0;
  const filledStars = Math.round(rating);
  const emptyStars = 5 - filledStars;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Small gym name at top */}
      <div className="px-4 pt-3 pb-1">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 truncate">
          {gym.name}
        </h3>
      </div>

      {/* Street name, street number, and city */}
      <div className="px-4 pb-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          {gym.address
            ? `${gym.address.streetName} ${gym.address.streetNumber}, ${gym.address.city}`
            : "Location not available"}
        </p>
      </div>

      {/* Gym image */}
      <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={gym.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-zinc-400 dark:text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                No Image
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Large gym name */}
      <div className="px-4 pt-3">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50 truncate">
          {gym.name}
        </h2>
      </div>

      {/* Star rating */}
      <div className="px-4 py-2 flex items-center gap-1">
        {[...Array(filledStars)].map((_, i) => (
          <svg
            key={`filled-${i}`}
            className="w-5 h-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {[...Array(emptyStars)].map((_, i) => (
          <svg
            key={`empty-${i}`}
            className="w-5 h-5 text-zinc-300 dark:text-zinc-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {gym.averageRating !== null && (
          <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-1">
            ({gym.averageRating.toFixed(1)})
          </span>
        )}
      </div>

      {/* Gym type */}
      <div className="px-4 pb-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {gym.gymType}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [gyms, setGyms] = useState<GymSummaryDto[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false);
  const [showKeycloakDebug, setShowKeycloakDebug] = useState<boolean>(false);

  // Check for token and login status
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = getAccessToken();
      setHasToken(!!token);
    }
  }, []);

  // Check login status
  const loggedIn = isLoggedIn();

  // Handle login
  const handleLogin = async () => {
    try {
      const authUrl = await buildAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error during login:", error);
      alert(
        "Error during login: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await logout();
      // logout() redirects to Keycloak, so this code won't be reached
    } catch (error) {
      console.error("Error during sign out:", error);
      alert(
        "Error during sign out: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  // Fetch gyms
  const fetchGyms = async (page: number) => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setIsNetworkError(false);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "8",
      });

      const response = await fetch(
        `${SEARCH_GYMS_ENDPOINT}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Store status code even if not ok
      const statusCode = response.status;
      setErrorCode(statusCode);

      if (!response.ok) {
        // Try to get error message from response body
        let errorMessage = `Failed to fetch gyms: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }

      const data: PageResponse<GymSummaryDto> = await response.json();

      // Log Address structure for debugging
      console.log("=== Gym Response Data ===");
      console.log("RAW PAGE RESPONSE:", JSON.stringify(data, null, 2));
      data.content.forEach((gym, index) => {
        console.log(`Gym ${index + 1} (${gym.name}):`, {
          address: gym.address,
          addressType: typeof gym.address,
          addressIsNull: gym.address === null,
          addressIsUndefined: gym.address === undefined,
        });
      });
      console.log("========================");

      setGyms(data.content);
      setTotalPages(data.totalPages);
      setCurrentPage(data.number + 1); // Backend returns 0-based, convert to 1-based
    } catch (err) {
      // Check if it's a network error (server not running)
      if (
        err instanceof TypeError &&
        (err.message.includes("fetch") ||
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError"))
      ) {
        setIsNetworkError(true);
        setError(
          "Cannot connect to server. Please make sure the backend is running."
        );
        setErrorCode(null);
      } else {
        setIsNetworkError(false);
        setError(err instanceof Error ? err.message : "Failed to fetch gyms");
      }
      setGyms([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on page load
  useEffect(() => {
    fetchGyms(1);
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchGyms(page);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex flex-col">
        {/* Transparent Header Overlay */}
        <header className="absolute top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight"
            >
              Gymify
            </Link>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={loggedIn ? handleSignOut : handleLogin}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2.5 text-xs sm:text-sm md:text-base font-medium rounded-lg transition-all backdrop-blur-sm ${
                  loggedIn
                    ? "text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                    : "text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                }`}
              >
                {loggedIn ? "Sign out" : "Log in"}
              </button>
            </div>
          </div>
        </header>

        {/* Hero Image Background */}
        <div className="absolute inset-0 w-full h-full">
          <div className="relative w-full h-full min-h-screen">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/header-image-gymify.jpg')",
              }}
            >
              {/* Dark Gradient Overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/20" />
            </div>
          </div>
        </div>

        {/* Hero Text Content - Centered */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight">
              Create your favourite gym in Hamburg and let others know what you
              think of it in seconds.
            </h1>
            {/* Create a gym button */}
            <Link
              href="/gyms/create"
              className="inline-block px-6 py-3 sm:px-8 sm:py-3.5 md:px-10 md:py-4 text-sm sm:text-base md:text-lg font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-all shadow-lg backdrop-blur-sm"
            >
              Create a gym
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Section - starts right after hero */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16 bg-zinc-50 dark:bg-black">
        {showKeycloakDebug && <KeycloakDebug />}

        {/* Gym Grid Section */}
        <div className="mt-12">
          {isLoading && (
            <div className="text-center py-12">
              <p className="text-zinc-600 dark:text-zinc-400">
                Loading gyms...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="inline-block bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
                <div className="flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                    Error Loading Gyms
                  </h3>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  {error}
                </p>
                {errorCode && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mb-3">
                    HTTP Status: {errorCode}
                  </p>
                )}
                {isNetworkError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mb-4">
                    💡 Make sure the backend server is running on{" "}
                    <span className="font-mono">http://localhost:8080</span>
                  </p>
                )}
                <button
                  onClick={() => fetchGyms(currentPage)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && gyms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-600 dark:text-zinc-400">No gyms found.</p>
            </div>
          )}

          {!isLoading && !error && gyms.length > 0 && (
            <>
              {/* Gym Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {gyms.map((gym) => (
                  <Link key={gym.id} href={`/gyms/${gym.id}`} className="block">
                    <GymCard gym={gym} />
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          pageNum === currentPage
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700"
                        } ${
                          isLoading
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer Section */}
      <footer className="relative z-10 w-full bg-zinc-900 dark:bg-black border-t border-zinc-800 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
            {/* Gymify and Mission */}
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                Gymify
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 dark:text-zinc-500 max-w-2xl">
                Our mission is to connect fitness enthusiasts with the best gyms
                in Hamburg. We empower the community to share honest reviews and
                discover their perfect training space.
              </p>
            </div>

            {/* Debug Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showKeycloakDebug}
                  onChange={(e) => setShowKeycloakDebug(e.target.checked)}
                  className="w-4 h-4 rounded border-yellow-200 dark:border-yellow-800 bg-zinc-800 dark:bg-zinc-900 checked:bg-yellow-600 focus:ring-2 focus:ring-yellow-500"
                />
                <span className="text-sm sm:text-base text-zinc-300 dark:text-zinc-400">
                  Debug
                </span>
              </label>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
