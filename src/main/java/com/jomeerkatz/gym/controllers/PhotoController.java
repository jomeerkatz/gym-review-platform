package com.jomeerkatz.gym.controllers;

import com.jomeerkatz.gym.domain.dtos.PhotoDto;
import com.jomeerkatz.gym.mappers.PhotoMapper;
import com.jomeerkatz.gym.services.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
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

    @GetMapping(path = "/{id:.+}")
    // Endpoint: Retrieves a stored photo by its ID.
    // Note: {id:.+} allows dots in the filename (e.g., "image.jpg").
    public ResponseEntity<Resource> getPhoto(@PathVariable String id) {

        // The service returns Optional<Resource>.
        // If a photo with this ID exists → map(...) is executed.
        return photoService.getPhotoAsResource(id).map(photo ->

                        // ResponseEntity builder:
                        // 200 OK + correct Content-Type (e.g., image/png, image/jpeg)
                        // MediaTypeFactory tries to detect the MIME type from the file.
                        ResponseEntity.ok()
                                .contentType(
                                        MediaTypeFactory.getMediaType(photo)
                                                // Fallback if MIME type cannot be detected → binary stream
                                                // MIME type = media type -> which type has the inside in the file
                                                // for example: text/html, image/png etc.
                                                .orElse(MediaType.APPLICATION_OCTET_STREAM)
                                )
                                // "inline" = Browser displays the image directly in the tab
                                // instead of forcing a download ("attachment").
                                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                                // The actual image returned as the response body
                                .body(photo)

                // If the Optional is empty → return 404 Not Found
        ).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
        // Alternative:
        // .orElse(ResponseEntity.notFound().build());
    }
}
