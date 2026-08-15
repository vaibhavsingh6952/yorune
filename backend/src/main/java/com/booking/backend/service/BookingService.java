package com.booking.backend.service;

import com.booking.backend.dto.AuthDTOs.CreateBookingRequest;
import com.booking.backend.dto.AuthDTOs.BookingResponse;
import com.booking.backend.model.*;
import com.booking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

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
