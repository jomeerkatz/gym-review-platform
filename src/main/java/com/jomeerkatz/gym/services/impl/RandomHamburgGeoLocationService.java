package com.jomeerkatz.gym.services.impl;

import com.jomeerkatz.gym.domain.GeoLocation;
import com.jomeerkatz.gym.domain.entities.Address;
import com.jomeerkatz.gym.services.GeoLocationService;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class RandomHamburgGeoLocationService implements GeoLocationService {
    private static final float MIN_LAT = 53.4f;
    private static final float MAX_LAT = 53.7f;

    private static final float MIN_LON = 9.7f;
    private static final float MAX_LON = 10.3f;

    @Override
    public GeoLocation geoLocate(Address address) {
        Random random = new Random();
        double lat = MIN_LAT + random.nextDouble() * (MAX_LAT-MIN_LAT);
        double lon = MIN_LON + random.nextDouble() * (MAX_LON-MIN_LON);
        return GeoLocation.builder().latitude(lat).longitute(lon)
                .build();
    }
}

