package com.reddot.app.dto;

import lombok.*;

/**
 * {@code ServiceResponse} is a generic class used to wrap all successful responses
 * to ensure that the response is consistent and easy to understand.
 */

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ServiceResponse<T> {
    private int statusCode;
    private String message;
    private T data;

    public ServiceResponse(int statusCode, String message) {
        this.statusCode = statusCode;
        this.message = message;
    }
}
