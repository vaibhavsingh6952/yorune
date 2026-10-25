package com.booking.backend.service;

import com.booking.backend.dto.AuthDTOs.CreateBookingRequest;
import com.booking.backend.dto.BookingEvent;
import com.booking.backend.event.BookingCreatedEvent;
import com.booking.backend.dto.AuthDTOs.BookingResponse;
import com.booking.backend.model.*;
import com.booking.backend.repository.*;
import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final BookingEventPublisher eventPublisher;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Transactional                                                                                                              
    public BookingResponse createBookingPessimistic(CreateBookingRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new IllegalArgumentException("User not found"));
        // if any second thread attempting to fetch this resource will block right here
        Resource resource = resourceRepository.findByIdWithPessimisticLock(request.resourceId()).orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        // safe overlap check inside locked transaction boundary
        List<BookingStatus> activeStatuses = List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED);
        List<Booking> overlaps = bookingRepository.findOverlappingBookings(
            request.resourceId(),
            request.startTime(),
            request.endTime(),
            activeStatuses
        );
        
        if (!overlaps.isEmpty()) {
            throw new IllegalStateException("Time slot is already booked for this resource.");
        }

        Booking booking  = Booking.builder()
                                  .resource(resource)
                                  .user(user)
                                  .startTime(request.startTime())
                                  .endTime(request.endTime())
                                  .status(BookingStatus.CONFIRMED)
                                  .build();

        Booking saved = bookingRepository.save(booking);

        // publish real time event to all the connected SSE events
        eventPublisher.publishEvent(new BookingEvent(
                "BOOKING_CREATED",
                saved.getId(),
                resource.getId(),
                user.getId(),
                saved.getStartTime(),
                saved.getEndTime()
        ));
        
        // publish async event inside the transactional boundary for MongoDB audit logging
        applicationEventPublisher.publishEvent(new BookingCreatedEvent(
                saved.getId(),
                resource.getId(),
                user.getId(),
                user.getEmail()
        ));

        return new BookingResponse(saved.getId(),
                                resource.getId(), 
                                resource.getName(), 
                                user.getId(), 
                                saved.getStartTime(), 
                                saved.getEndTime(), 
                                saved.getStatus().name());
    }

    @Transactional
    public BookingResponse createBookingNaive(CreateBookingRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Resource resource = resourceRepository.findById(request.resourceId()).orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        List<BookingStatus> activeStatuses = List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED);
        List<Booking> overlaps = bookingRepository.findOverlappingBookings(
            request.resourceId(),
            request.startTime(),
            request.endTime(),
            activeStatuses
        );

        if(!overlaps.isEmpty()) {
            throw new IllegalStateException("Time slot is already booked for this resource.");
        }

        Booking booking  = Booking.builder()
                                  .resource(resource)
                                  .user(user)
                                  .startTime(request.startTime())
                                  .endTime(request.endTime())
                                  .status(BookingStatus.CONFIRMED)
                                  .build();

        Booking saved = bookingRepository.save(booking);
        
        return new BookingResponse(saved.getId(),
                                resource.getId(), 
                                resource.getName(), 
                                user.getId(), 
                                saved.getStartTime(), 
                                saved.getEndTime(), 
                                saved.getStatus().name());
    }
}
