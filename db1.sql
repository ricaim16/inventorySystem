--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-05-07 15:08:42

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
-- TOC entry 221 (class 1259 OID 43996)
-- Name: Categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Categories" (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Categories" OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 44063)
-- Name: CustomerCredit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CustomerCredit" (
    id text NOT NULL,
    customer_id text NOT NULL,
    credit_amount double precision NOT NULL,
    paid_amount double precision DEFAULT 0 NOT NULL,
    unpaid_amount double precision DEFAULT 0 NOT NULL,
    total_unpaid_amount double precision DEFAULT 0 NOT NULL,
    total_paid_amount double precision DEFAULT 0 NOT NULL,
    medicine_name text,
    payment_method public."PaymentMethod" DEFAULT 'NONE'::public."PaymentMethod" NOT NULL,
    description text,
    status public."PaymentStatus" DEFAULT 'UNPAID'::public."PaymentStatus" NOT NULL,
    credit_date timestamp(3) without time zone NOT NULL,
    payment_file text,
    updated_at timestamp(3) without time zone NOT NULL,
    created_by text NOT NULL,
    updated_by text
);


ALTER TABLE public."CustomerCredit" OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 44042)
-- Name: Customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customers" (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    status public."Status" DEFAULT 'ACTIVE'::public."Status" NOT NULL
);


ALTER TABLE public."Customers" OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 44003)
-- Name: DosageForms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DosageForms" (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."DosageForms" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 44028)
-- Name: Expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Expenses" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    reason text NOT NULL,
    payment_method public."PaymentMethod",
    receipt text,
    amount double precision NOT NULL,
    description text,
    additional_info text
);


ALTER TABLE public."Expenses" OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 44083)
-- Name: KeyResults; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."KeyResults" (
    id text NOT NULL,
    objective_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    weight double precision NOT NULL,
    deadline timestamp(3) without time zone NOT NULL,
    progress double precision NOT NULL
);


ALTER TABLE public."KeyResults" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 44010)
-- Name: Medicines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Medicines" (
    id text NOT NULL,
    medicine_name text NOT NULL,
    brand_name text,
    batch_number text,
    category_id text NOT NULL,
    dosage_form_id text NOT NULL,
    medicine_weight double precision,
    quantity integer NOT NULL,
    supplier_id text NOT NULL,
    invoice_number text NOT NULL,
    unit_price double precision NOT NULL,
    sell_price double precision,
    total_price double precision NOT NULL,
    expire_date timestamp(3) without time zone NOT NULL,
    required_prescription boolean NOT NULL,
    payment_method public."PaymentMethod" DEFAULT 'NONE'::public."PaymentMethod" NOT NULL,
    "Payment_file" text,
    details text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Medicines" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 43981)
-- Name: Members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Members" (
    id text NOT NULL,
    user_id text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    phone text,
    "position" text NOT NULL,
    address text,
    certificate text,
    "Photo" text,
    gender public."Gender",
    dob timestamp(3) without time zone,
    salary double precision NOT NULL,
    joining_date timestamp(3) without time zone NOT NULL,
    status public."Status" DEFAULT 'ACTIVE'::public."Status" NOT NULL,
    role public."Role" NOT NULL,
    biography text
);


ALTER TABLE public."Members" OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 44076)
-- Name: Objectives; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Objectives" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    time_period text NOT NULL,
    progress double precision NOT NULL
);


ALTER TABLE public."Objectives" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 44035)
-- Name: Returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Returns" (
    id text NOT NULL,
    product_name text NOT NULL,
    product_batch_number text NOT NULL,
    dosage_form_id text NOT NULL,
    return_date timestamp(3) without time zone NOT NULL,
    reason_for_return text NOT NULL,
    quantity integer NOT NULL,
    medicine_id text NOT NULL
);


ALTER TABLE public."Returns" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 44019)
-- Name: Sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sales" (
    id text NOT NULL,
    product_name text,
    product_batch_number text,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    total_amount double precision NOT NULL,
    payment_method public."PaymentMethod" DEFAULT 'NONE'::public."PaymentMethod" NOT NULL,
    prescription boolean NOT NULL,
    dosage_form_id text NOT NULL,
    customer_id text,
    sealed_date timestamp(3) without time zone NOT NULL,
    medicine_id text NOT NULL,
    created_by text NOT NULL,
    updated_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Sales" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 44050)
