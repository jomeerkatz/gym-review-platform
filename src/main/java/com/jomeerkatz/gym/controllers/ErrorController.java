package com.jomeerkatz.gym.controllers;

import com.jomeerkatz.gym.domain.dtos.ErrorDto;
import com.jomeerkatz.gym.exceptions.BaseException;
import com.jomeerkatz.gym.exceptions.GymNotFoundException;
import com.jomeerkatz.gym.exceptions.ReviewNotAllowedException;
import com.jomeerkatz.gym.exceptions.StorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

@RestController
@ControllerAdvice
@Slf4j
public class ErrorController {

    @ExceptionHandler(ReviewNotAllowedException.class)
    public ResponseEntity<ErrorDto> handleReviewNotAllowedException(ReviewNotAllowedException ex) {
        log.error("caught Review Not Allowed Exception", ex);

        ErrorDto errorDto = ErrorDto.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("the specific review cannot be created or updated")
                .build();

        return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(GymNotFoundException.class)
    public ResponseEntity<ErrorDto> handleGymNotFoundException(GymNotFoundException ex) {
        log.error("caught GymNotFoundException", ex);

        ErrorDto errorDto = ErrorDto.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message("the specific gym wasn't found!")
                .build();

        return new ResponseEntity<>(errorDto, HttpStatus.NOT_FOUND);
    }

     @ExceptionHandler(MethodArgumentNotValidException.class)
     public ResponseEntity<ErrorDto> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex){
         log.error("caught MethodArgumentNotValidException", ex);

         String errorMessage = ex
                 .getBindingResult()
                 .getFieldErrors()
                 .stream()
                 .map(error -> error.getField() + ": " + error.getDefaultMessage())
                 .collect(Collectors.joining(", "));

         ErrorDto errorDto = ErrorDto.builder()
                 .message(errorMessage)
                 .status(HttpStatus.BAD_REQUEST.value())
                 .build();

         return new ResponseEntity<ErrorDto>(errorDto, HttpStatus.BAD_REQUEST);
     }

    @ExceptionHandler(StorageException.class)
    public ResponseEntity<ErrorDto> handleStorageException(StorageException ex) {
        log.error("caught storageexception", ex);
        ErrorDto errorDto = ErrorDto.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("unable to save or retrieve resources at this time")
                .build();
        return new ResponseEntity<>(errorDto, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorDto> handleBaseException(Exception ex) {
        log.error("caught base exception", ex);

        ErrorDto errorDto = ErrorDto.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("an unexpected error occurred")
                .build();

        return new ResponseEntity<>(errorDto, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDto> handleException(Exception ex) {
        log.error("caught unexpected exception", ex);

        ErrorDto errorDto = ErrorDto.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("an unexpected error occurred")
                .build();

        return new ResponseEntity<>(errorDto, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
