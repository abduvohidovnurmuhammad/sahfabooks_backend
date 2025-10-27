--
-- PostgreSQL database dump
--

\restrict YwmVbmX4vDtPzAQP0MKeCprKCuyqUiLpjUZxRHnhUTlvq7kID5DljhtA5EwP3Mu

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: files; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.files OWNER TO postgres;

--
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.files_id_seq OWNER TO postgres;

--
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.files_id_seq OWNED BY public.files.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    file_id integer,
    quantity integer DEFAULT 1,
    price numeric(10,2)
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    client_id integer,
    status character varying(50) DEFAULT 'To Confirm'::character varying,
    payment_status character varying(50) DEFAULT 'Pending'::character varying,
    total_amount numeric(10,2),
    delivery_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    delivery_address text,
    notes text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100),
    role character varying(20) DEFAULT 'client'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(100),
    phone character varying(20),
    organization_name character varying(200),
    address text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.files (id, client_id, title, file_path, description, cash_price, bank_price, show_price, stock, admin_notes, created_at, file_format, page_size, color_type, client_notes, status, uploaded_by) FROM stdin;
1	2	English Workbook Grade 5	\N	Student workbook for 5th grade	15000.00	14000.00	t	50	\N	2025-10-14 19:00:21.201539	\N	A4	Color	\N	approved	admin
2	2	Math Exercise Book	\N	Practice exercises for mathematics	12000.00	11000.00	t	30	\N	2025-10-14 19:00:21.201539	\N	A4	B&W	\N	approved	admin
3	2	Science Lab Manual	\N	Laboratory guide for science class	20000.00	19000.00	t	25	\N	2025-10-14 19:00:21.201539	\N	A4	Color	\N	approved	admin
10	2	English Workbook Grade 5	\N	Student workbook for 5th grade English	15000.00	14000.00	t	50	High quality printing required	2025-10-14 19:10:56.198989	PDF	A4	Color	\N	approved	admin
11	2	Math Exercise Book	\N	Practice exercises for mathematics	12000.00	11000.00	t	30	Standard paper	2025-10-14 19:10:56.198989	PDF	A4	B&W	\N	approved	admin
12	2	Science Lab Manual	\N	Laboratory guide for science class	20000.00	19000.00	t	25	Special binding needed	2025-10-14 19:10:56.198989	PDF	A4	Color	\N	approved	admin
13	5	History Textbook Grade 7	\N	World history curriculum	18000.00	17000.00	t	40	\N	2025-10-14 19:10:56.198989	PDF	A4	Color	\N	approved	admin
15	6	Chemistry Workbook	\N	Lab exercises and theory	16000.00	15000.00	t	35	\N	2025-10-14 19:10:56.198989	PDF	A5	B&W	\N	approved	admin
16	2	nomi1	\N	121	12000.00	1200.00	t	1012	\N	2025-10-17 14:02:27.330142	PDF	A4	Color	\N	approved	admin
17	2	 15000	\N	asd	15000.00	14000.00	t	10	\N	2025-10-17 15:14:16.050685	PDF	A4	Color	\N	approved	admin
14	5	Geography Atlas	\N	Maps and geographical information	25000.00	24000.00	t	20	Premium paper only	2025-10-14 19:10:56.198989	PDF	A4	Color	\N	approved	admin
18	5	5matem	uploads\\file-1760973392886-411820886.docx	oquvchila	15000.00	13999.00	t	2	\N	2025-10-20 20:16:32.925512	DOCX	A4	B&W	\N	approved	admin
19	5	 cambridge kitob	uploads\\file-1761027999563-773057074.docx	bolalar uchun	100000.00	99000.00	t	20	\N	2025-10-21 11:26:39.623786	DOCX	A4	B&W	\N	approved	admin
22	5	lobaratoriya	uploads\\file-1761053179645-501307403.docx	kursishi	20000.00	19000.00	t	20	\N	2025-10-21 18:26:19.712143	DOCX	A4	B&W	\N	approved	client
20	5	mustaqil ish	uploads\\file-1761052707285-183051059.docx	mustaqil	\N	\N	f	10	\N	2025-10-21 18:18:27.399163	DOCX	A4	B&W	\N	rejected	client
21	5	kurs	uploads\\file-1761052863776-893399041.docx	kursishi	\N	\N	f	10	\N	2025-10-21 18:21:03.85011	DOCX	A4	B&W	\N	rejected	client
23	5	exam	uploads\\file-1761126578134-257269565.docx	savollar	120000.00	100000.00	t	1	\N	2025-10-22 14:49:38.186801	DOCX	A4	B&W	\N	approved	client
24	10	mmmmmmm	uploads\\file-1761128132051-215118279.docx	111111	14000.00	14000.00	t	1	\N	2025-10-22 15:15:32.118016	DOCX	A4	B&W	\N	approved	client
25	11	mashina	uploads\\file-1761128948009-478587514.pdf	.	100000.00	99000.00	t	10	\N	2025-10-22 15:29:08.077276	PDF	A4	Color	\N	approved	client
27	12	Namuna	uploads\\file-1761130041972-858215869.pdf	A4 rangli 	50000.00	55000.00	t	1	\N	2025-10-22 15:47:22.044304	PDF	A4	Color	\N	approved	client
26	11	aaaaaaaaaa	uploads\\file-1761129125895-127450279.docx	aaaaaaaaa	\N	\N	f	1	\N	2025-10-22 15:32:05.964335	PDF	A4	B&W	\N	rejected	client
28	5	11	uploads\\file-1761212585606-218361107.pdf	1	14000.00	20000.00	t	0	\N	2025-10-23 14:43:05.673221	PDF	A4	B&W	\N	approved	client
29	11	3mavzu	uploads\\file-1761234782332-687290712.docx	3mavzu	12000.00	12999.00	t	20	\N	2025-10-23 20:53:02.503262	PDF	A4	B&W	\N	approved	admin
30	13	111111111	uploads\\file-1761460180815-657879028.docx	11111111111	10000.00	9000.00	t	1	\N	2025-10-26 11:29:40.888296	PDF	A4	B&W	\N	approved	client
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, file_id, quantity, price) FROM stdin;
4	2	2	10	18000.00
5	3	28	10	14000.00
6	4	28	10	14000.00
7	5	29	10	12000.00
8	6	29	10	12000.00
9	7	30	100	10000.00
10	8	29	1	12000.00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, client_id, status, payment_status, total_amount, delivery_date, created_at, delivery_address, notes, updated_at) FROM stdin;
3	5	completed	Pending	140000.00	\N	2025-10-24 00:27:43.405942			2025-10-24 00:28:48.041038
2	2	completed	Pending	180000.00	\N	2025-10-23 20:53:54.964323	\N	\N	2025-10-24 00:28:54.599865
4	5	completed	Pending	140000.00	\N	2025-10-24 00:29:31.472919			2025-10-24 00:44:24.108949
5	11	completed	Pending	120000.00	\N	2025-10-24 00:37:13.873998			2025-10-24 00:44:36.252881
6	11	completed	Pending	120000.00	\N	2025-10-24 00:38:47.33679			2025-10-24 00:44:40.11445
7	13	completed	Pending	1000000.00	\N	2025-10-26 11:31:24.618404			2025-10-26 11:31:52.64743
8	11	pending	Pending	12000.00	\N	2025-10-26 17:33:19.468774			2025-10-26 17:33:19.468774
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, full_name, role, created_at, email, phone, organization_name, address) FROM stdin;
2	westminster	$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36l1tHRcJ9Kb7FztN5LJwni	Westminster School	client	2025-10-14 19:00:12.681848	\N	\N	\N	\N
6	tis_school	$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36l1tHRcJ9Kb7FztN5LJwni	Ali Karimov	client	2025-10-14 19:08:28.721078	info@tashkentschool.uz	+998909876543	Tashkent International School	Tashkent, Mirzo Ulugbek District
8	testadmin	$2b$10$t7Dnt4nQDJsVruLntiRlDOQlpZnh/Sq26GGTi1lPHhon1gVhGEtvy	Test Admin	admin	2025-10-16 10:34:23.446648	\N	\N	\N	\N
9	superadmin	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	Azamjon	admin	2025-10-16 20:08:15.302519	azamjon@gmail.com	907000101	\N	\N
5	cambridge_school	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	Sarah Johnson	client	2025-10-14 19:08:28.721078	admin@cambridge.uz	+998907654321	Cambridge International School	Tashkent, Yakkasaray District
10	testschool	$2b$10$/D0hCBWaQeSf5DmO9Yeb5e435FgqHmkMtF9GniIoGSNY/XD7qNXg2	Azamjon Turgunov	client	2025-10-22 15:12:47.992736	\N	907000101	maktab1	Toshkent Qoraqamish
11	buxoroark	$2b$10$ft9CpBxVH2PCeyI9SF/w1eSXHvh5F8jprAcR5yZhAnfceC785jFD6	Sherzod aka	client	2025-10-22 15:28:07.931593	\N	901110909	uchebniy sentr	Yangiyol
12	start21	$2b$10$Hlnwz6.3.QU0Ab1qcub9g.WBL.APeTjhI47FsFI2W2sD13QaK4PMS	Bekzod Abduqahhorov	client	2025-10-22 15:46:20.466397	\N	+998507999955	start21	Namangan shahar
13	users	$2a$10$3Sa4a8vAYowGbrlW/.OQVuaIU9WTzFSHnuuwc/gpYACVhEniBsyDS	a	client	2025-10-26 11:29:02.21133	\N	999999999999	users	yangiyol
\.


--
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.files_id_seq', 30, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 10, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_files_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_files_client ON public.files USING btree (client_id);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_orders_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_client ON public.orders USING btree (client_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: files files_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict YwmVbmX4vDtPzAQP0MKeCprKCuyqUiLpjUZxRHnhUTlvq7kID5DljhtA5EwP3Mu

