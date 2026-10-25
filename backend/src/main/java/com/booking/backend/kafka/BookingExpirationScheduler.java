package com.booking.backend.kafka;

import com.booking.backend.model.Booking;
import com.booking.backend.model.BookingStatus;
import com.booking.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingExpirationScheduler {

    private final BookingRepository bookingRepository;
    private final BookingKafkaProducer kafkaProducer;

    // Run every 2 minutes to check for abandoned pending bookings older than 10 minutes
    @Scheduled(fixedRate = 120000)
    public void scanAndPublishExpiredBookings() {
        OffsetDateTime threshold = OffsetDateTime.now().minusMinutes(10);
        List<Booking> pendingBookings = bookingRepository.findByStatusAndCreatedAtBefore(BookingStatus.PENDING, threshold);

        for (Booking booking : pendingBookings) {
            log.info("Publishing expiration event for abandoned booking ID: {}", booking.getId());
            kafkaProducer.publishEvent(new BookingEventMessage(
                    "EXPIRE_BOOKING",
                    booking.getId(),
                    booking.getResource().getId(),
                    booking.getUser().getId(),
                    booking.getStartTime(),
                    booking.getEndTime()
            ));
        }
    }
}