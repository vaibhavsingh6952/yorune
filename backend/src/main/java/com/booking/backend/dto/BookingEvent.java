package com.booking.backend.dto;

import java.time.OffsetDateTime;

public record BookingEvent(String eventType, Long bookingId, Long resourceId, Long userId, OffsetDateTime startTime, OffsetDateTime endTime) {}
