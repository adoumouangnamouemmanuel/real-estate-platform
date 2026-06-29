# Lumavok Real Estate Platform — Complete Database Blueprint

> **Last updated:** 29/06/2026

---

## Table of Contents

- [1. The Big Picture](#1-the-big-picture)
- [2. Mandatory Tables (Required for MVP Launch)](#2-mandatory-tables-required-for-mvp-launch)
  - [2.1 `User`](#21-user-the-login-account)
  - [2.2 `PropertyDeveloper`](#22-propertydeveloper-the-real-estate-sellersagent)
  - [2.3 `Property`](#23-property-the-actual-listing)
  - [2.4 `City`](#24-city-list-of-cities)
  - [2.5 `District`](#25-district-precise-location-within-a-city-quartier)
  - [2.6 `Feature`](#26-feature-list-of-amenities)
  - [2.7 `PropertyFeature`](#27-propertyfeature-links-amenities-to-properties)
  - [2.8 `PropertyMedia`](#28-propertymedia-images-and-videos)
  - [2.9 `PropertyFavorite`](#29-propertyfavorite-users-saved-properties)
  - [2.10 `PropertyDeveloperRating`](#210-propertydeveloperrating-trust-scores)
  - [2.11 `Notification`](#211-notification-alerts-for-sellers)
  - [2.12 `PropertyAnalytics`](#212-propertyanalytics-daily-performance)
  - [2.13 `Report`](#213-report-user-complaints--admin-moderation)
  - [2.14 `RefreshToken`](#214-refreshtoken-secure-auto-login)
- [3. How Entities Connect (Relationship Map)](#3-how-entities-connect-relationship-map)
- [4. The Rules (Constraints to Enforce)](#4-the-rules-constraints-to-enforce)
- [5. Indexes (The Secret to Speed)](#5-indexes-the-secret-to-speed)
- [6. Final Checklist for the DBA](#6-final-checklist-for-the-dba)
- [Summary](#summary)

---

## 1. The Big Picture

The database is organized around **four main types of information**:

| Type | Description |
| :--- | :--- |
| **Who is using the platform** | Users and Property Developers |
| **What they are selling** | Properties, Images, Features, and Analytics |
| **How users interact** | Favorites, Ratings, Reports, and Notifications |
| **Where properties are located** | Cities and Districts (Quartiers) |

---

## 2. Mandatory Tables

Below are the **14 tables** that are absolutely required for the platform to function. If any of these are missing, the platform breaks.

---

### 2.1 `User` (The Login Account)

**Why we need it:** Every person using the platform needs an email and password to log in and do things (like saving favorites or listing properties).

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique internal ID. | **Yes** |
| `email` | The login email address. | **Yes** *(must be unique)* |
| `password_hash` | The scrambled password. We never store plain text. | **Yes** |
| `role` | What type of user: `USER` (just browsing) or `PROPERTY_DEVELOPER` (can sell). | **Yes** |
| `created_at` | When the account was made. | **Yes** |

**Rules to enforce:**
- `email` must be **unique** — no two users can share the same email.
- `role` determines what features the user can access.

---

### 2.2 `PropertyDeveloper` (The Real Estate Seller/Agent)

**Why we need it:** We must separate the login account (`User`) from the business profile. This table holds the agent's contact details, profile images, and trust score.

**Important:** *"Developer" here means the property seller (agent/agency), NOT a software engineer.*

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique internal ID. | **Yes** |
| `user_id` | Links this profile to a specific `User` login. | **Yes** *(must be unique per user)* |
| `business_name` | The official agency or seller name. | No |
| `whatsapp_number` | The phone number for WhatsApp contact. | **Yes** |
| `phone_number` | Alternative/secondary phone number. | **Yes** |
| `profile_image_url` | Link to their profile picture/logo. | **Yes** |
| `profile_image_public_id` | Cloudinary public ID for deletion/updates. | **Yes** |
| `cover_image_url` | Banner/cover image for their profile page. | No |
| `cover_image_public_id` | Cloudinary public ID for deletion/updates. | No |
| `bio` | A short description of their business. | No |
| `years_of_experience` | How many years they have been in real estate. | No |
| `specialization` | What they specialize in (e.g., *"Luxury Homes"*, *"Land Sales"*). | No |
| `languages_spoken` | Languages they can communicate in (e.g., *"French, English, Moore"*). | No |
| `address` | Physical office/business address. | No |
| `city` | City of operation. | **Yes** |
| `is_verified` | Has an Admin checked their documents? | **Yes** *(defaults to `FALSE`)* |
| `verified_since` | Date they were verified. | No |
| `average_rating` | Their average star score (1 to 5). | **Yes** *(defaults to `0`)* |
| `total_ratings` | How many people have rated them. | **Yes** *(defaults to `0`)* |
| `created_at` | When the profile was created. | **Yes** |
| `updated_at` | When the profile was last updated. | **Yes** |
| `deleted_at` | Soft deletion timestamp (for data recovery). | No |

**Rules to enforce:**
- `whatsapp_number` is **mandatory** — without it, clients cannot contact the seller.
- `phone_number` is **mandatory** — backup contact method.
- `profile_image_url` is **mandatory** — a seller without a profile image looks untrustworthy.
- `city` is **mandatory** — clients search by city.
- `is_verified` defaults to `FALSE`; only Admins can set it to `TRUE`.
- `average_rating` and `total_ratings` start at `0` and increase as users submit ratings.

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_developer_verified` | `is_verified` | To quickly filter verified sellers. |
| `idx_developer_rating` | `average_rating` | To sort by highest rated. |
| `idx_developer_city` | `city` | To filter sellers by city. |

---

### 2.3 `Property` (The Actual Listing)

**Why we need it:** This is the heart of the platform. Without this table, there is nothing to search for or buy.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique internal ID. | **Yes** |
| `property_developer_id` | Links this listing to the `PropertyDeveloper` who owns it. | **Yes** |
| `title` | The headline (e.g., *"Beautiful 3-Bedroom House"*). | **Yes** |
| `slug` | A unique URL-friendly version of the title (e.g., `beautiful-3-bedroom-house`). | **Yes** *(must be unique)* |
| `description` | The full details about the property. | **Yes** |
| `category` | What type: `APARTMENT`, `HOUSE`, `LAND`, `COMMERCIAL`. | **Yes** |
| `listing_type` | Is it for `SALE` or `RENT`? | **Yes** |
| `price` | The amount in local currency (e.g., XOF). | **Yes** |
| `address` | The street address. | **Yes** |
| `city_id` | Links to `City` (Ville). | **Yes** |
| `district_id` | Links to `District` (Quartier). | No |
| `bedrooms` | Number of bedrooms. | No |
| `bathrooms` | Number of bathrooms. | No |
| `car_spaces` | Number of parking spaces. | No |
| `land_size_sq_m` | Land/block size in square meters. | No |
| `building_size_sq_m` | Building size in square meters. | No |
| `year_built` | Year of construction. | No |
| `status` | Lifecycle: `DRAFT` (hidden), `ACTIVE` (visible), `RESERVED` (hidden), or `SOLD` (hidden). | **Yes** *(defaults to `DRAFT`)* |
| `view_count` | Total times this page was viewed. | **Yes** *(defaults to `0`)* |
| `whatsapp_click_count` | Total times the WhatsApp button was clicked. | **Yes** *(defaults to `0`)* |
| `favorite_count` | Total times this property was favorited. | **Yes** *(defaults to `0`)* |
| `published_at` | The date it was first made `ACTIVE`. | No |
| `created_at` | The date the listing was created. | **Yes** |
| `updated_at` | The date the listing was last updated. | **Yes** |
| `deleted_at` | Soft deletion timestamp (for data recovery). | No |

**Rules to enforce:**
- Only `ACTIVE` listings appear in public searches.
- `slug` is auto-generated from `title` and must be unique.
- `city_id` is mandatory — every property must be linked to a city.
- `district_id` is optional — for precise location (quartier).
- `published_at` is set when `status` changes from `DRAFT` to `ACTIVE`.
- `price` cannot be negative *(check constraint)*.
- `view_count`, `whatsapp_click_count`, and `favorite_count` are incremented by the application.

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_property_status` | `status` | We always filter for `ACTIVE` listings. |
| `idx_property_city` | `city_id` | Users search by city. |
| `idx_property_district` | `district_id` | Users filter by district/quartier. |
| `idx_property_listing_type` | `listing_type` | Users filter by `SALE` or `RENT`. |
| `idx_property_price` | `price` | Users filter by minimum and maximum price. |
| `idx_property_developer` | `property_developer_id` | We often join listings with the seller. |
| `idx_property_category` | `category` | Users filter by property type. |
| `idx_property_created` | `created_at` | To sort by newest listings. |

---

### 2.4 `City` (List of Cities)

**Why we need it:** To have a clean, standardized list of cities (Villes) for properties and sellers. This prevents spelling mistakes and makes search consistent.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique internal ID. | **Yes** |
| `name` | City name (e.g., *"Ouagadougou"*, *"Bobo-Dioulasso"*). | **Yes** *(must be unique)* |
| `is_active` | Is this city available on the platform? | **Yes** *(defaults to `TRUE`)* |
| `created_at` | When the record was created. | **Yes** |

**Rules to enforce:**
- `name` must be **unique** — no duplicate cities.
- Cities are added by **Admins**.
- Only `is_active = TRUE` cities appear in dropdown lists.

---

### 2.5 `District` (Precise Location within a City / Quartier)

**Why we need it:** To store the neighborhood/quartier where a property is located. This gives users a precise approximation of the property's location within a city.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique internal ID. | **Yes** |
| `city_id` | Links to `City` (Ville). | **Yes** |
| `name` | District/Quartier name (e.g., *"Zone du Bois"*, *"Dafra"*, *"Koulouba"*). | **Yes** |
| `is_active` | Is this district available on the platform? | **Yes** *(defaults to `TRUE`)* |
| `created_at` | When the record was created. | **Yes** |

**Rules to enforce:**
- A district name must be **unique within a city** *(unique constraint on `city_id` + `name`)*.
- For example, "Dafra" can exist in both Ouagadougou and Bobo-Dioulasso.
- Districts are added by **Admins**.
- Only `is_active = TRUE` districts appear in dropdown lists.

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_district_city` | `city_id` | To load all districts for a city. |
| `idx_district_city_name` | `city_id`, `name` | To enforce uniqueness and speed up lookups. |

---

### 2.6 `Feature` (List of Amenities)

**Why we need it:** To store a master list of all possible amenities (e.g., "Swimming Pool", "Garage", "Solar Panel", "Washing Machine"). We give developers a dropdown list to avoid spelling mistakes.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique internal ID. | **Yes** |
| `feature_name` | The name of the amenity (e.g., *"Swimming Pool"*). | **Yes** *(must be unique)* |
| `category` | Optional group (e.g., *"Security"*, *"Appliances"*, *"Outdoor"*). | No |
| `icon_name` | An icon code to display next to it on the website. | No |
| `created_at` | When the feature was created. | **Yes** |

**Rules to enforce:**
- `feature_name` must be **unique** — no duplicate amenities.
- Features are added by **Admins** (not by sellers).

---

### 2.7 `PropertyFeature` (Links Amenities to Properties)

**Why we need it:** A property can have many features (e.g., a house can have a garage *and* a pool). And a feature (like "Garage") can belong to many properties. This table connects them.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique internal ID. | **Yes** |
| `property_id` | Links to the specific `Property`. | **Yes** |
| `feature_id` | Links to the specific `Feature` (amenity). | **Yes** |
| `created_at` | When the feature was added to the property. | **Yes** |

**Rules to enforce:**
- A property cannot have the same feature listed twice *(unique constraint on `property_id` + `feature_id`)*.
- Deleting a `Property` deletes its associated `PropertyFeature` records *(`CASCADE`)*.

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_property_feature_property` | `property_id` | To quickly load all features for a property. |
| `idx_property_feature_feature` | `feature_id` | To find all properties with a specific amenity. |

---

### 2.8 `PropertyMedia` (Images and Videos)

**Why we need it:** One listing can have up to 10 images. We store them in a separate table to keep the `Property` table clean.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique ID for the media file. | **Yes** |
| `property_id` | Links this media to a specific `Property`. | **Yes** |
| `url` | The web address where the image is hosted (Cloudinary CDN). | **Yes** |
| `public_id` | The ID used by Cloudinary so we can delete it later. | **Yes** |
| `media_type` | Is it an `IMAGE` or `VIDEO`? | **Yes** *(defaults to `IMAGE`)* |
| `is_primary` | Is this the main cover image? | **Yes** *(defaults to `FALSE`)* |
| `order` | The display order (1st, 2nd, 3rd...). | **Yes** *(defaults to `0`)* |
| `alt_text` | Accessibility text for screen readers. | No |
| `created_at` | When the media was uploaded. | **Yes** |

**Rules to enforce:**
- Maximum **10 images** and **1 video** per property.
- At least one primary image must exist for `ACTIVE` listings.
- `is_primary` should be `TRUE` for exactly one media item per property.
- Deleting a `Property` deletes its associated `PropertyMedia` records *(`CASCADE`)*.

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_media_property` | `property_id` | To load all media for a property. |
| `idx_media_primary` | `property_id`, `is_primary` | To quickly find the cover image. |

---

### 2.9 `PropertyFavorite` (User's Saved Properties)

**Why we need it:** Users need a way to save properties to decide later. This table tracks exactly which properties a specific user has "hearted".

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique ID for the saved favorite. | **Yes** |
| `user_id` | The `User` who is saving the property. | **Yes** |
| `property_id` | The `Property` they are saving. | **Yes** |
| `created_at` | When they saved it. | **Yes** |

**Rules to enforce:**
- A user cannot favorite the same property twice *(unique constraint on `user_id` + `property_id`)*.
- Deleting a `User` or `Property` deletes its associated favorites *(`CASCADE`)*.

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_favorite_user` | `user_id` | To quickly load a user's list of favorites. |
| `idx_favorite_property` | `property_id` | To count how many users favorited a property. |

---

### 2.10 `PropertyDeveloperRating` (Trust Scores)

**Why we need it:** We need to hold sellers accountable. If a seller is bad, users can give them a 1-star rating. If they are great, they get 5 stars. This builds trust.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique ID for the rating. | **Yes** |
| `rater_user_id` | The `User` giving the rating. | **Yes** |
| `property_developer_id` | The `PropertyDeveloper` being rated. | **Yes** |
| `score` | The star rating (must be between 1 and 5). | **Yes** |
| `comment` | Optional text review. | No |
| `transaction_type` | Context: `SALE`, `RENT`, or `OTHER`. | No |
| `created_at` | When the rating was submitted. | **Yes** |

**Rules to enforce:**
- A user can only rate a specific seller once *(unique constraint on `rater_user_id` + `property_developer_id`)*.
- Rating must be between 1 and 5 *(check constraint)*.
- `average_rating` and `total_ratings` in `PropertyDeveloper` are updated automatically (via application logic or trigger).

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_rating_developer` | `property_developer_id` | To quickly calculate the average rating for a seller. |
| `idx_rating_rater` | `rater_user_id` | To check if a user has already rated a seller. |

---

### 2.11 `Notification` (Alerts for Sellers)

**Why we need it:** Property developers need to know when someone likes their property or contacts them. This table holds those alerts so they see them when they log in.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique ID for the notification. | **Yes** |
| `property_developer_id` | Which seller this alert is for. | **Yes** |
| `type` | What happened: `PROPERTY_LIKED`, `PROPERTY_VIEWED_MILESTONE`. | **Yes** |
| `title` | The subject of the alert. | **Yes** |
| `message` | The detailed message. | **Yes** |
| `metadata` | Structured data for rendering (e.g., `{ property_id, property_title }`). | No |
| `is_read` | Has the seller seen it yet? | **Yes** *(defaults to `FALSE`)* |
| `read_at` | When the notification was read. | No |
| `created_at` | When the alert was sent. | **Yes** |

**Rules to enforce:**
- Notifications are automatically created by background jobs.
- Read status is updated when the user views their notification feed.
- Notifications older than 30 days may be archived.

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_notification_developer` | `property_developer_id` | To load a seller's notification feed. |
| `idx_notification_read` | `property_developer_id`, `is_read` | To filter unread notifications. |

---

### 2.12 `PropertyAnalytics` (Daily Performance)

**Why we need it:** Sellers want to know if their property is popular. This table stores daily counts so we can show them a chart (e.g., views went up this week).

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique ID for the daily record. | **Yes** |
| `property_id` | The property being tracked. | **Yes** |
| `date` | The specific day (e.g., `2026-06-29`). | **Yes** |
| `views` | How many views on that specific day. | **Yes** *(defaults to `0`)* |
| `whatsapp_clicks` | How many WhatsApp clicks on that day. | **Yes** *(defaults to `0`)* |
| `favorites` | How many times it was favorited on that day. | **Yes** *(defaults to `0`)* |
| `created_at` | When the record was created. | **Yes** |
| `updated_at` | When the record was last updated. | **Yes** |

**Rules to enforce:**
- We only store **one record per property, per day** *(unique constraint on `property_id` + `date`)*.
- Records are upserted via atomic increment operations.
- Data is aggregated by daily cron job or application events.

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_analytics_property_date` | `property_id`, `date` | To quickly pull daily charts for a specific property. |

---

### 2.13 `Report` (User Complaints / Admin Moderation)

**Why we need it:** Users might spot a fake listing or a scammer. This table stores those complaints so the Admin can review and suspend bad actors.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique ID for the report. | **Yes** |
| `reporter_user_id` | The `User` filing the report. Can be empty for anonymous reports. | No |
| `target_type` | What is being reported? `PROPERTY` or `PROPERTY_DEVELOPER`. | **Yes** |
| `target_id` | The ID of the property or seller being reported. | **Yes** |
| `reason` | Why they are reporting (e.g., *"Fake photos"*, *"Scam"*). | **Yes** |
| `description` | Detailed description (optional). | No |
| `status` | Admin status: `OPEN`, `UNDER_REVIEW`, `RESOLVED`, or `DISMISSED`. | **Yes** *(defaults to `OPEN`)* |
| `resolution_note` | Admin notes on how the report was resolved. | No |
| `created_at` | When the report was filed. | **Yes** |
| `updated_at` | When the report was last updated. | **Yes** |

**Rules to enforce:**
- Reports can be submitted **anonymously** (`reporter_user_id` can be `NULL`).
- Only Admins can update the `status` field.
- Deleting a `User` sets `reporter_user_id` to `NULL` (preserves the report).

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_report_status` | `status` | To filter open reports for Admins. |
| `idx_report_target` | `target_type`, `target_id` | To find all reports about a specific property or seller. |

---

### 2.14 `RefreshToken` (Secure Auto-Login)

**Why we need it:** We never store passwords in the user's browser. Instead, we issue a secure token so they don't have to log in every 5 minutes. This table stores those tokens safely on the server.

| Field Name | What It Stores | Required? |
| :--- | :--- | :--- |
| `id` | Unique ID for the token. | **Yes** |
| `user_id` | The `User` this token belongs to. | **Yes** |
| `token_hash` | The scrambled token value. | **Yes** |
| `expires_at` | When this token stops working. | **Yes** |
| `revoked_at` | If the token was manually cancelled (e.g., user logged out). | No |
| `user_agent` | The client's browser/device info (for security). | No |
| `ip_address` | The client's IP address (for security). | No |
| `created_at` | When the token was created. | **Yes** |

**Rules to enforce:**
- Tokens expire after **7 days** (configurable).
- Each user can have multiple active refresh tokens (for multiple devices).
- Revoked tokens cannot be used.
- Token rotation creates a new token and revokes the old one.

**Indexes I recommend:**

| Index | Columns | Why |
| :--- | :--- | :--- |
| `idx_token_user` | `user_id` | To find all tokens for a user. |
| `idx_token_hash` | `token_hash` | To quickly look up a token during authentication. |

---

## 3. How Entities Connect (Relationship Map)

For you as the DBA, here is how the data links together:

| Relationship | Type | Description |
| :--- | :--- | :--- |
| `User` ↔ `PropertyDeveloper` | One-to-One | One login account, one seller profile. |
| `PropertyDeveloper` → `Property` | One-to-Many | One seller can have many listings. |
| `City` → `District` | One-to-Many | One city can have many districts/quartiers. |
| `City` → `Property` | One-to-Many | One city can have many properties. |
| `District` → `Property` | One-to-Many | One district can have many properties. |
| `Property` → `PropertyMedia` | One-to-Many | One listing can have many images. |
| `Property` ↔ `Feature` (via `PropertyFeature`) | Many-to-Many | Properties can have many features; features can belong to many properties. |
| `User` ↔ `Property` (via `PropertyFavorite`) | Many-to-Many | Users can favorite many properties; properties can be favorited by many users. |
| `User` ↔ `PropertyDeveloper` (via `PropertyDeveloperRating`) | Many-to-Many | Users can rate many sellers; sellers can be rated by many users. |
| `PropertyDeveloper` → `Notification` | One-to-Many | One seller receives many alerts. |
| `Property` → `PropertyAnalytics` | One-to-Many | One property has many daily data records. |
| `User` → `Report` | One-to-Many | One user can submit many reports. |
| `User` → `RefreshToken` | One-to-Many | One user can have many active sessions. |

---

## 4. The Rules (Constraints to Enforce)

As the DBA, you must set these rules so the application doesn't store bad data:

| Constraint | Table(s) | Type | Purpose |
| :--- | :--- | :--- | :--- |
| No duplicate emails | `User` | `UNIQUE` | Prevent multiple accounts with the same email. |
| No duplicate slugs | `Property` | `UNIQUE` | Each property needs a unique URL. |
| No duplicate cities | `City` | `UNIQUE` | Prevent duplicate city names. |
| No duplicate districts in same city | `District` | `UNIQUE (city_id + name)` | A district name must be unique within its city. |
| No duplicate features | `Feature` | `UNIQUE` | Prevent duplicate amenities. |
| No duplicate favorites | `PropertyFavorite` | `UNIQUE (user_id + property_id)` | A user can favorite a property only once. |
| No duplicate ratings | `PropertyDeveloperRating` | `UNIQUE (rater_user_id + property_developer_id)` | A user can rate a seller only once. |
| No duplicate property features | `PropertyFeature` | `UNIQUE (property_id + feature_id)` | A property can have a feature only once. |
| No duplicate analytics | `PropertyAnalytics` | `UNIQUE (property_id + date)` | Only one record per property, per day. |
| Rating must be 1–5 | `PropertyDeveloperRating` | `CHECK (score BETWEEN 1 AND 5)` | Valid star ratings only. |
| Price cannot be negative | `Property` | `CHECK (price >= 0)` | No negative prices. |

---

## 5. Indexes (The Secret to Speed)

> **Tip:** As the platform grows, the database will become slow if we don't add indexes. Think of an index like the index at the back of a book — it lets the database find data instantly without flipping through every page.

### Mandatory Indexes (Create Immediately)

| Table | Column(s) to Index | Why We Need It |
| :--- | :--- | :--- |
| `Property` | `status` | We always filter for `ACTIVE` listings. |
| `Property` | `city_id` | Users search by city. |
| `Property` | `district_id` | Users filter by district/quartier. |
| `Property` | `listing_type` | Users filter by `SALE` or `RENT`. |
| `Property` | `price` | Users filter by minimum and maximum price. |
| `Property` | `property_developer_id` | We often join listings with the seller. |
| `Property` | `category` | Users filter by property type. |
| `Property` | `created_at` | Users sort by newest listings. |
| `PropertyDeveloper` | `is_verified` | To filter verified sellers. |
| `PropertyDeveloper` | `average_rating` | To sort by highest rated sellers. |
| `PropertyDeveloper` | `city` | To filter sellers by city. |
| `District` | `city_id` | To load all districts for a city. |
| `PropertyMedia` | `property_id` | To load all media for a property. |
| `PropertyFeature` | `property_id` | To load all features for a property. |
| `PropertyFavorite` | `user_id` | To quickly load a user's list of favorites. |
| `PropertyAnalytics` | `property_id`, `date` | To quickly pull daily charts for a specific property. |
| `PropertyDeveloperRating` | `property_developer_id` | To quickly calculate average rating for a seller. |
| `Notification` | `property_developer_id` | To load a seller's notification feed. |
| `RefreshToken` | `token_hash` | To quickly look up a token during authentication. |

---

## 6. Final Checklist for the DBA

To have a fully working platform, we must ensure these tables exist and are correctly linked:

### Mandatory Tables (MVP Launch) — 14 Tables

- [ ] `User` — for logins.
- [ ] `PropertyDeveloper` — for the seller's business profile.
- [ ] `Property` — for the listings.
- [ ] `City` — for the list of cities (Villes).
- [ ] `District` — for precise locations within cities (Quartiers).
- [ ] `Feature` — for the list of amenities.
- [ ] `PropertyFeature` — to link amenities to properties.
- [ ] `PropertyMedia` — for images and videos.
- [ ] `PropertyFavorite` — for saving properties for later.
- [ ] `PropertyDeveloperRating` — for trust and reviews.
- [ ] `Notification` — for alerts.
- [ ] `PropertyAnalytics` — for daily stats.
- [ ] `Report` — for admin moderation.
- [ ] `RefreshToken` — for secure auto-login.

---

## Summary

If you build these **14 tables** with the correct:

1. **Foreign keys** — to link tables together
2. **Unique constraints** — to prevent duplicates
3. **Check constraints** — to validate data
4. **Indexes** — for speed

...then the backend developers will have everything they need to build a fully working real estate platform for Burkina Faso and beyond.

---

### Location Hierarchy
City (Ville)
└── District (Quartier)
└── Property


| Level | Table | Example (Ouagadougou) |
| :--- | :--- | :--- |
| City | `City` | Ouagadougou |
| District | `District` | Zone du Bois, Dafra, Koulouba, Gounghin |

---

*End of document.*