import { useEffect, useState } from 'react';

export function useBookingStream(resourceId: number) {
    const [availabilityStatus, setAvailabilityStatus] = useState<string>('AVAILABLE');

    useEffect(() => {
        const eventSource = new EventSource(`http://localhost:8080/api/stream/bookings`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.resourceId === resourceId) {
                setAvailabilityStatus(data.status);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [resourceId]);

    return { availabilityStatus };
}