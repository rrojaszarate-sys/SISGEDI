import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { InsertTables, UpdateTables } from '../types/database';

// Unidades Administrativas
export function useUnidadesAdministrativas() {
  return useQuery({
    queryKey: ['unidades-administrativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cat_unidad_administrativa')
        .select('*')
        .order('nivel_jerarquico', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useCrearUnidadAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ua: InsertTables<'cat_unidad_administrativa'>) => {
      const { data, error } = await supabase
        .from('cat_unidad_administrativa')
        .insert(ua)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-administrativas'] });
      toast.success('Unidad creada correctamente');
    },
    onError: () => {
      toast.error('Error al crear unidad');
    },
  });
}

export function useActualizarUnidadAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<'cat_unidad_administrativa'>;
    }) => {
      const { error } = await supabase
        .from('cat_unidad_administrativa')
        .update(data)
        .eq('id_ua', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-administrativas'] });
      toast.success('Unidad actualizada');
    },
    onError: () => {
      toast.error('Error al actualizar unidad');
    },
  });
}

// Roles
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cat_roles')
        .select('*')
        .order('nombre_rol');

      if (error) throw error;
      return data;
    },
  });
}

export function useCrearRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rol: InsertTables<'cat_roles'>) => {
      const { data, error } = await supabase
        .from('cat_roles')
        .insert(rol)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rol creado correctamente');
    },
    onError: () => {
      toast.error('Error al crear rol');
    },
  });
}

export function useActualizarRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<'cat_roles'>;
    }) => {
      const { error } = await supabase
        .from('cat_roles')
        .update(data)
        .eq('id_rol', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rol actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar rol');
    },
  });
}

// Valores de Catálogo
export function useValoresCatalogo(tipoCatalogo: string) {
  return useQuery({
    queryKey: ['valores-catalogo', tipoCatalogo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', tipoCatalogo)
        .eq('estatus', true)
        .order('orden_presentacion');

      if (error) throw error;
      return data;
    },
    enabled: !!tipoCatalogo,
  });
}

export function useCrearValorCatalogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (valor: InsertTables<'cat_valores_catalogo'>) => {
      const { data, error } = await supabase
        .from('cat_valores_catalogo')
        .insert(valor)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['valores-catalogo', variables.tipo_catalogo] });
      toast.success('Valor creado correctamente');
    },
    onError: () => {
      toast.error('Error al crear valor');
    },
  });
}

export function useActualizarValorCatalogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<'cat_valores_catalogo'>;
    }) => {
      const { error } = await supabase
        .from('cat_valores_catalogo')
        .update(data)
        .eq('id_valor_catalogo', id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valores-catalogo'] });
      toast.success('Valor actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar valor');
    },
  });
}

// Prioridades (helper específico)
export function usePrioridades() {
  return useValoresCatalogo('Prioridad');
}

// Tipos de documento (helper específico)
export function useTiposDocumento() {
  return useValoresCatalogo('Tipo_Documento');
}

// Áreas remitentes (helper específico)
export function useAreasRemitente() {
  return useValoresCatalogo('Area_Remitente');
}
