import React, { useEffect, useMemo, useState } from 'react';
import { Trash, Edit, Users, Building, Truck, Cable, LayoutList } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [affiliations, setAffiliations] = useState([]);

    // Facilities
    const [facilities, setFacilities] = useState([]);
    const [showFacilitiesModal, setShowFacilitiesModal] = useState(false);
    const [selectedFacilities, setSelectedFacilities] = useState([]);
    const [originalSelectedFacilities, setOriginalSelectedFacilities] = useState([]);
    const [facilitySearch, setFacilitySearch] = useState('');
    const [hasFacilityChanges, setHasFacilityChanges] = useState(false);
    const [savingFacilities, setSavingFacilities] = useState(false);

    // Vehicles
    const [vehicles, setVehicles] = useState([]);
    const [showVehiclesModal, setShowVehiclesModal] = useState(false);
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [originalSelectedVehicles, setOriginalSelectedVehicles] = useState([]);
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [hasVehicleChanges, setHasVehicleChanges] = useState(false);
    const [savingVehicles, setSavingVehicles] = useState(false);

    // Equipment
    const [equipment, setEquipment] = useState([]);
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState([]);
    const [originalSelectedEquipment, setOriginalSelectedEquipment] = useState([]);
    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [hasEquipmentChanges, setHasEquipmentChanges] = useState(false);
    const [savingEquipment, setSavingEquipment] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [showSidebarModal, setShowSidebarModal] = useState(false);
    const [selectedSidebarItems, setSelectedSidebarItems] = useState([]);
    const [originalSelectedSidebarItems, setOriginalSelectedSidebarItems] = useState([]);
    const [hasSidebarChanges, setHasSidebarChanges] = useState(false);
    const [savingSidebar, setSavingSidebar] = useState(false);
    const SIDEBAR_ITEMS = [
        { key: 'facility-dashboard', label: 'Facility Dashboard' },
        { key: 'vehicle-dashboard', label: 'Vehicle Dashboard' },
        { key: 'equipment-dashboard', label: 'Equipment Dashboard' },
        { key: 'universal-calendar', label: 'Universal Calendar' },

        { key: 'calendar', label: 'Facility Calendar' },
        { key: 'booking', label: 'Facility Booking' },

        { key: 'vehicle-calendar', label: 'Vehicle Calendar' },
        { key: 'vehicle-booking', label: 'Vehicle Booking' },

        { key: 'equipment-calendar', label: 'Equipment Calendar' },
        { key: 'equipment-booking', label: 'Equipment Booking' },

        { key: 'user-management', label: 'User Management' },
        { key: 'manage-affiliation', label: 'Affiliations' },
        { key: 'manage-department', label: 'Facilities' },
        { key: 'manage-vehicles', label: 'Vehicles' },
        { key: 'manage-allequipment', label: 'Equipments' },
        { key: 'manage-drivers', label: 'Drivers' },
    ];

    // Form
    const [form, setForm] = useState({
        name: '',
        affiliation: '',
        role: 'user',
        email: '',
        password: '',
    });
    const [editingId, setEditingId] = useState(null);

    // ========================= FETCH DATA =========================
    useEffect(() => {
        const fetchAffiliations = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/fetch-affiliation');
                const data = await res.json();
                if (data.success) setAffiliations(data.affiliations || []);
            } catch (err) {
                console.error('fetch affiliations error:', err);
            }
        };

        const fetchFacilities = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/fetch-facilities');
                const data = await res.json();
                if (data.success) setFacilities(data.facilities || []);
            } catch (err) {
                console.error('fetch facilities error:', err);
            }
        };

        const fetchVehicles = async () => {
            try {
                // ✅ real vehicles endpoint
                const res = await fetch('http://localhost:5000/api/fetch-vehicle');
                const data = await res.json();
                if (data.success) setVehicles(data.vehicles || []);
            } catch (err) {
                console.error('fetch vehicles error:', err);
            }
        };

        const fetchEquipment = async () => {
            try {
                // ✅ real equipments endpoint
                const res = await fetch('http://localhost:5000/api/fetch-equipments');
                const data = await res.json();
                if (data.success) setEquipment(data.equipments || []);
            } catch (err) {
                console.error('fetch equipments error:', err);
            }
        };

        const fetchUsers = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/fetchAll-user');
                const data = await res.json();
                setUsers((data.users || []).filter((u) => !u.deleted));
            } catch (err) {
                console.error('fetch users error:', err);
            }
        };

        fetchAffiliations();
        fetchFacilities();
        fetchVehicles();
        fetchEquipment();
        fetchUsers();
    }, []);

    // ========================= HELPERS =========================
    const normalize = (v) => String(v ?? '').toLowerCase().trim();

    const getItemLabel = (item, type) => {
        if (!item) return '';
        if (type === 'facility') return item.name ?? `Facility #${item.id}`;

        if (type === 'vehicle') {
            // adjust these if your vehicle schema differs
            return (
                item.vehicle_name ||
                item.vehicleType ||
                item.type ||
                item.name ||
                `Vehicle #${item.id}`
            );
        }

        // equipment
        const name = item.name ?? `Equipment #${item.id}`;
        const model = item.model_id ?? item.modelId ?? '';
        return model ? `${name} (${model})` : name;
    };

    const getSearchBlob = (item, type) => {
        if (!item) return '';
        if (type === 'facility') return `${item.name ?? ''} ${item.id ?? ''}`;

        if (type === 'vehicle') {
            return `${item.vehicle_name ?? ''} ${item.vehicleType ?? ''} ${item.type ?? ''} ${item.id ?? ''} ${item.name ?? ''}`;
        }

        // equipment
        return `${item.name ?? ''} ${item.model_id ?? ''} ${item.modelId ?? ''} ${item.control_number ?? ''} ${item.id ?? ''}`;
    };

    // ========================= FORM HANDLERS =========================
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId
            ? `http://localhost:5000/api/update-user/${editingId}`
            : `http://localhost:5000/api/create-user`;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        if (data.success) {
            setForm({ name: '', affiliation: '', role: 'user', email: '', password: '' });
            setEditingId(null);

            const refresh = await fetch('http://localhost:5000/api/fetchAll-user');
            const usersData = await refresh.json();
            setUsers((usersData.users || []).filter((u) => !u.deleted));
        } else {
            alert(data.message || 'Error saving user');
        }
    };

    const handleEdit = (user) => {
        setForm({
            name: user.name,
            email: user.email,
            role: user.role,
            password: '',
            affiliation: user.affiliation ? Number(user.affiliation) : '',
        });
        setEditingId(user.id);
    };
    const toggleSidebarItem = (key) => {
        setSelectedSidebarItems((prev) => {
            const updated = prev.includes(key)
                ? prev.filter((k) => k !== key)
                : [...prev, key];

            setHasSidebarChanges(
                updated.sort().join(',') !==
                originalSelectedSidebarItems.sort().join(',')
            );

            return updated;
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this user?')) return;

        const res = await fetch(`http://localhost:5000/api/delete-user/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) setUsers((prev) => prev.filter((u) => u.id !== id));
        else alert(data.message || 'Delete failed');
    };

    // ========================= MODAL LOGIC =========================
    const openModal = async (user, type) => {
        setSelectedUser(user);

        if (type === 'facility') {
            setFacilitySearch('');
            setHasFacilityChanges(false);
            setSelectedFacilities([]);
            setOriginalSelectedFacilities([]);
            setShowFacilitiesModal(true);

            try {
                const res = await fetch(`http://localhost:5000/api/user-facilities-fetch/${user.id}`);
                const data = await res.json();
                if (data.success) {
                    const assigned = (data.facilities || []).map(Number);
                    setSelectedFacilities(assigned);
                    setOriginalSelectedFacilities(assigned);
                }
            } catch (err) {
                console.error(err);
            }
        }

        if (type === 'vehicle') {
            setVehicleSearch('');
            setHasVehicleChanges(false);
            setSelectedVehicles([]);
            setOriginalSelectedVehicles([]);
            setShowVehiclesModal(true);

            try {
                const res = await fetch(`http://localhost:5000/api/user-vehicles-fetch/${user.id}`);
                const data = await res.json();
                if (data.success) {
                    const assigned = (data.vehicles || []).map(Number);
                    setSelectedVehicles(assigned);
                    setOriginalSelectedVehicles(assigned);
                }
            } catch (err) {
                console.error(err);
            }
        }

        if (type === 'equipment') {
            setEquipmentSearch('');
            setHasEquipmentChanges(false);
            setSelectedEquipment([]);
            setOriginalSelectedEquipment([]);
            setShowEquipmentModal(true);

            try {
                const res = await fetch(`http://localhost:5000/api/user-equipments-fetch/${user.id}`);
                const data = await res.json();
                if (data.success) {
                    const assigned = (data.equipments || []).map(Number);
                    setSelectedEquipment(assigned);
                    setOriginalSelectedEquipment(assigned);
                }
            } catch (err) {
                console.error(err);
            }
        }
        if (type === 'sidebar') {
            setSelectedUser(user);
            setHasSidebarChanges(false);
            setSelectedSidebarItems([]);
            setOriginalSelectedSidebarItems([]);
            setShowSidebarModal(true);

            try {
                const res = await fetch(`http://localhost:5000/api/user-sidebar-fetch/${user.id}`);
                const data = await res.json();
                if (data.success) {
                    setSelectedSidebarItems(data.items || []);
                    setOriginalSelectedSidebarItems(data.items || []);
                }
            } catch (err) {
                console.error(err);
            }
        }

    };

    const toggleItem = (id, type) => {
        if (type === 'facility') {
            setSelectedFacilities((prev) => {
                const updated = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
                setHasFacilityChanges(
                    [...updated].sort((a, b) => a - b).join(',') !==
                    [...originalSelectedFacilities].sort((a, b) => a - b).join(',')
                );
                return updated;
            });
        }

        if (type === 'vehicle') {
            setSelectedVehicles((prev) => {
                const updated = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
                setHasVehicleChanges(
                    [...updated].sort((a, b) => a - b).join(',') !==
                    [...originalSelectedVehicles].sort((a, b) => a - b).join(',')
                );
                return updated;
            });
        }

        if (type === 'equipment') {
            setSelectedEquipment((prev) => {
                const updated = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
                setHasEquipmentChanges(
                    [...updated].sort((a, b) => a - b).join(',') !==
                    [...originalSelectedEquipment].sort((a, b) => a - b).join(',')
                );
                return updated;
            });
        }
    };

    const handleCancelModal = (type) => {
        if (type === 'facility') {
            setSelectedFacilities(originalSelectedFacilities);
            setHasFacilityChanges(false);
        }
        if (type === 'vehicle') {
            setSelectedVehicles(originalSelectedVehicles);
            setHasVehicleChanges(false);
        }
        if (type === 'equipment') {
            setSelectedEquipment(originalSelectedEquipment);
            setHasEquipmentChanges(false);
        }
    };

    const saveModal = async (type) => {
        if (!selectedUser) return;

        // ===================== SIDEBAR (EXIT EARLY) =====================
        if (type === 'sidebar') {
            setSavingSidebar(true);

            try {
                const res = await fetch('http://localhost:5000/api/user-sidebar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: String(selectedUser.id),
                        items: selectedSidebarItems
                    }),
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || 'Failed to save sidebar permissions');
                    return;
                }

                setOriginalSelectedSidebarItems(selectedSidebarItems);
                setHasSidebarChanges(false);
                setShowSidebarModal(false);
            } catch (err) {
                console.error(err);
                alert('Failed to save sidebar permissions');
            } finally {
                setSavingSidebar(false);
            }

            return; // ⛔ CRITICAL: stop here
        }

        // ===================== EXISTING LOGIC =====================
        if (type === 'facility') setSavingFacilities(true);
        if (type === 'vehicle') setSavingVehicles(true);
        if (type === 'equipment') setSavingEquipment(true);

        try {
            let url = '';
            let payloadKey = '';
            let ids = [];

            if (type === 'facility') {
                url = 'http://localhost:5000/api/user-facilities';
                payloadKey = 'facilities';
                ids = selectedFacilities;
            } else if (type === 'vehicle') {
                url = 'http://localhost:5000/api/user-vehicles';
                payloadKey = 'vehicles';
                ids = selectedVehicles;
            } else if (type === 'equipment') {
                url = 'http://localhost:5000/api/user-equipments';
                payloadKey = 'equipments';
                ids = selectedEquipment;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: String(selectedUser.id),
                    [payloadKey]: ids.map(String),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || `Failed to save ${payloadKey}`);
                return;
            }

            if (type === 'facility') {
                setOriginalSelectedFacilities(selectedFacilities);
                setHasFacilityChanges(false);
                setShowFacilitiesModal(false);
            } else if (type === 'vehicle') {
                setOriginalSelectedVehicles(selectedVehicles);
                setHasVehicleChanges(false);
                setShowVehiclesModal(false);
            } else if (type === 'equipment') {
                setOriginalSelectedEquipment(selectedEquipment);
                setHasEquipmentChanges(false);
                setShowEquipmentModal(false);
            }

        } catch (err) {
            console.error(err);
            alert('Failed to save. Check server logs.');
        } finally {
            if (type === 'facility') setSavingFacilities(false);
            if (type === 'vehicle') setSavingVehicles(false);
            if (type === 'equipment') setSavingEquipment(false);
        }
    };


    const filteredItems = (type) => {
        const q =
            type === 'facility' ? facilitySearch : type === 'vehicle' ? vehicleSearch : equipmentSearch;
        const list = type === 'facility' ? facilities : type === 'vehicle' ? vehicles : equipment;

        const query = normalize(q);
        if (!query) return list;

        return list.filter((item) => normalize(getSearchBlob(item, type)).includes(query));
    };

    // ========================= RENDER =========================
    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#96161C]">
                <Users className="w-6 h-6" /> User Management
            </h1>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <input
                        name="email"
                        placeholder="Username"
                        value={form.email}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required
                    />

                    <select
                        name="affiliation"
                        value={form.affiliation}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-2"
                        required
                    >
                        <option value="">Select...</option>
                        {affiliations.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.abbreviation}
                            </option>
                        ))}
                    </select>

                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                    </select>

                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className="border px-3 py-2 rounded-lg"
                        required={!editingId}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="submit"
                        className="bg-[#96161C] text-white px-6 py-2 rounded-lg hover:bg-[#7a1217] transition"
                    >
                        {editingId ? 'Update User' : 'Create User'}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null);
                                setForm({ name: '', affiliation: '', role: 'user', email: '', password: '' });
                            }}
                            className="bg-gray-200 px-6 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* USER TABLE */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-[#96161C]">All Users</h2>

                <table className="min-w-full table-auto">
                    <thead className="bg-[#96161C] text-white text-left">
                        <tr>
                            <th className="px-4 py-2 rounded-tl-xl">Name</th>
                            <th className="px-4 py-2">Username</th>
                            <th className="px-4 py-2">Affiliation</th>
                            <th className="px-4 py-2">Role</th>
                            <th className="px-4 py-2 text-right rounded-tr-xl">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b">
                                <td className="px-4 py-2">{user.name}</td>
                                <td className="px-4 py-2">{user.email}</td>
                                <td className="px-4 py-2">
                                    {affiliations.find((a) => a.id === Number(user.affiliation))?.abbreviation || '—'}
                                </td>
                                <td className="px-4 py-2">{user.role}</td>

                                <td className="px-4 py-2 flex justify-end gap-3">
                                    <button
                                        onClick={() => openModal(user, 'sidebar')}
                                        className="text-indigo-700 hover:text-indigo-900"
                                        title="Manage Sidebar Access"
                                    >
                                        <LayoutList size={18} />
                                    </button>
                                    <button
                                        onClick={() => openModal(user, 'facility')}
                                        className="text-green-700 hover:text-green-900"
                                        title="Manage Facilities"
                                    >
                                        <Building size={18} />
                                    </button>

                                    <button
                                        onClick={() => openModal(user, 'vehicle')}
                                        className="text-purple-700 hover:text-purple-900"
                                        title="Manage Vehicles"
                                    >
                                        <Truck size={18} />
                                    </button>
                                    <button
                                        onClick={() => openModal(user, 'equipment')}
                                        className="text-blue-700 hover:text-blue-900"
                                        title="Manage Equipment"
                                    >
                                        <Cable size={18} />
                                    </button>
                                    {/* <button
                                        onClick={() => openModal(user, 'equipment')}
                                        className="text-orange-600 hover:text-orange-800"
                                        title="Manage Equipment"
                                    >
                                        <Tool size={18} />
                                    </button> */}

                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-600 hover:underline flex items-center gap-1"
                                    >
                                        <Trash size={16} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALS */}
            {showFacilitiesModal && renderModal('facility')}
            {showVehiclesModal && renderModal('vehicle')}
            {showEquipmentModal && renderModal('equipment')}
            {showSidebarModal && renderModal('sidebar')}
        </div>
    );

    // ========================= MODAL RENDER =========================
    function renderModal(type) {
        if (type === 'sidebar') {
            return (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-[#96161C]">
                                    Sidebar Items
                                </h3>
                                <p className="text-sm text-gray-600">
                                    User: <span className="font-semibold">{selectedUser?.name}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSidebarModal(false)}
                                className="text-gray-500 hover:text-black text-2xl leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="max-h-[340px] overflow-y-auto border rounded-xl p-3 space-y-2">
                            {SIDEBAR_ITEMS.map((item) => (
                                <label
                                    key={item.key}
                                    className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedSidebarItems.includes(item.key)}
                                            onChange={() => toggleSidebarItem(item.key)}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                {item.label}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Key: {item.key}
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-5">
                            <div className="text-xs text-gray-500">
                                {hasSidebarChanges ? 'Unsaved changes' : 'No changes'}
                            </div>

                            <div className="flex gap-2">
                                {hasSidebarChanges ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setSelectedSidebarItems(originalSelectedSidebarItems);
                                                setHasSidebarChanges(false);
                                            }}
                                            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            onClick={() => saveModal('sidebar')}
                                            className="px-5 py-2 rounded-xl bg-[#96161C] text-white hover:bg-[#7a1217] transition"
                                            disabled={savingSidebar}
                                        >
                                            {savingSidebar ? 'Saving...' : 'Save'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setShowSidebarModal(false)}
                                        className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
                                    >
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        const items = filteredItems(type);

        const selected =
            type === 'facility' ? selectedFacilities : type === 'vehicle' ? selectedVehicles : selectedEquipment;

        const hasChanges =
            type === 'facility' ? hasFacilityChanges : type === 'vehicle' ? hasVehicleChanges : hasEquipmentChanges;

        const saving =
            type === 'facility' ? savingFacilities : type === 'vehicle' ? savingVehicles : savingEquipment;

        const search =
            type === 'facility' ? facilitySearch : type === 'vehicle' ? vehicleSearch : equipmentSearch;

        const setSearch =
            type === 'facility' ? setFacilitySearch : type === 'vehicle' ? setVehicleSearch : setEquipmentSearch;

        const close =
            type === 'facility'
                ? () => setShowFacilitiesModal(false)
                : type === 'vehicle'
                    ? () => setShowVehiclesModal(false)
                    : () => setShowEquipmentModal(false);

        return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-[#96161C]">
                                {type === 'sidebar'
                                    ? 'Sidebar Items'
                                    : `${type.charAt(0).toUpperCase() + type.slice(1)}s`}
                            </h3>
                            <p className="text-sm text-gray-600">
                                User: <span className="font-semibold">{selectedUser?.name}</span>
                            </p>
                        </div>
                        <button
                            onClick={close}
                            className="text-gray-500 hover:text-black text-2xl leading-none"
                        >
                            ✕
                        </button>
                    </div>

                    {type !== 'sidebar' && (
                        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`Search ${type}...`}
                                className="w-full md:w-2/3 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]/40"
                            />
                            <div className="text-sm text-gray-600">
                                Selected: <span className="font-bold">{selected.length}</span>
                            </div>
                        </div>
                    )}

                    <div className="max-h-[340px] overflow-y-auto border rounded-xl p-3 space-y-2">
                        {items.length === 0 ? (
                            <p className="text-gray-500 text-sm">No items found.</p>
                        ) : (
                            items.map((item) => {
                                const id = type === 'sidebar' ? item.key : Number(item.id);
                                const label =
                                    type === 'sidebar'
                                        ? item.label
                                        : getItemLabel(item, type);

                                const checked =
                                    type === 'sidebar'
                                        ? selected.includes(item.key)
                                        : selected.includes(Number(item.id));

                                return (
                                    <label
                                        key={id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    type === 'sidebar'
                                                        ? toggleSidebarItem(item.key)
                                                        : toggleItem(Number(item.id), type)
                                                }
                                                className="w-4 h-4"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {label}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {type === 'sidebar'
                                                        ? `Key: ${item.key}`
                                                        : `ID: ${item.id}`}
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-5">
                        <div className="text-xs text-gray-500">
                            {hasChanges ? 'Unsaved changes' : 'No changes'}
                        </div>

                        <div className="flex gap-2">
                            {hasChanges ? (
                                <>
                                    <button
                                        onClick={() => handleCancelModal(type)}
                                        className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={() => saveModal(type)}
                                        className="px-5 py-2 rounded-xl bg-[#96161C] text-white hover:bg-[#7a1217] transition disabled:opacity-60"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={close}
                                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
