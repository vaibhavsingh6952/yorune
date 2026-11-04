'use client';

import { useState } from 'react';
import { fetchWithAuth } from '@/lib/api';

interface Resource {
    id: number;
    name: string;
    location: string;
}

interface BookingModalProps {
    resource: Resource;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BookingModal({ resource, onClose, onSuccess }: BookingModalProps) {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formattedStart = `${startTime}:00Z`;
            const formattedEnd = `${endTime}:00Z`;

            await fetchWithAuth('/bookings/pessimistic', {
                method: 'POST',
                body: JSON.stringify({
                    resourceId: resource.id,
                    startTime: formattedStart,
                    endTime: formattedEnd,
                }),
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Booking failed. Slot may be occupied.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-md p-6 rounded-2xl shadow-2xl">
                <h2 className="text-xl font-bold mb-1">Book {resource.name}</h2>
                <p className="text-gray-400 text-sm mb-4">Location: {resource.location}</p>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <form onSubmit={handleBooking} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Start Time</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">End Time</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                            required
                        />
                    </div>
                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {loading ? 'Locking Slot' : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}