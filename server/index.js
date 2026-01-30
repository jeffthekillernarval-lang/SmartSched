const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});


// asdasd
app.use(cors({ origin: ['http://localhost:3000', 'https://discord-auth-token-bot.onrender.com'] }));
// app.use(cors());
app.use(express.json());
// 
const loginRoute = require('./routes/account/login');
app.use('/api/login', loginRoute);
// 
// Global request logger
// app.use((req, res, next) => {
//     console.log("---- Incoming Request ----");
//     console.log("Method:", req.method);
//     console.log("URL:", req.originalUrl);
//     console.log("Headers:", req.headers);
//     console.log("Body:", req.body);
//     console.log("--------------------------");
//     next();
// });

app.use((req, res, next) => {
    // console.log(`[REQ] ${req.method} ${req.originalUrl}`);
    next();
});
app.get('/api/test', async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
    console.log("object");
});
const authMiddleware = require("./middleware/auth");

app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({ success: true, message: "Protected route", user: req.user });
});

// CHATBOT
const chatbotRoute = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoute);

const updateEquipmentRoute = require('./routes/booking/updateEquipment');
app.use('/api/update-equipment', updateEquipmentRoute);
const deleteEquipmentRoute = require('./routes/booking/deleteEquipment');
app.use('/api/delete-equipment', deleteEquipmentRoute);


const fetchUserRoute = require('./routes/account/fetchUserDetails');
const updateEquipmentModelRoute = require('./routes/booking/updateEquipmentModel');
app.use('/api/update-equipment-model', updateEquipmentModelRoute);
// 
const createBookingRoute = require('./routes/booking/createBooking');
const deleteBookingRoute = require('./routes/booking/deleteBooking');
const fetchBookingRoute = require('./routes/booking/fetchBooking');
const cancelBookingRoute = require('./routes/booking/cancelBooking');
const editBookingRoute = require('./routes/booking/editBooking');
// const fetchVehiclesRoute = require('./routes/booking/fetchVehicles');
const createequipmentRoute = require('./routes/booking/createequipment');
const createNewVehicleBooking = require('./routes/booking/newVehicleBooking');
const vehicleBookingRoute = require('./routes/booking/createVehicleBooking');
const deleteVehicleBooking = require('./routes/booking/deleteVehicleBooking');
const fetchVehicleBookingRoute = require('./routes/booking/fetchVehicleBooking');
const updateBookingStatusRoute = require('./routes/booking/updateBookingStatus');
const fetchVehicleBookingConflicts = require('./routes/booking/fetchBookingConflict');
// dashboard
const statusCountsRoute = require('./routes/dashboard/statusCounts');
// user
const createUserRoute = require('./routes/account/createUser');
const deleteUserRoute = require('./routes/account/deleteUser');
const fetchAllUserRoute = require('./routes/account/fetchUser');
const updateUserRoute = require('./routes/account/updateUser');
// equipment
const fetchAllBookingEquipment = require('./routes/booking/fetchBookingEquipment');
const editBookingEquipmentRoute = require('./routes/booking/editBookingEquipment');
const deleteBookingEquipmentRoute = require('./routes/booking/deleteBookingEquipment');

const downloadAllReportRoute = require('./routes/booking/downloadReports');

// USER
app.use('/api/create-user', createUserRoute);
app.use('/api/delete-user', deleteUserRoute);
app.use('/api/fetchAll-user', fetchAllUserRoute);
app.use('/api/update-user', updateUserRoute);

app.use('/api/download-reports', downloadAllReportRoute);

