package com.booking.backend.service;

import com.booking.backend.dto.AuthDTOs.CreateBookingRequest;
import com.booking.backend.model.*;
import com.booking.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.OffsetDateTime;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest 
public class BookingServiceConcurrencyTest {
    @Autowired private BookingService bookingService;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BookingRepository bookingRepository;

    private Long testResourceId;
    private String user1Email = "user1@test.com";
    private String user2Email = "user2@test.com";

    @BeforeEach 
    void setUp() {
        bookingRepository.deleteAll();
        resourceRepository.deleteAll();
        userRepository.deleteAll();

        User u1 = userRepository.save(User.builder().name("User 1").email(user1Email).passwordHash("pass").role(Role.USER).build());
        User u2 = userRepository.save(User.builder().name("User 2").email(user2Email).passwordHash("pass").role(Role.USER).build());
        
        Resource res = resourceRepository.save(Resource.builder()
                .name("Hot Desk A")
                .type(ResourceType.desk)
                .capacity(1)
                .location("Floor 1")
                .build());
        testResourceId = res.getId();
    }

    @Test
    @DisplayName("PESSIMISTIC lock rejects concurrent double-booking attempts")
    void pessimisticBooking_ConcurrentRequests_PreventsDoubleBooking() throws InterruptedException {
        int numberOfThreads = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(1);

        OffsetDateTime start = OffsetDateTime.now().plusDays(1);
        OffsetDateTime end = start.plusHours(2);
        CreateBookingRequest request = new CreateBookingRequest(testResourceId, start, end);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        executorService.submit(() -> {
            try {
                latch.await();
                bookingService.createBookingPessimistic(request, user1Email);
                successCount.incrementAndGet();
            } catch (Exception e) {
                failureCount.incrementAndGet();
            }
        });

        executorService.submit(() -> {
            try {
                latch.await();
                bookingService.createBookingPessimistic(request, user2Email);
                successCount.incrementAndGet();
            } catch (Exception e) {
                failureCount.incrementAndGet();
            }
        });

        latch.countDown();
        executorService.shutdown();
        executorService.awaitTermination(5, TimeUnit.SECONDS);

        // Exactly ONE booking succeeds, and ONE fails with an overlap exception
        assertEquals(1, successCount.get(), "Only one request should succeed!");
        assertEquals(1, failureCount.get(), "The overlapping request must be rejected!");
        assertEquals(1, bookingRepository.count(), "Only one booking record must exist in PostgreSQL!");
    }

    @Test 
    @DisplayName("NAIVE logic allows double-booking when requests are concurrent")
    void naiveBooking_ConcurrentRequests_CauseDoubleBooking() throws InterruptedException {
        int numberOfThreads = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(1);

        OffsetDateTime start = OffsetDateTime.now().plusDays(1);
        OffsetDateTime end = start.plusHours(2);
        CreateBookingRequest request = new CreateBookingRequest(testResourceId, start, end);

        AtomicInteger successCount = new AtomicInteger(0);

        executorService.submit(() -> {
            try {
                latch.await();
                bookingService.createBookingNaive(request,user1Email);
                successCount.incrementAndGet();
            }
            catch(Exception ignored) {}
        });
        
        executorService.submit(() -> {
            try {
                latch.await();
                bookingService.createBookingNaive(request,user1Email);
                successCount.incrementAndGet();
            }
            catch(Exception ignored) {}
        });

        latch.countDown();
        executorService.shutdown();
        executorService.awaitTermination(5,TimeUnit.SECONDS);

        assertEquals(2,successCount.get(), "Naive implementation allowed concurrent double booking!");
        assertEquals(2,bookingRepository.count());
    }
}
