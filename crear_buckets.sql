-- ============================================================================
-- CREAR STORAGE BUCKETS - SISGEDI 2.0
-- ============================================================================
-- Ejecutar en SQL Editor de Supabase
-- Crea los 5 buckets públicos necesarios
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documentos', 'documentos', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('documentos-salientes', 'documentos-salientes', true, 10485760, ARRAY['application/pdf']),
  ('acuses', 'acuses', true, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('inventario', 'inventario', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('firmas', 'firmas', true, 1048576, ARRAY['application/x-pkcs12', 'application/x-x509-ca-cert'])
ON CONFLICT (id) DO NOTHING;

-- Verificar que se crearon
SELECT
  id as bucket_name,
  CASE WHEN public THEN '✅ Público' ELSE '❌ Privado' END as acceso,
  ROUND(file_size_limit::numeric / 1048576, 2) || ' MB' as limite_tamaño,
  array_length(allowed_mime_types, 1) as tipos_permitidos,
  created_at
FROM storage.buckets
WHERE id IN ('documentos', 'documentos-salientes', 'acuses', 'inventario', 'firmas')
ORDER BY id;
