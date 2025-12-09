package com.jomeerkatz.gym.manual;

import com.jomeerkatz.gym.domain.GymCreateUpdateRequest;
import com.jomeerkatz.gym.domain.entities.Address;
import com.jomeerkatz.gym.domain.entities.OperatingHours;
import com.jomeerkatz.gym.domain.entities.Photo;
import com.jomeerkatz.gym.domain.entities.TimeRange;
import com.jomeerkatz.gym.services.GymService;
import com.jomeerkatz.gym.services.PhotoService;
import com.jomeerkatz.gym.services.impl.RandomHamburgGeoLocationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.Rollback;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@SpringBootTest
public class GymDataLoaderTest {

    @Autowired
    private GymService gymService;

    @Autowired
    private RandomHamburgGeoLocationService geoLocationService;

    @Autowired
    private PhotoService photoService;

    @Autowired
    private ResourceLoader resourceLoader;

    @Test
    @Rollback(false) // Allow changes to persist
    public void createSampleGyms() throws Exception {
        List<GymCreateUpdateRequest> gyms = createGymData();
        gyms.forEach(gym -> {
            String fileName = gym.getPhotoIds().getFirst();
            Resource resource = resourceLoader.getResource("classpath:testdata/" + fileName);
            MultipartFile multipartFile = null;
            try {
                multipartFile = new MockMultipartFile(
                        "file", // parameter name
                        fileName, // original filename
                        MediaType.IMAGE_JPEG_VALUE,
                        resource.getInputStream()
                );
            } catch (IOException e) {
                throw new RuntimeException(e);
            }


            // Call the service method
            Photo uploadedPhoto = photoService.uploadFile(multipartFile);

            gym.setPhotoIds(List.of(uploadedPhoto.getUrl()));

            gymService.createGym(gym);

            System.out.println("Created gym: " + gym.getName());
        });
    }

    private List<GymCreateUpdateRequest> createGymData() {
        return Arrays.asList(
                createGym(
                        "Iron Forge Fitness",
                        "Fitnessstudio",
                        "+49 40 1234567",
                        createAddress("12", "Reeperbahn", null, "Hamburg", "Hamburg", "20359", "Germany"),
                        createStandardOperatingHours("06:00", "23:00", "08:00", "22:00"),
                        "image1.jpg"
                ),
                createGym(
                        "Elb CrossFit Center",
                        "CrossFit",
                        "+49 40 2345678",
                        createAddress("54", "Stresemannstraße", null, "Hamburg", "Hamburg", "22769", "Germany"),
                        createStandardOperatingHours("06:00", "22:00", "09:00", "20:00"),
                        "image2.jpg"
                ),
                createGym(
                        "Hammer & Steel Boxing Club",
                        "Boxing",
                        "+49 40 3456789",
                        createAddress("27", "Schulterblatt", null, "Hamburg", "Hamburg", "20357", "Germany"),
                        createStandardOperatingHours("10:00", "22:00", "10:00", "20:00"),
                        "image3.jpg"
                ),
                createGym(
                        "Zen Flow Yoga Studio",
                        "Yoga",
                        "+49 40 4567890",
                        createAddress("8", "Feldstraße", null, "Hamburg", "Hamburg", "20357", "Germany"),
                        createStandardOperatingHours("08:00", "21:00", "09:00", "20:00"),
                        "image4.jpg"
                ),
                createGym(
                        "Nordic Strength Club",
                        "Krafttraining",
                        "+49 40 5678901",
                        createAddress("92", "Mönckebergstraße", null, "Hamburg", "Hamburg", "20095", "Germany"),
                        createStandardOperatingHours("06:00", "23:00", "08:00", "22:00"),
                        "image5.jpg"
                ),
                createGym(
                        "Harbor Athletic Arena",
                        "Athletic",
                        "+49 40 6789012",
                        createAddress("15", "Große Elbstraße", null, "Hamburg", "Hamburg", "22767", "Germany"),
                        createStandardOperatingHours("07:00", "22:00", "08:00", "20:00"),
                        "image6.jpg"
                ),
                createGym(
                        "Hanseatic Martial Arts",
                        "Martial Arts",
                        "+49 40 7890123",
                        createAddress("32", "Wandsbeker Chaussee", null, "Hamburg", "Hamburg", "22089", "Germany"),
                        createStandardOperatingHours("09:00", "22:00", "10:00", "20:00"),
                        "image7.jpg"
                ),
                createGym(
                        "Alster Performance Lab",
                        "Performance",
                        "+49 40 8901234",
                        createAddress("71", "Alsterterrasse", null, "Hamburg", "Hamburg", "20354", "Germany"),
                        createStandardOperatingHours("06:00", "22:00", "08:00", "21:00"),
                        "image8.jpg"
                ),
                createGym(
                        "Hamburg Powerlifting Hub",
                        "Powerlifting",
                        "+49 40 9012345",
                        createAddress("45", "Langenhorner Chaussee", null, "Hamburg", "Hamburg", "22415", "Germany"),
                        createStandardOperatingHours("06:00", "23:00", "08:00", "22:00"),
                        "image9.jpg"
                ),
                createGym(
                        "St. Pauli Strength Factory",
                        "Strength",
                        "+49 40 0123456",
                        createAddress("88", "Simon-von-Utrecht-Straße", null, "Hamburg", "Hamburg", "20359", "Germany"),
                        createStandardOperatingHours("07:00", "23:00", "08:00", "22:00"),
                        "image10.jpg"
                )
        );
    }


    private GymCreateUpdateRequest createGym(
            String name,
            String gymType,
            String contactInformation,
            Address address,
            OperatingHours operatingHours,
            String photoId
    ) {
        return GymCreateUpdateRequest.builder()
                .name(name)
                .gymType(gymType)
                .contactInformation(contactInformation)
                .address(address)
                .operatingHours(operatingHours)
                .photoIds(List.of(photoId))
                .build();
    }

    private Address createAddress(
            String streetNumber,
            String streetName,
            String unit,
            String city,
            String state,
            String postalCode,
            String country
    ) {
        Address address = new Address();
        address.setStreetNumber(streetNumber);
        address.setStreetName(streetName);
        address.setUnit(unit);
        address.setCity(city);
        address.setState(state);
        address.setPostalCode(postalCode);
        address.setCountry(country);
        return address;
    }

    private OperatingHours createStandardOperatingHours(
            String weekdayOpen,
            String weekdayClose,
            String weekendOpen,
            String weekendClose
    ) {
        TimeRange weekday = new TimeRange();
        weekday.setOpenTime(weekdayOpen);
        weekday.setCloseTime(weekdayClose);

        TimeRange weekend = new TimeRange();
        weekend.setOpenTime(weekendOpen);
        weekend.setCloseTime(weekendClose);

        OperatingHours hours = new OperatingHours();
        hours.setMonday(weekday);
        hours.setTuesday(weekday);
        hours.setWednesday(weekday);
        hours.setThursday(weekday);
        hours.setFriday(weekend);
        hours.setSaturday(weekend);
        hours.setSunday(weekend);

        return hours;
    }
}

