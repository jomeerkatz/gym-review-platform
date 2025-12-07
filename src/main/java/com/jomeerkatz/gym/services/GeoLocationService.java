package com.jomeerkatz.gym.services;

import com.jomeerkatz.gym.domain.GeoLocation;
import com.jomeerkatz.gym.domain.entities.Address;

public interface GeoLocationService {
    GeoLocation geoLocate(Address address);
}
