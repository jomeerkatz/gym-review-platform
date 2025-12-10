package com.jomeerkatz.gym.exceptions;

public class ReviewNotAllowedException extends BaseException {
    public ReviewNotAllowedException(String message) {
        super(message);
    }

    public ReviewNotAllowedException() {
        super();
    }

    public ReviewNotAllowedException(String message, Throwable cause) {
        super(message, cause);
    }

    public ReviewNotAllowedException(Throwable cause) {
        super(cause);
    }
}
