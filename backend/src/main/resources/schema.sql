CREATE TYPE user_role as ENUM ('USER','ADMIN')
CREATE TYPE resource_type as ENUM ('desk','room','cabin')
CREATE TYPE booking_status as ENUM ('PENDING','CONFIRMED','CANCELLED')

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF EXISTS resources (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type resource_type NOT NULL,
    capacity INT NOT NULL,
    location VARCHAR(150) NOT NULL,
    photo_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS slots (
    id BIGSERIAL PRIMARY KEY,
    resource_id BIGINT REFERENCES resources(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DB-level guarantee that two ACTIVE bookings never overlap for a resource.
-- A UNIQUE(resource_id, start_time, end_time) constraint would only block
-- byte-identical ranges, not partial overlaps (e.g. 10:00-12:00 vs 11:00-13:00).
-- btree_gist is required for the `=` operator on BIGINT (plain gist has no int8=).
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- Exclusion constraints cannot be partial (no WHERE clause), so CANCELLED rows
-- are mapped to an empty range: an empty range conflicts with nothing, meaning
-- released slots remain bookable. tstzrange defaults to '[)', matching the
-- overlap check in BookingRepository (start < :end AND end > :start).
ALTER TABLE slots ADD CONSTRAINT slots_no_active_overlap
    EXCLUDE USING gist (
        resource_id WITH =,
        CASE WHEN status IN ('PENDING','CONFIRMED')
             THEN tstzrange(start_time, end_time)
             ELSE 'empty'::tstzrange END WITH &&
    );

CREATE TABLE IF NOT EXISTS waitlist (
    id BIGSERIAL PRIMARY KEY,
    resource_id BIGINT REFERENCES resources(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    desired_start TIMESTAMP WITH TIME ZONE NOT NULL,
    desired_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    resource_id BIGINT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    desired_start TIMESTAMP WITH TIME ZONE NOT NULL,
    desired_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