-- Name: SupplierCredits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SupplierCredits" (
    id text NOT NULL,
    supplier_id text NOT NULL,
    credit_amount double precision NOT NULL,
    medicine_name text,
    paid_amount double precision DEFAULT 0 NOT NULL,
    unpaid_amount double precision DEFAULT 0 NOT NULL,
    total_unpaid_amount double precision DEFAULT 0 NOT NULL,
    total_paid_amount double precision DEFAULT 0 NOT NULL,
    description text,
    payment_method public."PaymentMethod",
    payment_status public."PaymentStatus" DEFAULT 'UNPAID'::public."PaymentStatus" NOT NULL,
    credit_date timestamp(3) without time zone NOT NULL,
    payment_file text,
    created_by text NOT NULL,
    updated_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SupplierCredits" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 43989)
-- Name: Suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Suppliers" (
    id text NOT NULL,
    supplier_name text NOT NULL,
    contact_info text NOT NULL,
    payment_info_cbe text,
    payment_info_coop text,
    payment_info_boa text,
    payment_info_awash text,
    payment_info_ebirr text,
    location text NOT NULL,
    email text
);


ALTER TABLE public."Suppliers" OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 43973)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role public."Role" NOT NULL,
    status public."Status" DEFAULT 'ACTIVE'::public."Status" NOT NULL
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 43921)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- TOC entry 4967 (class 0 OID 43996)
-- Dependencies: 221
-- Data for Name: Categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Categories" (id, name) FROM stdin;
5b4ffaf9-fb3c-47fd-821a-72c9ff9d15de	GIT Drugs
3969bcfe-5521-4312-b55b-37e19f093fa0	Anti-Infective
1814de8b-829b-4ea5-b676-4ab1eb89a533	Vitamins & Minerals
33c44e29-1481-4dba-bd58-e9c3436ade7b	Anti-Diabetics
2e577cb2-8cd2-40ad-9b14-d0211d951dc1	Anti-Histamine
8f4e6caf-2362-4277-bbb3-01d4a8746a16	NSAIDs
891d8213-467e-4997-a620-8ac391fe4b59	CVS Drugs 
654cd893-afb2-4e95-b8b4-992264ebda5e	Family Planning Drugs
bc1c3b4e-4e57-4607-8549-d8ef334f22ba	Chemical Solutions
4283f7ad-9cc9-42ca-a225-de3a37c398e5	Anti-Infective
3823ae54-12bf-447f-9741-56f107e5a7c3	Optimistic Drugs
\.


--
-- TOC entry 4975 (class 0 OID 44063)
-- Dependencies: 229
-- Data for Name: CustomerCredit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CustomerCredit" (id, customer_id, credit_amount, paid_amount, unpaid_amount, total_unpaid_amount, total_paid_amount, medicine_name, payment_method, description, status, credit_date, payment_file, updated_at, created_by, updated_by) FROM stdin;
7c5bfb64-df0d-4219-8f29-cbf6a0251a4f	4c9fd72e-ccca-41a6-9ba0-2dc22306cb0a	249.98	0	249.98	249.98	0	test	NONE	\N	UNPAID	2025-05-07 14:46:17.175	\N	2025-05-07 14:46:17.175	ca372201-c364-42ad-9614-d06e1b5f517b	ca372201-c364-42ad-9614-d06e1b5f517b
\.


--
-- TOC entry 4973 (class 0 OID 44042)
-- Dependencies: 227
-- Data for Name: Customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Customers" (id, name, phone, address, status) FROM stdin;
4c9fd72e-ccca-41a6-9ba0-2dc22306cb0a	ky	989975662	jigjiga	ACTIVE
\.


--
-- TOC entry 4968 (class 0 OID 44003)
-- Dependencies: 222
-- Data for Name: DosageForms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DosageForms" (id, name) FROM stdin;
b6a97f58-fccb-46af-a119-138ffa39a47d	Tablets
2a7d3583-ba53-42ff-87f8-e782440e2798	Capsules
b86f05f2-44d2-4be4-9df0-161c660b2a42	Liquids/Syrups
5be53713-05ea-40ed-a601-b69bebd5f3f4	Chewable Tablets
754da8b5-6816-43a4-b073-9ffcdb47c1b4	Topical Creams/Ointments
c06da84b-5c2e-41e0-9c89-7828c56c94d6	Nasal Sprays
c7c06818-b1a8-49ee-b7d7-947491ee14e6	Eye Drops
\.


--
-- TOC entry 4971 (class 0 OID 44028)
-- Dependencies: 225
-- Data for Name: Expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Expenses" (id, date, reason, payment_method, receipt, amount, description, additional_info) FROM stdin;
cd0e292b-d802-4f13-b65e-d0065c46cf6b	2025-05-07 00:00:00	test	CASH	uploads/1746618299301-459519639.png	2500	hgjh	\N
\.


