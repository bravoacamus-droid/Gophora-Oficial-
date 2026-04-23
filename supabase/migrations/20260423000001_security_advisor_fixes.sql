-- Security Advisor fixes (2026-04-23)
--
-- 1. Drop ret_* tables — they belonged to an external project (agrocar-erp retail/POS
--    schema: ventas, kardex, productos, proveedores, categorias, sesiones_caja) and
--    should not live in the GOPHORA database. Each project owns its own Supabase.
--
-- 2. Convert mission_applications view to security_invoker so it evaluates RLS under
--    the caller's privileges instead of the view creator's.

DROP TABLE IF EXISTS public.ret_ventas_items CASCADE;
DROP TABLE IF EXISTS public.ret_ventas CASCADE;
DROP TABLE IF EXISTS public.ret_kardex CASCADE;
DROP TABLE IF EXISTS public.ret_productos CASCADE;
DROP TABLE IF EXISTS public.ret_categorias CASCADE;
DROP TABLE IF EXISTS public.ret_proveedores CASCADE;
DROP TABLE IF EXISTS public.ret_sesiones_caja CASCADE;

ALTER VIEW public.mission_applications SET (security_invoker = true);
