"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReviewCreateUpdateRequestDto } from "../../../../lib/types";
import { isLoggedIn, getAccessToken } from "../../../../lib/keycloak";

import { getBackendBaseUrl } from "../../../../lib/config";

// Backend configuration - Funktionen um sicherzustellen, dass Environment Variables zur Laufzeit geladen werden
function getUploadPhotoEndpoint(): string {
  return `${getBackendBaseUrl()}/photos`;
}
const TOKEN_STORAGE_KEY = "kc_access_token";
const MAX_PHOTOS = 5;

export default function CreateReviewPage() {
  const params = useParams();
  const router = useRouter();
  const gymId = params.id as string;

  // Authentication state
  const [hasToken, setHasToken] = useState<boolean>(false);

  // Form state
  const [rating, setRating] = useState<number | null>(null);
  const [content, setContent] = useState<string>("");

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = isLoggedIn();
      setHasToken(loggedIn);
      if (!loggedIn) {
        // Redirect to home if not logged in
        router.push("/");
      }
    }
  }, [router]);

  /**
   * Handle file selection for photos
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);

    // Check total photo count (existing + new)
    const totalPhotos = selectedFiles.length + newFiles.length;
    if (totalPhotos > MAX_PHOTOS) {
      setErrors((prev) => ({
        ...prev,
        photoIds: `❌ Maximum ${MAX_PHOTOS} photos allowed. You can upload ${
          MAX_PHOTOS - selectedFiles.length
        } more.`,
      }));
      return;
    }

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);

    // Clear error for photoIds
    if (errors.photoIds) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.photoIds;
        return newErrors;
      });
    }
  };

  /**
   * Remove a photo from the list
   */
  const removePhoto = (index: number) => {
    // Revoke preview URL
    if (photoPreviews[index]) {
      URL.revokeObjectURL(photoPreviews[index]);
    }

    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));

    // Clear error for photoIds
    if (errors.photoIds) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.photoIds;
        return newErrors;
      });
    }
  };

  /**
   * Upload all photos and return their IDs
   */
  const uploadAllPhotos = async (): Promise<string[]> => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      throw new Error("Kein Access Token gefunden. Bitte zuerst einloggen.");
    }

    const photoIds: string[] = [];

    // Upload all photos sequentially to get their IDs
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(getUploadPhotoEndpoint(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Foto-Upload fehlgeschlagen: ${response.statusText} - ${errorText}`
        );
      }

      const responseText = await response.text();
      try {
        const photoData: { url: string } = JSON.parse(responseText);
        photoIds.push(photoData.url);
      } catch (parseError) {
        throw new Error("Response konnte nicht geparst werden.");
      }
    }

    return photoIds;
  };

  /**
   * Cleanup preview URLs on unmount
   */
  useEffect(() => {
    return () => {
      photoPreviews.forEach((preview) => {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [photoPreviews]);

  /**
   * Validate the form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Rating is required
    if (!rating || rating < 1 || rating > 5) {
      newErrors.rating = "❌ Please select a rating between 1 and 5 stars.";
    }

    // Content is required
    if (!content || content.trim() === "") {
      newErrors.content = "❌ Review content cannot be blank.";
    }

    // Photos are required (minimum 1) and max 5
    if (selectedFiles.length === 0) {
      newErrors.photoIds = "❌ At least one photo is required.";
    } else if (selectedFiles.length > MAX_PHOTOS) {
      newErrors.photoIds = `❌ Maximum ${MAX_PHOTOS} photos allowed.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset previous states
    setIsSuccess(false);
    setErrorMessage(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check for token
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setErrorMessage("Kein Access Token gefunden. Bitte zuerst einloggen.");
      setHasToken(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first (if any) to get their IDs
      const photoIds = selectedFiles.length > 0 ? await uploadAllPhotos() : [];

      // Build request payload
      const payload: ReviewCreateUpdateRequestDto = {
        content: content.trim(),
        rating: rating!,
        photoIds: photoIds.length > 0 ? photoIds : undefined,
      };

      // Send POST request
      const response = await fetch(
        `${getBackendBaseUrl()}/gyms/${encodeURIComponent(gymId)}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // Read response body
      const responseText = await response.text();

      if (response.ok) {
        // Success
        setIsSuccess(true);
        setErrorMessage(null);

        // Redirect to gym page after 1.5 seconds
        setTimeout(() => {
          router.push(`/gyms/${gymId}`);
        }, 1500);
      } else {
        // Error
        setIsSuccess(false);
        try {
          const errorData = JSON.parse(responseText);
          setErrorMessage(
            errorData.message ||
              errorData.error ||
              `Fehler beim Erstellen der Bewertung: ${response.statusText}`
          );
        } catch {
          setErrorMessage(
            `Fehler beim Erstellen der Bewertung: ${response.statusText}`
          );
        }
      }
    } catch (error) {
      setIsSuccess(false);
      setErrorMessage(
        error instanceof Error
          ? `Netzwerkfehler: ${error.message}`
          : "Unbekannter Fehler beim Erstellen der Bewertung"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Clear error for a field when user starts typing
   */
  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  /**
   * Handle star click
   */
  const handleStarClick = (starRating: number) => {
    setRating(starRating);
    clearFieldError("rating");
  };

  // Don't render if not authenticated
  if (!hasToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-4xl mx-auto px-8 py-16">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href={`/gyms/${gymId}`}
            className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Gym
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          {/* Title and Subtitle */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
              Write a Review
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Share your experience and help others discover great gyms. Your
              review will be visible to all users.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Rating Section */}
            <section>
              <label className="block mb-4 text-sm font-medium text-black dark:text-zinc-50">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => handleStarClick(starValue)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    aria-label={`Rate ${starValue} star${
                      starValue !== 1 ? "s" : ""
                    }`}
                  >
                    <svg
                      className={`w-10 h-10 ${
                        rating && starValue <= rating
                          ? "text-yellow-400"
                          : "text-zinc-300 dark:text-zinc-600"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                {rating && (
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                    {rating} {rating === 1 ? "star" : "stars"}
                  </span>
                )}
              </div>
              {errors.rating && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.rating}
                </p>
              )}
            </section>

            {/* Review Content Section */}
            <section>
              <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                Review Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  clearFieldError("content");
                }}
                rows={6}
                placeholder="Share your experience with this gym..."
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 resize-y ${
                  errors.content
                    ? "border-red-500"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.content}
                </p>
              )}
            </section>

            {/* Photos Section */}
            <section>
              <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                Photos <span className="text-red-500">*</span> (min 1, max {MAX_PHOTOS})
              </label>
              <div className="space-y-4">
                {/* File input */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={selectedFiles.length >= MAX_PHOTOS}
                    className="block w-full text-sm text-zinc-500 dark:text-zinc-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      dark:file:bg-blue-900/20 dark:file:text-blue-300
                      dark:hover:file:bg-blue-900/30
                      cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {selectedFiles.length} of {MAX_PHOTOS} photos selected
                    </p>
                  )}
                </div>

                {/* Photo previews */}
                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden"
                      >
                        <div className="relative">
                          <img
                            src={photoPreviews[index]}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                        <div className="p-3 bg-white dark:bg-zinc-800">
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 truncate">
                            {file.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.photoIds && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.photoIds}
                  </p>
                )}
              </div>
            </section>

            {/* Success Message */}
            {isSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-200">
                  ✅ Review successfully created!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Redirecting to gym page...
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">
                  ❌ Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Submit and Cancel Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!hasToken || isSubmitting || selectedFiles.length === 0}
                className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                  hasToken && !isSubmitting && selectedFiles.length > 0
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    : "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting
                  ? "Uploading photos and submitting review..."
                  : "Submit Review"}
              </button>
              <Link
                href={`/gyms/${gymId}`}
                className="px-6 py-3 font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-zinc-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
