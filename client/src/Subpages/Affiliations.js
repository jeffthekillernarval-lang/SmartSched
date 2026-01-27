import React, { useEffect, useState } from 'react';
import { Trash, Edit, Building2 } from 'lucide-react';

export default function Affiliations() {
    const [affiliations, setAffiliations] = useState([]);
    const [form, setForm] = useState({
        abbr: '',
        meaning: '',
        moderator: ''
    });
    const [editingId, setEditingId] = useState(null);



    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({ abbr: '', meaning: '', moderator: '' });
        setEditingId(null);
    };
    const fetchAffiliations = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/fetch-affiliation');
            const data = await res.json();

            if (data.success) {
                setAffiliations(data.affiliations);
            }
        } catch (err) {
            console.error('Fetch affiliations failed:', err);
        }
    };

    useEffect(() => {
        fetchAffiliations();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = editingId
            ? `http://localhost:5000/api/update-affiliation/${editingId}`
            : 'http://localhost:5000/api/create-affiliation';

        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                abbr: form.abbr,
                meaning: form.meaning,
                moderator: form.moderator
            })
        });

        const data = await res.json();

        if (data.success) {
            if (editingId) {
                // update list in-place
                setAffiliations(prev =>
                    prev.map(a =>
                        a.id === editingId ? data.affiliation : a
                    )
                );
            } else {
                // add new
                setAffiliations(prev => [...prev, data.affiliation]);
            }

            resetForm();
        } else {
            alert(data.message || 'Operation failed');
        }
    };



    const handleEdit = (aff) => {
        setForm({
            abbr: aff.abbreviation,
            meaning: aff.meaning,
            moderator: aff.moderator
        });
        setEditingId(aff.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this affiliation?')) return;

        try {
            const res = await fetch(
                `http://localhost:5000/api/delete-affiliation/${id}`,
                { method: 'DELETE' }
            );

            const data = await res.json();

            if (data.success) {
                setAffiliations(prev => prev.filter(a => a.id !== id));
            } else {
                alert(data.message || 'Failed to delete affiliation');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Server error');
        }
    };


    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#96161C]">
                <Building2 className="w-6 h-6" />
                Affiliation Management
            </h1>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-md p-6 mb-8 space-y-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        name="abbr"
                        placeholder="Abbreviation (e.g. AGSO)"
                        value={form.abbr}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="meaning"
                        placeholder="Meaning (e.g. Administrative & General Services Office)"
                        value={form.meaning}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="moderator"
                        placeholder="Moderator (e.g. Juan Dela Cruz)"
                        value={form.moderator}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="submit"
                        className="bg-[#96161C] text-white px-6 py-2 rounded-lg hover:bg-[#7a1217] transition"
                    >
                        {editingId ? 'Update Affiliation' : 'Create Affiliation'}
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
                    All Affiliations
                </h2>

                <table className="min-w-full table-auto">
                    <thead className="bg-[#96161C] text-white text-left">
                        <tr>
                            <th className="px-4 py-2 rounded-tl-xl">Abbr</th>
                            <th className="px-4 py-2">Meaning</th>
                            <th className="px-4 py-2">Moderator</th>
                            <th className="px-4 py-2 text-right rounded-tr-xl">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {affiliations.map(aff => (
                            <tr key={aff.id} className="border-b">
                                <td className="px-4 py-2 font-semibold">
                                    {aff.abbreviation}
                                </td>
                                <td className="px-4 py-2">
                                    {aff.meaning}
                                </td>
                                <td className="px-4 py-2">
                                    {aff.moderator}
                                </td>
                                <td className="px-4 py-2 flex justify-end gap-3">
                                    <button
                                        onClick={() => handleEdit(aff)}
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(aff.id)}
                                        className="text-red-600 hover:underline flex items-center gap-1"
                                    >
                                        <Trash size={16} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {affiliations.length === 0 && (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="px-4 py-6 text-center text-gray-500"
                                >
                                    No affiliations created yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
