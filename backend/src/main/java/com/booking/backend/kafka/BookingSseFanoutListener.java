package com.booking.backend.kafka;

import com.booking.backend.dto.BookingEvent;
import com.booking.backend.service.BookingEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Broadcasts SSE events from Kafka to the clients connected to this instance.
 *
 * The group id is a random UUID resolved once per JVM, so every instance joins
 * the topic under its own group and receives every message (true broadcast —
 * a shared group would load-balance messages across instances instead).
 * auto-offset-reset=latest guarantees a restarted instance never replays
 * historical events to newly connected SSE clients.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingSseFanoutListener {

    private final BookingEventPublisher eventPublisher;

    @KafkaListener(
            topics = BookingEventPublisher.SSE_TOPIC,
            groupId = "#{T(java.util.UUID).randomUUID().toString()}",
            properties = "auto-offset-reset=latest"
    )
    public void fanOutToLocalSubscribers(BookingEvent event) {
        eventPublisher.emitToSubscribers(event);
    }
}
