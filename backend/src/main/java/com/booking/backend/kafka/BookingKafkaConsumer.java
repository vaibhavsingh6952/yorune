package com.booking.backend.kafka;

import com.booking.backend.model.Booking;
import com.booking.backend.model.BookingStatus;
import com.booking.backend.model.Waitlist;
import com.booking.backend.repository.BookingRepository;
import com.booking.backend.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingKafkaConsumer {

    private final BookingRepository bookingRepository;
    private final WaitlistRepository waitlistRepository; // 1. Inject Waitlist Repository

    @KafkaListener(topics = "yorune-booking-events", groupId = "yorune-booking-group")
    @Transactional
    public void consumeBookingEvent(BookingEventMessage message) {
        log.info("Consumed Kafka message: {} for booking ID: {}", message.eventType(), message.bookingId());

        if ("EXPIRE_BOOKING".equals(message.eventType())) {
            // Idempotent state guard: only mutate if status is strictly PENDING
            Booking booking = bookingRepository.findById(message.bookingId()).orElse(null);
            
            if (booking != null && booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.CANCELLED);
                bookingRepository.save(booking);
                log.info("Auto-expired unconfirmed booking ID: {}. Resource released.", booking.getId());

                // 2. Waitlist Cascade: Check who is next in line for this resource & time slot
                List<Waitlist> waitlistEntries = waitlistRepository.findEligibleWaitlistEntries(
                        booking.getResource().getId(),
                        booking.getStartTime(),
                        booking.getEndTime()
                );

                if (!waitlistEntries.isEmpty()) {
                    Waitlist nextUserInLine = waitlistEntries.get(0); // FIFO order
                    log.info(" [WAITLIST CASCADE] Slot freed! Notifying next user in queue -> User ID: {} for Resource ID: {}",
                            nextUserInLine.getUser().getId(), booking.getResource().getId());
                    
                    // Optional: Delete or update waitlist entry so they aren't notified twice
                    waitlistRepository.delete(nextUserInLine);
                } else {
                    log.info(" [WAITLIST CASCADE] No users waiting for Resource ID: {} during this slot.", booking.getResource().getId());
                }

            } else {
                log.info("Booking ID: {} is no longer pending. Skipping expiry.", message.bookingId());
            }
        }
    }
}