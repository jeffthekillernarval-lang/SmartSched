import React, { useEffect, useState } from 'react';
import { User, Edit, Trash } from 'lucide-react';

export default function Drivers() {
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        name: '',
        age: '',
        gender: '',
        contactNumber: '',
        licenseNumber: '',
        drivableVehicles: []
    });

    /* ---------------- FETCH DATA ---------------- */

    const fetchDrivers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/fetch-drivers');
            const data = await res.json();
            if (data.success) setDrivers(data.drivers);
        } catch (err) {
            console.error('Fetch drivers failed:', err);
        }
    };

    const fetchVehicles = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/fetch-vehicle');
            const data = await res.json();
            if (data.success) setVehicles(data.vehicles);
        } catch (err) {
            console.error('Fetch vehicles failed:', err);
        }
    };

    useEffect(() => {
        fetchDrivers();
        fetchVehicles();
    }, []);

    /* ---------------- FORM HANDLERS ---------------- */

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const toggleVehicle = (vehicleId) => {
        setForm(prev => ({
            ...prev,
            drivableVehicles: prev.drivableVehicles.includes(vehicleId)
                ? prev.drivableVehicles.filter(id => id !== vehicleId)
                : [...prev.drivableVehicles, vehicleId]
        }));
    };

    const resetForm = () => {
        setForm({
            name: '',
            age: '',
            gender: '',
            contactNumber: '',
            licenseNumber: '',
            drivableVehicles: []
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let url = 'http://localhost:5000/api/create-driver';
            let method = 'POST';

            if (editingId) {
                url = `http://localhost:5000/api/update-driver/${editingId}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (data.success) {
                fetchDrivers();
                resetForm();
            } else {
                alert(data.message || 'Operation failed');
            }
        } catch (err) {
            console.error('Submit failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (d) => {
        setForm({
            name: d.name,
            age: d.age,
            gender: d.gender,
            contactNumber: d.contact_number,
            licenseNumber: d.liscence_id_number,
            drivableVehicles: d.drivable_vehicle_ids || []
        });
        setEditingId(d.id);
    };


    const handleDelete = async (id) => {
        if (!window.confirm('Delete this driver?')) return;

        try {
            const res = await fetch(
                `http://localhost:5000/api/delete-driver/${id}`,
                { method: 'DELETE' }
            );
            const data = await res.json();

            if (data.success) {
                setDrivers(prev => prev.filter(d => d.id !== id));
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    /* ---------------- UI ---------------- */

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#96161C]">
                <User className="w-6 h-6" />
                Driver Management
            </h1>

            {/* FORM */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-md p-6 mb-8 space-y-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        name="name"
                        placeholder="Driver Name"
                        value={form.name}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="age"
                        type="number"
                        min="18"
                        placeholder="Age"
                        value={form.age}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    >
                        <option value="">Gender</option>
                        <option>Male</option>
                        <option>Female</option>

                    </select>

                    <input
                        name="contactNumber"
                        placeholder="Contact Number"
                        value={form.contactNumber}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="licenseNumber"
                        placeholder="License ID Number"
                        value={form.licenseNumber}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />
                </div>

                {/* Drivable Vehicles */}
                <div>
                    <p className="font-semibold mb-2 text-[#96161C]">
                        Drivable Vehicles
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {vehicles.map(v => (
                            <label
                                key={v.id}
                                className="flex items-center gap-2 border rounded-lg px-3 py-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={form.drivableVehicles.includes(v.id)}
                                    onChange={() => toggleVehicle(v.id)}
                                />
                                {v.vehicle_name}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#96161C] text-white px-6 py-2 rounded-lg hover:bg-[#7a1217]"
                    >
                        {editingId ? 'Update Driver' : 'Add Driver'}
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

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-[#96161C]">
                    All Drivers
                </h2>

                <table className="min-w-full table-auto">
                    <thead className="bg-[#96161C] text-white">
                        <tr>
                            <th className="px-4 py-2 rounded-tl-xl">Name</th>
                            <th className="px-4 py-2">Contact</th>
                            <th className="px-4 py-2">License</th>
                            <th className="px-4 py-2">Vehicles</th>
                            <th className="px-4 py-2 text-right rounded-tr-xl">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map(d => (
                            <tr key={d.id} className="border-b">
                                <td className="px-4 py-2 font-medium">{d.name}</td>
                                <td className="px-4 py-2">{d.contact_number}</td>
                                <td className="px-4 py-2">{d.liscence_id_number}</td>
                                <td className="px-4 py-2">
                                    {d.vehicle_names?.join(', ') || '—'}
                                </td>
                                <td className="px-4 py-2 flex justify-end gap-3">
                                    <button
                                        onClick={() => handleEdit(d)}
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(d.id)}
                                        className="text-red-600 hover:underline flex items-center gap-1"
                                    >
                                        <Trash size={16} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {drivers.length === 0 && (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="px-4 py-6 text-center text-gray-500"
                                >
                                    No drivers added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
