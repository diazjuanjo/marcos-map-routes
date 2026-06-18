-- =============================================================
-- RutaTrac — Esquema completo
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('normal', 'viewer'))
);

CREATE TABLE IF NOT EXISTS master_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  notes TEXT,
  time TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS route_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES master_clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'canceled')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, day, client_id)
);

CREATE TABLE IF NOT EXISTS viewer_route_orders (
  viewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  assignment_id TEXT NOT NULL REFERENCES route_assignments(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(viewer_id, day, assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_ra_user_day ON route_assignments(user_id, day);
CREATE INDEX IF NOT EXISTS idx_mc_sort ON master_clients(sort_order);
CREATE INDEX IF NOT EXISTS idx_vro_viewer_day ON viewer_route_orders(viewer_id, day);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_route_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on users" ON users;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on master_clients" ON master_clients;
CREATE POLICY "Allow all on master_clients" ON master_clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on route_assignments" ON route_assignments;
CREATE POLICY "Allow all on route_assignments" ON route_assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on viewer_route_orders" ON viewer_route_orders;
CREATE POLICY "Allow all on viewer_route_orders" ON viewer_route_orders FOR ALL USING (true) WITH CHECK (true);

-- =============================================================
-- Datos de demostración
-- =============================================================

INSERT INTO users (id, name, role) VALUES
  ('user-1', 'Carlos Gómez (Vendedor Sur)', 'normal'),
  ('user-2', 'Lucía Paz (Distribución Centro)', 'normal'),
  ('user-3', 'Supervisor General (Fletero)', 'viewer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO master_clients (id, name, address, lat, lng, notes, time, sort_order) VALUES
  ('client-1', 'Plaza Independencia (Gobierno)', '25 de Mayo 90', -26.82414, -65.2226, 'Retirar firmas y orden de pago en administración.', '08:30', 0),
  ('client-2', 'Mercado del Norte', 'Maipú 200', -26.8265, -65.2230, 'Entregar caja de repuestos y cobrar factura #3401.', '10:00', 1),
  ('client-3', 'Casa Histórica', 'Congreso 141', -26.8306, -65.2220, 'Visita técnica para evaluar nueva instalación de filtros.', '11:45', 2),
  ('client-4', 'Terminal de Ómnibus', 'Av. Brígido Terán 250', -26.8315, -65.1945, 'Despachar encomienda urgente para sucursal Concepción.', '13:00', 3),
  ('client-5', 'Parque Centenario 9 de Julio', 'Av. Soldati 400', -26.8250, -65.1980, 'Mantenimiento preventivo en bombas de agua del lago.', '09:00', 4),
  ('client-6', 'Sanatorio 9 de Julio', '25 de Mayo 350', -26.8220, -65.2235, 'Entrega de insumos descartables de alta prioridad.', '09:15', 5),
  ('client-7', 'Plaza Urquiza', 'Muñecas 800', -26.8175, -65.2095, 'Reunión comercial en cafetería de la esquina con cliente mayorista.', '11:00', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO route_assignments (id, user_id, day, client_id, status, sort_order) VALUES
  ('assign-1', 'user-1', 'Lunes', 'client-1', 'completed', 0),
  ('assign-2', 'user-1', 'Lunes', 'client-2', 'pending', 1),
  ('assign-3', 'user-1', 'Lunes', 'client-3', 'pending', 2),
  ('assign-4', 'user-1', 'Lunes', 'client-4', 'pending', 3),
  ('assign-5', 'user-1', 'Martes', 'client-5', 'pending', 0),
  ('assign-6', 'user-2', 'Lunes', 'client-6', 'pending', 0),
  ('assign-7', 'user-2', 'Lunes', 'client-7', 'completed', 1)
ON CONFLICT (user_id, day, client_id) DO NOTHING;
