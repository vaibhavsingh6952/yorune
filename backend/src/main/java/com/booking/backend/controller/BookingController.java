package com.booking.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.booking.backend.dto.AuthDTOs.BookingResponse;
import com.booking.backend.dto.AuthDTOs.CreateBookingRequest;
import com.booking.backend.service.BookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController 
@RequestMapping ("/api/bookings")
@RequiredArgsConstructor 
public class BookingController {
    private final BookingService bookingService;
    @PostMapping ("/naive")
    public ResponseEntity<BookingResponse> createNaive(@RequestBody @Valid CreateBookingRequest request, @AuthenticationPrincipal UserDetails userDetails) {
        BookingResponse response = bookingService.createBookingNaive(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
    @PostMapping("/pessimistic")
    public ResponseEntity<BookingResponse> createPessimistic(@RequestBody @Valid CreateBookingRequest request, @AuthenticationPrincipal UserDetails userDetails) {
        BookingResponse response = bookingService.createBookingPessimistic(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}