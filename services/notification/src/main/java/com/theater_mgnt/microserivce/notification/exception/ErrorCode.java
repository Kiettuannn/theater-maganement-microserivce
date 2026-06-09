package com.theater_mgnt.microserivce.notification.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    INVALID_KEY(1005, "Invalid message key", HttpStatus.BAD_REQUEST), // 404
    UNAUTHENTICATED(1007, "Unauthenticated", HttpStatus.UNAUTHORIZED), // 401
    UNAUTHORIZED(1008, "You do not have permissions", HttpStatus.FORBIDDEN), // 403
    CANNOT_SEND_EMAIL(1010, "Cannot send email", HttpStatus.BAD_REQUEST),
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR) // Code: 500
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
