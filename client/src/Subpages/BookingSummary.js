import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
export default function BookingSummary() {
    const { id } = useParams(); // gets booking ID from URL

    // Fetch booking details using the ID
    useEffect(() => {
        fetch(`http://localhost:5000/api/fetch-booking/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // populate state with booking details
                }
            });
    }, [id]);

    return <div>Booking summary for ID: {id}</div>;
}
