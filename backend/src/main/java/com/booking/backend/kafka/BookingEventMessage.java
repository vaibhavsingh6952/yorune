package com.booking.backend.kafka;

import java.time.OffsetDateTime;

public record BookingEventMessage(
        String eventType, // eg "EXPIRE_BOOKING"
        Long bookingId,
        Long resourceId,
        Long userId,
        OffsetDateTime startTime,
        OffsetDateTime endTime
) {}