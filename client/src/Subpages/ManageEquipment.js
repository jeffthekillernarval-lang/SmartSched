import React, { useState, useEffect } from 'react';

export default function ManageEquipment() {
    const [equipmentList, setEquipmentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ type: '', quantity: '', model_id: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch all equipment
            const eqRes = await fetch('http://localhost:5000/api/fetch-booking-equipment');
            const eqData = await eqRes.json();

            if (!eqData.success) throw new Error(eqData.message);

            // Fetch all bookings
            const bkRes = await fetch('http://localhost:5000/api/fetch-bookings');
            const bkData = await bkRes.json();

            if (!bkData.success) throw new Error(bkData.message);

            // Merge booking info into equipment list
            const merged = eqData.equipment
                .filter(eq => eq.booking_id !== null) // ⬅️ remove unassigned equipment
                .map(eq => {
                    const booking = bkData.bookings.find(b => b.id === eq.booking_id);
                    return {
                        ...eq,
                        facility: booking?.event_facility || 'N/A',
                        event_name: booking?.event_name || 'N/A',
                        event_date: booking?.event_date || null
                    };
                });


            setEquipmentList(merged);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message || 'Error fetching equipment and bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEquipment = async (id) => {
        if (!editData.type.trim() || !editData.quantity || !editData.model_id.trim()) {
            alert('Please fill out all fields.');
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/update-equipment/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });

            const data = await res.json();
            if (data.success) {
                alert('Equipment updated successfully!');
                setEditingId(null);
                fetchData();
            } else {
                alert(data.message || 'Failed to update equipment.');
            }
        } catch (err) {
            console.error('Update error:', err);
            alert('Error updating equipment.');
        }
    };

    const handleDeleteEquipment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this equipment?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/delete-equipment/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert('Equipment deleted successfully.');
                fetchData();
            } else {
                alert(data.message || 'Failed to delete equipment.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Error deleting equipment.');
        }
    };

    if (loading) return <div className="text-center mt-10 text-lg text-[#96161C] font-semibold">Loading equipment...</div>;
    if (error) return <div className="text-center mt-10 text-red-500 font-semibold">{error}</div>;

    return (
        <div className="p-6 flex justify-center">
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl">
                <h1 className="text-2xl font-bold mb-4 text-[#96161C] border-b-2 border-[#96161C] pb-2">
                    Manage Equipment
                </h1>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border border-gray-300 rounded-lg overflow-hidden">
                        <thead className="bg-[#96161C] text-white">
                            <tr>
                                <th className="p-2 border">ID</th>
                                <th className="p-2 border">Type</th>
                                <th className="p-2 border">Quantity</th>
                                <th className="p-2 border">Model ID</th>
                                <th className="p-2 border">Facility</th>
                                <th className="p-2 border">Event</th>
                                <th className="p-2 border">Date</th>
                                {/* <th className="p-2 border">booking id</th> */}
                                <th className="p-2 border">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipmentList.map(eq => (
                                <tr key={eq.id} className="hover:bg-red-50 transition-colors">
                                    <td className="p-2 border">{eq.id}</td>

                                    {/* TYPE */}
                                    <td className="p-2 border">
                                        {editingId === eq.id ? (
                                            <input
                                                type="text"
                                                value={editData.type}
                                                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                                                className="border px-2 py-1 w-28 text-sm"
                                            />
                                        ) : (
                                            eq.type
                                        )}
                                    </td>

                                    {/* QUANTITY */}
                                    <td className="p-2 border">
                                        {editingId === eq.id ? (
                                            <input
                                                type="number"
                                                value={editData.quantity}
                                                onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                                                className="border px-2 py-1 w-16 text-sm"
                                            />
                                        ) : (
                                            eq.quantity
                                        )}
                                    </td>

                                    {/* MODEL ID */}
                                    <td className="p-2 border">
                                        {editingId === eq.id ? (
                                            <input
                                                type="text"
                                                value={editData.model_id}
                                                onChange={(e) => setEditData({ ...editData, model_id: e.target.value })}
                                                className="border px-2 py-1 w-20 text-sm"
                                            />
                                        ) : (
                                            eq.model_id || 'N/A'
                                        )}
                                    </td>

                                    {/* FACILITY */}
                                    <td className="p-2 border">{eq.facility}</td>

                                    {/* EVENT */}
                                    <td className="p-2 border">{eq.event_name}</td>

                                    {/* DATE */}
                                    <td className="p-2 border">
                                        {eq.event_date ? new Date(eq.event_date).toLocaleDateString() : 'N/A'}
                                    </td>
                                    {/* <td className="p-2 border">{eq.booking_id}</td> */}

                                    {/* ACTION */}
                                    <td className="p-2 border">
                                        {editingId === eq.id ? (
                                            <div className="flex gap-1 justify-center">
                                                <button
                                                    onClick={() => handleUpdateEquipment(eq.id)}
                                                    className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="bg-gray-400 text-white px-2 py-1 text-xs rounded hover:bg-gray-500"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1 justify-center">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(eq.id);
                                                        setEditData({
                                                            type: eq.type,
                                                            quantity: eq.quantity,
                                                            model_id: eq.model_id || ''
                                                        });
                                                    }}
                                                    className="bg-[#96161C] text-white px-2 py-1 text-xs rounded hover:bg-red-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEquipment(eq.id)}
                                                    className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
