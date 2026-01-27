-- Table: public.Actions

-- DROP TABLE IF EXISTS public."Actions";

CREATE TABLE IF NOT EXISTS public."Actions"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "timestamp" timestamp without time zone NOT NULL,
    booking_id integer,
    user_id integer,
    action_type character varying COLLATE pg_catalog."default",
    CONSTRAINT "Actions_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Actions"
    OWNER to postgres;

    -- Table: public.Affiliations

-- DROP TABLE IF EXISTS public."Affiliations";

CREATE TABLE IF NOT EXISTS public."Affiliations"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    abbreviation character varying COLLATE pg_catalog."default",
    meaning character varying COLLATE pg_catalog."default",
    moderator character varying COLLATE pg_catalog."default",
    enabled boolean DEFAULT true,
    CONSTRAINT "Affiliations_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Affiliations"
    OWNER to postgres;
    -- Table: public.Booking

-- DROP TABLE IF EXISTS public."Booking";

CREATE TABLE IF NOT EXISTS public."Booking"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    event_date date,
    starting_time time without time zone,
    ending_time time without time zone,
    event_name character varying(50) COLLATE pg_catalog."default",
    event_facility character varying(50) COLLATE pg_catalog."default",
    requested_by character varying(20) COLLATE pg_catalog."default",
    organization character varying(40) COLLATE pg_catalog."default",
    contact character varying(11) COLLATE pg_catalog."default",
    creator_id integer,
    status character varying COLLATE pg_catalog."default",
    deleted boolean DEFAULT false,
    reservation boolean DEFAULT true,
    insider character varying COLLATE pg_catalog."default",
    booking_fee integer DEFAULT 0,
    schedules jsonb,
    CONSTRAINT "Booking_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Booking"
    OWNER to postgres;
    -- Table: public.Equipment

-- DROP TABLE IF EXISTS public."Equipment";

CREATE TABLE IF NOT EXISTS public."Equipment"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    type character varying COLLATE pg_catalog."default",
    quantity integer,
    booking_id integer,
    model_id character varying COLLATE pg_catalog."default",
    CONSTRAINT "Equipment_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Equipment"
    OWNER to postgres;
    -- Table: public.Equipments

-- DROP TABLE IF EXISTS public."Equipments";

CREATE TABLE IF NOT EXISTS public."Equipments"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    name character varying COLLATE pg_catalog."default",
    control_number character varying COLLATE pg_catalog."default",
    model_id character varying COLLATE pg_catalog."default",
    enabled boolean DEFAULT true,
    CONSTRAINT "Equipments_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Equipments"
    OWNER to postgres;
    -- Table: public.Facilities

-- DROP TABLE IF EXISTS public."Facilities";

CREATE TABLE IF NOT EXISTS public."Facilities"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    name character varying COLLATE pg_catalog."default",
    capacity integer,
    location character varying COLLATE pg_catalog."default",
    enabled boolean DEFAULT true,
    CONSTRAINT "Facilities_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Facilities"
    OWNER to postgres;
    -- Table: public.Facility-Vehicle-Pivot

-- DROP TABLE IF EXISTS public."Facility-Vehicle-Pivot";

CREATE TABLE IF NOT EXISTS public."Facility-Vehicle-Pivot"
(
    pivot_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    booking_id character varying COLLATE pg_catalog."default",
    vehiclebooking_id character varying COLLATE pg_catalog."default",
    CONSTRAINT "Facility-Vehicle-Pivot_pkey" PRIMARY KEY (pivot_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Facility-Vehicle-Pivot"
    OWNER to postgres;
    -- Table: public.Notification

-- DROP TABLE IF EXISTS public."Notification";

CREATE TABLE IF NOT EXISTS public."Notification"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    booking_id integer,
    message_title character varying(30) COLLATE pg_catalog."default",
    message_body character varying(115) COLLATE pg_catalog."default",
    sender_id integer,
    receiver_id integer,
    "timestamp" timestamp without time zone[],
    status character varying COLLATE pg_catalog."default",
    CONSTRAINT "Notification_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Notification"
    OWNER to postgres;
    -- Table: public.User

-- DROP TABLE IF EXISTS public."User";

CREATE TABLE IF NOT EXISTS public."User"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 5 MINVALUE 5 MAXVALUE 99999999 CACHE 1 ),
    name character varying(20) COLLATE pg_catalog."default",
    affiliation character varying(20) COLLATE pg_catalog."default",
    role character varying(20) COLLATE pg_catalog."default",
    email character varying(20) COLLATE pg_catalog."default",
    password character varying(20) COLLATE pg_catalog."default",
    deleted boolean DEFAULT false,
    CONSTRAINT "User_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."User"
    OWNER to postgres;
    -- Table: public.VehicleBooking

-- DROP TABLE IF EXISTS public."VehicleBooking";

CREATE TABLE IF NOT EXISTS public."VehicleBooking"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    vehicle_id character varying(20) COLLATE pg_catalog."default",
    requestor character varying(20) COLLATE pg_catalog."default",
    department_id character varying(20) COLLATE pg_catalog."default",
    date date,
    purpose character varying(100) COLLATE pg_catalog."default",
    booker_id integer,
    deleted boolean NOT NULL DEFAULT false,
    payment integer DEFAULT 0,
    status character varying COLLATE pg_catalog."default",
    CONSTRAINT "VehicleBooking_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."VehicleBooking"
    OWNER to postgres;
    -- Table: public.Vehicles

-- DROP TABLE IF EXISTS public."Vehicles";

CREATE TABLE IF NOT EXISTS public."Vehicles"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    vehicle_name character varying COLLATE pg_catalog."default",
    plate_number character varying COLLATE pg_catalog."default",
    vehicle_type character varying COLLATE pg_catalog."default",
    vin character varying COLLATE pg_catalog."default",
    passenger_capacity character varying COLLATE pg_catalog."default",
    enabled boolean DEFAULT true,
    CONSTRAINT "Vehicles_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Vehicles"
    OWNER to postgres;



    CREATE TABLE "Drivers" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    age INT,
    gender TEXT,
    contact_number TEXT,
    enabled BOOLEAN DEFAULT true
);

CREATE TABLE "DriverVehicles" (
    id SERIAL PRIMARY KEY,
    driver_id INT REFERENCES "Drivers"(id) ON DELETE CASCADE,
    vehicle_id INT REFERENCES "Vehicles"(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    UNIQUE (driver_id, vehicle_id)
);