--
-- TOC entry 4977 (class 0 OID 44083)
-- Dependencies: 231
-- Data for Name: KeyResults; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."KeyResults" (id, objective_id, title, description, weight, deadline, progress) FROM stdin;
\.


--
-- TOC entry 4969 (class 0 OID 44010)
-- Dependencies: 223
-- Data for Name: Medicines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Medicines" (id, medicine_name, brand_name, batch_number, category_id, dosage_form_id, medicine_weight, quantity, supplier_id, invoice_number, unit_price, sell_price, total_price, expire_date, required_prescription, payment_method, "Payment_file", details, "createdById", "createdAt", "updatedAt") FROM stdin;
f6750e9f-cb26-4782-87bb-16c2251c1021	test	\N	\N	4283f7ad-9cc9-42ca-a225-de3a37c398e5	b86f05f2-44d2-4be4-9df0-161c660b2a42	\N	500	3240e217-bcd0-4fd1-9a82-8410b76e5ccb	44	20	56	10000	2025-05-07 00:00:00	f	NONE	uploads/1746618025444-Screenshot 2025-04-04 112153.png	\N	ca372201-c364-42ad-9614-d06e1b5f517b	2025-05-07 11:40:25.553	2025-05-07 11:40:25.553
30d6b725-4ab8-44ea-a779-d4d8786bf025	Ibuprofen1	BrandX	BAT123456	2e577cb2-8cd2-40ad-9b14-d0211d951dc1	b6a97f58-fccb-46af-a119-138ffa39a47d	\N	78	3240e217-bcd0-4fd1-9a82-8410b76e5ccb	567	50	60	5000	2025-07-16 00:00:00	t	NONE	uploads/1746614512449-Screenshot 2025-04-04 112221.png		ca372201-c364-42ad-9614-d06e1b5f517b	2025-05-07 10:41:52.546	2025-05-07 11:42:45.653
769d4f3a-e516-4a0b-8e5c-d348002e5434	Paracetamol			654cd893-afb2-4e95-b8b4-992264ebda5e	c06da84b-5c2e-41e0-9c89-7828c56c94d6	\N	52	3240e217-bcd0-4fd1-9a82-8410b76e5ccb	5	12	20	624	2025-05-07 00:00:00	t	NONE	\N		ca372201-c364-42ad-9614-d06e1b5f517b	2025-05-07 11:51:10.523	2025-05-07 11:51:38.551
d7a89d5d-7481-49fa-9cdd-7246ee2a0051	Tramadol0	\N	\N	33c44e29-1481-4dba-bd58-e9c3436ade7b	5be53713-05ea-40ed-a601-b69bebd5f3f4	\N	200	3240e217-bcd0-4fd1-9a82-8410b76e5ccb	pp	100	149.98	20000	2025-05-07 00:00:00	f	NONE	\N	\N	ca372201-c364-42ad-9614-d06e1b5f517b	2025-05-07 12:05:35.778	2025-05-07 12:05:35.778
\.


--
-- TOC entry 4965 (class 0 OID 43981)
-- Dependencies: 219
-- Data for Name: Members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Members" (id, user_id, "FirstName", "LastName", phone, "position", address, certificate, "Photo", gender, dob, salary, joining_date, status, role, biography) FROM stdin;
\.


--
-- TOC entry 4976 (class 0 OID 44076)
-- Dependencies: 230
-- Data for Name: Objectives; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Objectives" (id, title, description, time_period, progress) FROM stdin;
\.


--
-- TOC entry 4972 (class 0 OID 44035)
-- Dependencies: 226
-- Data for Name: Returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Returns" (id, product_name, product_batch_number, dosage_form_id, return_date, reason_for_return, quantity, medicine_id) FROM stdin;
5815778c-edec-443b-9042-cfe695a2116e	Ibuprofen1	BAT123456	2a7d3583-ba53-42ff-87f8-e782440e2798	2025-05-07 14:42:45.603	ghj	2	30d6b725-4ab8-44ea-a779-d4d8786bf025
\.


--
-- TOC entry 4970 (class 0 OID 44019)
-- Dependencies: 224
-- Data for Name: Sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sales" (id, product_name, product_batch_number, quantity, price, total_amount, payment_method, prescription, dosage_form_id, customer_id, sealed_date, medicine_id, created_by, updated_by, created_at, updated_at) FROM stdin;
a47fa088-757e-4704-9133-c690738052da	Ibuprofen1	BAT123456	24	60	1440	CBE	t	2a7d3583-ba53-42ff-87f8-e782440e2798	4c9fd72e-ccca-41a6-9ba0-2dc22306cb0a	2025-05-07 17:41:34.992	30d6b725-4ab8-44ea-a779-d4d8786bf025	ca372201-c364-42ad-9614-d06e1b5f517b	ca372201-c364-42ad-9614-d06e1b5f517b	2025-05-07 14:41:34.992	2025-05-07 14:42:45.649
\.


