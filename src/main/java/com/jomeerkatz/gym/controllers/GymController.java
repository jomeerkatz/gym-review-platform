package com.jomeerkatz.gym.controllers;

import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.dtos.GymCreateUpdateRequestDto;
import com.jomeerkatz.gym.domain.dtos.GymDto;
import com.jomeerkatz.gym.domain.dtos.GymSummaryDto;
import com.jomeerkatz.gym.domain.entities.Gym;
import com.jomeerkatz.gym.mappers.GymMapper;
import com.jomeerkatz.gym.services.GymService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

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

    @GetMapping
    public Page<GymSummaryDto> searchGyms(
            @RequestParam(required = false) String query, // can be null which is OK!, that's why param is optional!
            @RequestParam(required = false) Float minRating,
            @RequestParam(required = false) Float latitude,
            @RequestParam(required = false) Float longitude,
            @RequestParam(required = false) Float radius,
            @RequestParam(defaultValue = "1") int page, // actually starting at index  0, so we need to get sure to
            // implement it right in frontend
            @RequestParam(defaultValue = "20") int size
    ) {
        System.out.println("🔎 searchGyms called with:");
        System.out.println("   latitude = " + latitude);
        System.out.println("   longitude = " + longitude);
        System.out.println("   radius = " + radius);
        Page<Gym> searchResult = gymService.searchGyms(query, minRating, latitude, longitude, radius, PageRequest.of(page - 1, size));
        return searchResult.map(gymMapper::toSummaryDto);
    }

    @GetMapping("/{gym_id}")
    public ResponseEntity<GymDto> getGym(@PathVariable("gym_id") String gymId) {
        return gymService.getGym(gymId)
                .map(gym -> ResponseEntity.ok(gymMapper.toGymDto(gym)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
