package com.jomeerkatz.gym.mappers;

import com.jomeerkatz.gym.domain.dtos.PhotoDto;
import com.jomeerkatz.gym.domain.entities.Photo;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

// componentModel defines which DI framework manages the mapper (Spring in this case)
// unmappedTargetPolicy controls how MapStruct handles unmapped target fields (IGNORE = no warnings)
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PhotoMapper {
    PhotoDto toDto(Photo photo);
}


