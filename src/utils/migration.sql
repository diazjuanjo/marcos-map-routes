-- Migración: agregar sort_order y viewer_route_orders
-- Ejecutar en el SQL Editor de Supabase

-- 1. Agregar sort_order a route_assignments (si no existe)
ALTER TABLE route_assignments
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 2. Crear tabla viewer_route_orders (si no existe)
CREATE TABLE IF NOT EXISTS viewer_route_orders (
  viewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  assignment_id TEXT NOT NULL REFERENCES route_assignments(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(viewer_id, day, assignment_id)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_vro_viewer_day ON viewer_route_orders(viewer_id, day);

-- 4. RLS para viewer_route_orders
ALTER TABLE viewer_route_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on viewer_route_orders" ON viewer_route_orders;
CREATE POLICY "Allow all on viewer_route_orders" ON viewer_route_orders
  FOR ALL USING (true) WITH CHECK (true);
