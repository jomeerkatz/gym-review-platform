package com.jomeerkatz.gym.services.impl;

import ch.qos.logback.core.util.StringUtil;
import com.jomeerkatz.gym.exceptions.StorageException;
import com.jomeerkatz.gym.services.StorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

@Service
// @Slf4j generates a Logger instance named 'log' for this class.
// It replaces the need for System.out.println and provides structured logging
// with different log levels (info, warn, error, debug).
// Lombok creates the logger automatically, so you can use log.info(), log.error(), etc.
@Slf4j

public class FileSystemStorageService implements StorageService {

    // with :uploads, we set a default
    @Value("${app.storage.location:uploads}")
    private String storageLocation;

    private Path rootLocation; // not initlize in constructor since an exception can appear. we do it with in postconstruct

    @PostConstruct // run this AFTER dependency injection
    public void init() {
        this.rootLocation = Paths.get(storageLocation);
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new StorageException("could not initilize storage location", e);
        }
    }

    @Override
    public String store(MultipartFile file, String filename) {
        try {
            // Check if the uploaded file has no content; empty uploads are invalid and must be rejected.
            if (file.isEmpty()) {
                throw new StorageException("cannot save an empty file!");
            }
            // Extract the extension (e.g., "png", "jpg") from the original filename provided by the client. Does not include the dot.
            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            // Build the final filename using the provided base name plus the original file's extension.
            String finalFileName = filename + "." + extension;
            // Construct the full storage path by safely resolving the filename inside the root directory, normalizing to remove "../" sequences, and converting to an absolute path.
            Path destinationFile = rootLocation
                    .resolve(Paths.get(finalFileName))
                    .normalize()
                    .toAbsolutePath();

            // Security check: ensure the resolved destination is still inside the root upload directory. Prevents path traversal attacks.
            if (!destinationFile.getParent().equals(rootLocation.toAbsolutePath())) {
                throw new StorageException("cannot store file outside specified directory!");
            }

            // Copy the uploaded file's data into the destination path, replacing any existing file with the same name.
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            return finalFileName;
        } catch (IOException e) {
            throw new StorageException("failed to store file", e);
        }
    }

    @Override
    public Optional<Resource> loadAsResource(String id) {
        return Optional.empty();
    }
}
