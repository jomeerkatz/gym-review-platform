"use client";

/**
 * Gym Creation Page
 *
 * This page allows users to create a new gym by filling out a comprehensive form.
 * The form includes basic information, address, operating hours, and photo uploads.
 * Users can upload photos which are sent to the backend, and the returned photo IDs
 * are then included when creating the gym. All data is validated client-side and then
 * submitted to the backend API with Bearer token authentication.
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  GymCreateUpdateRequestDto,
  AddressDto,
  OperatingHoursDto,
  TimeRangeDto,
  GymDto,
} from "../../lib/types";

import { getBackendBaseUrl } from "../../lib/config";

// Backend configuration - Funktionen um sicherzustellen, dass Environment Variables zur Laufzeit geladen werden
function getCreateGymEndpoint(): string {
  return `${getBackendBaseUrl()}/gyms`;
}

function getUploadPhotoEndpoint(): string {
  return `${getBackendBaseUrl()}/photos`;
}
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

export default function CreateGymPage() {
  const router = useRouter();

  // Token state
  const [hasToken, setHasToken] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>("");
  const [gymType, setGymType] = useState<string>("");
  const [contactInformation, setContactInformation] = useState<string>("");

  // Address state
  const [streetNumber, setStreetNumber] = useState<string>("");
  const [streetName, setStreetName] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [country, setCountry] = useState<string>("");

  // Operating hours state
  const [operatingHours, setOperatingHours] = useState<
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
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [createdGym, setCreatedGym] = useState<GymDto | null>(null);

  /**
   * Check for token on component mount
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      setHasToken(!!token);
    }
  }, []);

  /**
   * Update operating hours for a specific day
   */
  const updateOperatingHours = (
    day: DayOfWeek,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
    // Clear error for this field
    if (errors[`operatingHours.${day}.${field}`]) {
      setErrors((prev) => {
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
    setOperatingHours(newOperatingHours);
    // Clear errors for operating hours
    setErrors((prev) => {
      const newErrors = { ...prev };
      DAYS_OF_WEEK.forEach((day) => {
        delete newErrors[`operatingHours.${day}.openTime`];
        delete newErrors[`operatingHours.${day}.closeTime`];
      });
      return newErrors;
    });
  };

  /**
   * Handle file selection for photos
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
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
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic information
    const nameError = validateField("name", name);
    if (nameError) newErrors.name = nameError;

    const gymTypeError = validateField("gymType", gymType);
    if (gymTypeError) newErrors.gymType = gymTypeError;

    const contactError = validateField(
      "contactInformation",
      contactInformation
    );
    if (contactError) newErrors.contactInformation = contactError;

    // Address
    const streetNumberError = validateField("streetNumber", streetNumber);
    if (streetNumberError) newErrors.streetNumber = streetNumberError;

    const streetNameError = validateField("streetName", streetName);
    if (streetNameError) newErrors.streetName = streetNameError;

    const cityError = validateField("city", city);
    if (cityError) newErrors.city = cityError;

    const stateError = validateField("state", state);
    if (stateError) newErrors.state = stateError;

    const postalCodeError = validateField("postalCode", postalCode);
    if (postalCodeError) newErrors.postalCode = postalCodeError;

    const countryError = validateField("country", country);
    if (countryError) newErrors.country = countryError;

    // Operating hours - validate each day
    DAYS_OF_WEEK.forEach((day) => {
      const dayHours = operatingHours[day];
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

    // Photos - must have at least one selected photo
    if (selectedFiles.length < 1) {
      newErrors.photoIds = "❌ at least one photos has to be there!";
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
    setStatusCode(null);
    setStatusText(null);
    setCreatedGym(null);

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
      // Build address object
      const address: AddressDto = {
        streetNumber: streetNumber.trim(),
        streetName: streetName.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      };
      if (unit && unit.trim() !== "") {
        address.unit = unit.trim();
      }

      // Build operating hours object (only include days with both times)
      const operatingHoursDto: OperatingHoursDto = {};
      DAYS_OF_WEEK.forEach((day) => {
        const dayHours = operatingHours[day];
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

      // Upload all photos first to get their IDs
      const validPhotoIds = await uploadAllPhotos();

      // Build request payload
      const payload: GymCreateUpdateRequestDto = {
        name: name.trim(),
        gymType: gymType.trim(),
        contactInformation: contactInformation.trim(),
        address,
        operatingHours: operatingHoursDto,
        photoIds: validPhotoIds,
      };

      // Send POST request
      const response = await fetch(getCreateGymEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Read status
      const status = response.status;
      const statusTextValue = response.statusText;
      setStatusCode(status);
      setStatusText(statusTextValue);

      // Read response body
      const responseText = await response.text();

      if (response.ok) {
        // Success
        try {
          const gymData: GymDto = JSON.parse(responseText);
          setCreatedGym(gymData);
          setIsSuccess(true);
          setErrorMessage(null);

          // Redirect to gym page after 1.5 seconds
          if (gymData.id) {
            setTimeout(() => {
              router.push(`/gyms/${gymData.id}`);
            }, 1500);
          }
        } catch (parseError) {
          setIsSuccess(true);
          setErrorMessage(
            "Gym successfully created, but response could not be parsed."
          );
        }
      } else {
        // Error
        setIsSuccess(false);
        try {
          const errorData = JSON.parse(responseText);
          setErrorMessage(
            errorData.message ||
              errorData.error ||
              `Error creating gym: ${statusTextValue}`
          );
        } catch {
          setErrorMessage(`Error creating gym: ${statusTextValue}`);
        }
      }
    } catch (error) {
      setIsSuccess(false);
      setErrorMessage(
        error instanceof Error
          ? `Network error: ${error.message}`
          : "Unknown error creating gym"
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
   * Fill all form fields with test data
   */
  const fillTestData = () => {
    // Basic information
    setName("FitZone Premium");
    setGymType("Fitnessstudio");
    setContactInformation("info@fitzone.de, +49 30 12345678");

    // Address
    setStreetNumber("42");
    setStreetName("Hauptstraße");
    setUnit("2. Stock");
    setCity("Berlin");
    setState("Berlin");
    setPostalCode("10115");
    setCountry("Deutschland");

    // Operating hours - set same hours for all days
    const testOpenTime = "06:00";
    const testCloseTime = "22:00";
    setOperatingHours({
      monday: { openTime: testOpenTime, closeTime: testCloseTime },
      tuesday: { openTime: testOpenTime, closeTime: testCloseTime },
      wednesday: { openTime: testOpenTime, closeTime: testCloseTime },
      thursday: { openTime: testOpenTime, closeTime: testCloseTime },
      friday: { openTime: testOpenTime, closeTime: testCloseTime },
      saturday: { openTime: testOpenTime, closeTime: testCloseTime },
      sunday: { openTime: testOpenTime, closeTime: testCloseTime },
    });

    // Template times
    setTemplateOpenTime(testOpenTime);
    setTemplateCloseTime(testCloseTime);

    // Clear all errors
    setErrors({});
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-4xl px-8 py-16">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
              Create Gym
            </h1>
            <button
              type="button"
              onClick={fillTestData}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              title="Fill all fields with test data"
            >
              🧪 Fill Test Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearFieldError("name");
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                      errors.name
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    Gym Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={gymType}
                    onChange={(e) => {
                      setGymType(e.target.value);
                      clearFieldError("gymType");
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                      errors.gymType
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {errors.gymType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.gymType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    Contact Information <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactInformation}
                    onChange={(e) => {
                      setContactInformation(e.target.value);
                      clearFieldError("contactInformation");
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                      errors.contactInformation
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {errors.contactInformation && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.contactInformation}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Address Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    Street Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={streetNumber}
                    onChange={(e) => {
                      setStreetNumber(e.target.value);
                      clearFieldError("streetNumber");
                    }}
                    placeholder="e.g. 123 or 45A"
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                      errors.streetNumber
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {errors.streetNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.streetNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    Street Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={streetName}
                    onChange={(e) => {
                      setStreetName(e.target.value);
                      clearFieldError("streetName");
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                      errors.streetName
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {errors.streetName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.streetName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    Unit (optional)
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. Apt 4B"
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      clearFieldError("city");
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                      errors.city
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    State/Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      clearFieldError("state");
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                      errors.state
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.state}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      clearFieldError("postalCode");
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                      errors.postalCode
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.postalCode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      clearFieldError("country");
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                      errors.country
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.country}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Operating Hours Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                Operating Hours
              </h2>

              {/* Template time inputs for copying to all days */}
              <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-700">
                <h3 className="text-sm font-medium mb-3 text-black dark:text-zinc-50">
                  Copy times to all days
                </h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                      Open Time
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
                      Close Time
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
                    Copy to all days
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-black dark:text-zinc-50 capitalize">
                      {day === "monday" && "Monday"}
                      {day === "tuesday" && "Tuesday"}
                      {day === "wednesday" && "Wednesday"}
                      {day === "thursday" && "Thursday"}
                      {day === "friday" && "Friday"}
                      {day === "saturday" && "Saturday"}
                      {day === "sunday" && "Sunday"}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                          Open Time
                        </label>
                        <input
                          type="time"
                          value={operatingHours[day].openTime}
                          onChange={(e) =>
                            updateOperatingHours(
                              day,
                              "openTime",
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                            errors[`operatingHours.${day}.openTime`]
                              ? "border-red-500"
                              : "border-zinc-300 dark:border-zinc-700"
                          }`}
                        />
                        {errors[`operatingHours.${day}.openTime`] && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors[`operatingHours.${day}.openTime`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                          Close Time
                        </label>
                        <input
                          type="time"
                          value={operatingHours[day].closeTime}
                          onChange={(e) =>
                            updateOperatingHours(
                              day,
                              "closeTime",
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 ${
                            errors[`operatingHours.${day}.closeTime`]
                              ? "border-red-500"
                              : "border-zinc-300 dark:border-zinc-700"
                          }`}
                        />
                        {errors[`operatingHours.${day}.closeTime`] && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors[`operatingHours.${day}.closeTime`]}
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
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                Photos <span className="text-red-500">*</span>
              </h2>
              <div className="space-y-4">
                {/* File input */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
                    Select images:
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

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!hasToken || isSubmitting}
                className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                  hasToken && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    : "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting
                  ? "Uploading photos and creating gym…"
                  : "Create Gym"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-3 font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Status Code Display */}
            {statusCode !== null && (
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-700">
                <p className="text-sm font-semibold text-black dark:text-zinc-50">
                  Status: {statusCode} {statusText}
                </p>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && createdGym && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-200">
                  ✅ Gym successfully created!
                </h3>
                {createdGym.id && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Gym ID: {createdGym.id}
                  </p>
                )}
                {createdGym.name && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Name: {createdGym.name}
                  </p>
                )}
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
          </form>

          {/* Back to Home Button */}
          <div className="mt-6">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
