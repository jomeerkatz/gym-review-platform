"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ReviewDto,
  ReviewCreateUpdateRequestDto,
} from "../../../../../lib/types";
import { isLoggedIn } from "../../../../../lib/keycloak";

// Backend configuration
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const UPLOAD_PHOTO_ENDPOINT = `${BACKEND_BASE_URL}/photos`;
const PHOTOS_ENDPOINT = `${BACKEND_BASE_URL}/photos`;
const TOKEN_STORAGE_KEY = "kc_access_token";
const MAX_PHOTOS = 5;

export default function EditReviewPage() {
  const params = useParams();
  const router = useRouter();
  const gymId = params.id as string;
  const reviewId = params.reviewId as string;

  // Authentication state
  const [hasToken, setHasToken] = useState<boolean>(false);

  // Loading and error states
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(true);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Form state
  const [rating, setRating] = useState<number | null>(null);
  const [content, setContent] = useState<string>("");

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingPhotos, setExistingPhotos] = useState<
    Array<{ url: string; id: string }>
  >([]);
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
   * Fetch review details
   */
  const fetchReviewDetails = async () => {
    setIsLoadingReview(true);
    setReviewError(null);

    try {
      const url = `${BACKEND_BASE_URL}/gyms/${encodeURIComponent(
        gymId
      )}/reviews/${encodeURIComponent(reviewId)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Review not found");
        }
        throw new Error(`Failed to fetch review: ${response.statusText}`);
      }

      const data: ReviewDto = await response.json();

      // Initialize form with review data
      setRating(data.rating ?? null);
      setContent(data.content || "");

      // Initialize existing photos
      if (data.photos && data.photos.length > 0) {
        const photos = data.photos.map((photo, index) => ({
          url: photo.url,
          id: `existing-${index}`,
        }));
        setExistingPhotos(photos);
      } else {
        setExistingPhotos([]);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setReviewError(
        err instanceof Error ? err.message : "Failed to fetch review"
      );
    } finally {
      setIsLoadingReview(false);
    }
  };

  // Fetch review details on mount
  useEffect(() => {
    if (gymId && reviewId && hasToken) {
      fetchReviewDetails();
    }
  }, [gymId, reviewId, hasToken]);

  /**
   * Handle file selection for photos
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);

    // Check total photo count (existing + new)
    const totalPhotos =
      existingPhotos.length + selectedFiles.length + newFiles.length;
    if (totalPhotos > MAX_PHOTOS) {
      setErrors((prev) => ({
        ...prev,
        photoIds: `❌ Maximum ${MAX_PHOTOS} photos allowed. You can add ${
          MAX_PHOTOS - existingPhotos.length - selectedFiles.length
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
   * Remove a new photo from the list
   */
  const removeNewPhoto = (index: number) => {
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
   * Remove an existing photo
   */
  const removeExistingPhoto = (id: string) => {
    setExistingPhotos((prev) => prev.filter((photo) => photo.id !== id));
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
   * Handle star click
   */
  const handleStarClick = (starRating: number) => {
    setRating(starRating);
    if (errors.rating) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.rating;
        return newErrors;
      });
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

    // Photos are required (minimum 1) - existing + new combined
    const totalPhotos = existingPhotos.length + selectedFiles.length;
    if (totalPhotos === 0) {
      newErrors.photoIds = "❌ At least one photo is required.";
    } else if (totalPhotos > MAX_PHOTOS) {
      newErrors.photoIds = `❌ Maximum ${MAX_PHOTOS} photos allowed.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Upload all new photos and return their IDs
   */
  const uploadNewPhotos = async (): Promise<string[]> => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      throw new Error("No access token found. Please log in first.");
    }

    const photoIds: string[] = [];

    // Upload all new photos sequentially to get their IDs
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(UPLOAD_PHOTO_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Photo upload failed: ${response.statusText} - ${errorText}`
        );
      }

      const responseText = await response.text();
      try {
        const photoData: { url: string } = JSON.parse(responseText);
        photoIds.push(photoData.url);
      } catch (parseError) {
        throw new Error("Response could not be parsed.");
      }
    }

    return photoIds;
  };

  /**
   * Handle form submission for update
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
      setErrorMessage("No access token found. Please log in first.");
      setHasToken(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload new photos first (if any) to get their IDs
      const newPhotoIds =
        selectedFiles.length > 0 ? await uploadNewPhotos() : [];

      // Combine existing photo IDs with new photo IDs
      const existingPhotoIds = existingPhotos.map((photo) => photo.url);
      const allPhotoIds = [...existingPhotoIds, ...newPhotoIds];

      // Build request payload
      const payload: ReviewCreateUpdateRequestDto = {
        content: content.trim(),
        rating: rating!,
        photoIds: allPhotoIds.length > 0 ? allPhotoIds : undefined,
      };

      // Send PUT request
      const response = await fetch(
        `${BACKEND_BASE_URL}/gyms/${encodeURIComponent(
          gymId
        )}/reviews/${encodeURIComponent(reviewId)}`,
        {
          method: "PUT",
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
              `Error updating review: ${response.statusText}`
          );
        } catch {
          setErrorMessage(`Error updating review: ${response.statusText}`);
        }
      }
    } catch (error) {
      setIsSuccess(false);
      setErrorMessage(
        error instanceof Error
          ? `Network error: ${error.message}`
          : "Unknown error updating review"
      );
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
              Edit Review
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Update your review content, rating, and photos.
            </p>
          </div>

          {/* Loading state */}
          {isLoadingReview && (
            <div className="text-center py-12">
              <p className="text-zinc-600 dark:text-zinc-400">
                Loading review details...
              </p>
            </div>
          )}

          {/* Error state */}
          {reviewError && !isLoadingReview && (
            <div className="text-center py-12">
              <div className="inline-block bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {reviewError}
                </p>
                <button
                  onClick={fetchReviewDetails}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          {!isLoadingReview && !reviewError && (
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
                  Photos <span className="text-red-500">*</span> (min 1, max{" "}
                  {MAX_PHOTOS})
                </label>
                <div className="space-y-4">
                  {/* Existing photos */}
                  {existingPhotos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-black dark:text-zinc-50">
                        Existing Photos
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {existingPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden"
                          >
                            <div className="relative">
                              <img
                                src={`${PHOTOS_ENDPOINT}/${photo.url}`}
                                alt="Existing photo"
                                className="w-full h-48 object-cover"
                              />
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-800">
                              <button
                                type="button"
                                onClick={() => removeExistingPhoto(photo.id)}
                                className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File input for new photos */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                      Add New Photos:
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      disabled={
                        existingPhotos.length + selectedFiles.length >=
                        MAX_PHOTOS
                      }
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
                    {existingPhotos.length + selectedFiles.length > 0 && (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {existingPhotos.length + selectedFiles.length} of{" "}
                        {MAX_PHOTOS} photos
                        {existingPhotos.length > 0 &&
                          ` (${existingPhotos.length} existing, ${selectedFiles.length} new)`}
                      </p>
                    )}
                  </div>

                  {/* New photo previews */}
                  {selectedFiles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-black dark:text-zinc-50">
                        New Photos
                      </h4>
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
                                onClick={() => removeNewPhoto(index)}
                                className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
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
                    ✅ Review successfully updated!
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
                  disabled={
                    !hasToken ||
                    isSubmitting ||
                    existingPhotos.length + selectedFiles.length === 0
                  }
                  className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                    hasToken &&
                    !isSubmitting &&
                    existingPhotos.length + selectedFiles.length > 0
                      ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      : "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting
                    ? "Uploading photos and updating review..."
                    : "Update Review"}
                </button>
                <Link
                  href={`/gyms/${gymId}`}
                  className="px-6 py-3 font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-zinc-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
