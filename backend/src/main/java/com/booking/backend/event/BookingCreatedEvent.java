package com.booking.backend.event;

public record BookingCreatedEvent(
        Long bookingId,
        Long resourceId,
        Long userId,
        String userEmail
) {}