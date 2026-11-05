package com.booking.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * The Next.js frontend runs on http://localhost:3000 and calls this API on
     * http://localhost:8080 — a cross-origin browser client. Without this, every
     * preflight is rejected with 403 "Invalid CORS request" and the UI cannot
     * reach the API at all. An explicit origin (never "*") is required because
     * credentials are allowed: the HttpOnly auth cookie and the XSRF-TOKEN
     * cookie must both flow on cross-origin requests.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of(HttpHeaders.CONTENT_TYPE, HttpHeaders.AUTHORIZATION, "X-XSRF-TOKEN"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // cache preflights for 1h
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Auth runs via the HttpOnly "token" cookie (see AuthController), so CSRF
        // protection is mandatory. Double-submit pattern: a readable XSRF-TOKEN
        // cookie must be echoed in the X-XSRF-TOKEN header on every mutating request.
        // The plain (non-Xor) request handler is deliberate: Xor masks the token for
        // HTML form rendering, which would break the raw cookie round-trip, and BREACH
        // only applies to tokens reflected in response bodies, not cookies.
        http.csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
            .cors(Customizer.withDefaults()) // resolves the CorsConfigurationSource bean above
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.requestMatchers("/api/auth/**").permitAll()
                                               .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                                               .anyRequest().authenticated()
        );
        return http.build();
    }
}
