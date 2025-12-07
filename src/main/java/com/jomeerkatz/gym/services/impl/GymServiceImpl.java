package com.jomeerkatz.gym.services.impl;

import com.jomeerkatz.gym.domain.GeoLocation;
import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.entities.Address;
import com.jomeerkatz.gym.domain.entities.Gym;
import com.jomeerkatz.gym.domain.entities.Photo;
import com.jomeerkatz.gym.repositories.GymRepository;
import com.jomeerkatz.gym.services.GeoLocationService;
import com.jomeerkatz.gym.services.GymService;
import lombok.AllArgsConstructor;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
public class GymServiceImpl implements GymService {
    private final GymRepository gymRepository;
    private final GeoLocationService geoLocationService;

    @Override
    public Gym createGym(GymCreateUpdateRequest request) {
        Address address = request.getAddress();
        GeoLocation geoLocation = geoLocationService.geoLocate(address); // random location in hamburg
        GeoPoint geoPoint = new GeoPoint(geoLocation.getLatitude(), geoLocation.getLongitute());
        List<String> photos = request.getPhotoIds();
        List<Photo> photoList = photos.stream().map(currentPhoto ->
                Photo.builder().url(currentPhoto).uploadDate(LocalDateTime.now()).build()).toList();

        Gym gym = Gym.builder()
                .address(address)
                .name(request.getName())
                .contactInformation(request.getContactInformation())
                .geoLocation(geoPoint)
                .gymType(request.getGymType())
                .operatingHours(request.getOperatingHours())
                .averageRating(0F)
                .photos(photoList)
                .build();

        return gymRepository.save(gym);
    }
}
