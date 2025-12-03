package com.jomeerkatz.gym.exceptions;

public class StorageException extends BaseException {
    public StorageException(String message) {
        super(message);
    }

    public StorageException() {
    }

    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }

    public StorageException(Throwable cause) {
        super(cause);
    }
}
