package com.jomeerkatz.gym.services;

import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.entities.Gym;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
}
