package com.jomeerkatz.gym.controllers;

import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.dtos.GymCreateUpdateRequestDto;
import com.jomeerkatz.gym.domain.dtos.GymDto;
import com.jomeerkatz.gym.domain.entities.Gym;
import com.jomeerkatz.gym.mappers.GymMapper;
import com.jomeerkatz.gym.services.GymService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/gyms")
@RequiredArgsConstructor // only works with final variables
public class GymController {
    private final GymService gymService;
    private final GymMapper gymMapper;

    @PostMapping
    public ResponseEntity<GymDto> createGym(@Valid @RequestBody GymCreateUpdateRequestDto gymCreateUpdateRequestDto) {
        GymCreateUpdateRequest gymCreateUpdateRequest = gymMapper.toGymCreateUpdateRequest(gymCreateUpdateRequestDto);
        Gym savedGym = gymService.createGym(gymCreateUpdateRequest);
        GymDto savedGymDto = gymMapper.toGymDto(savedGym);
        return ResponseEntity.ok(savedGymDto);
    }
}
