package com.booking.backend.service;

import com.booking.backend.dto.AuthDTOs.CreateBookingRequest;
import com.booking.backend.model.*;
import com.booking.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTest {
    @Mock private BookingRepository bookingRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private BookingService bookingService;

    @Test
    void createBookingNaive_WhenOverlapExists_ShouldThrowException() {
        // AAA - Arrange
        OffsetDateTime now = OffsetDateTime.now();
        CreateBookingRequest request = new CreateBookingRequest(1L,now,now.plusHours(2));
        
        User user = User.builder().id(10L).email("user@test.com").build();
        Resource resource = Resource.builder().id(1L).name("Desk 1").build();
        Booking existingBooking = Booking.builder().id(99L).build();

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(resource));
        when(bookingRepository.findOverlappingBookings(eq(1L), any(), any(), any())).thenReturn(List.of(existingBooking));
        
        // Arrange and Assert
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> bookingService.createBookingNaive(request,"user@test.com")
        );
        assertEquals("Time slot is already booked for this resource.", exception.getMessage());
        verify(bookingRepository, never()).save(any()); 
    }
}
