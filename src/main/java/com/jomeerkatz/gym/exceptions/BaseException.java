package com.jomeerkatz.gym.exceptions;

// BaseException extends RuntimeException → this makes it an UNCHECKED exception.
// Unchecked exceptions do NOT need to be declared with 'throws'
// and methods are NOT forced to catch them.
// This keeps the code cleaner and avoids changing method signatures everywhere.
//
// If this class extended Exception instead, it would be a CHECKED exception.
// Checked exceptions MUST be handled or declared, which can clutter the code
// and violates the open-closed principle.

public class BaseException extends RuntimeException {

    public BaseException(String message) {
        super(message);
    }

    public BaseException() {
    }

    public BaseException(String message, Throwable cause) {
        super(message, cause);
    }

    public BaseException(Throwable cause) {
        super(cause);
    }
}

