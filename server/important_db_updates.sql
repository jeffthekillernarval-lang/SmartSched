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

-- Table: public.VehicleBooking

-- DROP TABLE IF EXISTS public."VehicleBooking";

CREATE TABLE IF NOT EXISTS public."VehicleBooking"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    vehicle_id integer NOT NULL,
    requestor character varying(20) COLLATE pg_catalog."default",
    department_id integer,
    purpose character varying(100) COLLATE pg_catalog."default",
    booker_id integer,
    deleted boolean NOT NULL DEFAULT false,
    payment integer DEFAULT 0,
    status character varying COLLATE pg_catalog."default",
    driver_id integer,
    destination character varying COLLATE pg_catalog."default",
    start_datetime timestamp without time zone NOT NULL,
    end_datetime timestamp without time zone NOT NULL,
    CONSTRAINT "VehicleBooking_pkey" PRIMARY KEY (id),
    CONSTRAINT "VehicleBooking_driver_id_fkey" FOREIGN KEY (driver_id)
        REFERENCES public."Drivers" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "VehicleBooking_vehicle_id_fkey" FOREIGN KEY (vehicle_id)
        REFERENCES public."Vehicles" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT check_time_valid CHECK (end_datetime > start_datetime)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."VehicleBooking"
    OWNER to postgres;
-- Index: idx_driver_time

-- DROP INDEX IF EXISTS public.idx_driver_time;

CREATE INDEX IF NOT EXISTS idx_driver_time
    ON public."VehicleBooking" USING btree
    (driver_id ASC NULLS LAST, start_datetime ASC NULLS LAST, end_datetime ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_vehicle_time

-- DROP INDEX IF EXISTS public.idx_vehicle_time;

CREATE INDEX IF NOT EXISTS idx_vehicle_time
    ON public."VehicleBooking" USING btree
    (vehicle_id ASC NULLS LAST, start_datetime ASC NULLS LAST, end_datetime ASC NULLS LAST)
    TABLESPACE pg_default;