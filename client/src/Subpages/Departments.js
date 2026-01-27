import React, { useEffect, useState } from 'react';
import { Building, Edit, Trash } from 'lucide-react';

export default function Facilities() {
    const [facilities, setFacilities] = useState([]);
    const [form, setForm] = useState({ name: '', capacity: '', location: '' });
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    /* ================= FETCH ================= */
    const fetchFacilities = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/fetch-facilities');
            const data = await res.json();
            if (data.success) setFacilities(data.facilities);
        } catch (err) {
            console.error('Fetch failed', err);
        }
    };

    useEffect(() => {
        fetchFacilities();
    }, []);

    /* ================= FORM ================= */
    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const resetForm = () => setForm({ name: '', capacity: '', location: '' });

    /* ================= CREATE ================= */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const url = editingId
            ? `http://localhost:5000/api/update-facilities/${editingId}`
            : 'http://localhost:5000/api/create-facilities';

        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (data.success) {
                fetchFacilities();
                resetForm();
                setEditingId(null);
            } else {
                alert(data.message || 'Operation failed');
            }
        } catch (err) {
            console.error('Submit failed', err);
        } finally {
            setLoading(false);
        }
    };
    const handleEdit = (facility) => {
        setForm({
            name: facility.name,
            capacity: facility.capacity,
            location: facility.location
        });
        setEditingId(facility.id);
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this facility?')) return;

        try {
            const res = await fetch(
                `http://localhost:5000/api/delete-facilities/${id}`,
                { method: 'DELETE' }
            );
            const data = await res.json();

            if (data.success) {
                setFacilities(prev => prev.filter(f => f.id !== id));
            } else {
                alert(data.message || 'Delete failed');
            }
        } catch (err) {
            console.error('Delete failed', err);
        }
    };


    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#96161C]">
                <Building className="w-6 h-6" />
                Facility Management
            </h1>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        name="name"
                        placeholder="Facility Name"
                        value={form.name}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="capacity"
                        type="number"
                        min="1"
                        placeholder="Capacity"
                        value={form.capacity}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="location"
                        placeholder="Location"
                        value={form.location}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#96161C] text-white px-6 py-2 rounded-lg hover:bg-[#7a1217]"
                    >
                        {editingId ? 'Update Facility' : 'Add Facility'}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setEditingId(null);
                            }}
                            className="bg-gray-200 px-6 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                    )}

                </div>
            </form>

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-[#96161C]">All Facilities</h2>

                <table className="min-w-full table-auto">
                    <thead className="bg-[#96161C] text-white">
                        <tr>
                            <th className="px-4 py-2 rounded-tl-xl">Name</th>
                            <th className="px-4 py-2">Capacity</th>
                            <th className="px-4 py-2">Location</th>
                            <th className="px-4 py-2 text-right rounded-tr-xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(facilities || []).map(f => (
                            <tr key={f.id} className="border-b">
                                <td className="px-4 py-2">{f.name}</td>
                                <td className="px-4 py-2">{f.capacity}</td>
                                <td className="px-4 py-2">{f.location}</td>
                                <td className="px-4 py-2 flex justify-end gap-3">
                                    <button
                                        onClick={() => handleEdit(f)}
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(f.id)}
                                        className="text-red-600 hover:underline flex items-center gap-1"
                                    >
                                        <Trash size={16} /> Delete
                                    </button>
                                </td>

                            </tr>
                        ))}
                        {facilities.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-4 py-6 text-center text-gray-500">
                                    No facilities added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
