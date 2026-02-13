import React, { useEffect, useState } from "react";
import { Chart } from "react-google-charts";

export default function DriverScheduleTimeline() {
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [drivers, setDrivers] = useState(["All"]);
    const [vehicles, setVehicles] = useState(["All"]);
    const [selectedDriver, setSelectedDriver] = useState("All");
    const [selectedVehicle, setSelectedVehicle] = useState("All");
    const [viewMode, setViewMode] = useState("Month");
    const getToday = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const [currentDate, setCurrentDate] = useState(getToday());
    const moveNext = () => {
        const newDate = new Date(currentDate);

        if (viewMode === "Day") newDate.setDate(newDate.getDate() + 1);
        if (viewMode === "Week") newDate.setDate(newDate.getDate() + 7);
        if (viewMode === "Month") newDate.setMonth(newDate.getMonth() + 1);

        setCurrentDate(newDate);
    };

    const movePrevious = () => {
        const newDate = new Date(currentDate);

        if (viewMode === "Day") newDate.setDate(newDate.getDate() - 1);
        if (viewMode === "Week") newDate.setDate(newDate.getDate() - 7);
        if (viewMode === "Month") newDate.setMonth(newDate.getMonth() - 1);

        setCurrentDate(newDate);
    };

    useEffect(() => {
        fetch("http://localhost:5000/api/fetch-vehicles")
            .then(res => res.json())
            .then(data => {
                const bookings = Array.isArray(data) ? data : [];

                const driverList = [
                    "All",
                    ...new Set(bookings.map(b => b.driver_name).filter(Boolean))
                ];

                const vehicleList = [
                    "All",
                    ...new Set(bookings.map(b => b.vehicle_name).filter(Boolean))
                ];

                setDrivers(driverList);
                setVehicles(vehicleList);
                setRawData(bookings);
            });
    }, []);

    useEffect(() => {
        const rows = [
            [
                { type: "string", id: "Driver" },
                { type: "string", id: "Booking" },
                { type: "date", id: "Start" },
                { type: "date", id: "End" }
            ]
        ];

        const { start, end } = getDateWindow();

        let hasVisibleBooking = false;

        rawData
            .filter(b =>
                (selectedDriver === "All" || b.driver_name === selectedDriver) &&
                (selectedVehicle === "All" || b.vehicle_name === selectedVehicle)
            )
            .forEach(b => {

                if (!b.start_datetime || !b.end_datetime) return;

                const bookingStart = new Date(b.start_datetime);
                const bookingEnd = new Date(b.end_datetime);

                // Only show bookings overlapping current window
                if (bookingEnd > start && bookingStart < end) {
                    hasVisibleBooking = true;

                    rows.push([
                        b.driver_name,
                        `${b.vehicle_name}
 ${new Date(b.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
-
${new Date(b.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        ,
                        bookingStart,
                        bookingEnd
                    ]);
                }
            });

        // 👇 FORCE WINDOW EVEN IF EMPTY
        // if (!hasVisibleBooking) {
        //     rows.push([
        //         " ",
        //         " ",
        //         start,
        //         end
        //     ]);
        // }
        if (!hasVisibleBooking) {
            const anchor = new Date(start);
            const tiny = new Date(start);
            tiny.setMilliseconds(tiny.getMilliseconds() + 1);

            rows.push([
                "",
                "",
                anchor,
                tiny
            ]);
        }

        setFilteredData(rows);

    }, [rawData, selectedDriver, selectedVehicle, viewMode, currentDate]);


    const getHeight = () => {
        if (viewMode === "Day") return 300;
        if (viewMode === "Week") return 400;
        return 500;
    };

    const getDateWindow = () => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (viewMode === "Day") {
            end.setDate(start.getDate() + 1);
        }

        if (viewMode === "Week") {
            const day = start.getDay();
            start.setDate(start.getDate() - day);
            end.setTime(start.getTime());
            end.setDate(start.getDate() + 7);
        }

        if (viewMode === "Month") {
            start.setDate(1);
            end.setMonth(start.getMonth() + 1);
            end.setDate(1);
        }

        return { start, end };
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-10">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">

                <h2 className="text-2xl font-bold text-[#96161C]">
                    Driver Schedule Timeline
                </h2>

                <div className="flex items-center gap-4">

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={movePrevious}
                            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                        >
                            ←
                        </button>

                        <span className="font-semibold text-gray-700">
                            {viewMode === "Day" && currentDate.toDateString()}

                            {viewMode === "Week" && (
                                `${getDateWindow().start.toDateString()} - ${getDateWindow().end.toDateString()}`
                            )}

                            {viewMode === "Month" && (
                                currentDate.toLocaleString("default", { month: "long", year: "numeric" })
                            )}

                        </span>

                        <button
                            onClick={moveNext}
                            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                        >
                            →
                        </button>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                        {["Day", "Week", "Month"].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-1 rounded-lg text-sm font-semibold transition ${viewMode === mode
                                    ? "bg-[#96161C] text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                </div>
            </div>


            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">

                <select
                    value={selectedDriver}
                    onChange={e => setSelectedDriver(e.target.value)}
                    className="border rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#96161C]"
                >
                    {drivers.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>

                <select
                    value={selectedVehicle}
                    onChange={e => setSelectedVehicle(e.target.value)}
                    className="border rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#96161C]"
                >
                    {vehicles.map(v => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
            </div>

            {/* Timeline Chart */}
            <Chart
                chartType="Timeline"
                width="100%"
                height={`${getHeight()}px`}
                data={filteredData}
                options={{
                    timeline: { groupByRowLabel: true },

                    hAxis: {
                        minValue: getDateWindow().start,
                        maxValue: getDateWindow().end,

                        format:
                            viewMode === "Day"
                                ? "HH:mm"
                                : viewMode === "Week"
                                    ? "EEE dd"
                                    : "dd",

                        gridlines: {
                            count:
                                viewMode === "Day"
                                    ? 6
                                    : viewMode === "Week"
                                        ? 7
                                        : 31
                        }
                    },

                    backgroundColor: "#fafafa"
                }}

            />


        </div>
    );
}
