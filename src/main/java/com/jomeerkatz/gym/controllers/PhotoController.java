package com.jomeerkatz.gym.controllers;

import com.jomeerkatz.gym.domain.dtos.PhotoDto;
import com.jomeerkatz.gym.mappers.PhotoMapper;
import com.jomeerkatz.gym.services.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
// we do not need constructos since we use this Annotation.
// but u need to declare the variables as final!
@RequestMapping(path = "/api/photos")
public class PhotoController {
    private final PhotoService photoService;
    private final PhotoMapper photoMapper;

    // Even though the file is not sent as a URL query parameter,
    // @RequestParam("file") is required so Spring knows which multipart
    // body part (name="file") should be bound to this MultipartFile.
    @PostMapping
    PhotoDto uploadPhoto (@RequestParam("file") MultipartFile file) {
        return photoMapper.toDto(photoService.uploadFile(file));
    }
}
