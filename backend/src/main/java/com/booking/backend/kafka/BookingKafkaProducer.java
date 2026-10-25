package com.booking.backend.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingKafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    public static final String TOPIC_NAME = "yorune-booking-events";

    public void publishEvent(BookingEventMessage event) {
        kafkaTemplate.send(TOPIC_NAME, event.bookingId().toString(), event);
        log.info("Published {} event to Kafka topic for booking ID: {}", event.eventType(), event.bookingId());
    }
}