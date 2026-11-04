package com.booking.backend.repository;

import com.booking.backend.model.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {

    @Query("SELECT w FROM Waitlist w WHERE w.resource.id = :resourceId AND w.desiredStart >= :start AND w.desiredEnd <= :end ORDER BY w.createdAt ASC")
    List<Waitlist> findEligibleWaitlistEntries(
            @Param("resourceId") Long resourceId,
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end
    );
}