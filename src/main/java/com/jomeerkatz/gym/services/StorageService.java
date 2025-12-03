package com.jomeerkatz.gym.services;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface StorageService {

    // MultipartFile -> bec this is the type we get when we upload file to a springboot controller
    // it represents a file, which gets sent via http request
    String store(MultipartFile file, String filename);
    // Resource: abstract is a type which is an abstract representation of a resource. its kind of generell type
    // it is any datasource, which i can access
    Optional<Resource> loadAsResource(String id);
}
