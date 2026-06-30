// ============================================================
// LUMAVOK REAL ESTATE PLATFORM - DATABASE DESIGN
// ============================================================
// Total: 14 tables | Paste this code here -> https://dbdiagram.io/home 
// ============================================================

// ============================================================
// 1. MANDATORY TABLES
// ============================================================

// ------------------------------------------------------------
// 1.1 User - Login Account
// ------------------------------------------------------------
Table user {
  id INT PK
  email VARCHAR [unique, note: 'Login email address']
  password_hash VARCHAR [note: 'Scrambled password, never stored plain text']
  role VARCHAR [note: 'USER or PROPERTY_DEVELOPER']
  created_at TIMESTAMP
}

// ------------------------------------------------------------
// 1.2 PropertyDeveloper - Real Estate Seller/Agent
// Note: "Developer" means property seller, not software engineer
// ------------------------------------------------------------
Table property_developer {
  id INT PK
  user_id INT [unique, note: 'Links to User login']
  business_name VARCHAR
  whatsapp_number VARCHAR [note: 'Primary contact method']
  phone_number VARCHAR [note: 'Backup contact method']
  profile_image_url VARCHAR [note: 'Profile picture/logo']
  profile_image_public_id VARCHAR [note: 'Cloudinary public ID']
  cover_image_url VARCHAR
  cover_image_public_id VARCHAR
  bio TEXT
  years_of_experience INT
  specialization VARCHAR
  languages_spoken VARCHAR
  address VARCHAR
  city VARCHAR [note: 'City of operation']
  is_verified BOOLEAN [default: false, note: 'Admin verification status']
  verified_since TIMESTAMP
  average_rating DECIMAL [default: 0, note: 'Average star score (1-5)']
  total_ratings INT [default: 0, note: 'Number of ratings received']
  created_at TIMESTAMP
  updated_at TIMESTAMP
  deleted_at TIMESTAMP
}

// ------------------------------------------------------------
// 1.3 Property - The Actual Listing
// ------------------------------------------------------------
Table property {
  id INT PK
  property_developer_id INT [note: 'Links to PropertyDeveloper']
  title VARCHAR
  slug VARCHAR [unique, note: 'URL-friendly version of title']
  description TEXT
  category VARCHAR [note: 'APARTMENT, HOUSE, LAND, COMMERCIAL']
  listing_type VARCHAR [note: 'SALE or RENT']
  price DECIMAL [note: 'Price in local currency']
  address VARCHAR [note: 'Street address']
  city_id INT [note: 'Links to City (Ville)']
  district_id INT [note: 'Links to District (Quartier)']
  bedrooms INT
  bathrooms INT
  car_spaces INT
  land_size_sq_m DECIMAL
  building_size_sq_m DECIMAL
  year_built INT
  status VARCHAR [default: 'DRAFT', note: 'DRAFT, ACTIVE, RESERVED, SOLD']
  view_count INT [default: 0]
  whatsapp_click_count INT [default: 0]
  favorite_count INT [default: 0]
  published_at TIMESTAMP
  created_at TIMESTAMP
  updated_at TIMESTAMP
  deleted_at TIMESTAMP
}

// ------------------------------------------------------------
// 1.4 City - List of Cities (Villes)
// ------------------------------------------------------------
Table city {
  id INT PK
  name VARCHAR [unique, note: 'City name (e.g., Ouagadougou, Bobo-Dioulasso)']
  is_active BOOLEAN [default: true, note: 'Is this city available on the platform?']
  created_at TIMESTAMP
}

// ------------------------------------------------------------
// 1.5 District - Precise Location within a City (Quartier)
// ------------------------------------------------------------
Table district {
  id INT PK
  city_id INT [note: 'Links to City (Ville)']
  name VARCHAR [note: 'District/Neighborhood name (e.g., Zone du Bois, Dafra, Koulouba)']
  is_active BOOLEAN [default: true, note: 'Is this district available on the platform?']
  created_at TIMESTAMP

  indexes {
    (city_id, name) [unique, note: 'A district name must be unique within a city']
  }
}

// ------------------------------------------------------------
// 1.6 Feature - List of Amenities
// ------------------------------------------------------------
Table feature {
  id INT PK
  feature_name VARCHAR [unique, note: 'e.g., Swimming Pool, Garage']
  category VARCHAR [note: 'e.g., Security, Appliances, Outdoor']
  icon_name VARCHAR
  created_at TIMESTAMP
}

// ------------------------------------------------------------
// 1.7 PropertyFeature - Links Amenities to Properties
// ------------------------------------------------------------
Table property_feature {
  id INT PK
  property_id INT
  feature_id INT
  created_at TIMESTAMP

  indexes {
    (property_id, feature_id) [unique]
  }
}

