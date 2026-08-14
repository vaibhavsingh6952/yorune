package com.booking.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // automatically generate and auto-increment this ID
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING) // by default it is EnumType.ORDINAL. it stops a bug where adding a new role at the top (like GUEST) shifts USER from 0 to 1, accidentally turning all your existing users into guests overnight.
    @Column(nullable = false)
    private Role role;
}