--
-- TOC entry 4974 (class 0 OID 44050)
-- Dependencies: 228
-- Data for Name: SupplierCredits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupplierCredits" (id, supplier_id, credit_amount, medicine_name, paid_amount, unpaid_amount, total_unpaid_amount, total_paid_amount, description, payment_method, payment_status, credit_date, payment_file, created_by, updated_by, created_at, updated_at) FROM stdin;
1bf7cf51-e25a-48d0-88f4-d4d17d7db39e	3240e217-bcd0-4fd1-9a82-8410b76e5ccb	449.98	Ibuprofen1	0	449.98	449.98	0	\N	NONE	UNPAID	2025-05-07 14:45:37.675	\N	ca372201-c364-42ad-9614-d06e1b5f517b	ca372201-c364-42ad-9614-d06e1b5f517b	2025-05-07 14:45:37.675	2025-05-07 14:45:37.675
\.


--
-- TOC entry 4966 (class 0 OID 43989)
-- Dependencies: 220
-- Data for Name: Suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Suppliers" (id, supplier_name, contact_info, payment_info_cbe, payment_info_coop, payment_info_boa, payment_info_awash, payment_info_ebirr, location, email) FROM stdin;
3240e217-bcd0-4fd1-9a82-8410b76e5ccb	feti	+25103536543						jigjiga	aimemu16@gmail.com
\.


--
-- TOC entry 4964 (class 0 OID 43973)
-- Dependencies: 218
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, "FirstName", "LastName", username, password, role, status) FROM stdin;
ca372201-c364-42ad-9614-d06e1b5f517b	Sample	Manager	Admin	$2b$10$BX0/oWOxY0mpuGeonLamku1AjgHKuLf2KiVBD.Os.Br360RAP52nK	MANAGER	ACTIVE
00dafb04-115f-4e36-9989-688fa9219041	beamlak	tesfaye	bam	$2b$10$qosTACs9UwOogFLnQRrCweuEAYLDr/1HbKpi.DEH65Vrsiv1EBGLe	EMPLOYEE	ACTIVE
\.


--
-- TOC entry 4963 (class 0 OID 43921)
-- Dependencies: 217
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- TOC entry 4777 (class 2606 OID 44002)
-- Name: Categories Categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Categories"
    ADD CONSTRAINT "Categories_pkey" PRIMARY KEY (id);


--
-- TOC entry 4794 (class 2606 OID 44075)
-- Name: CustomerCredit CustomerCredit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerCredit"
    ADD CONSTRAINT "CustomerCredit_pkey" PRIMARY KEY (id);


--
-- TOC entry 4790 (class 2606 OID 44049)
-- Name: Customers Customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customers"
    ADD CONSTRAINT "Customers_pkey" PRIMARY KEY (id);


--
-- TOC entry 4779 (class 2606 OID 44009)
-- Name: DosageForms DosageForms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DosageForms"
    ADD CONSTRAINT "DosageForms_pkey" PRIMARY KEY (id);


--
-- TOC entry 4786 (class 2606 OID 44034)
-- Name: Expenses Expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expenses"
    ADD CONSTRAINT "Expenses_pkey" PRIMARY KEY (id);


--
-- TOC entry 4798 (class 2606 OID 44089)
-- Name: KeyResults KeyResults_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."KeyResults"
    ADD CONSTRAINT "KeyResults_pkey" PRIMARY KEY (id);


--
-- TOC entry 4782 (class 2606 OID 44018)
-- Name: Medicines Medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicines"
    ADD CONSTRAINT "Medicines_pkey" PRIMARY KEY (id);


--
-- TOC entry 4772 (class 2606 OID 43988)
-- Name: Members Members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Members"
    ADD CONSTRAINT "Members_pkey" PRIMARY KEY (id);


--
-- TOC entry 4796 (class 2606 OID 44082)
-- Name: Objectives Objectives_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Objectives"
    ADD CONSTRAINT "Objectives_pkey" PRIMARY KEY (id);


--
-- TOC entry 4788 (class 2606 OID 44041)
-- Name: Returns Returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Returns"
    ADD CONSTRAINT "Returns_pkey" PRIMARY KEY (id);


--
-- TOC entry 4784 (class 2606 OID 44027)
-- Name: Sales Sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sales"
    ADD CONSTRAINT "Sales_pkey" PRIMARY KEY (id);


