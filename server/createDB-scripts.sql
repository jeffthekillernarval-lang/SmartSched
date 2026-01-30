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
-- Table: public.DriverVehicles

-- DROP TABLE IF EXISTS public."DriverVehicles";

CREATE TABLE IF NOT EXISTS public."DriverVehicles"
(
    id integer NOT NULL DEFAULT nextval('"DriverVehicles_id_seq"'::regclass),
    driver_id integer,
    vehicle_id integer,
    enabled boolean DEFAULT true,
    CONSTRAINT "DriverVehicles_pkey" PRIMARY KEY (id),
    CONSTRAINT "DriverVehicles_driver_id_vehicle_id_key" UNIQUE (driver_id, vehicle_id),
    CONSTRAINT "DriverVehicles_driver_id_fkey" FOREIGN KEY (driver_id)
        REFERENCES public."Drivers" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT "DriverVehicles_vehicle_id_fkey" FOREIGN KEY (vehicle_id)
        REFERENCES public."Vehicles" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."DriverVehicles"
    OWNER to postgres;

-- Table: public.Drivers

-- DROP TABLE IF EXISTS public."Drivers";

CREATE TABLE IF NOT EXISTS public."Drivers"
(
    id integer NOT NULL DEFAULT nextval('"Drivers_id_seq"'::regclass),
    name text COLLATE pg_catalog."default" NOT NULL,
    age integer,
    gender text COLLATE pg_catalog."default",
    contact_number text COLLATE pg_catalog."default",
    enabled boolean DEFAULT true,
    liscence_id_number text COLLATE pg_catalog."default",
    CONSTRAINT "Drivers_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Drivers"
    OWNER to postgres;
-- Table: public.Equipment

-- DROP TABLE IF EXISTS public."Equipment";

CREATE TABLE IF NOT EXISTS public."Equipment"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    equipment_type_id integer NOT NULL,
    quantity integer NOT NULL,
    affiliation_id integer NOT NULL,
    facility_id integer NOT NULL,
    dates date[] NOT NULL,
    purpose text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    time_start time without time zone,
    time_end time without time zone,
    status text COLLATE pg_catalog."default" NOT NULL DEFAULT 'Pending'::text,
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
-- Table: public.User-Equipment-Pivot

-- DROP TABLE IF EXISTS public."User-Equipment-Pivot";

CREATE TABLE IF NOT EXISTS public."User-Equipment-Pivot"
(
    pivot_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_id character varying COLLATE pg_catalog."default",
    equipments_id character varying COLLATE pg_catalog."default",
    CONSTRAINT "User-Equipment-Pivot_pkey" PRIMARY KEY (pivot_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."User-Equipment-Pivot"
    OWNER to postgres;
-- Table: public.User-Facility-Pivot

-- DROP TABLE IF EXISTS public."User-Facility-Pivot";

CREATE TABLE IF NOT EXISTS public."User-Facility-Pivot"
(
    pivot_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_id character varying COLLATE pg_catalog."default",
    facilities_id character varying COLLATE pg_catalog."default",
    CONSTRAINT "User-Facility-Pivot_pkey" PRIMARY KEY (pivot_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."User-Facility-Pivot"
    OWNER to postgres;
-- Table: public.User-Sidebar-Pivot

-- DROP TABLE IF EXISTS public."User-Sidebar-Pivot";

CREATE TABLE IF NOT EXISTS public."User-Sidebar-Pivot"
(
    pivot_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_id character varying COLLATE pg_catalog."default" NOT NULL,
    sidebar_key character varying COLLATE pg_catalog."default" NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    CONSTRAINT "User-Sidebar-Pivot_pkey" PRIMARY KEY (pivot_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."User-Sidebar-Pivot"
    OWNER to postgres;
-- Table: public.User-Vehicle-Pivot

-- DROP TABLE IF EXISTS public."User-Vehicle-Pivot";

CREATE TABLE IF NOT EXISTS public."User-Vehicle-Pivot"
(
    pivot_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_id character varying COLLATE pg_catalog."default",
    vehicles_id character varying COLLATE pg_catalog."default",
    CONSTRAINT "User-Vehicle-Pivot_pkey" PRIMARY KEY (pivot_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."User-Vehicle-Pivot"
    OWNER to postgres;
-- Table: public.VehicleBooking

-- DROP TABLE IF EXISTS public."VehicleBooking";

CREATE TABLE IF NOT EXISTS public."VehicleBooking"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    vehicle_id character varying(20) COLLATE pg_catalog."default",
    requestor character varying(20) COLLATE pg_catalog."default",
    department_id character varying(20) COLLATE pg_catalog."default",
    purpose character varying(100) COLLATE pg_catalog."default",
    booker_id integer,
    deleted boolean NOT NULL DEFAULT false,
    payment integer DEFAULT 0,
    status character varying COLLATE pg_catalog."default",
    driver_id integer,
    destination character varying COLLATE pg_catalog."default",
    dates date[],
    CONSTRAINT "VehicleBooking_pkey" PRIMARY KEY (id),
    CONSTRAINT "VehicleBooking_driver_id_fkey" FOREIGN KEY (driver_id)
        REFERENCES public."Drivers" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
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