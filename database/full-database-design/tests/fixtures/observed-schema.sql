-- Sanitized observed-schema fixture for disposable tests only. No production row data.
--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'REQUESTED',
    'CONFIRMED',
    'RESCHEDULED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE public."AppointmentStatus" OWNER TO postgres;


--
-- Name: ListingType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ListingType" AS ENUM (
    'SALE',
    'RENT'
);


ALTER TYPE public."ListingType" OWNER TO postgres;


--
-- Name: MediaType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MediaType" AS ENUM (
    'IMAGE',
    'VIDEO'
);


ALTER TYPE public."MediaType" OWNER TO postgres;


--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'UNREAD',
    'READ',
    'ARCHIVED'
);


ALTER TYPE public."NotificationStatus" OWNER TO postgres;


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'PROPERTY_LIKED',
    'PROPERTY_VIEWED_MILESTONE',
    'APPOINTMENT_REQUESTED',
    'APPOINTMENT_CONFIRMED',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_RESCHEDULED',
    'APPOINTMENT_COMPLETED',
    'APPOINTMENT_NO_SHOW',
    'LISTING_PUBLISHED',
    'LISTING_SUSPENDED',
    'DRAFT_REMINDER',
    'SYSTEM'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;


--
-- Name: PropertyCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PropertyCategory" AS ENUM (
    'APARTMENT',
    'HOUSE',
    'LAND',
    'COMMERCIAL'
);


ALTER TYPE public."PropertyCategory" OWNER TO postgres;


--
-- Name: PropertyStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PropertyStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'RESERVED',
    'SOLD',
    'SUSPENDED'
);


ALTER TYPE public."PropertyStatus" OWNER TO postgres;


--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED',
    'DISMISSED'
);


ALTER TYPE public."ReportStatus" OWNER TO postgres;


--
-- Name: ReportTargetType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReportTargetType" AS ENUM (
    'PROPERTY',
    'PROPERTY_DEVELOPER'
);


ALTER TYPE public."ReportTargetType" OWNER TO postgres;


--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'PROPERTY_DEVELOPER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;


--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionType" AS ENUM (
    'SALE',
    'RENT',
    'OTHER'
);


ALTER TYPE public."TransactionType" OWNER TO postgres;


