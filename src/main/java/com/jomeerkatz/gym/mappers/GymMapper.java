package com.jomeerkatz.gym.mappers;

import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.dtos.GymDto;
import com.jomeerkatz.gym.domain.dtos.GeoPointDto;
import com.jomeerkatz.gym.domain.dtos.GymCreateUpdateRequestDto;
import com.jomeerkatz.gym.domain.dtos.GymSummaryDto;
import com.jomeerkatz.gym.domain.entities.Gym;
import com.jomeerkatz.gym.domain.entities.Review;
import org.mapstruct.*;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GymMapper {

    GymCreateUpdateRequest toGymCreateUpdateRequest(GymCreateUpdateRequestDto dto);

    @Mapping(source = "reviews", target = "totalReviews", qualifiedByName = "populateTotalReviews")
    GymDto toGymDto(Gym gym);

    @Mapping(source = "reviews", target = "totalReviews", qualifiedByName = "populateTotalReviews")
    GymSummaryDto toSummaryDto(Gym gym);

    @Named("populateTotalReviews")
    default Integer populateTotalReviews(List<Review> reviewList){
        return reviewList.size();
    }
}
