"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GymDto,
  GymSummaryDto,
  PageResponse,
  GymCreateUpdateRequestDto,
  AddressDto,
  OperatingHoursDto,
  TimeRangeDto,
  ReviewDto,
} from "../../lib/types";
import { isLoggedIn, getAccessToken } from "../../lib/keycloak";

import { getBackendBaseUrl } from "../../lib/config";

// Backend configuration - Funktionen um sicherzustellen, dass Environment Variables zur Laufzeit geladen werden
function getGymEndpoint(): string {
  return `${getBackendBaseUrl()}/gyms`;
}

function getPhotosEndpoint(): string {
  return `${getBackendBaseUrl()}/photos`;
}

function getUploadPhotoEndpoint(): string {
  return `${getBackendBaseUrl()}/photos`;
}
const DEFAULT_RADIUS = 10000; // 10km in meters
const TOKEN_STORAGE_KEY = "kc_access_token";

// Days of the week for operating hours
const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Gym Card Component (reused from homepage)
function GymCard({ gym }: { gym: GymSummaryDto }) {
  const [imageError, setImageError] = useState(false);
  const firstPhoto = gym.photos && gym.photos.length > 0 ? gym.photos[0] : null;
  const imageUrl = firstPhoto
    ? `${getPhotosEndpoint()}/${firstPhoto.url}`
    : null;

  // Calculate star rating (0-5 scale)
  const rating = gym.averageRating ?? 0;
  const filledStars = Math.round(rating);
  const emptyStars = 5 - filledStars;

  return (
    <Link href={`/gyms/${gym.id}`} className="block">
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
    </Link>
  );
}

