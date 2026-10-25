'use client'
import { useEffect, useState } from 'react';

export interface BookingEvent {
    eventType: string;
    bookingId: number;
    resourceId: number;
    userId: number;
    startTime: string;
    endTime: string;
}

export function useBookingStream(onNewBooking?: (event: BookingEvent) => void) {
    const [isConnected, setIsConnected] = useState(false);
    useEffect(() => {
        const eventSource = new EventSource('http://localhost:8080/api/bookings/stream')
        eventSource.onopen = () => {
            setIsConnected(true);
        };
        eventSource.addEventListener('BOOKING_CREATED', (event: MessageEvent) => {
            const data: BookingEvent = JSON.parse(event.data);
            if (onNewBooking) {
                onNewBooking(data);
            }
        });
        eventSource.onerror = () => {
            setIsConnected(false);
        };
        return () => {
            eventSource.close();
        };
    }, [onNewBooking]);
    return { isConnected };
}