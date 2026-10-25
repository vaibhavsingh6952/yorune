package com.booking.backend.service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import org.springframework.stereotype.Service;

import com.booking.backend.dto.BookingEvent;

@Service 
public class BookingEventPublisher {
    // broadcasts emitted events to all active flux subscribers using multicast sink
    private final Sinks.Many<BookingEvent> sink = Sinks.many().multicast().onBackpressureBuffer();

    public void publishEvent(BookingEvent event) {
        sink.tryEmitNext(event);
    }

    public Flux<BookingEvent> getEventStream() {
        return sink.asFlux();
    }
}