app.use('/api/fetch-user', fetchUserRoute);
// CREATE
app.use('/api/create-vehicle-booking', createNewVehicleBooking);
app.use('/api/create-booking', createBookingRoute);
app.use('/api/vehicle-booking', vehicleBookingRoute);
app.use('/api/create-equipment', createequipmentRoute);
// UPDATE
app.use('/api/update-booking-status', updateBookingStatusRoute);
// CANCEL
app.use('/api/cancel-booking', cancelBookingRoute);
// DELETE
app.use('/api/delete-booking', deleteBookingRoute);
// FETCH
app.use('/api/fetch-booking-conflicts', fetchVehicleBookingConflicts);
app.use('/api/fetch-bookings', fetchBookingRoute);
app.use('/api/fetch-vehicles', fetchVehicleBookingRoute);
app.use('/api/fetch-booking-equipment', fetchAllBookingEquipment);
// EDIT
app.use('/api/edit-booking', editBookingRoute);
app.use('/api/edit-booking-equipment', editBookingEquipmentRoute);
app.use('/api/delete-booking-equipment', deleteBookingEquipmentRoute);
// DASHBOARD    
app.use('/api/dashboard/status-counts', statusCountsRoute);
app.use('/api/dashboard/status-counts', require('./routes/dashboard/statusCounts'));
app.use('/api/dashboard/monthly-bookings', require('./routes/dashboard/monthlyBookings'));
app.use('/api/dashboard/college-bookings', require('./routes/dashboard/collegeBookings'));
app.use('/api/dashboard/recent-facility-transactions', require('./routes/dashboard/recentFacilityTransactions'));
app.use('/api/dashboard/recent-vehicle-transactions', require('./routes/dashboard/recentVehicleTransactions'));
app.use('/api/vehicle/delete', deleteVehicleBooking);

const editVehicleBooking = require('./routes/booking/editVehicleBooking');
app.use('/api/edit-vehicle-booking', editVehicleBooking);
const updateVehiclePayment = require('./routes/booking/updateVehiclePayment');
app.use('/api/edit-payment', updateVehiclePayment);

app.use('/api/vehicle-conflicts', require('./routes/booking/vehicleConflicts'));
const editPaymentRoute = require('./routes/booking/editPayment');
app.use('/api/edit-payment', editPaymentRoute);


// CRUDS
const updateBookingType = require('./routes/booking/updateBookingType');
app.use('/api/toggle-reservation', updateBookingType);

// AFFILIATION  
const createAffiliationRoute = require('./routes/cruds/createAffiliations');
app.use('/api/create-affiliation', createAffiliationRoute);
const fetchAffiliationRoute = require('./routes/cruds/fetchAffiliations');
app.use('/api/fetch-affiliation', fetchAffiliationRoute);
const updateAffiliationRoute = require('./routes/cruds/updateAffiliation');
app.use('/api/update-affiliation', updateAffiliationRoute);
const deleteAffiliationRoute = require('./routes/cruds/deleteAffiliation');
app.use('/api/delete-affiliation', deleteAffiliationRoute);

// VEHICLE
const createVehicleRoute = require('./routes/cruds/createVehicles');
app.use('/api/create-vehicle', createVehicleRoute);
const fetchVehicleRoute = require('./routes/cruds/fetchVehicles');
app.use('/api/fetch-vehicle', fetchVehicleRoute);
const updateFinalVehiclesRoute = require('./routes/cruds/updateVehicles');
app.use('/api/final-update-vehicles', updateFinalVehiclesRoute);
const deleteFinalVehiclesRoute = require('./routes/cruds/deleteVehicles');
app.use('/api/final-delete-vehicles', deleteFinalVehiclesRoute);

// EQUIPMENT
const createEquipmentsRoute = require('./routes/cruds/createEquipments');
app.use('/api/create-equipments', createEquipmentsRoute);
const fetchEquipmentsRoute = require('./routes/cruds/fetchEquipments');
app.use('/api/fetch-equipments', fetchEquipmentsRoute);
const updateFinalEquipmentsRoute = require('./routes/cruds/updateEquipment');
app.use('/api/final-update-equipment', updateFinalEquipmentsRoute);
const deleteFinlEquipmentsRoute = require('./routes/cruds/deleteEquipment');
app.use('/api/final-delete-equipment', deleteFinlEquipmentsRoute);

