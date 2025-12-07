package com.jomeerkatz.gym.domain.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {

    @NotBlank(message = "❌ street number can't be blanked!")
    @Pattern(regexp = "^[0-9]{1,5}[a-zA-Z]?$", message = "❌ invalid street number format!")
    private String streetNumber;

    @NotBlank(message = "❌ street name can't be blanked!")
    private String streetName;

    private String unit;

    @NotBlank(message = "❌ street city can't be blanked!")
    private String city;

    @NotBlank(message = "❌ state can't be blanked!")
    private String state;

    @NotBlank(message = "❌ postel code can't be blanked!")
    private String postalCode;

    @NotBlank(message = "❌ country can't be blanked!")
    private String country;
}
