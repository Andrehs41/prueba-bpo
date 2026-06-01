-- ============================================================================
--  Arquitectura Multi-Tenant - esquema + datos de prueba (en español)
--  Se ejecuta automáticamente al iniciar el contenedor MySQL por primera vez.
--  Uso manual:  mysql -u bpo_user -p multitenant < backend/db/init.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS multitenant
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE multitenant;

-- Idempotente: permite re-ejecutar el script sin errores.
DROP TABLE IF EXISTS records;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

-- ----------------------------------------------------------------------------
-- tenants: cada empresa/organización de la plataforma.
-- `slug` es el identificador legible usado en la URL del frontend.
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
-- users: pertenecen a un único tenant. Base de la autenticación JWT + roles.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id      INT UNSIGNED NOT NULL,
  email          VARCHAR(190) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- el email es único *por tenant*, no global.
  UNIQUE KEY uq_users_tenant_email (tenant_id, email),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- records: datos de negocio. SIEMPRE asociados a un tenant (tenant_id NOT NULL).
-- Es la tabla cuyo aislamiento evalúa la prueba.
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
--  DATOS DE PRUEBA (DUMMY) - 6 empresas en español
-- ============================================================================

INSERT INTO tenants (id, slug, name) VALUES
  (1, 'distribuidora-andina', 'Distribuidora Andina S.A.S.'),
  (2, 'cafe-monteverde',      'Café Monteverde'),
  (3, 'transportes-rapidos',  'Transportes Rápidos Ltda.'),
  (4, 'clinica-vida-sana',    'Clínica Vida Sana'),
  (5, 'constructora-horizonte','Constructora Horizonte'),
  (6, 'moda-urbana',          'Moda Urbana');

-- Usuarios sembrados. Las contraseñas son hashes bcrypt de:
--   ADMIN -> admin123     USER -> user123
-- El patrón de correos es admin@<slug>.com y usuario@<slug>.com
INSERT INTO users (tenant_id, email, password_hash, role) VALUES
  -- Distribuidora Andina
  (1, 'admin@distribuidora-andina.com',  '$2a$10$coIeQSX3Rz32CIBFooR0a.5HIFH8m7fee4gnM9WiWBX52KkrT/.LG', 'ADMIN'),
  (1, 'usuario@distribuidora-andina.com','$2a$10$USh4uLAgMAPukTbSl/Xy0e06Pueq77rJknKowoGlaXTG.AlP/ytzK', 'USER'),
  -- Café Monteverde
  (2, 'admin@cafe-monteverde.com',       '$2a$10$coIeQSX3Rz32CIBFooR0a.5HIFH8m7fee4gnM9WiWBX52KkrT/.LG', 'ADMIN'),
  (2, 'usuario@cafe-monteverde.com',     '$2a$10$USh4uLAgMAPukTbSl/Xy0e06Pueq77rJknKowoGlaXTG.AlP/ytzK', 'USER'),
  -- Transportes Rápidos
  (3, 'admin@transportes-rapidos.com',   '$2a$10$coIeQSX3Rz32CIBFooR0a.5HIFH8m7fee4gnM9WiWBX52KkrT/.LG', 'ADMIN'),
  (3, 'usuario@transportes-rapidos.com', '$2a$10$USh4uLAgMAPukTbSl/Xy0e06Pueq77rJknKowoGlaXTG.AlP/ytzK', 'USER'),
  -- Clínica Vida Sana
  (4, 'admin@clinica-vida-sana.com',     '$2a$10$coIeQSX3Rz32CIBFooR0a.5HIFH8m7fee4gnM9WiWBX52KkrT/.LG', 'ADMIN'),
  -- Constructora Horizonte
  (5, 'admin@constructora-horizonte.com','$2a$10$coIeQSX3Rz32CIBFooR0a.5HIFH8m7fee4gnM9WiWBX52KkrT/.LG', 'ADMIN'),
  -- Moda Urbana
  (6, 'admin@moda-urbana.com',           '$2a$10$coIeQSX3Rz32CIBFooR0a.5HIFH8m7fee4gnM9WiWBX52KkrT/.LG', 'ADMIN');

-- Registros por empresa (información distinta y temática para cada tenant).
-- Distribuidora Andina (1) - facturas e inventario
INSERT INTO records (tenant_id, name, amount) VALUES
  (1, 'Factura #A-1001 - Supermercados del Valle', 1850000.00),
  (1, 'Factura #A-1002 - Tienda La Esquina',        430500.00),
  (1, 'Compra de inventario - Granos y cereales',  2750000.00),
  (1, 'Devolución mercancía - Lote 45',             -120000.00),
  (1, 'Factura #A-1003 - Minimercado El Sol',       675300.00),
  (1, 'Pago a proveedor - Empaques Andina',        1200000.00);

-- Café Monteverde (2) - cosechas y exportación
INSERT INTO records (tenant_id, name, amount) VALUES
  (2, 'Cosecha lote norte - Café Excelso',         3200000.00),
  (2, 'Exportación contenedor #7 - Alemania',     18500000.00),
  (2, 'Venta local - Tostadora Premium',            540000.00),
  (2, 'Mantenimiento maquinaria de secado',         890000.00),
  (2, 'Cosecha lote sur - Café Supremo',           2980000.00);

-- Transportes Rápidos (3) - rutas y flota
INSERT INTO records (tenant_id, name, amount) VALUES
  (3, 'Ruta Bogotá - Medellín (carga seca)',        980000.00),
  (3, 'Mantenimiento flota - Tractomula 04',       1450000.00),
  (3, 'Ruta Cali - Barranquilla (refrigerado)',    1675000.00),
  (3, 'Combustible - Recarga semanal',             2300000.00),
  (3, 'Peajes ruta nacional - Mes de mayo',         520000.00),
  (3, 'Ruta Pereira - Cúcuta (paquetería)',         760000.00),
  (3, 'Seguro vehicular - Renovación anual',       3400000.00);

-- Clínica Vida Sana (4) - servicios médicos
INSERT INTO records (tenant_id, name, amount) VALUES
  (4, 'Consulta general - Paquete corporativo',     450000.00),
  (4, 'Exámenes de laboratorio - Lote enero',       980000.00),
  (4, 'Insumos médicos - Proveedor MedCol',        1750000.00),
  (4, 'Jornada de vacunación empresarial',          620000.00),
  (4, 'Equipo de rayos X - Mantenimiento',          340000.00);

-- Constructora Horizonte (5) - obras y materiales
INSERT INTO records (tenant_id, name, amount) VALUES
  (5, 'Obra Edificio Mirador - Avance 30%',       45000000.00),
  (5, 'Compra de cemento - 500 bultos',            2250000.00),
  (5, 'Alquiler de grúa torre - Mes',              5800000.00),
  (5, 'Mano de obra - Cuadrilla cimentación',      3100000.00),
  (5, 'Obra Conjunto Las Palmas - Avance 15%',    28000000.00),
  (5, 'Acero estructural - Pedido #12',            7600000.00);

-- Moda Urbana (6) - colecciones y retail
INSERT INTO records (tenant_id, name, amount) VALUES
  (6, 'Colección Primavera - Producción',          4200000.00),
  (6, 'Venta tienda Centro Comercial Norte',       1340000.00),
  (6, 'Campaña publicitaria redes sociales',        780000.00),
  (6, 'Compra de telas - Proveedor Textil S.A.',   1950000.00),
  (6, 'Colección Invierno - Diseño',                950000.00),
  (6, 'Venta online - Tienda virtual',             2110000.00);
