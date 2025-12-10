package com.jomeerkatz.gym.controllers;

import com.jomeerkatz.gym.domain.ReviewUpdateCreateRequest;
import com.jomeerkatz.gym.domain.dtos.ReviewCreateUpdateRequestDto;
import com.jomeerkatz.gym.domain.dtos.ReviewDto;
import com.jomeerkatz.gym.domain.entities.Review;
import com.jomeerkatz.gym.domain.entities.User;
import com.jomeerkatz.gym.mappers.ReviewMapper;
import com.jomeerkatz.gym.services.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping( path = "/api/gyms/{gym_id}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewMapper reviewMapper;
    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewDto> createReview(
            @PathVariable("gym_id") String gym_id,
            @Valid @RequestBody ReviewCreateUpdateRequestDto review,
            @AuthenticationPrincipal Jwt jwt // JasonWebToken
    ) {
        ReviewUpdateCreateRequest reviewUpdateCreate = reviewMapper.toReviewUpdateCreate(review);

        User user = jwtToUser(jwt);

        Review createdReview = reviewService.createReview(user, gym_id, reviewUpdateCreate);

        return ResponseEntity.ok(reviewMapper.toDto(createdReview));
    }

    private User jwtToUser(Jwt jwt){
        return User.builder()
                .id(jwt.getSubject())
                .username(jwt.getClaimAsString("preferred_username"))
                .givenName(jwt.getClaimAsString("given_name"))
                .familyName(jwt.getClaimAsString("family_name"))
                .build();
    }
}
