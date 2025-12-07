package com.jomeerkatz.gym.services;

import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.entities.Gym;

public interface GymService {
    Gym createGym(GymCreateUpdateRequest request);
}