// Review Card Component
function ReviewCard({
  review,
  gymId,
  onDeleteClick,
}: {
  review: ReviewDto;
  gymId: string;
  onDeleteClick: (reviewId: string) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const firstPhoto =
    review.photos && review.photos.length > 0 ? review.photos[0] : null;
  const imageUrl = firstPhoto
    ? `${getPhotosEndpoint()}/${firstPhoto.url}`
    : null;

  // Calculate star rating (0-5 scale)
  const rating = review.rating ?? 0;
  const filledStars = Math.round(rating);
  const emptyStars = 5 - filledStars;

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Date not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Date not available";
    }
  };

  // Get user display name
  const getUserDisplayName = (): string => {
    if (review.writtenBy?.username) {
      return review.writtenBy.username;
    }
    if (review.writtenBy?.email) {
      return review.writtenBy.email;
    }
    return "Anonymous";
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
      {/* Edit and Delete buttons */}
      {review.id && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {/* Delete button */}
          <button
            onClick={() => onDeleteClick(review.id!)}
            className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            title="Delete review"
          >
            <svg
              className="w-4 h-4 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          {/* Edit button */}
          <Link
            href={`/gyms/${gymId}/reviews/${review.id}/edit`}
            className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            title="Edit review"
          >
            <svg
              className="w-4 h-4 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Link>
        </div>
      )}
      {/* Review image */}
      {imageUrl && (
        <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
          {!imageError ? (
            <img
              src={imageUrl}
              alt="Review photo"
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
      )}

      {/* Review content */}
      <div className="p-4">
        {/* User and date */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {getUserDisplayName()}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {formatDate(review.datePosted)}
          </p>
        </div>

        {/* Star rating */}
        <div className="mb-3 flex items-center gap-1">
          {[...Array(filledStars)].map((_, i) => (
            <svg
              key={`filled-${i}`}
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          {[...Array(emptyStars)].map((_, i) => (
            <svg
              key={`empty-${i}`}
              className="w-4 h-4 text-zinc-300 dark:text-zinc-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Review content text */}
        {review.content && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
            {review.content}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GymDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gymId = params.id as string;

  console.log("🔍 Component mounted, params:", params);
  console.log("🔍 gymId:", gymId);

  const [gym, setGym] = useState<GymDto | null>(null);
  const [nearbyGyms, setNearbyGyms] = useState<GymSummaryDto[]>([]);
  const [isLoadingGym, setIsLoadingGym] = useState<boolean>(true);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Authentication state
  const [hasToken, setHasToken] = useState<boolean>(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Edit form state
  const [editName, setEditName] = useState<string>("");
  const [editGymType, setEditGymType] = useState<string>("");
  const [editContactInformation, setEditContactInformation] =
    useState<string>("");

  // Edit address state
  const [editStreetNumber, setEditStreetNumber] = useState<string>("");
  const [editStreetName, setEditStreetName] = useState<string>("");
  const [editUnit, setEditUnit] = useState<string>("");
  const [editCity, setEditCity] = useState<string>("");
  const [editState, setEditState] = useState<string>("");
  const [editPostalCode, setEditPostalCode] = useState<string>("");
  const [editCountry, setEditCountry] = useState<string>("");

  // Edit operating hours state
  const [editOperatingHours, setEditOperatingHours] = useState<
    Record<DayOfWeek, TimeRangeDto>
  >({
    monday: { openTime: "", closeTime: "" },
    tuesday: { openTime: "", closeTime: "" },
    wednesday: { openTime: "", closeTime: "" },
    thursday: { openTime: "", closeTime: "" },
    friday: { openTime: "", closeTime: "" },
    saturday: { openTime: "", closeTime: "" },
    sunday: { openTime: "", closeTime: "" },
  });

  // Template time for copying to all days
  const [templateOpenTime, setTemplateOpenTime] = useState<string>("");
  const [templateCloseTime, setTemplateCloseTime] = useState<string>("");

  // Photo management state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingPhotos, setExistingPhotos] = useState<
    Array<{ url: string; id: string }>
  >([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Validation errors
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Update submission state
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(
    null
  );

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null
  );

  // Delete review modal state
  const [isDeleteReviewModalOpen, setIsDeleteReviewModalOpen] =
    useState<boolean>(false);
  const [isDeletingReview, setIsDeletingReview] = useState<boolean>(false);
  const [deleteReviewSuccess, setDeleteReviewSuccess] =
    useState<boolean>(false);
  const [deleteReviewErrorMessage, setDeleteReviewErrorMessage] = useState<
    string | null
  >(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  // Review sorting and pagination state
  const [sortBy, setSortBy] = useState<"datePosted" | "rating">("datePosted");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [reviewsPage, setReviewsPage] = useState<number>(0);
  const [reviewsPageSize] = useState<number>(20);
  const [sortedReviews, setSortedReviews] =
    useState<PageResponse<ReviewDto> | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [useSortedReviews, setUseSortedReviews] = useState<boolean>(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Fetch gym details
  const fetchGymDetails = async (id: string) => {
    console.log("🚀 fetchGymDetails called with id:", id);
    setIsLoadingGym(true);
    setError(null);

    try {
      const url = `${getGymEndpoint()}/${encodeURIComponent(id)}`;
      console.log("📡 Fetching gym from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Response:", response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Gym not found");
        }
        throw new Error(`Failed to fetch gym: ${response.statusText}`);
      }

      const data: GymDto = await response.json();
      setGym(data);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch gym");
      setGym(null);
    } finally {
      setIsLoadingGym(false);
    }
  };

  // Fetch nearby gyms
  const fetchNearbyGyms = async (
    latitude: number,
    longitude: number,
    radius: number
  ) => {
    setIsLoadingNearby(true);

    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString(),
        page: "1",
        size: "12",
      });

      const url = `${getGymEndpoint()}?${params.toString()}`;
      console.log("🔍 Fetching nearby gyms from:", url);
      console.log("📍 Parameters:", { latitude, longitude, radius });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Response status:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch nearby gyms: ${response.statusText}`);
      }

      const data: PageResponse<GymSummaryDto> = await response.json();
      console.log("📦 Nearby gyms data:", data);
      console.log("�� Nearby gyms BEFORE filter:", data.content);

      // Filter out the current gym from nearby results
      const filtered = data.content.filter((g) => g.id !== gymId);
      setNearbyGyms(filtered);
    } catch (err) {
      console.error("❌ Failed to fetch nearby gyms:", err);
      setNearbyGyms([]);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  // Fetch sorted reviews
  const fetchSortedReviews = async (
    sortByParam?: "datePosted" | "rating",
    sortDirectionParam?: "desc" | "asc",
    pageParam?: number
  ) => {
    setIsLoadingReviews(true);
    setReviewsError(null);

    const currentSortBy = sortByParam ?? sortBy;
    const currentSortDirection = sortDirectionParam ?? sortDirection;
    const currentPage = pageParam ?? reviewsPage;

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: reviewsPageSize.toString(),
        sort: `${currentSortBy},${currentSortDirection}`,
      });

      const url = `${getBackendBaseUrl()}/gyms/${encodeURIComponent(
        gymId
      )}/reviews?${params.toString()}`;
      console.log("📡 Fetching sorted reviews from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
      }

      const data: PageResponse<ReviewDto> = await response.json();
      setSortedReviews(data);
      setReviewsError(null);
    } catch (err) {
      console.error("❌ Error fetching reviews:", err);
      setReviewsError(
        err instanceof Error ? err.message : "Failed to fetch reviews"
      );
      setSortedReviews(null);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasToken(isLoggedIn());
    }
  }, []);

  // Fetch gym details on mount
  useEffect(() => {
    console.log("🔄 useEffect triggered, gymId:", gymId);
    if (gymId) {
      console.log("✅ gymId exists, calling fetchGymDetails");
      fetchGymDetails(gymId);
    } else {
      console.warn("⚠️ gymId is undefined or empty!");
    }
  }, [gymId]);

  // Fetch nearby gyms when gym details are loaded
  useEffect(() => {
    console.log("��️ Gym loaded:", gym);
    console.log("�� GeoLocation:", gym?.geoLocation);

    if (gym?.geoLocation?.lat && gym?.geoLocation?.lon) {
      console.log("🚀 Fetching nearby gyms...");
      fetchNearbyGyms(
        gym.geoLocation.lat, // Use "lat" instead of "latitude"
        gym.geoLocation.lon, // Use "lon" instead of "longitude"
        DEFAULT_RADIUS
      );
    } else {
      console.log("⚠️ No geoLocation available, skipping nearby gyms fetch");
    }
  }, [gym]);

  // Get first photo URL
  const firstPhoto =
    gym?.photos && gym.photos.length > 0 ? gym.photos[0] : null;
  const imageUrl = firstPhoto
    ? `${getPhotosEndpoint()}/${firstPhoto.url}`
    : null;

  // Calculate star rating
  const rating = gym?.averageRating ?? 0;
  const filledStars = Math.round(rating);
  const emptyStars = 5 - filledStars;

  /**
   * Initialize edit form with current gym data
   */
  const initializeEditForm = () => {
    if (!gym) return;

    // Basic info
    setEditName(gym.name || "");
    setEditGymType(gym.gymType || "");
    setEditContactInformation(gym.contactInformation || "");

    // Address
    if (gym.address) {
      setEditStreetNumber(gym.address.streetNumber || "");
      setEditStreetName(gym.address.streetName || "");
      setEditUnit(gym.address.unit || "");
      setEditCity(gym.address.city || "");
      setEditState(gym.address.state || "");
      setEditPostalCode(gym.address.postalCode || "");
      setEditCountry(gym.address.country || "");
    }

    // Operating hours
    if (gym.operatingHours) {
      const hours: Record<DayOfWeek, TimeRangeDto> = {
        monday: gym.operatingHours.monday || { openTime: "", closeTime: "" },
        tuesday: gym.operatingHours.tuesday || { openTime: "", closeTime: "" },
        wednesday: gym.operatingHours.wednesday || {
          openTime: "",
          closeTime: "",
        },
        thursday: gym.operatingHours.thursday || {
          openTime: "",
          closeTime: "",
        },
        friday: gym.operatingHours.friday || { openTime: "", closeTime: "" },
        saturday: gym.operatingHours.saturday || {
          openTime: "",
          closeTime: "",
        },
        sunday: gym.operatingHours.sunday || { openTime: "", closeTime: "" },
      };
      setEditOperatingHours(hours);
    }

    // Existing photos
    if (gym.photos && gym.photos.length > 0) {
      const photos = gym.photos.map((photo, index) => ({
        url: photo.url,
        id: `existing-${index}`,
      }));
      setExistingPhotos(photos);
    } else {
      setExistingPhotos([]);
    }

    // Reset new photos
    setSelectedFiles([]);
    setPhotoPreviews([]);
    setEditErrors({});
    setUpdateSuccess(false);
    setUpdateErrorMessage(null);
  };

  /**
   * Open edit modal and initialize form
   */
  const openEditModal = () => {
    initializeEditForm();
    setIsEditModalOpen(true);
  };

  /**
   * Close edit modal
   */
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditErrors({});
    setUpdateSuccess(false);
    setUpdateErrorMessage(null);
  };

  /**
   * Update operating hours for a specific day
   */
  const updateOperatingHours = (
    day: DayOfWeek,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setEditOperatingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
    // Clear error for this field
    if (editErrors[`operatingHours.${day}.${field}`]) {
      setEditErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`operatingHours.${day}.${field}`];
        return newErrors;
      });
    }
  };

  /**
   * Copy template times to all days
   */
  const copyTimesToAllDays = () => {
    if (!templateOpenTime || !templateCloseTime) {
      return;
    }
    const newOperatingHours: Record<DayOfWeek, TimeRangeDto> = {
      monday: { openTime: templateOpenTime, closeTime: templateCloseTime },
      tuesday: { openTime: templateOpenTime, closeTime: templateCloseTime },
      wednesday: { openTime: templateOpenTime, closeTime: templateCloseTime },
      thursday: { openTime: templateOpenTime, closeTime: templateCloseTime },
      friday: { openTime: templateOpenTime, closeTime: templateCloseTime },
      saturday: { openTime: templateOpenTime, closeTime: templateCloseTime },
      sunday: { openTime: templateOpenTime, closeTime: templateCloseTime },
    };
    setEditOperatingHours(newOperatingHours);
    // Clear errors for operating hours
    setEditErrors((prev) => {
      const newErrors = { ...prev };
      DAYS_OF_WEEK.forEach((day) => {
        delete newErrors[`operatingHours.${day}.openTime`];
        delete newErrors[`operatingHours.${day}.closeTime`];
      });
      return newErrors;
    });
  };

  /**
   * Handle file selection for new photos
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);

    // Clear error for photoIds
    if (editErrors.photoIds) {
      setEditErrors((prev) => {
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
    if (editErrors.photoIds) {
      setEditErrors((prev) => {
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
    if (editErrors.photoIds) {
      setEditErrors((prev) => {
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
   * Validate a single field
   */
  const validateField = (fieldName: string, value: any): string | null => {
    switch (fieldName) {
      case "name":
        if (!value || value.trim() === "") {
          return "❌ gym name can't be blanked!";
        }
        break;
      case "gymType":
        if (!value || value.trim() === "") {
          return "❌ gym type can't be blanked!";
        }
        break;
      case "contactInformation":
        if (!value || value.trim() === "") {
          return "❌ contact information can't be blanked!";
        }
        break;
      case "streetNumber":
        if (!value || value.trim() === "") {
          return "❌ street number can't be blanked!";
        }
        if (!/^[0-9]{1,5}[a-zA-Z]?$/.test(value)) {
          return "❌ invalid street number format!";
        }
        break;
      case "streetName":
        if (!value || value.trim() === "") {
          return "❌ street name can't be blanked!";
        }
        break;
      case "city":
        if (!value || value.trim() === "") {
          return "❌ street city can't be blanked!";
        }
        break;
      case "state":
        if (!value || value.trim() === "") {
          return "❌ state can't be blanked!";
        }
        break;
      case "postalCode":
        if (!value || value.trim() === "") {
          return "❌ postel code can't be blanked!";
        }
        break;
      case "country":
        if (!value || value.trim() === "") {
          return "❌ country can't be blanked!";
        }
        break;
      case "openTime":
      case "closeTime":
        if (!value || value.trim() === "") {
          return "❌ open time can't be blanked!";
        }
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          return "❌ invalid time format!";
        }
        break;
    }
    return null;
  };

  /**
   * Validate the entire form
   */
  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic information
    const nameError = validateField("name", editName);
    if (nameError) newErrors.name = nameError;

    const gymTypeError = validateField("gymType", editGymType);
    if (gymTypeError) newErrors.gymType = gymTypeError;

    const contactError = validateField(
      "contactInformation",
      editContactInformation
    );
    if (contactError) newErrors.contactInformation = contactError;

    // Address
    const streetNumberError = validateField("streetNumber", editStreetNumber);
    if (streetNumberError) newErrors.streetNumber = streetNumberError;

    const streetNameError = validateField("streetName", editStreetName);
    if (streetNameError) newErrors.streetName = streetNameError;

    const cityError = validateField("city", editCity);
    if (cityError) newErrors.city = cityError;

    const stateError = validateField("state", editState);
    if (stateError) newErrors.state = stateError;

    const postalCodeError = validateField("postalCode", editPostalCode);
    if (postalCodeError) newErrors.postalCode = postalCodeError;

    const countryError = validateField("country", editCountry);
    if (countryError) newErrors.country = countryError;

    // Operating hours - validate each day
    DAYS_OF_WEEK.forEach((day) => {
      const dayHours = editOperatingHours[day];
      if (dayHours) {
        const openTimeError = validateField("openTime", dayHours.openTime);
        if (openTimeError) {
          newErrors[`operatingHours.${day}.openTime`] = openTimeError;
        }

        const closeTimeError = validateField("closeTime", dayHours.closeTime);
        if (closeTimeError) {
          newErrors[`operatingHours.${day}.closeTime`] = closeTimeError;
        }
      }
    });

    // Photos - must have at least one (existing or new)
    if (existingPhotos.length === 0 && selectedFiles.length === 0) {
      newErrors.photoIds = "❌ at least one photos has to be there!";
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Upload all new photos and return their IDs
   */
  const uploadNewPhotos = async (): Promise<string[]> => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      throw new Error("Kein Access Token gefunden. Bitte zuerst einloggen.");
    }

    const photoIds: string[] = [];

    // Upload all new photos sequentially to get their IDs
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
   * Handle form submission for update
   */
  const handleUpdateGym = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset previous states
    setUpdateSuccess(false);
    setUpdateErrorMessage(null);

    // Validate form
    if (!validateEditForm()) {
      return;
    }

    // Check for token
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUpdateErrorMessage(
        "Kein Access Token gefunden. Bitte zuerst einloggen."
      );
      setHasToken(false);
      return;
    }

    setIsUpdating(true);

    try {
      // Build address object
      const address: AddressDto = {
        streetNumber: editStreetNumber.trim(),
        streetName: editStreetName.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        postalCode: editPostalCode.trim(),
        country: editCountry.trim(),
      };
      if (editUnit && editUnit.trim() !== "") {
        address.unit = editUnit.trim();
      }

      // Build operating hours object
      const operatingHoursDto: OperatingHoursDto = {};
      DAYS_OF_WEEK.forEach((day) => {
        const dayHours = editOperatingHours[day];
        if (
          dayHours &&
          dayHours.openTime &&
          dayHours.closeTime &&
          dayHours.openTime.trim() !== "" &&
          dayHours.closeTime.trim() !== ""
        ) {
          operatingHoursDto[day] = {
            openTime: dayHours.openTime.trim(),
            closeTime: dayHours.closeTime.trim(),
          };
        }
      });

      // Upload new photos first to get their IDs
      const newPhotoIds = await uploadNewPhotos();

      // Combine existing photo URLs (that weren't removed) with new photo IDs
      const existingPhotoUrls = existingPhotos.map((photo) => photo.url);
      const allPhotoIds = [...existingPhotoUrls, ...newPhotoIds];

      // Build request payload
      const payload: GymCreateUpdateRequestDto = {
        name: editName.trim(),
        gymType: editGymType.trim(),
        contactInformation: editContactInformation.trim(),
        address,
        operatingHours: operatingHoursDto,
        photoIds: allPhotoIds,
      };

      // Send PUT request
      const response = await fetch(
        `${getGymEndpoint()}/${encodeURIComponent(gymId)}`,
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
        try {
          const updatedGym: GymDto = JSON.parse(responseText);
          setGym(updatedGym);
          setUpdateSuccess(true);
          setUpdateErrorMessage(null);

          // Close modal after a short delay
          setTimeout(() => {
            closeEditModal();
          }, 1500);
        } catch (parseError) {
          setUpdateSuccess(true);
          setUpdateErrorMessage(
            "Gym erfolgreich aktualisiert, aber Response konnte nicht geparst werden."
          );
        }
      } else {
        // Error
        setUpdateSuccess(false);
        try {
          const errorData = JSON.parse(responseText);
          setUpdateErrorMessage(
            errorData.message ||
              errorData.error ||
              `Fehler beim Aktualisieren: ${response.statusText}`
          );
        } catch {
          setUpdateErrorMessage(
            `Fehler beim Aktualisieren: ${response.statusText}`
          );
        }
      }
    } catch (error) {
      setUpdateSuccess(false);
      setUpdateErrorMessage(
        error instanceof Error
          ? `Netzwerkfehler: ${error.message}`
          : "Unbekannter Fehler beim Aktualisieren"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Clear error for a field when user starts typing
   */
  const clearFieldError = (fieldName: string) => {
    if (editErrors[fieldName]) {
      setEditErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  /**
   * Close delete modal
   */
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteSuccess(false);
    setDeleteErrorMessage(null);
  };

  /**
   * Handle gym deletion
   */
  const handleDeleteGym = async () => {
    // Reset previous states
    setDeleteSuccess(false);
    setDeleteErrorMessage(null);

    // Check for token
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setDeleteErrorMessage(
        "Kein Access Token gefunden. Bitte zuerst einloggen."
      );
      setHasToken(false);
      return;
    }

    setIsDeleting(true);

    try {
      // Send DELETE request
      const response = await fetch(
        `${getGymEndpoint()}/${encodeURIComponent(gymId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Success - 204 No Content
        setDeleteSuccess(true);
        setDeleteErrorMessage(null);

        // Wait 2-3 seconds, then redirect to home page
        setTimeout(() => {
          router.push("/");
        }, 2500);
      } else {
        // Error
        setDeleteSuccess(false);
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          setDeleteErrorMessage(
            errorData.message ||
              errorData.error ||
              `Fehler beim Löschen: ${response.statusText}`
          );
        } catch {
          setDeleteErrorMessage(`Fehler beim Löschen: ${response.statusText}`);
        }
      }
    } catch (error) {
      setDeleteSuccess(false);
      setDeleteErrorMessage(
        error instanceof Error
          ? `Netzwerkfehler: ${error.message}`
          : "Unbekannter Fehler beim Löschen"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Open delete review modal
   */
  const openDeleteReviewModal = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setIsDeleteReviewModalOpen(true);
    setDeleteReviewSuccess(false);
    setDeleteReviewErrorMessage(null);
  };

  /**
   * Close delete review modal
   */
  const closeDeleteReviewModal = () => {
    setIsDeleteReviewModalOpen(false);
    setReviewToDelete(null);
    setDeleteReviewSuccess(false);
    setDeleteReviewErrorMessage(null);
  };

  /**
   * Handle review deletion
   */
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    // Reset previous states
    setDeleteReviewSuccess(false);
    setDeleteReviewErrorMessage(null);

    // Check for token
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setDeleteReviewErrorMessage(
        "Kein Access Token gefunden. Bitte zuerst einloggen."
      );
      setHasToken(false);
      return;
    }

    setIsDeletingReview(true);

    try {
      // Send DELETE request
      const response = await fetch(
        `${getBackendBaseUrl()}/gyms/${encodeURIComponent(
          gymId
        )}/reviews/${encodeURIComponent(reviewToDelete)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Success
        setDeleteReviewSuccess(true);
        setDeleteReviewErrorMessage(null);

        // Refresh gym details to update the gym object (including reviews)
        await fetchGymDetails(gymId);

        // Refresh sorted reviews list if using sorted reviews
        if (useSortedReviews) {
          await fetchSortedReviews();
        }

        // Close modal after delay
        setTimeout(() => {
          closeDeleteReviewModal();
        }, 1500);
      } else {
        // Error
        setDeleteReviewSuccess(false);
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          setDeleteReviewErrorMessage(
            errorData.message ||
              errorData.error ||
              `Fehler beim Löschen: ${response.statusText}`
          );
        } catch {
          setDeleteReviewErrorMessage(
            `Fehler beim Löschen: ${response.statusText}`
          );
        }
      }
    } catch (error) {
      setDeleteReviewSuccess(false);
      setDeleteReviewErrorMessage(
        error instanceof Error
          ? `Netzwerkfehler: ${error.message}`
          : "Unbekannter Fehler beim Löschen"
      );
    } finally {
      setIsDeletingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-7xl mx-auto px-8 py-16">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/"
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
            Back to All Gyms
          </Link>
        </div>

        {/* Loading state */}
        {isLoadingGym && (
          <div className="text-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading gym details...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoadingGym && (
          <div className="text-center py-12">
            <div className="inline-block bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                {error}
              </p>
              <button
                onClick={() => fetchGymDetails(gymId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Gym details */}
        {!isLoadingGym && !error && gym && (
          <>
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-8">
              {/* Gym image */}
              <div className="w-full h-96 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                {imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt={gym.name || "Gym"}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-24 h-24 mx-auto text-zinc-400 dark:text-zinc-600"
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
                      <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-2">
                        No Image
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Gym information */}
              <div className="p-6">
                {/* Name */}
                <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-4">
                  {gym.name}
                </h1>

                {/* Type */}
                <div className="mb-4">
                  <p className="text-lg text-zinc-600 dark:text-zinc-400">
                    {gym.gymType}
                  </p>
                </div>

                {/* Contact information */}
                {gym.contactInformation && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Contact:
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {gym.contactInformation}
                    </p>
                  </div>
                )}

                {/* Full address */}
                {gym.address && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Address:
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {gym.address.streetName} {gym.address.streetNumber}
                      {gym.address.unit && `, ${gym.address.unit}`}
                      <br />
                      {gym.address.city}, {gym.address.state}{" "}
                      {gym.address.postalCode}
                      <br />
                      {gym.address.country}
                    </p>
                  </div>
                )}

                {/* Star rating */}
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(filledStars)].map((_, i) => (
                      <svg
                        key={`filled-${i}`}
                        className="w-6 h-6 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    {[...Array(emptyStars)].map((_, i) => (
                      <svg
                        key={`empty-${i}`}
                        className="w-6 h-6 text-zinc-300 dark:text-zinc-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {gym.averageRating !== null &&
                      gym.averageRating !== undefined && (
                        <span className="text-lg text-zinc-600 dark:text-zinc-400">
                          {gym.averageRating.toFixed(1)} / 5.0
                        </span>
                      )}
                    {gym.totalReviews !== null &&
                      gym.totalReviews !== undefined && (
                        <span className="text-sm text-zinc-500 dark:text-zinc-500">
                          ({gym.totalReviews}{" "}
                          {gym.totalReviews === 1 ? "review" : "reviews"})
                        </span>
                      )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-4">
                  {hasToken && (
                    <>
                      <button
                        onClick={openEditModal}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Update Gym
                      </button>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Delete Gym
                      </button>
                    </>
                  )}
                  {hasToken && (
                    <Link
                      href={`/gyms/${gymId}/reviews/create`}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Write a Review
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Nearby gyms section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-black dark:text-zinc-50 mb-6">
                Gyms Nearby
              </h2>

              {isLoadingNearby && (
                <div className="text-center py-8">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Loading nearby gyms...
                  </p>
                </div>
              )}

              {!isLoadingNearby && nearbyGyms.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No nearby gyms found.
                  </p>
                </div>
              )}

              {!isLoadingNearby && nearbyGyms.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {nearbyGyms.map((nearbyGym) => (
                    <GymCard key={nearbyGym.id} gym={nearbyGym} />
                  ))}
                </div>
              )}
            </div>

            {/* Reviews section */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black dark:text-zinc-50">
                  Reviews
                </h2>
                {/* Sort buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSortBy("datePosted");
                      setSortDirection("desc");
                      setReviewsPage(0);
                      setUseSortedReviews(true);
                      fetchSortedReviews("datePosted", "desc", 0);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      useSortedReviews &&
                      sortBy === "datePosted" &&
                      sortDirection === "desc"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("rating");
                      setSortDirection("desc");
                      setReviewsPage(0);
                      setUseSortedReviews(true);
                      fetchSortedReviews("rating", "desc", 0);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      useSortedReviews &&
                      sortBy === "rating" &&
                      sortDirection === "desc"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    Highest Rating
                  </button>
                </div>
              </div>

              {/* Loading state */}
              {isLoadingReviews && (
                <div className="text-center py-8">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Loading reviews...
                  </p>
                </div>
              )}

              {/* Error state */}
              {reviewsError && (
                <div className="text-center py-8">
                  <div className="inline-block bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      {reviewsError}
                    </p>
                    <button
                      onClick={() => fetchSortedReviews()}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews display */}
              {!isLoadingReviews && !reviewsError && (
                <>
                  {useSortedReviews ? (
                    // Display sorted reviews
                    !sortedReviews || sortedReviews.content.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-zinc-600 dark:text-zinc-400">
                          No reviews yet.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sortedReviews.content.map((review) => (
                            <ReviewCard
                              key={review.id || Math.random()}
                              review={review}
                              gymId={gymId}
                              onDeleteClick={openDeleteReviewModal}
                            />
                          ))}
                        </div>
                        {/* Pagination */}
                        {sortedReviews.totalPages > 1 && (
                          <div className="mt-8 flex justify-center gap-2">
                            {Array.from(
                              { length: sortedReviews.totalPages },
                              (_, i) => i
                            ).map((pageNum) => (
                              <button
                                key={pageNum}
                                onClick={() => {
                                  setReviewsPage(pageNum);
                                  fetchSortedReviews(
                                    undefined,
                                    undefined,
                                    pageNum
                                  );
                                }}
                                disabled={isLoadingReviews}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                  pageNum === sortedReviews.number
                                    ? "bg-blue-600 text-white"
                                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700"
                                } ${
                                  isLoadingReviews
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                              >
                                {pageNum + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  ) : // Display reviews from gym object
                  !gym.reviews || gym.reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-zinc-600 dark:text-zinc-400">
                        No reviews yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gym.reviews.map((review) => (
                        <ReviewCard
                          key={review.id || Math.random()}
                          review={review}
                          gymId={gymId}
                          onDeleteClick={openDeleteReviewModal}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Edit Gym Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black dark:text-zinc-50">
                  Gym aktualisieren
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>
              </div>

              <form onSubmit={handleUpdateGym} className="p-6 space-y-8">
                {/* Basic Information Section */}
                <section>
                  <h3 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                    Grundinformationen
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          clearFieldError("name");
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                          editErrors.name
                            ? "border-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      />
                      {editErrors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Gym Typ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editGymType}
                        onChange={(e) => {
                          setEditGymType(e.target.value);
                          clearFieldError("gymType");
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                          editErrors.gymType
                            ? "border-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      />
                      {editErrors.gymType && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.gymType}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Kontaktinformationen{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editContactInformation}
                        onChange={(e) => {
                          setEditContactInformation(e.target.value);
                          clearFieldError("contactInformation");
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                          editErrors.contactInformation
                            ? "border-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      />
                      {editErrors.contactInformation && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.contactInformation}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Address Section */}
                <section>
                  <h3 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                    Adresse
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Hausnummer <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editStreetNumber}
                        onChange={(e) => {
                          setEditStreetNumber(e.target.value);
                          clearFieldError("streetNumber");
                        }}
                        placeholder="z.B. 123 oder 45A"
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                          editErrors.streetNumber
                            ? "border-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      />
                      {editErrors.streetNumber && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.streetNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Straßenname <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editStreetName}
                        onChange={(e) => {
                          setEditStreetName(e.target.value);
                          clearFieldError("streetName");
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                          editErrors.streetName
                            ? "border-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      />
                      {editErrors.streetName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.streetName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Einheit (optional)
                      </label>
                      <input
                        type="text"
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        placeholder="z.B. Apt 4B"
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Stadt <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => {
                          setEditCity(e.target.value);
                          clearFieldError("city");
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                          editErrors.city
                            ? "border-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      />
                      {editErrors.city && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Bundesland/Staat <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => {
                          setEditState(e.target.value);
                          clearFieldError("state");
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                          editErrors.state
                            ? "border-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      />
                      {editErrors.state && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Postleitzahl <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editPostalCode}
                        onChange={(e) => {
                          setEditPostalCode(e.target.value);
                          clearFieldError("postalCode");
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                          editErrors.postalCode
                            ? "border-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      />
                      {editErrors.postalCode && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.postalCode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                        Land <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editCountry}
                        onChange={(e) => {
                          setEditCountry(e.target.value);
                          clearFieldError("country");
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                          editErrors.country
                            ? "border-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      />
                      {editErrors.country && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editErrors.country}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Operating Hours Section */}
                <section>
                  <h3 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                    Öffnungszeiten
                  </h3>

                  {/* Template time inputs for copying to all days */}
                  <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-700">
                    <h4 className="text-sm font-medium mb-3 text-black dark:text-zinc-50">
                      Zeiten für alle Tage kopieren
                    </h4>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                          Öffnungszeit
                        </label>
                        <input
                          type="time"
                          value={templateOpenTime}
                          onChange={(e) => setTemplateOpenTime(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                          Schließzeit
                        </label>
                        <input
                          type="time"
                          value={templateCloseTime}
                          onChange={(e) => setTemplateCloseTime(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={copyTimesToAllDays}
                        disabled={!templateOpenTime || !templateCloseTime}
                        className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                          templateOpenTime && templateCloseTime
                            ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            : "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                        }`}
                      >
                        Auf alle Tage kopieren
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-black dark:text-zinc-50 capitalize">
                          {day === "monday" && "Montag"}
                          {day === "tuesday" && "Dienstag"}
                          {day === "wednesday" && "Mittwoch"}
                          {day === "thursday" && "Donnerstag"}
                          {day === "friday" && "Freitag"}
                          {day === "saturday" && "Samstag"}
                          {day === "sunday" && "Sonntag"}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                              Öffnungszeit
                            </label>
                            <input
                              type="time"
                              value={editOperatingHours[day].openTime}
                              onChange={(e) =>
                                updateOperatingHours(
                                  day,
                                  "openTime",
                                  e.target.value
                                )
                              }
                              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                                editErrors[`operatingHours.${day}.openTime`]
                                  ? "border-red-500"
                                  : "border-zinc-300 dark:border-zinc-700"
                              }`}
                            />
                            {editErrors[`operatingHours.${day}.openTime`] && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {editErrors[`operatingHours.${day}.openTime`]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                              Schließzeit
                            </label>
                            <input
                              type="time"
                              value={editOperatingHours[day].closeTime}
                              onChange={(e) =>
                                updateOperatingHours(
                                  day,
                                  "closeTime",
                                  e.target.value
                                )
                              }
                              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                                editErrors[`operatingHours.${day}.closeTime`]
                                  ? "border-red-500"
                                  : "border-zinc-300 dark:border-zinc-700"
                              }`}
                            />
                            {editErrors[`operatingHours.${day}.closeTime`] && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {editErrors[`operatingHours.${day}.closeTime`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Photos Section */}
                <section>
                  <h3 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                    Fotos <span className="text-red-500">*</span>
                  </h3>
                  <div className="space-y-4">
                    {/* Existing photos */}
                    {existingPhotos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-black dark:text-zinc-50">
                          Vorhandene Fotos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {existingPhotos.map((photo) => (
                            <div
                              key={photo.id}
                              className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden"
                            >
                              <div className="relative">
                                <img
                                  src={`${getPhotosEndpoint()}/${photo.url}`}
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
                                  Entfernen
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
                        Neue Bilder hinzufügen:
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="block w-full text-sm text-zinc-500 dark:text-zinc-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          dark:file:bg-blue-900/20 dark:file:text-blue-300
                          dark:hover:file:bg-blue-900/30
                          cursor-pointer"
                      />
                    </div>

                    {/* New photo previews */}
                    {selectedFiles.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-black dark:text-zinc-50">
                          Neue Fotos
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
                                  Entfernen
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {editErrors.photoIds && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {editErrors.photoIds}
                      </p>
                    )}
                  </div>
                </section>

                {/* Success Message */}
                {updateSuccess && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-200">
                      ✅ Gym erfolgreich aktualisiert!
                    </h3>
                  </div>
                )}

                {/* Error Message */}
                {updateErrorMessage && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">
                      ❌ Fehler
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {updateErrorMessage}
                    </p>
                  </div>
                )}

                {/* Submit and Cancel Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!hasToken || isUpdating}
                    className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                      hasToken && !isUpdating
                        ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                        : "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    {isUpdating
                      ? "Fotos werden hochgeladen und Gym wird aktualisiert…"
                      : "Gym aktualisieren"}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-6 py-3 font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-zinc-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Gym Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-black dark:text-zinc-50 mb-4">
                  Gym löschen
                </h2>

                {!deleteSuccess ? (
                  <>
                    <div className="mb-6">
                      <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                        Sind Sie sicher, dass Sie dieses Gym löschen möchten?
                      </p>
                      {gym && (
                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                          "{gym.name}"
                        </p>
                      )}
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        Diese Aktion kann nicht rückgängig gemacht werden.
                      </p>
                    </div>

                    {/* Error Message */}
                    {deleteErrorMessage && (
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {deleteErrorMessage}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleDeleteGym}
                        disabled={isDeleting}
                        className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors ${
                          isDeleting
                            ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        }`}
                      >
                        {isDeleting ? "Wird gelöscht…" : "Ja, ich bin sicher"}
                      </button>
                      <button
                        onClick={closeDeleteModal}
                        disabled={isDeleting}
                        className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors ${
                          isDeleting
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                            : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-zinc-50 cursor-pointer"
                        }`}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Success Message */}
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                        ✅ Gym erfolgreich gelöscht!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Sie werden zur Startseite weitergeleitet…
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Review Confirmation Modal */}
        {isDeleteReviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-black dark:text-zinc-50 mb-4">
                  Review löschen
                </h2>

                {!deleteReviewSuccess ? (
                  <>
                    <div className="mb-6">
                      <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                        Sind Sie sicher, dass Sie dieses Review löschen möchten?
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        Diese Aktion kann nicht rückgängig gemacht werden.
                      </p>
                    </div>

                    {/* Error Message */}
                    {deleteReviewErrorMessage && (
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {deleteReviewErrorMessage}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleDeleteReview}
                        disabled={isDeletingReview}
                        className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors ${
                          isDeletingReview
                            ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        }`}
                      >
                        {isDeletingReview
                          ? "Wird gelöscht…"
                          : "Ja, ich bin sicher"}
                      </button>
                      <button
                        onClick={closeDeleteReviewModal}
                        disabled={isDeletingReview}
                        className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors ${
                          isDeletingReview
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                            : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-zinc-50 cursor-pointer"
                        }`}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Success Message */}
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                        ✅ Review erfolgreich gelöscht!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Das Review wird aktualisiert…
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
