import React, { useEffect, useState } from 'react';
import { Truck, Edit, Trash } from 'lucide-react';

export default function Vehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '', // Updated from vehicle_name to name
        plateNumber: '', // Updated from plate_number to plateNumber
        vin: '',
        type: 'Van', // Updated from vehicle_type to type
        capacity: '' // Updated from passenger_capacity to capacity
    });

    const [editingId, setEditingId] = useState(null);

    const fetchVehicles = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/fetch-vehicle');
            const data = await res.json();

            if (data.success) {
                setVehicles(data.vehicles);
            }
        } catch (err) {
            console.error('Fetch vehicles failed:', err);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({
            name: '', // Updated
            plateNumber: '', // Updated
            vin: '',
            type: 'Van', // Updated
            capacity: '' // Updated
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let url = 'http://localhost:5000/api/create-vehicle';
            let method = 'POST';

            if (editingId) {
                // If editing, call the update endpoint
                url = `http://localhost:5000/api/final-update-vehicles/${editingId}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (data.success) {
                fetchVehicles(); // Refresh list
                resetForm();     // Clear form
            } else {
                alert(data.message || 'Operation failed');
            }
        } catch (err) {
            console.error('Submit failed', err);
        } finally {
            setLoading(false);
        }
    };


    const handleEdit = (v) => {
        setForm({
            name: v.vehicle_name, // Updated
            plateNumber: v.plate_number, // Updated
            vin: v.vin,
            type: v.vehicle_type, // Updated
            capacity: v.passenger_capacity || '' // Updated
        });
        setEditingId(v.id);
    };


    const handleDelete = async (id) => {
        if (!window.confirm('Delete this vehicle?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/final-delete-vehicles/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (data.success) {
                // Remove deleted vehicle from state
                setVehicles(prev => prev.filter(v => v.id !== id));
            } else {
                alert(data.message || 'Delete failed');
            }
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#96161C]">
                <Truck className="w-6 h-6" />
                Vehicle Management
            </h1>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-md p-6 mb-8 space-y-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        name="name" // Updated
                        placeholder="Vehicle Name (e.g. School Van 1)"
                        value={form.name} // Updated
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="plateNumber" // Updated
                        placeholder="Plate Number"
                        value={form.plateNumber} // Updated
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="vin"
                        placeholder="VIN"
                        value={form.vin}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="type" // Updated
                        value={form.type} // Updated
                        placeholder='ex. pickup - van'
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                    />

                    <input
                        name="capacity" // Updated
                        type="number"
                        min="1"
                        placeholder="Passenger Capacity"
                        value={form.capacity} // Updated
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#96161C] text-white px-6 py-2 rounded-lg hover:bg-[#7a1217] transition"
                    >
                        {editingId ? 'Update Vehicle' : 'Add Vehicle'}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-gray-200 px-6 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-[#96161C]">
                    All Vehicles
                </h2>

                <table className="min-w-full table-auto">
                    <thead className="bg-[#96161C] text-white">
                        <tr>
                            <th className="px-4 py-2 rounded-tl-xl">Name</th>
                            <th className="px-4 py-2">Plate</th>
                            <th className="px-4 py-2">VIN</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Capacity</th>
                            <th className="px-4 py-2 text-right rounded-tr-xl">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(v => (
                            <tr key={v.id} className="border-b">
                                <td className="px-4 py-2 font-medium">{v.vehicle_name}</td>
                                <td className="px-4 py-2">{v.plate_number}</td>
                                <td className="px-4 py-2">{v.vin}</td>
                                <td className="px-4 py-2">{v.vehicle_type}</td>
                                <td className="px-4 py-2">{v.passenger_capacity || '—'}</td>
                                <td className="px-4 py-2 flex justify-end gap-3">
                                    <button
                                        onClick={() => handleEdit(v)}
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        className="text-red-600 hover:underline flex items-center gap-1"
                                    >
                                        <Trash size={16} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {vehicles.length === 0 && (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="px-4 py-6 text-center text-gray-500"
                                >
                                    No vehicles added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
