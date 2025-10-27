CREATE TABLE public.files (
    id integer NOT NULL,
    client_id integer,
    title character varying(200) NOT NULL,
    file_path character varying(500),
    description text,
    cash_price numeric(10,2),
    bank_price numeric(10,2),
    show_price boolean DEFAULT false,
    stock integer DEFAULT 0,
    admin_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    file_format character varying(20),
    page_size character varying(10),
    color_type character varying(20),
    client_notes text,
    status character varying(20) DEFAULT 'approved'::character varying,
    uploaded_by character varying(10) DEFAULT 'admin'::character varying
);

