package com.jomeerkatz.gym.exceptions;

public class GymNotFoundException extends BaseException {
    public GymNotFoundException(String message) {
        super(message);
    }

    public GymNotFoundException() {
        super();
    }

    public GymNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public GymNotFoundException(Throwable cause) {
        super(cause);
    }
}
