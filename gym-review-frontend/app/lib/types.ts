/**
 * TypeScript types matching the backend DTOs
 */

export interface TimeRangeDto {
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
}

export interface OperatingHoursDto {
  monday?: TimeRangeDto;
  tuesday?: TimeRangeDto;
  wednesday?: TimeRangeDto;
  thursday?: TimeRangeDto;
  friday?: TimeRangeDto;
  saturday?: TimeRangeDto;
  sunday?: TimeRangeDto;
}

export interface AddressDto {
  streetNumber: string; // Pattern: ^[0-9]{1,5}[a-zA-Z]?$
  streetName: string;
  unit?: string; // Optional
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface GymCreateUpdateRequestDto {
  name: string;
  gymType: string;
  contactInformation: string;
  address: AddressDto;
  operatingHours: OperatingHoursDto;
  photoIds: string[]; // Min 1 item required
}

export interface GeoPointDto {
  lat: number; // Backend sends "lat", not "latitude"
  lon: number; // Backend sends "lon", not "longitude"
}

export interface ReviewDto {
  id?: string;
  content?: string;
  rating?: number;
  datePosted?: string; // LocalDateTime as ISO string
  lastEdited?: string; // LocalDateTime as ISO string, optional
  photos?: Photo[];
  writtenBy?: UserDto;
}

export interface ReviewCreateUpdateRequestDto {
  content: string;
  rating: number; // 1-5
  photoIds?: string[];
}

export interface UserDto {
  id?: string;
  username?: string;
  email?: string;
  // Add other fields as needed
}

export interface GymDto {
  id?: string;
  name?: string;
  gymType?: string;
  contactInformation?: string;
  averageRating?: number | null;
  totalReviews: number | null;
  geoLocation?: GeoPointDto | null;
  address?: AddressDto | null;
  operatingHours?: OperatingHoursDto;
  photos?: Photo[];
  reviews?: ReviewDto[];
  createdBy?: UserDto | null;
}

export interface Photo {
  url: string;
  uploadDate: string; // ISO date string
}

export interface GymSummaryDto {
  id: string;
  name: string;
  gymType: string;
  averageRating: number | null;
  totalReviews: number | null;
  address: AddressDto | null; // Backend sends "address", not "addressDto"
  photos: Photo[];
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // 0-based page number
  numberOfElements: number;
  first: boolean;
  last: boolean;
}
