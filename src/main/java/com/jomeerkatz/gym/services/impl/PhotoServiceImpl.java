package com.jomeerkatz.gym.services.impl;

import com.jomeerkatz.gym.domain.entities.Photo;
import com.jomeerkatz.gym.services.PhotoService;
import com.jomeerkatz.gym.services.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PhotoServiceImpl implements PhotoService {

    private StorageService storageService;

    public PhotoServiceImpl (StorageService storageService) {
        this.storageService = storageService;
    }

    @Override
    public Photo uploadFile(MultipartFile file) { // coming from the client
        String photoId = UUID.randomUUID().toString(); // create a random UUID
        String url = storageService.store(file, photoId); //

        return Photo.builder()
                .url(url)
                .uploadDate(LocalDateTime.now())
                .build();
    }

    @Override
    public Optional<Resource> getPhotoAsResource(String id) {
        return storageService.loadAsResource(id);
    }
}
