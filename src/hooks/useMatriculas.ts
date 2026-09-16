import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MatriculaHistorico {
  id: string;
  servidor_id: string;
  matricula: string;
  vigente_de: string | null;
  vigente_ate: string | null
  created_at: string;
}

export function useMatriculasHistorico(servidorId?: string) {
  return useQuery({
    queryKey: ['matriculas_historico', servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matriculas_historico')
        .select('*')
        .eq('servidor_id', servidorId!)
        .order('vigente_de', { ascending: true });

      if (error) throw error;
      return data as MatriculaHistorico[];
    },
    enabled: !!servidorId,
  });
}

/** Resolve o servidor_id a partir de uma matrícula (atual ou histórica). */
export async function resolverServidorIdPorMatricula(matricula: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('matriculas_historico')
    .select('servidor_id')
    .eq('matricula', matricula)
    .order('vigente_de', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data?.servidor_id) return data.servidor_id;

  const { data: serv, error: errServ } = await supabase
    .from('servidores')
    .select('id')
    .eq('matricula', matricula)
    .maybeSingle();

  if (errServ) throw errServ;
  return serv?.id ?? null;
}

/** Resolve o servidor pelo RU (chave oficial e imutável). */
export async function resolverServidorIdPorRU(registroUnico: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('servidores')
    .select('id')
    .eq('registro_unico', registroUnico)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}
