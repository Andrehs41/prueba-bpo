-- ============================================================================
--  Multi-Tenant slice vertical - database schema + dummy data
--  Runs automatically on first MySQL container start.
--  Also usable manually:  mysql -u bpo_user -p multitenant < backend/db/init.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS multitenant
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE multitenant;

-- Idempotent: allow re-running the script cleanly.
DROP TABLE IF EXISTS records;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

-- ----------------------------------------------------------------------------
-- tenants: each customer/organization in the platform.
-- `slug` is the human-readable identifier used in the frontend URL.
-- ----------------------------------------------------------------------------
CREATE TABLE tenants (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(64)  NOT NULL,
  name        VARCHAR(128) NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenants_slug (slug)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- users: belong to exactly one tenant. Drives JWT auth + role-based access.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id      INT UNSIGNED NOT NULL,
  email          VARCHAR(190) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- email is unique *per tenant*, not globally.
  UNIQUE KEY uq_users_tenant_email (tenant_id, email),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- records: business data. ALWAYS scoped to a tenant (tenant_id NOT NULL + FK).
-- This is the table whose isolation the test evaluates.
-- ----------------------------------------------------------------------------
CREATE TABLE records (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id   INT UNSIGNED NOT NULL,
  name        VARCHAR(190) NOT NULL,
  amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_records_tenant (tenant_id),
  CONSTRAINT fk_records_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
--  DUMMY DATA
-- ============================================================================

-- Two tenants to prove isolation between them.
INSERT INTO tenants (id, slug, name) VALUES
  (1, 'acme',   'ACME Corporation'),
  (2, 'globex', 'Globex Industries');

-- Seed users (passwords below are bcrypt hashes):
--   acme   -> admin@acme.com   / admin123   (ADMIN)
--           user@acme.com    / user123    (USER)
--   globex -> admin@globex.com / admin123   (ADMIN)
INSERT INTO users (tenant_id, email, password_hash, role) VALUES
  (1, 'admin@acme.com',   '$2a$10$coIeQSX3Rz32CIBFooR0a.5HIFH8m7fee4gnM9WiWBX52KkrT/.LG', 'ADMIN'),
  (1, 'user@acme.com',    '$2a$10$USh4uLAgMAPukTbSl/Xy0e06Pueq77rJknKowoGlaXTG.AlP/ytzK', 'USER'),
  (2, 'admin@globex.com', '$2a$10$coIeQSX3Rz32CIBFooR0a.5HIFH8m7fee4gnM9WiWBX52KkrT/.LG', 'ADMIN');

-- Records for ACME (tenant 1).
INSERT INTO records (tenant_id, name, amount) VALUES
  (1, 'ACME - Invoice #1001', 1200.50),
  (1, 'ACME - Invoice #1002',  980.00),
  (1, 'ACME - Subscription Q1', 4500.00),
  (1, 'ACME - Hardware purchase', 230.75),
  (1, 'ACME - Consulting hours', 3100.00);

-- Records for Globex (tenant 2) - must never be visible to ACME.
INSERT INTO records (tenant_id, name, amount) VALUES
  (2, 'Globex - Invoice #5001', 760.00),
  (2, 'Globex - Invoice #5002', 1540.20),
  (2, 'Globex - Cloud credits', 999.99),
  (2, 'Globex - Marketing spend', 2750.00);
