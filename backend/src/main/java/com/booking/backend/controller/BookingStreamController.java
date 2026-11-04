package com.booking.backend.controller;

import com.booking.backend.dto.BookingEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import com.booking.backend.service.BookingEventPublisher;
import reactor.core.publisher.Flux;
import java.time.Duration;

import lombok.RequiredArgsConstructor;

@RestController 
@RequestMapping("/api/bookings")
@RequiredArgsConstructor 
public class BookingStreamController {
    private final BookingEventPublisher eventPublisher;
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<BookingEvent>> streamBookingEvents() {
        Flux<ServerSentEvent<BookingEvent>> heartbeats = Flux.interval(Duration.ofSeconds(15)).map(i -> ServerSentEvent.<BookingEvent>builder().comment("keep-alive").build());
        Flux<ServerSentEvent<BookingEvent>> events = eventPublisher.getEventStream().map(event -> ServerSentEvent.<BookingEvent>builder().event(event.eventType()).data(event).build());
        return Flux.merge(events,heartbeats);
    }
}
