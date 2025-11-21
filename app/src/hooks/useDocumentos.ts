import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { InsertTables, UpdateTables } from '../types/database';

export function useDocumentosEntrantes(page = 1, limit = 10, filtros?: { estatus?: string }) {
  const { usuario } = useAuth();

  return useQuery({
    queryKey: ['documentos-entrantes', page, limit, filtros, usuario?.id_ua],
    queryFn: async () => {
      let query = supabase
        .from('tbl_documento_entrante')
        .select(`
          *,
          prioridad:id_prioridad(id_valor_catalogo, valor),
          tipo_documento:id_tipo_doc(id_valor_catalogo, valor)
        `, { count: 'exact' })
        .eq('eliminado', false)
        .eq('id_ua_registro', usuario?.id_ua)
        .order('fecha_registro', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (filtros?.estatus && filtros.estatus !== 'todos') {
        query = query.eq('estatus_general', filtros.estatus);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, count };
    },
    enabled: !!usuario?.id_ua,
  });
}

export function useDocumentoEntrante(id: string | undefined) {
  return useQuery({
    queryKey: ['documento-entrante', id],
    queryFn: async () => {
      if (!id) throw new Error('ID requerido');

      const { data, error } = await supabase
        .from('tbl_documento_entrante')
        .select(`
          *,
          cat_unidad_administrativa(*),
          prioridad:id_prioridad(valor),
          tipo_documento:id_tipo_doc(valor),
          area_remitente:id_area_remitente(valor)
        `)
        .eq('id_doc_entrante', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCrearDocumento() {
  const queryClient = useQueryClient();
  const { usuario } = useAuth();

  return useMutation({
    mutationFn: async (documento: InsertTables<'tbl_documento_entrante'>) => {
      const { data, error } = await supabase
        .from('tbl_documento_entrante')
        .insert({
          ...documento,
          id_ua_registro: usuario?.id_ua,
          id_usuario_registro: usuario?.id_usuario,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-entrantes'] });
      toast.success('Documento registrado correctamente');
    },
    onError: () => {
      toast.error('Error al registrar documento');
    },
  });
}

export function useActualizarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<'tbl_documento_entrante'>;
    }) => {
      const { error } = await supabase
        .from('tbl_documento_entrante')
        .update(data)
        .eq('id_doc_entrante', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-entrantes'] });
      queryClient.invalidateQueries({ queryKey: ['documento-entrante', variables.id] });
      toast.success('Documento actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar documento');
    },
  });
}

export function useEliminarDocumento() {
  const queryClient = useQueryClient();
  const { usuario } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tbl_documento_entrante')
        .update({
          eliminado: true,
          fecha_eliminacion: new Date().toISOString(),
          eliminado_por: usuario?.id_usuario,
        })
        .eq('id_doc_entrante', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-entrantes'] });
      toast.success('Documento eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar documento');
    },
  });
}

export function useTurnadosDocumento(docId: string | undefined) {
  return useQuery({
    queryKey: ['turnados-documento', docId],
    queryFn: async () => {
      if (!docId) throw new Error('ID requerido');

      const { data, error } = await supabase
        .from('tbl_turnado')
        .select(`
          *,
          ua_origen:id_ua_origen(nombre_ua, codigo_ua),
          ua_destino:id_ua_destino(nombre_ua, codigo_ua)
        `)
        .eq('id_doc_entrante', docId)
        .order('fecha_turnado', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!docId,
  });
}

export function useAnexosDocumento(docId: string | undefined) {
  return useQuery({
    queryKey: ['anexos-documento', docId],
    queryFn: async () => {
      if (!docId) throw new Error('ID requerido');

      const { data, error } = await supabase
        .from('tbl_anexos')
        .select('*')
        .eq('id_doc_entrante', docId);

      if (error) throw error;
      return data;
    },
    enabled: !!docId,
  });
}
