package com.jomeerkatz.gym.services;

import com.jomeerkatz.gym.domain.ReviewUpdateCreateRequest;
import com.jomeerkatz.gym.domain.entities.Review;
import com.jomeerkatz.gym.domain.entities.User;

public interface ReviewService {
    Review createReview(User author, String gymId, ReviewUpdateCreateRequest review);
}
