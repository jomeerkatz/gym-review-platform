package com.jomeerkatz.gym.domain;

import com.jomeerkatz.gym.domain.entities.Address;
import com.jomeerkatz.gym.domain.entities.OperatingHours;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GymCreateUpdateRequest {
    private String name;
    private String gymType;
    private String contactInformation;
    private Address address;
    private OperatingHours operatingHours;
    private List<String> photoIds;

}
