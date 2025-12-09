package com.jomeerkatz.gym.services.impl;

import com.jomeerkatz.gym.domain.GeoLocation;
import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.entities.Address;
import com.jomeerkatz.gym.domain.entities.Gym;
import com.jomeerkatz.gym.domain.entities.Photo;
import com.jomeerkatz.gym.exceptions.GymNotFoundException;
import com.jomeerkatz.gym.repositories.GymRepository;
import com.jomeerkatz.gym.services.GeoLocationService;
import com.jomeerkatz.gym.services.GymService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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

    @Override
    // multiple arguments, all can be null - only pageable not
    public Page<Gym> searchGyms(String query, Float minRating, Float latitude, Float longitude, Float radius, Pageable pageable) {
        if (null != minRating && (null == query || query.isEmpty())) {
            return gymRepository.findByAverageRatingGreaterThanEqual(minRating, pageable);
        }

        Float searchMinRating = minRating == null ? 0f : minRating;

        if (null != query && !query.trim().isEmpty()) {
            return gymRepository.findByQueryAndMinRating(query, searchMinRating, pageable);
        }

        if (null != latitude && null != longitude && null != radius) {
            return gymRepository.findByLocationNear(latitude, longitude, radius, pageable);
        }

        return gymRepository.findAll(pageable);
    }

    @Override
    public Optional<Gym> getGym(String id) {
        return gymRepository.findById(id);
    }

    @Override
    public void deleteGym(String id) {
        gymRepository.deleteById(id);
    public Gym updateGym(String id, GymCreateUpdateRequest request) {
        Gym gym = getGym(id).orElseThrow(() -> new GymNotFoundException("gym doesn't exists with id " + id));

        GeoLocation geoLocation = geoLocationService.geoLocate(request.getAddress());

        GeoPoint geoPoint = new GeoPoint(geoLocation.getLatitude(), geoLocation.getLongitute());

        List<String> photoIds = request.getPhotoIds();

        List<Photo> photos = photoIds.stream().map(currentPhoto -> Photo.builder()
                .url(currentPhoto)
                .uploadDate(LocalDateTime.now())
                .build()
        ).toList();

        gym.setName(request.getName());
        gym.setGymType(request.getGymType());
        gym.setContactInformation(request.getContactInformation());
        gym.setAddress(request.getAddress());
        gym.setGeoLocation(geoPoint);
        gym.setOperatingHours(request.getOperatingHours());
        gym.setPhotos(photos);

        return gymRepository.save(gym);
    }
}
