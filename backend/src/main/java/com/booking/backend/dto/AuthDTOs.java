package com.booking.backend.dto;

import com.booking.backend.model.Role;
import jakarta.validation.constraints.Email; // Jakarta bean validation for email and non empty password
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;

public class AuthDTOs {
    public record SignupRequest(@NotBlank String name, @Email String email, @NotBlank String password, Role role) {}
    public record LoginRequest(@Email String email, @NotBlank String password) {};
    public record AuthResponse(String token, String email, String role) {};

    public record CreateBookingRequest(Long resourceId, OffsetDateTime startTime, OffsetDateTime endTime) {};
    public record BookingResponse(Long id, Long resourceId, String resourceName, Long userId, OffsetDateTime startTime, OffsetDateTime endTime, String status) {};
}