// LandingPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Menu, X, Home, Calendar, ClipboardList, LogOut, User, ScrollText, Hotel, Speaker, Car, UserCog, LifeBuoy
} from 'lucide-react';

import Dashboard from '../Subpages/Dashboard';
import Profile from '../Subpages/Profile';
import CalendarPage from '../Subpages/Facility/FacilityCalendar';
import Booking from '../Subpages/Facility/FacilityBooking';
import VehicleBooking from '../Subpages/Vehicle/VehicleBooking';
import VehicleCalendar from '../Subpages/Vehicle/VehicleCalendar';
import UserManagement from '../Subpages/UserManagement';
import ManageEquipment from '../Subpages/ManageEquipment';
// ADDITIONALS
import Affiliations from '../Subpages/Affiliations';
import Vehicles from '../Subpages/Vehicles';
import Departments from '../Subpages/Departments';
import Equipments from '../Subpages/Equipments';
// DASHBOARD    
import FacilityDashboard from '../Subpages/FacilityDashboard';
import VehicleDashboard from '../Subpages/VehicleDashboard';
import Drivers from '../Subpages/Drivers';
// Equipment
import EquipmentBooking from '../Subpages/Equipment/EquipmentBooking';
import EquipmentCalendar from '../Subpages/Equipment/EquipmentCalendar';
import EquipmentDashboard from '../Subpages/EquipmentDashboard';
import UniversalCalendar from '../Subpages/UniversalCalendar';
// ✅ Updated helper — now handles both facility & vehicle bookings
async function sendCohereChatMessage(message, bookingsPayload = {}, currentDateTime) {
    try {
        const response = await axios.post('http://localhost:5000/api/chatbot', {
            message,
            bookings: bookingsPayload, // contains { facilities, vehicles }
            currentDateTime,
        });
        return response.data.reply;
    } catch (error) {
        console.error('Cohere Chat Error:', error);
        return 'Sorry, something went wrong while chatting with AI.';
    }
}


