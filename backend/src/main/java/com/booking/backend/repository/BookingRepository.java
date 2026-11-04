package com.booking.backend.repository;

import com.booking.backend.model.Booking;
import com.booking.backend.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;                       

import java.time.OffsetDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    @Query("""
            SELECT b from Booking b
            WHERE b.resource.id = :resourceId
            AND b.status IN (:statuses)
            AND (b.startTime < :endTime AND b.endTime > :startTime)                           
            """)
    List<Booking> findOverlappingBookings(
        @Param("resourceId") Long resourceId, // these JPQL vars are mapped here to the Java class private vars
        @Param("startTime") OffsetDateTime startTime,
        @Param("endTime") OffsetDateTime endTime,
        @Param("statuses") List<BookingStatus> statuses

    );
    // Derived query or explicit JPQL for finding pending abandoned bookings
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.createdAt < :threshold")
    List<Booking> findByStatusAndCreatedAtBefore(
            @Param("status") BookingStatus status, 
            @Param("threshold") OffsetDateTime threshold
    );
    List<Booking> findByUserId(Long UserId);
}