// FACILITIES
const createFacilitiesRoute = require('./routes/cruds/createFacilities');
app.use('/api/create-facilities', createFacilitiesRoute);
const fetchFacilitiesRoute = require('./routes/cruds/fetchFacilities');
app.use('/api/fetch-facilities', fetchFacilitiesRoute);
const updateFacilitiesRoute = require('./routes/cruds/updateFacilities');
app.use('/api/update-facilities', updateFacilitiesRoute);
const deleteFacilitiesRoute = require('./routes/cruds/deleteFacilities');
app.use('/api/delete-facilities', deleteFacilitiesRoute);

const createRawVehicleBooking = require('./routes/booking/createRawVehicleBooking');
app.use('/api/create-raw-vehicle-booking', createRawVehicleBooking);
const updateStatusRoute = require('./routes/booking/updateStatus');
app.use('/api/update-status', updateStatusRoute);

const createDriverRoute = require('./routes/cruds/createDriver');
app.use('/api/create-driver', createDriverRoute);
const fetchDriversRoute = require('./routes/cruds/fetchDrivers');
app.use('/api/fetch-drivers', fetchDriversRoute);
const updateDriverRoute = require('./routes/cruds/updateDriver');
app.use('/api/update-driver', updateDriverRoute);
const deleteDriverRoute = require('./routes/cruds/deleteDriver');
app.use('/api/delete-driver', deleteDriverRoute);
const fetchDriversByVehicle = require('./routes/booking/fetch-drivers-by-vehicle');
app.use('/api/drivers-by-vehicle', fetchDriversByVehicle);

const relatedVehicleBookings = require('./routes/cruds/fetchRelatedVehicleBookings')
app.use('/api/related-vehicle-bookings', relatedVehicleBookings);

const userFacilitiesRoute = require('./routes/booking/userFacilities');
app.use('/api/user-facilities', userFacilitiesRoute);
const userFacilitiesFetchRoute = require('./routes/booking/userFacilitiesFetch');
app.use('/api/user-facilities-fetch', userFacilitiesFetchRoute);

const createEquipmentBookingRoute = require('./routes/booking/createEquipmentBooking');
app.use('/api/create-equipment-booking', createEquipmentBookingRoute);

const fetchEquipmentBookingsRoute = require('./routes/booking/fetchEquipmentBookings');
app.use('/api/fetch-equipment-bookings', fetchEquipmentBookingsRoute);
const deleteEquipmentBookingRoute = require('./routes/booking/deleteEquipmentBooking');
app.use('/api/delete-equipment-booking', deleteEquipmentBookingRoute);

const userVehiclesRoutes = require('./routes/booking/userVehicles');
const userEquipmentsRoutes = require('./routes/booking/userEquipments');
const availableEquipments = require('./routes/cruds/availableEquipments');

app.use('/api', userVehiclesRoutes);
app.use('/api', userEquipmentsRoutes);
app.use('/api', availableEquipments);
const updateEquipmentStatus = require('./routes/cruds/updateEquipmentStatus');

app.use('/api/update-equipment-status', updateEquipmentStatus);

const updateEquipmentBooking = require('./routes/cruds/updateEquipmentBooking');
app.use('/api/update-equipment-booking', updateEquipmentBooking);


const fetchUserSidebar = require('./routes/cruds/userSidebarFetch');
app.use('/api/user-sidebar-fetch', fetchUserSidebar);
const userSidebar = require('./routes/cruds/userSidebar');
app.use('/api/user-sidebar', userSidebar);
// const fetchUserSidebar = require('./routes/cruds/fetchUserSidebar');
// app.use('/api/user-sidebar-fetch', fetchUserSidebar);
// 
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
// Catch all unmatched routes
app.use((req, res) => {
    console.log("[404] Route not found:", req.method, req.originalUrl);
    res.status(404).json({ success: false, message: "Route not found" });
});

app.get('/api/bookings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "Booking"'); // Adjust query as needed
        console.log("Bookings fetched from database:", result.rows); // Debugging log
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ success: false, message: "Failed to fetch bookings" });
    }
});
