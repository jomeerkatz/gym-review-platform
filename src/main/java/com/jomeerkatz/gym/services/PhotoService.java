package com.jomeerkatz.gym.services;

import com.jomeerkatz.gym.domain.entities.Photo;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface PhotoService {
    Photo uploadFile(MultipartFile file);

    Optional<Resource> getPhotoAsResource(String id);
}
