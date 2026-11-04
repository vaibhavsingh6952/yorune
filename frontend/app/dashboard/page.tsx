'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import BookingModal from '@/components/BookingModal';

interface Resource {
    id: number;
    name: string;
    type: string;
    capacity: number;
    location: string;
}

export default function DashboardPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

    useEffect(() => {
        fetchWithAuth('/resources')
            .then((data) => {
                setResources(data);
                setLoading(false);
            })
            .catch((err) => console.error('Failed to load resources', err));
    }, []);

    if (loading) return <div className="p-8 text-white bg-gray-900 min-h-screen">Loading resources...</div>;

    return (
        <main className="p-8 bg-gray-950 text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Yorune Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resources.map((resource) => (
                    <div key={resource.id} className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-2">{resource.name}</h2>
                        <p className="text-gray-400 text-sm mb-4">Location: {resource.location} ({resource.type})</p>
                        <button
                            onClick={() => setSelectedResource(resource)}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-lg font-medium transition"
                        >
                            Select Slot
                        </button>
                    </div>
                ))}
            </div>

            {selectedResource && (
                <BookingModal
                    resource={selectedResource}
                    onClose={() => setSelectedResource(null)}
                    onSuccess={() => alert('Slot successfully reserved with pessimistic locking!')}
                />
            )}
        </main>
    );
}