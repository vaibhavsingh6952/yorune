package com.booking.backend.service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.booking.backend.dto.BookingEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingEventPublisher {
    // Cross-instance broadcast bus: an in-memory Sink only reaches SSE clients
    // connected to the same JVM, so every event is published to Kafka and each
    // instance re-emits it to its local subscribers (see BookingSseFanoutListener).
    public static final String SSE_TOPIC = "yorune-booking-sse";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    // local fan-out sink for SSE clients connected to THIS instance
    private final Sinks.Many<BookingEvent> sink = Sinks.many().multicast().onBackpressureBuffer();

    public void publishEvent(BookingEvent event) {
        kafkaTemplate.send(SSE_TOPIC, event.bookingId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish {} event for booking ID {} to Kafka topic {}",
                                event.eventType(), event.bookingId(), SSE_TOPIC, ex);
                    } else {
                        log.info("Published {} event for booking ID {} to Kafka topic {}",
                                event.eventType(), event.bookingId(), SSE_TOPIC);
                    }
                });
    }

    // Called by the Kafka fan-out listener so every instance reaches its own clients
    public void emitToSubscribers(BookingEvent event) {
        sink.tryEmitNext(event);
    }

    public Flux<BookingEvent> getEventStream() {
        return sink.asFlux();
    }
}
