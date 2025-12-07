package com.jomeerkatz.gym.domain.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GymCreateUpdateRequestDto {
    @NotBlank(message = "❌ gym name can't be blanked!")
    private String name;
    @NotBlank(message = "❌ gym type can't be blanked!")
    private String gymType;
    @NotBlank(message = "❌ contact information can't be blanked!")
    private String contactInformation;
    @Valid
    private AddressDto address;
    @Valid
    private OperatingHoursDto operatingHours;
    @Size(min = 1, message = "❌ at least one photos has to be there!")
    private List<String> photoIds;
}
