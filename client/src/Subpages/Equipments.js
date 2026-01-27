import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

export default function Equipments() {
    const [equipments, setEquipments] = useState([]);
    const [form, setForm] = useState({
        name: '',
        control_number: '',
        model_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);


    /* ================= FETCH ================= */
    const fetchEquipments = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/fetch-equipments');
            const data = await res.json();

            if (data.success) {
                setEquipments(data.equipments);
            }
        } catch (err) {
            console.error('Fetch failed', err);
        }
    };

    useEffect(() => {
        fetchEquipments();
    }, []);

    /* ================= FORM ================= */
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({
            name: '',
            control_number: '',
            model_id: ''
        });
    };


    /* ================= CREATE ================= */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const url = editingId
            ? `http://localhost:5000/api/final-update-equipment/${editingId}`
            : 'http://localhost:5000/api/create-equipments';

        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (data.success) {
                fetchEquipments();
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
    const handleEdit = (eq) => {
        setForm({
            name: eq.name,
            control_number: eq.control_number,
            model_id: eq.model_id || ''
        });
        setEditingId(eq.id);
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this equipment?')) return;

        try {
            const res = await fetch(
                `http://localhost:5000/api/final-delete-equipment/${id}`,
                { method: 'DELETE' }
            );

            const data = await res.json();

            if (data.success) {
                setEquipments(prev => prev.filter(e => e.id !== id));
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
                <Package className="w-6 h-6" />
                Equipment Management
            </h1>

            {/* FORM */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-md p-6 mb-8 space-y-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        name="name"
                        placeholder="Equipment Name"
                        value={form.name}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="control_number"
                        placeholder="Control Number"
                        value={form.control_number}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="model_id"
                        placeholder="Model ID"
                        value={form.model_id}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#96161C] text-white px-6 py-2 rounded-lg hover:bg-[#7a1217]"
                    >
                        {editingId ? 'Update Equipment' : 'Add Equipment'}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setEditingId(null);
                            }}
                            className="bg-gray-200 px-6 py-2 rounded-lg ml-3"
                        >
                            Cancel
                        </button>
                    )}

                </div>
            </form>

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-[#96161C]">
                    All Equipments
                </h2>

                <table className="min-w-full table-auto">
                    <thead className="bg-[#96161C] text-white">
                        <tr>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Control #</th>
                            <th className="px-4 py-2">Model ID</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(equipments || []).map(eq => (

                            <tr key={eq.id} className="border-b">
                                <td className="px-4 py-2">{eq.name}</td>
                                <td className="px-4 py-2">{eq.control_number}</td>
                                <td className="px-4 py-2">{eq.model_id || '—'}</td>
                                <td className="px-4 py-2 flex gap-3">
                                    <button
                                        onClick={() => handleEdit(eq)}
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(eq.id)}
                                        className="text-red-600 hover:underline flex items-center gap-1"
                                    >
                                        Delete
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
