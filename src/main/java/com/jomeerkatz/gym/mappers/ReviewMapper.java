package com.jomeerkatz.gym.mappers;

import com.jomeerkatz.gym.domain.ReviewUpdateCreateRequest;
import com.jomeerkatz.gym.domain.dtos.ReviewCreateUpdateRequestDto;
import com.jomeerkatz.gym.domain.dtos.ReviewDto;
import com.jomeerkatz.gym.domain.entities.Review;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ReviewMapper {
    ReviewUpdateCreateRequest toReviewUpdateCreate(ReviewCreateUpdateRequestDto reviewCreateUpdateRequestDto);

    ReviewDto toDto(Review review);
}