--
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
-- Name: appointment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment (
    id text NOT NULL,
    property_id text NOT NULL,
    property_developer_id text NOT NULL,
    client_user_id text NOT NULL,
    client_name text NOT NULL,
    scheduled_for timestamp(3) without time zone NOT NULL,
    previous_scheduled_for timestamp(3) without time zone,
    status public."AppointmentStatus" DEFAULT 'REQUESTED'::public."AppointmentStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.appointment OWNER TO postgres;


--
-- Name: appointment_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment_history (
    id text NOT NULL,
    appointment_id text NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.appointment_history OWNER TO postgres;


--
-- Name: city; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.city (
    id text NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.city OWNER TO postgres;


--
-- Name: district; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.district (
    id text NOT NULL,
    city_id text NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.district OWNER TO postgres;


--
-- Name: feature; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature (
    id text NOT NULL,
    feature_name text NOT NULL,
    category text,
    icon_name text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.feature OWNER TO postgres;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id text NOT NULL,
    property_developer_id text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    read_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."NotificationStatus" DEFAULT 'UNREAD'::public."NotificationStatus" NOT NULL,
    link text
);


ALTER TABLE public.notification OWNER TO postgres;


--
-- Name: property; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property (
    id text NOT NULL,
    property_developer_id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    category public."PropertyCategory" NOT NULL,
    listing_type public."ListingType" NOT NULL,
    price numeric(15,2) NOT NULL,
    address text NOT NULL,
    city_id text NOT NULL,
    district_id text,
    bedrooms integer,
    bathrooms integer,
    car_spaces integer,
    land_size_sq_m numeric(10,2),
    building_size_sq_m numeric(10,2),
    year_built integer,
    status public."PropertyStatus" DEFAULT 'DRAFT'::public."PropertyStatus" NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    whatsapp_click_count integer DEFAULT 0 NOT NULL,
    favorite_count integer DEFAULT 0 NOT NULL,
    published_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    CONSTRAINT chk_property_bathrooms_non_negative CHECK (((bathrooms IS NULL) OR (bathrooms >= 0))),
    CONSTRAINT chk_property_bedrooms_non_negative CHECK (((bedrooms IS NULL) OR (bedrooms >= 0))),
    CONSTRAINT chk_property_building_size_positive CHECK (((building_size_sq_m IS NULL) OR (building_size_sq_m > (0)::numeric))),
    CONSTRAINT chk_property_car_spaces_non_negative CHECK (((car_spaces IS NULL) OR (car_spaces >= 0))),
    CONSTRAINT chk_property_land_size_positive CHECK (((land_size_sq_m IS NULL) OR (land_size_sq_m > (0)::numeric))),
    CONSTRAINT chk_property_price_non_negative CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.property OWNER TO postgres;


--
-- Name: property_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_analytics (
    id text NOT NULL,
    property_id text NOT NULL,
    date date NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    whatsapp_clicks integer DEFAULT 0 NOT NULL,
    favorites integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.property_analytics OWNER TO postgres;


--
-- Name: property_developer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_developer (
    id text NOT NULL,
    user_id text NOT NULL,
    business_name text,
    whatsapp_number text NOT NULL,
    phone_number text NOT NULL,
    profile_image_url text NOT NULL,
    profile_image_public_id text NOT NULL,
    cover_image_url text,
    cover_image_public_id text,
    bio text,
    years_of_experience integer,
    specialization text,
    languages_spoken text,
    address text,
    city text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    verified_since timestamp(3) without time zone,
    average_rating numeric(3,2) DEFAULT 0 NOT NULL,
    total_ratings integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    CONSTRAINT chk_developer_average_rating_range CHECK (((average_rating >= (0)::numeric) AND (average_rating <= (5)::numeric)))
);


ALTER TABLE public.property_developer OWNER TO postgres;


--
-- Name: property_developer_rating; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_developer_rating (
    id text NOT NULL,
    rater_user_id text NOT NULL,
    property_developer_id text NOT NULL,
    score integer NOT NULL,
    comment text,
    transaction_type public."TransactionType",
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_rating_score_range CHECK (((score >= 1) AND (score <= 5)))
);


ALTER TABLE public.property_developer_rating OWNER TO postgres;


--
-- Name: property_favorite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_favorite (
    id text NOT NULL,
    user_id text NOT NULL,
    property_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.property_favorite OWNER TO postgres;


--
-- Name: property_feature; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_feature (
    id text NOT NULL,
    property_id text NOT NULL,
    feature_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.property_feature OWNER TO postgres;


--
-- Name: property_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_media (
    id text NOT NULL,
    property_id text NOT NULL,
    url text NOT NULL,
    public_id text NOT NULL,
    media_type public."MediaType" DEFAULT 'IMAGE'::public."MediaType" NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    alt_text text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.property_media OWNER TO postgres;


--
-- Name: refresh_token; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_token (
    id text NOT NULL,
    user_id text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    revoked_at timestamp(3) without time zone,
    user_agent text,
    ip_address text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_token OWNER TO postgres;


--
-- Name: report; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report (
    id text NOT NULL,
    reporter_user_id text,
    target_type public."ReportTargetType" NOT NULL,
    target_id text NOT NULL,
    reason text NOT NULL,
    description text,
    status public."ReportStatus" DEFAULT 'OPEN'::public."ReportStatus" NOT NULL,
    resolution_note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.report OWNER TO postgres;


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public."Role" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    full_name text
);


ALTER TABLE public."user" OWNER TO postgres;


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);



--
-- Name: appointment_history appointment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_history
    ADD CONSTRAINT appointment_history_pkey PRIMARY KEY (id);



--
-- Name: appointment appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT appointment_pkey PRIMARY KEY (id);



--
-- Name: city city_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.city
    ADD CONSTRAINT city_pkey PRIMARY KEY (id);



--
-- Name: district district_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district
    ADD CONSTRAINT district_pkey PRIMARY KEY (id);



--
-- Name: feature feature_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature
    ADD CONSTRAINT feature_pkey PRIMARY KEY (id);



--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);



--
-- Name: property_analytics property_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_analytics
    ADD CONSTRAINT property_analytics_pkey PRIMARY KEY (id);



--
-- Name: property_developer property_developer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_developer
    ADD CONSTRAINT property_developer_pkey PRIMARY KEY (id);



--
-- Name: property_developer_rating property_developer_rating_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_developer_rating
    ADD CONSTRAINT property_developer_rating_pkey PRIMARY KEY (id);



--
-- Name: property_favorite property_favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_favorite
    ADD CONSTRAINT property_favorite_pkey PRIMARY KEY (id);



--
-- Name: property_feature property_feature_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_feature
    ADD CONSTRAINT property_feature_pkey PRIMARY KEY (id);



--
-- Name: property_media property_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_media
    ADD CONSTRAINT property_media_pkey PRIMARY KEY (id);



--
-- Name: property property_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_pkey PRIMARY KEY (id);



--
-- Name: refresh_token refresh_token_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_pkey PRIMARY KEY (id);



--
-- Name: report report_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_pkey PRIMARY KEY (id);



--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);



--
-- Name: city_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX city_name_key ON public.city USING btree (name);



--
-- Name: feature_feature_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX feature_feature_name_key ON public.feature USING btree (feature_name);



--
-- Name: idx_analytics_property_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_analytics_property_date ON public.property_analytics USING btree (property_id, date);



--
-- Name: idx_appointment_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_client ON public.appointment USING btree (client_user_id);



--
-- Name: idx_appointment_developer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_developer ON public.appointment USING btree (property_developer_id);



--
-- Name: idx_appointment_history_appointment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_history_appointment ON public.appointment_history USING btree (appointment_id);



--
-- Name: idx_appointment_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_property ON public.appointment USING btree (property_id);



--
-- Name: idx_appointment_scheduled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_scheduled ON public.appointment USING btree (scheduled_for);



--
-- Name: idx_appointment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_status ON public.appointment USING btree (status);



--
-- Name: idx_developer_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_developer_city ON public.property_developer USING btree (city);



--
-- Name: idx_developer_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_developer_rating ON public.property_developer USING btree (average_rating);



--
-- Name: idx_developer_verified; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_developer_verified ON public.property_developer USING btree (is_verified);



--
-- Name: idx_district_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_district_city ON public.district USING btree (city_id);



--
-- Name: idx_district_city_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_district_city_name ON public.district USING btree (city_id, name);



--
-- Name: idx_favorite_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorite_property ON public.property_favorite USING btree (property_id);



--
-- Name: idx_favorite_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorite_user ON public.property_favorite USING btree (user_id);



--
-- Name: idx_media_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_primary ON public.property_media USING btree (property_id, is_primary);



--
-- Name: idx_media_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_property ON public.property_media USING btree (property_id);



--
-- Name: idx_notification_developer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_developer ON public.notification USING btree (property_developer_id);



--
-- Name: idx_notification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_status ON public.notification USING btree (property_developer_id, status);



--
-- Name: idx_property_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_category ON public.property USING btree (category);



--
-- Name: idx_property_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_city ON public.property USING btree (city_id);



--
-- Name: idx_property_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_created ON public.property USING btree (created_at);



--
-- Name: idx_property_developer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_developer ON public.property USING btree (property_developer_id);



--
-- Name: idx_property_district; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_district ON public.property USING btree (district_id);



--
-- Name: idx_property_feature_feature; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_feature_feature ON public.property_feature USING btree (feature_id);



--
-- Name: idx_property_feature_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_feature_property ON public.property_feature USING btree (property_id);



--
-- Name: idx_property_listing_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_listing_type ON public.property USING btree (listing_type);



--
-- Name: idx_property_price; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_price ON public.property USING btree (price);



--
-- Name: idx_property_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_status ON public.property USING btree (status);



--
-- Name: idx_rating_developer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rating_developer ON public.property_developer_rating USING btree (property_developer_id);



--
-- Name: idx_rating_rater; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rating_rater ON public.property_developer_rating USING btree (rater_user_id);



--
-- Name: idx_report_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_status ON public.report USING btree (status);



--
-- Name: idx_report_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_target ON public.report USING btree (target_type, target_id);



--
-- Name: idx_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_hash ON public.refresh_token USING btree (token_hash);



--
-- Name: idx_token_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_user ON public.refresh_token USING btree (user_id);



--
-- Name: property_developer_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX property_developer_user_id_key ON public.property_developer USING btree (user_id);



--
-- Name: property_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX property_slug_key ON public.property USING btree (slug);



--
-- Name: refresh_token_token_hash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX refresh_token_token_hash_key ON public.refresh_token USING btree (token_hash);



--
-- Name: uq_favorite_user_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_favorite_user_property ON public.property_favorite USING btree (user_id, property_id);



--
-- Name: uq_property_feature; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_property_feature ON public.property_feature USING btree (property_id, feature_id);



--
-- Name: uq_rating_rater_developer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_rating_rater_developer ON public.property_developer_rating USING btree (rater_user_id, property_developer_id);



--
-- Name: user_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);



--
-- Name: appointment appointment_client_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT appointment_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE RESTRICT;



--
-- Name: appointment_history appointment_history_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_history
    ADD CONSTRAINT appointment_history_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointment(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: appointment appointment_property_developer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT appointment_property_developer_id_fkey FOREIGN KEY (property_developer_id) REFERENCES public.property_developer(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: appointment appointment_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT appointment_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id) ON UPDATE CASCADE ON DELETE RESTRICT;



--
-- Name: district district_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district
    ADD CONSTRAINT district_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.city(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: notification notification_property_developer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_property_developer_id_fkey FOREIGN KEY (property_developer_id) REFERENCES public.property_developer(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property_analytics property_analytics_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_analytics
    ADD CONSTRAINT property_analytics_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property property_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.city(id) ON UPDATE CASCADE ON DELETE RESTRICT;



--
-- Name: property_developer_rating property_developer_rating_property_developer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_developer_rating
    ADD CONSTRAINT property_developer_rating_property_developer_id_fkey FOREIGN KEY (property_developer_id) REFERENCES public.property_developer(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property_developer_rating property_developer_rating_rater_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_developer_rating
    ADD CONSTRAINT property_developer_rating_rater_user_id_fkey FOREIGN KEY (rater_user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property_developer property_developer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_developer
    ADD CONSTRAINT property_developer_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property property_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.district(id) ON UPDATE CASCADE ON DELETE SET NULL;



--
-- Name: property_favorite property_favorite_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_favorite
    ADD CONSTRAINT property_favorite_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property_favorite property_favorite_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_favorite
    ADD CONSTRAINT property_favorite_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property_feature property_feature_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_feature
    ADD CONSTRAINT property_feature_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.feature(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property_feature property_feature_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_feature
    ADD CONSTRAINT property_feature_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property_media property_media_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_media
    ADD CONSTRAINT property_media_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: property property_property_developer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_property_developer_id_fkey FOREIGN KEY (property_developer_id) REFERENCES public.property_developer(id) ON UPDATE CASCADE ON DELETE RESTRICT;



--
-- Name: refresh_token refresh_token_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;



--
-- Name: report report_reporter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;



--
-- Name: city; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.city ENABLE ROW LEVEL SECURITY;


--
-- Name: district; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.district ENABLE ROW LEVEL SECURITY;


--
-- Name: feature; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.feature ENABLE ROW LEVEL SECURITY;


--
-- Name: notification; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;


--
-- Name: property; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property ENABLE ROW LEVEL SECURITY;


--
-- Name: property_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;


--
-- Name: property_developer; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_developer ENABLE ROW LEVEL SECURITY;


--
-- Name: property_developer_rating; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_developer_rating ENABLE ROW LEVEL SECURITY;


--
-- Name: property_favorite; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_favorite ENABLE ROW LEVEL SECURITY;


--
-- Name: property_feature; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_feature ENABLE ROW LEVEL SECURITY;


--
-- Name: property_media; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;


--
-- Name: refresh_token; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.refresh_token ENABLE ROW LEVEL SECURITY;


--
-- Name: report; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.report ENABLE ROW LEVEL SECURITY;


--
-- Name: user; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;


--
-- Name: TABLE _prisma_migrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._prisma_migrations TO service_role;



--
-- Name: TABLE appointment; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.appointment TO service_role;



--
-- Name: TABLE appointment_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.appointment_history TO service_role;



--
-- Name: TABLE city; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.city TO service_role;



--
-- Name: TABLE district; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.district TO service_role;



--
-- Name: TABLE feature; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.feature TO service_role;



--
-- Name: TABLE notification; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification TO service_role;



--
-- Name: TABLE property; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property TO service_role;



--
-- Name: TABLE property_analytics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_analytics TO service_role;



--
-- Name: TABLE property_developer; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_developer TO service_role;



--
-- Name: TABLE property_developer_rating; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_developer_rating TO service_role;



--
-- Name: TABLE property_favorite; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_favorite TO service_role;



--
-- Name: TABLE property_feature; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_feature TO service_role;



--
-- Name: TABLE property_media; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_media TO service_role;



--
-- Name: TABLE refresh_token; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.refresh_token TO service_role;



--
-- Name: TABLE report; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.report TO service_role;



--
-- Name: TABLE "user"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."user" TO service_role;



--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;



--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


