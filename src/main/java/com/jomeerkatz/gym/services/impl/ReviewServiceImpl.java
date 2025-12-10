package com.jomeerkatz.gym.services.impl;

import com.jomeerkatz.gym.domain.ReviewUpdateCreateRequest;
import com.jomeerkatz.gym.domain.entities.*;
import com.jomeerkatz.gym.exceptions.GymNotFoundException;
import com.jomeerkatz.gym.exceptions.ReviewNotAllowedException;
import com.jomeerkatz.gym.repositories.GymRepository;
import com.jomeerkatz.gym.services.ReviewService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final GymRepository gymRepository;

    @Override
    public Review createReview(User author, String gymId, ReviewUpdateCreateRequest reviewUpdateCreateRequest) {
        LocalDateTime now = LocalDateTime.now();
        Gym gym = getGymOrThrow(gymId);

        boolean authorHasWrittenReview = gym.getReviews().stream().anyMatch(
                currentReview -> currentReview.getWrittenBy().getId().equals(author.getId()));

        if (authorHasWrittenReview) {
            throw new ReviewNotAllowedException("author with id " + author.getId() + " already wrote a review!");
        }

        List<Photo> photos = reviewUpdateCreateRequest.getPhotoIds().stream().map(url ->
                Photo.builder()
                        .url(url)
                        .uploadDate(now)
                        .build()).toList();

        String uuid = UUID.randomUUID().toString();
        Review review = Review.builder()
                .id(uuid)
                .content(reviewUpdateCreateRequest.getContent())
                .datePosted(now)
                .rating(reviewUpdateCreateRequest.getRating())
                .photos(photos)
                .lastEdited(now)
                .writtenBy(author)
                .build();

        gym.getReviews().add(review);

        updateAverageGymRating(gym);

        Gym savedGym = gymRepository.save(gym);

        return savedGym
                .getReviews()
                .stream()
                .filter(a -> uuid.equals(a.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("error retrieving created review"));
    }

    private void updateAverageGymRating(Gym gym) {
        List<Review> reviews = gym.getReviews();

        if (reviews.isEmpty()) {
            gym.setAverageRating(0.0F);
        } else {
            double averageRating = reviews
                    .stream()
                    .mapToDouble(Review::getRating)
                    .average()
                    .orElse(0.0);
            gym.setAverageRating((float) averageRating);
        }
    }

    @Override
    public Page<Review> listReviews(String id, Pageable pageable) {
        // Load the gym or fail fast if the ID is invalid
        Gym gym = getGymOrThrow(id);

        // Work on a mutable list copy of the gym's reviews
        List<Review> reviews = gym.getReviews();

        // Extract sort information from the pageable (may be unsorted)
        Sort sort = pageable.getSort();

        if (sort.isSorted()) {
            // We currently only honor the first sort order coming from the client
            Sort.Order order = sort.iterator().next(); // e.g. ?sort=rating,asc

            // Field name to sort by, e.g. "datePosted" or "rating"
            String property = order.getProperty();

            // Requested direction, true = ASC, false = DESC
            boolean isAscending = order.getDirection().isAscending();

            // Map the requested property to a concrete comparison strategy
            Comparator<Review> comparator = switch (property) {
                case "datePosted" -> Comparator.comparing(Review::getDatePosted);
                case "rating" -> Comparator.comparing(Review::getRating);
                // Fallback: sort by newest first if the client sends an unknown property
                default -> Comparator.comparing(Review::getDatePosted);
            };

            // Apply direction: ASC uses the comparator as-is, DESC reverses it
            reviews.sort(isAscending ? comparator : comparator.reversed());
        } else {
            // Default sort: newest reviews first when no sort parameter is provided
            reviews.sort(Comparator.comparing(Review::getDatePosted).reversed());
        }

        // Calculate index of the first element for the requested page (0-based offset)
        int start = (int) pageable.getOffset();

        // If the requested page starts beyond the available data,
        // return an empty page but keep pagination metadata consistent
        if (start >= reviews.size()) {
            return new PageImpl<>(Collections.emptyList(), pageable, reviews.size());
        }

        // Calculate the end index, ensuring we don't read past the list size
        int end = Math.min(start + pageable.getPageSize(), reviews.size());

        // Create a Page slice backed by the sorted sublist and the original pageable + total count
        return new PageImpl<>(reviews.subList(start, end), pageable, reviews.size());
    }

    private Gym getGymOrThrow(String gymId) {
        return gymRepository.findById(gymId).orElseThrow(
                () -> new GymNotFoundException("gym could not found with id:" + gymId));
    }

    @Override
    public Optional<Review> getReview(String gymId, String reviewId) {
        Gym gym = getGymOrThrow(gymId);
        List<Review> reviews = gym.getReviews();
        return getReviewFromGym(reviewId, gym);
    }

    private static Optional<Review> getReviewFromGym(String reviewId, Gym gym) {
        return gym.getReviews().stream().filter(currentReview -> currentReview.getId().equals(reviewId)).findFirst();
    }

    @Override
    public Review updateReview(User user, String gymId, String reviewId, ReviewUpdateCreateRequest updatedReview) {
        Gym gym = getGymOrThrow(gymId);
        String userId = user.getId();
        Review toUpdatedReview = getReviewFromGym(reviewId, gym)
                .orElseThrow(() ->
                        new ReviewNotAllowedException("review does't exist with the id: " + reviewId));

        if (!userId.equals(toUpdatedReview.getWrittenBy().getId())) {
            throw new ReviewNotAllowedException("User can not edit another User's review!");
        }

        if (LocalDateTime.now().isAfter(toUpdatedReview.getLastEdited().plusHours(24))) {
            throw new ReviewNotAllowedException("User can not edit review after 48 hours!");
        }

        toUpdatedReview.setContent(updatedReview.getContent());
        toUpdatedReview.setRating(updatedReview.getRating());
        toUpdatedReview.setLastEdited(LocalDateTime.now());

        toUpdatedReview.setPhotos(
                updatedReview.getPhotoIds()
                        .stream()
                        .map(currentPhotoUrl -> Photo.builder()
                                .url(currentPhotoUrl)
                                .uploadDate(LocalDateTime.now())
                                .build()).toList());

        updateAverageGymRating(gym);

        List<Review> reviewsFromDiffUsern = gym.getReviews() // go through all reviews and find the right one to update
                .stream()
                .filter(currentReview ->
                        !reviewId.equals(currentReview.getId())).collect(Collectors.toList());

        reviewsFromDiffUsern.add(toUpdatedReview);

        gym.setReviews(reviewsFromDiffUsern);

        gymRepository.save(gym);

        return toUpdatedReview;
    }
}