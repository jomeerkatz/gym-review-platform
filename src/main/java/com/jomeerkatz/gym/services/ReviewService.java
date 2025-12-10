package com.jomeerkatz.gym.services;

import com.jomeerkatz.gym.domain.ReviewUpdateCreateRequest;
import com.jomeerkatz.gym.domain.dtos.ReviewCreateUpdateRequestDto;
import com.jomeerkatz.gym.domain.entities.Review;
import com.jomeerkatz.gym.domain.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ReviewService {
    Review createReview(User author, String gymId, ReviewUpdateCreateRequest review);
    Page<Review> listReviews(String id, Pageable pageable);
    Optional<Review> getReview(String gymId, String reviewId);
    Review updateReview(User author, String gymId, String reviewId, ReviewUpdateCreateRequest review);
}