// ------------------------------------------------------------
// 1.8 PropertyMedia - Images and Videos
// ------------------------------------------------------------
Table property_media {
  id INT PK
  property_id INT
  url VARCHAR [note: 'Cloudinary CDN URL']
  public_id VARCHAR [note: 'Cloudinary public ID for deletion']
  media_type VARCHAR [default: 'IMAGE', note: 'IMAGE or VIDEO']
  is_primary BOOLEAN [default: false, note: 'Main cover image']
  order INT [default: 0, note: 'Display order']
  alt_text VARCHAR [note: 'Accessibility text']
  created_at TIMESTAMP

  indexes {
    (property_id, is_primary)
  }
}

// ------------------------------------------------------------
// 1.9 PropertyFavorite - User's Saved Properties
// ------------------------------------------------------------
Table property_favorite {
  id INT PK
  user_id INT
  property_id INT
  created_at TIMESTAMP

  indexes {
    (user_id, property_id) [unique]
  }
}

// ------------------------------------------------------------
// 1.10 PropertyDeveloperRating - Trust Scores
// ------------------------------------------------------------
Table property_developer_rating {
  id INT PK
  rater_user_id INT
  property_developer_id INT
  score INT [note: 'Star rating, must be between 1 and 5']
  comment TEXT
  transaction_type VARCHAR [note: 'SALE, RENT, or OTHER']
  created_at TIMESTAMP

  indexes {
    (rater_user_id, property_developer_id) [unique]
  }
}

// ------------------------------------------------------------
// 1.11 Notification - Alerts for Sellers
// ------------------------------------------------------------
Table notification {
  id INT PK
  property_developer_id INT
  type VARCHAR [note: 'PROPERTY_LIKED, PROPERTY_VIEWED_MILESTONE']
  title VARCHAR
  message TEXT
  metadata JSON
  is_read BOOLEAN [default: false]
  read_at TIMESTAMP
  created_at TIMESTAMP

  indexes {
    (property_developer_id, is_read)
  }
}

// ------------------------------------------------------------
// 1.12 PropertyAnalytics - Daily Performance
// ------------------------------------------------------------
Table property_analytics {
  id INT PK
  property_id INT
  date DATE
  views INT [default: 0]
  whatsapp_clicks INT [default: 0]
  favorites INT [default: 0]
  created_at TIMESTAMP
  updated_at TIMESTAMP

  indexes {
    (property_id, date) [unique]
  }
}

// ------------------------------------------------------------
// 1.13 Report - User Complaints / Admin Moderation
// ------------------------------------------------------------
Table report {
  id INT PK
  reporter_user_id INT
  target_type VARCHAR [note: 'PROPERTY or PROPERTY_DEVELOPER']
  target_id INT
  reason VARCHAR
  description TEXT
  status VARCHAR [default: 'OPEN', note: 'OPEN, UNDER_REVIEW, RESOLVED, DISMISSED']
  resolution_note TEXT
  created_at TIMESTAMP
  updated_at TIMESTAMP

  indexes {
    target_type
    target_id
    status
  }
}

// ------------------------------------------------------------
// 1.14 RefreshToken - Secure Auto-Login
// ------------------------------------------------------------
Table refresh_token {
  id INT PK
  user_id INT
  token_hash VARCHAR [note: 'Scrambled token value']
  expires_at TIMESTAMP
  revoked_at TIMESTAMP
  user_agent TEXT
  ip_address VARCHAR
  created_at TIMESTAMP

  indexes {
    token_hash [unique]
  }
}


// ============================================================
// 2. RELATIONSHIPS (FOREIGN KEYS)
// ============================================================

// --- User Relationships ---
Ref: property_developer.user_id > user.id
Ref: property_favorite.user_id > user.id
Ref: property_developer_rating.rater_user_id > user.id
Ref: report.reporter_user_id > user.id
Ref: refresh_token.user_id > user.id

// --- PropertyDeveloper Relationships ---
Ref: property.property_developer_id > property_developer.id
Ref: property_developer_rating.property_developer_id > property_developer.id
Ref: notification.property_developer_id > property_developer.id

// --- Property Location Relationships ---
Ref: property.city_id > city.id
Ref: property.district_id > district.id

// --- District Relationships ---
Ref: district.city_id > city.id

// --- Property Relationships ---
Ref: property_feature.property_id > property.id
Ref: property_media.property_id > property.id
Ref: property_favorite.property_id > property.id
Ref: property_analytics.property_id > property.id

// --- Feature Relationships ---
Ref: property_feature.feature_id > feature.id