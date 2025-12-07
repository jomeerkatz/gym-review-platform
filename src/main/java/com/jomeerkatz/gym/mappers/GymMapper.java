package com.jomeerkatz.gym.mappers;

import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.dtos.GymDto;
import com.jomeerkatz.gym.domain.dtos.GeoPointDto;
import com.jomeerkatz.gym.domain.dtos.GymCreateUpdateRequestDto;
import com.jomeerkatz.gym.domain.entities.Gym;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GymMapper {
    GymCreateUpdateRequest toGymCreateUpdateRequest(GymCreateUpdateRequestDto dto);
    GymDto toGymDto(Gym gym);

    // "Run this exact Java code to compute the value for this field"
    @Mapping(target = "latitude", expression = "java(geoPoint.getLat())")
    @Mapping(target = "longitude", expression = "java(geoPoint.getLon())")
    GeoPointDto toGeoPointDto(GeoPoint geoPoint);
}
