package com.booking.backend.event;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.booking.backend.model.AuditLog;
import com.booking.backend.repository.AuditLogRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor 
@Slf4j
public class BookingAuditEventListener {
    private final AuditLogRepository auditLogRepository;

    @Async 
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBookingCreatedEvent(BookingCreatedEvent event) {
        try {
            AuditLog auditLog = AuditLog.builder()
                            .eventType("BOOKING_CREATED")
                            .bookingId(event.bookingId())
                            .resourceId(event.resourceId())
                            .userId(event.userId())
                            .actorEmail(event.userEmail())
                            .build();
            auditLogRepository.save(auditLog);
            log.info("Successfully wrote asynchronous audit log to MongoDB for booking ID: {}", event.bookingId());
        }
        catch(Exception e) {
            log.error("Failed to write audit log to MongoDB asynchronously", e);
            // Swallowed intentionally so MongoDB downtime never breaks user bookings
        }
    }
}
