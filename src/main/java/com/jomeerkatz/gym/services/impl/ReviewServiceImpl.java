package com.jomeerkatz.gym.services.impl;

import com.jomeerkatz.gym.domain.ReviewUpdateCreateRequest;
import com.jomeerkatz.gym.domain.entities.*;
import com.jomeerkatz.gym.exceptions.GymNotFoundException;
import com.jomeerkatz.gym.exceptions.ReviewNotAllowedException;
import com.jomeerkatz.gym.repositories.GymRepository;
import com.jomeerkatz.gym.services.ReviewService;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.GeoPointField;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final GymRepository gymRepository;

    @Override
    public Review createReview(User author, String gymId, ReviewUpdateCreateRequest reviewUpdateCreateRequest) {
        LocalDateTime now = LocalDateTime.now();
        Gym gym = gymRepository
                .findById(gymId)
                .orElseThrow(() -> new GymNotFoundException("gym could not found with id:" + gymId));

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

        // todo: also update the count of review
        // todo: when deleting a review, we have to handle the case to edit the count of review (-1)

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
}