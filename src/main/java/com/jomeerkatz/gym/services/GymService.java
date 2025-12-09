package com.jomeerkatz.gym.services;

import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.entities.Gym;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface GymService {
    Gym createGym(GymCreateUpdateRequest request);

    Page<Gym> searchGyms(
            String query,
            Float minRating,
            Float latitude,
            Float longitude,
            Float radius,
            Pageable pageable
    );

    Optional<Gym> getGym(String id);

    Gym updateGym(String id, GymCreateUpdateRequest gymCreateUpdateRequest);
}
