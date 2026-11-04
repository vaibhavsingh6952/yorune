package com.booking.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Builder;
import lombok.Data;

@Document(collection = "booking_audit_logs") // @Table(name="") equivalent for mongodb
@Data // automatically generates getters setters toSting() hashCode() equals()
@Builder // enable builder pattern which uses method chaining (Fluent API) for avoiding telescopic constructors, basically have object of each arg which is returned
public class AuditLog {
     @Id
     private String id;
     private String eventType;
     private Long bookingId;
     private Long resourceId;
     private Long userId;
     private String actorEmail;

     @Indexed(expireAfter = "90d") // 90 days TTL index
     @Builder.Default
     private Instant timestamp = Instant.now();
}