--
-- TOC entry 4792 (class 2606 OID 44062)
-- Name: SupplierCredits SupplierCredits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupplierCredits"
    ADD CONSTRAINT "SupplierCredits_pkey" PRIMARY KEY (id);


--
-- TOC entry 4775 (class 2606 OID 43995)
-- Name: Suppliers Suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Suppliers"
    ADD CONSTRAINT "Suppliers_pkey" PRIMARY KEY (id);


--
-- TOC entry 4769 (class 2606 OID 43980)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 4767 (class 2606 OID 43929)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4780 (class 1259 OID 44092)
-- Name: Medicines_invoice_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Medicines_invoice_number_key" ON public."Medicines" USING btree (invoice_number);


--
-- TOC entry 4773 (class 1259 OID 44091)
-- Name: Members_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Members_user_id_key" ON public."Members" USING btree (user_id);


--
-- TOC entry 4770 (class 1259 OID 44090)
-- Name: Users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Users_username_key" ON public."Users" USING btree (username);


--
-- TOC entry 4814 (class 2606 OID 44173)
-- Name: CustomerCredit CustomerCredit_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerCredit"
    ADD CONSTRAINT "CustomerCredit_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4815 (class 2606 OID 44168)
-- Name: CustomerCredit CustomerCredit_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerCredit"
    ADD CONSTRAINT "CustomerCredit_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public."Customers"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4816 (class 2606 OID 44178)
-- Name: CustomerCredit CustomerCredit_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerCredit"
    ADD CONSTRAINT "CustomerCredit_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4817 (class 2606 OID 44183)
-- Name: KeyResults KeyResults_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."KeyResults"
    ADD CONSTRAINT "KeyResults_objective_id_fkey" FOREIGN KEY (objective_id) REFERENCES public."Objectives"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4800 (class 2606 OID 44098)
-- Name: Medicines Medicines_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicines"
    ADD CONSTRAINT "Medicines_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public."Categories"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4801 (class 2606 OID 44113)
-- Name: Medicines Medicines_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicines"
    ADD CONSTRAINT "Medicines_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4802 (class 2606 OID 44103)
-- Name: Medicines Medicines_dosage_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicines"
    ADD CONSTRAINT "Medicines_dosage_form_id_fkey" FOREIGN KEY (dosage_form_id) REFERENCES public."DosageForms"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4803 (class 2606 OID 44108)
-- Name: Medicines Medicines_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicines"
    ADD CONSTRAINT "Medicines_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public."Suppliers"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4799 (class 2606 OID 44093)
-- Name: Members Members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Members"
    ADD CONSTRAINT "Members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4809 (class 2606 OID 44143)
-- Name: Returns Returns_dosage_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Returns"
    ADD CONSTRAINT "Returns_dosage_form_id_fkey" FOREIGN KEY (dosage_form_id) REFERENCES public."DosageForms"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4810 (class 2606 OID 44148)
-- Name: Returns Returns_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Returns"
    ADD CONSTRAINT "Returns_medicine_id_fkey" FOREIGN KEY (medicine_id) REFERENCES public."Medicines"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4804 (class 2606 OID 44133)
-- Name: Sales Sales_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sales"
    ADD CONSTRAINT "Sales_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4805 (class 2606 OID 44123)
-- Name: Sales Sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sales"
    ADD CONSTRAINT "Sales_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public."Customers"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4806 (class 2606 OID 44118)
-- Name: Sales Sales_dosage_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sales"
    ADD CONSTRAINT "Sales_dosage_form_id_fkey" FOREIGN KEY (dosage_form_id) REFERENCES public."DosageForms"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4807 (class 2606 OID 44128)
-- Name: Sales Sales_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sales"
    ADD CONSTRAINT "Sales_medicine_id_fkey" FOREIGN KEY (medicine_id) REFERENCES public."Medicines"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4808 (class 2606 OID 44138)
-- Name: Sales Sales_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sales"
    ADD CONSTRAINT "Sales_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4811 (class 2606 OID 44158)
-- Name: SupplierCredits SupplierCredits_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupplierCredits"
    ADD CONSTRAINT "SupplierCredits_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4812 (class 2606 OID 44153)
-- Name: SupplierCredits SupplierCredits_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupplierCredits"
    ADD CONSTRAINT "SupplierCredits_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public."Suppliers"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4813 (class 2606 OID 44163)
-- Name: SupplierCredits SupplierCredits_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupplierCredits"
    ADD CONSTRAINT "SupplierCredits_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


-- Completed on 2025-05-07 15:08:43

--
-- PostgreSQL database dump complete
--