export default function LandingPage() {
    // ===== State =====
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFacilityOpen, setIsFacilityOpen] = useState(true);
    const [isVehicleOpen, setIsVehicleOpen] = useState(true);
    const [showFacilityBreakdown, setShowFacilityBreakdown] = useState(false);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
        { from: 'bot', text: 'Hi! How can I help you today?, `\n`Would u like to book a Facility or Vehicle for an event?' }
    ]);
    const [isManagementOpen, setIsManagementOpen] = useState(true);
    const [isEquipmentOpen, setisEquipmentOpen] = useState(true);

    const [allowedSidebarItems, setAllowedSidebarItems] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [vehicleBookings, setVehicleBookings] = useState([]);
    const [user, setUser] = useState(null);
    const canSee = (key) => {
        // Admins see everything
        if (user?.role === "SuperAdmin") return true;

        // If no sidebar permissions loaded yet, hide by default
        if (!allowedSidebarItems || allowedSidebarItems.length === 0) return false;

        return allowedSidebarItems.includes(key);
    };

    const toggleChatBot = () => setShowChatbot(!showChatbot);
    useEffect(() => {
        const userId = Number(localStorage.getItem('currentUserId'));
        if (!userId) return;

        fetch(`http://localhost:5000/api/user-sidebar-fetch/${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAllowedSidebarItems(data.items);
                }
            })
            .catch(err => console.error('Sidebar permission fetch error:', err));
    }, []);

    // ===== Chat send handler =====
    const handleSendChat = async () => {
        if (!chatInput.trim()) return;

        const newMessages = [...chatMessages, { from: 'user', text: chatInput }];
        setChatMessages(newMessages);
        setChatInput('');
        setIsBotTyping(true);

        const currentDateTime = new Date().toLocaleString('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
        });

        // Format facility bookings
        const formattedBookings = bookings.map((b) => ({
            name: b.event_name,
            facility: b.event_facility,
            date: b.event_date?.split('T')[0],
            startTime: b.starting_time,
            endTime: b.ending_time,
            requestedBy: b.requested_by,
        }));

        // Format vehicle bookings
        const formattedVehicleBookings = vehicleBookings.map((v) => ({
            vehicle_Type: v.vehicle_Type,
            requestor: v.requestor,
            department: v.department,
            date: v.date,
            purpose: v.purpose,
        }));

        // Combine both
        const bookingsPayload = {
            facilities: formattedBookings,
            vehicles: formattedVehicleBookings,
        };

        try {
            const response = await sendCohereChatMessage(chatInput, bookingsPayload, currentDateTime);
            setChatMessages([...newMessages, { from: 'ai', text: response }]);
        } catch (err) {
            console.error('Chatbot error:', err);
            setChatMessages([...newMessages, { from: 'ai', text: 'Something went wrong. Try again.' }]);
        } finally {
            setIsBotTyping(false);
        }
    };


    // ===== Data fetching =====
    useEffect(() => {
        const userId = Number(localStorage.getItem('currentUserId'));
        if (!userId) return;

        // Facility bookings
        fetch('http://localhost:5000/api/fetch-bookings')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.bookings) {
                    console.log('Facility bookings fetched:', data.bookings);
                    setBookings(data.bookings);
                }
            })
            .catch(err => console.error('Error fetching facility bookings:', err));

        fetch('http://localhost:5000/api/fetch-vehicles')
            .then(res => res.json())
            .then(data => {
                console.log('Raw vehicle response:', data);
                const vehicles = Array.isArray(data) ? data : data.vehicles;
                if (vehicles && vehicles.length > 0) {
                    console.log('Vehicle bookings fetched:', vehicles);
                    setVehicleBookings(vehicles);
                } else {
                    console.warn('No vehicle data found', data);
                }
            })
            .catch(err => console.error('Error fetching vehicle bookings:', err));

        // User
        fetch(`http://localhost:5000/api/fetch-user/${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setUser(data.user);
            })
            .catch(err => console.error('Error fetching user:', err));

    }, []);


    // ===== Admin toggle =====
    useEffect(() => {
        const storedRole = localStorage.getItem('currentUserRole');
        if (storedRole === 'admin') setShowFacilityBreakdown(true);
    }, []);


    // ===== Sidebar handling =====
    const [activePage, setActivePage] = useState(localStorage.getItem('activePage') || 'dashboard');
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleLogout = () => window.location.href = '/';
    const handleSetActivePage = (page) => {
        setActivePage(page);
        localStorage.setItem('activePage', page);
    };


    // ===== Dynamic Page Rendering =====
    let RenderedPage;
    switch (activePage) {
        case 'dashboard': RenderedPage = <Dashboard bookings={bookings} />; break;
        case 'profile': RenderedPage = <Profile />; break;
        case 'user-management': RenderedPage = <UserManagement />; break;
        case 'calendar': RenderedPage = <CalendarPage />; break;
        case 'booking': RenderedPage = <Booking />; break;
        case 'vehicle-calendar': RenderedPage = <VehicleCalendar />; break;
        case 'vehicle-booking': RenderedPage = <VehicleBooking />; break;
        case 'manage-equipment': RenderedPage = <ManageEquipment />; break;
        // 
        case 'manage-affiliation': RenderedPage = <Affiliations />; break;
        case 'manage-department': RenderedPage = <Departments />; break;
        case 'manage-vehicles': RenderedPage = <Vehicles />; break;
        case 'manage-allequipment': RenderedPage = <Equipments />; break;
        case 'facility-dashboard': RenderedPage = < FacilityDashboard />; break;
        case 'vehicle-dashboard': RenderedPage = <VehicleDashboard />; break;
        case 'manage-drivers': RenderedPage = <Drivers />; break;
        case 'equipment-calendar': RenderedPage = <EquipmentCalendar />; break;
        case 'equipment-booking': RenderedPage = <EquipmentBooking />; break;
        case 'equipment-dashboard': RenderedPage = <EquipmentDashboard />; break;
        case 'universal-calendar': RenderedPage = <UniversalCalendar />; break;
        default: RenderedPage = <Dashboard />;
    }

    // ===== JSX =====
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div
                className={`
                    ${isSidebarOpen ? 'w-64' : 'w-16'}
                    transition-all duration-300 min-h-screen flex flex-col py-6 pl-4 bg-[#96161C]
                    overflow-y-auto fixed top-0 left-0 h-screen z-20
                `}
            >
                {/* Sidebar Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center justify-between w-full mb-4 pr-4">
                        <span className={`text-[#ffa7a7] font-bold tracking-widest text-lg ${!isSidebarOpen && 'hidden'}`}>{user?.role?.toUpperCase() || 'USER'}</span>
                        <button onClick={toggleSidebar} className="text-white">{isSidebarOpen ? <X /> : <Menu />}</button>
                    </div>
                    <img
                        src="https://i.pravatar.cc/150?img=6"
                        alt="Profile"
                        className={`rounded-full border-4 border-[#96161C] shadow-lg mb-2 ${isSidebarOpen ? 'w-20 h-20' : 'w-10 h-10'}`}
                    />

                    {isSidebarOpen && (
                        <>
                            <div className="text-lg font-bold text-white">{user?.name || 'User'}</div>
                            <div className="text-sm font-bold text-[#ffa7a7] tracking-widest">{user?.affiliation || ''}</div>
                        </>
                    )}
                </div>

                {/* Sidebar Items */}
                <nav className="flex flex-col gap-2 text-white">
                    {/* {showFacilityBreakdown && (
                        <SidebarItem icon={<Home size={20} />} label="Dashboard" open={isSidebarOpen} onClick={() => handleSetActivePage('dashboard')} />
                    )} */}
                    {canSee('facility-dashboard') && showFacilityBreakdown && (
                        <SidebarItem icon={<Home size={20} />} label="Facility Dashboard" open={isSidebarOpen} onClick={() => handleSetActivePage('facility-dashboard')} />
                    )}

                    {canSee('vehicle-dashboard') && showFacilityBreakdown && (
                        <SidebarItem icon={<Home size={20} />} label="Vehicle Dashboard" open={isSidebarOpen} onClick={() => handleSetActivePage('vehicle-dashboard')} />
                    )}

                    {canSee('equipment-dashboard') && showFacilityBreakdown && (
                        <SidebarItem icon={<Home size={20} />} label="Equipment Dashboard" open={isSidebarOpen} onClick={() => handleSetActivePage('equipment-dashboard')} />
                    )}

                    {canSee('universal-calendar') && showFacilityBreakdown && (
                        <SidebarItem icon={<Home size={20} />} label="Universal Calendar" open={isSidebarOpen} onClick={() => handleSetActivePage('universal-calendar')} />
                    )}

                    {canSee('profile') && (
                        <SidebarItem icon={<User size={20} />} label="Profile" open={isSidebarOpen} onClick={() => handleSetActivePage('profile')} />
                    )}
                    {/* Management Section (group label only, collapsible) */}
                    {user?.role === 'admin' && isSidebarOpen && (
                        <>
                            <button
                                onClick={() => setIsManagementOpen(!isManagementOpen)}
                                className="px-2 pt-4 text-xs font-bold text-[#ffa7a7] uppercase tracking-wider text-left w-full"
                            >
                                Management {isManagementOpen ? '▾' : '▸'}
                            </button>

                            {isManagementOpen && (
                                <>
                                    {canSee('user-management') && (
                                        <SidebarItem icon={<UserCog size={20} />} label="User Management" open={isSidebarOpen} onClick={() => handleSetActivePage('user-management')} />
                                    )}
                                    {canSee('manage-affiliation') && (
                                        <SidebarItem icon={<ScrollText size={20} />} label="Affiliations" open={isSidebarOpen} onClick={() => handleSetActivePage('manage-affiliation')} />
                                    )}
                                    {canSee('manage-department') && (
                                        <SidebarItem icon={<Hotel size={20} />} label="Facilities" open={isSidebarOpen} onClick={() => handleSetActivePage('manage-department')} />
                                    )}
                                    {canSee('manage-vehicles') && (
                                        <SidebarItem icon={<Car size={20} />} label="Vehicles" open={isSidebarOpen} onClick={() => handleSetActivePage('manage-vehicles')} />
                                    )}
                                    {canSee('manage-allequipment') && (
                                        <SidebarItem icon={<Speaker size={20} />} label="Equipments" open={isSidebarOpen} onClick={() => handleSetActivePage('manage-allequipment')} />
                                    )}
                                    {canSee('manage-drivers') && (
                                        <SidebarItem icon={<LifeBuoy size={20} />} label="Drivers" open={isSidebarOpen} onClick={() => handleSetActivePage('manage-drivers')} />
                                    )}
                                </>
                            )}
                        </>
                    )}


                    <button
                        onClick={() => setisEquipmentOpen(!isEquipmentOpen)}
                        className="px-2 pt-4 text-xs font-bold text-[#ffa7a7] uppercase tracking-wider text-left w-full"
                    >
                        Equipment Bookings {isEquipmentOpen ? '▾' : '▸'}
                    </button>
                    {canSee('equipment-calendar') || canSee('equipment-booking') ? (
                        <>
                            <button
                                onClick={() => setisEquipmentOpen(!isEquipmentOpen)}
                                className="px-2 pt-4 text-xs font-bold text-[#ffa7a7] uppercase tracking-wider text-left w-full"
                            >
                                Equipment Bookings {isEquipmentOpen ? '▾' : '▸'}
                            </button>

                            {isEquipmentOpen && (
                                <>
                                    {canSee('equipment-calendar') && (
                                        <SidebarItem icon={<UserCog size={20} />} label="Equipment Calendar" open={isSidebarOpen} onClick={() => handleSetActivePage('equipment-calendar')} />
                                    )}
                                    {canSee('equipment-booking') && (
                                        <SidebarItem icon={<ScrollText size={20} />} label="Equipment Booking" open={isSidebarOpen} onClick={() => handleSetActivePage('equipment-booking')} />
                                    )}
                                </>
                            )}
                        </>
                    ) : null}


                    {/* Facility Section */}
                    {canSee('calendar') || canSee('booking') ? (
                        <>
                            <button
                                onClick={() => setIsFacilityOpen(!isFacilityOpen)}
                                className="px-2 pt-4 text-xs font-bold text-[#ffa7a7] uppercase tracking-wider text-left w-full"
                            >
                                Facility Bookings {isFacilityOpen ? '▾' : '▸'}
                            </button>

                            {isFacilityOpen && (
                                <>
                                    {canSee('calendar') && (
                                        <SidebarItem icon={<Calendar size={20} />} label="Facility Calendar" open={isSidebarOpen} onClick={() => handleSetActivePage('calendar')} />
                                    )}
                                    {canSee('booking') && (
                                        <SidebarItem icon={<ClipboardList size={20} />} label="Facility Bookings" open={isSidebarOpen} onClick={() => handleSetActivePage('booking')} />
                                    )}
                                </>
                            )}
                        </>
                    ) : null}


                    {/* Vehicle Section */}
                    {canSee('vehicle-calendar') || canSee('vehicle-booking') ? (
                        <>
                            <button
                                onClick={() => setIsVehicleOpen(!isVehicleOpen)}
                                className="px-2 pt-4 text-xs font-bold text-[#ffa7a7] uppercase tracking-wider text-left w-full"
                            >
                                Vehicle Bookings {isVehicleOpen ? '▾' : '▸'}
                            </button>

                            {isVehicleOpen && (
                                <>
                                    {canSee('vehicle-calendar') && (
                                        <SidebarItem icon={<Calendar size={20} />} label="Vehicle Calendar" open={isSidebarOpen} onClick={() => handleSetActivePage('vehicle-calendar')} />
                                    )}
                                    {canSee('vehicle-booking') && (
                                        <SidebarItem icon={<ClipboardList size={20} />} label="Vehicle Bookings" open={isSidebarOpen} onClick={() => handleSetActivePage('vehicle-booking')} />
                                    )}
                                </>
                            )}
                        </>
                    ) : null}


                    <SidebarItem icon={<LogOut size={20} />} label="Logout" open={isSidebarOpen} onClick={handleLogout} />
                </nav>
            </div>

            {/* Main Content */}
            <div className={`flex-1 p-6 transition-all duration-300`} style={{ marginLeft: isSidebarOpen ? '16rem' : '4rem' }}>
                {RenderedPage}
            </div>

            {/* Floating Chatbot Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={toggleChatBot}
                    className="bg-[#96161C] hover:bg-red-800 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2"
                >
                    🤖 <span className="hidden sm:inline">AI Assistant</span>
                </button>
            </div>

            {/* Chatbot Interface */}
            {showChatbot && (
                <div className="fixed bottom-20 right-6 w-[820px] h-[650px] bg-white border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-[#96161C] text-white">
                        <h2 className="font-semibold text-lg">Booking Assistant</h2>
                        <button onClick={() => setShowChatbot(false)} className="text-white hover:text-gray-300">✖</button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {chatMessages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-lg text-sm max-w-[70%] break-words whitespace-pre-line
                                    ${msg.from === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isBotTyping && (
                            <div className="flex justify-start">
                                <div className="px-4 py-2 text-sm bg-gray-200 text-gray-600 rounded-lg animate-pulse">
                                    Typing<span className="animate-bounce">...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="flex items-center p-3 border-t gap-2 bg-white">
                        <input
                            type="text"
                            className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                            placeholder="Type your message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        />
                        <button
                            onClick={handleSendChat}
                            className="bg-[#96161C] hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


// ✅ Reusable Sidebar Item
const SidebarItem = ({ icon, label, open, onClick }) => (
    <div
        className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition hover:bg-white/20 hover:text-white active:bg-white/30"
        onClick={onClick}
    >
        {icon}
        {open && <span className="text-sm">{label}</span>}
    </div>
);
