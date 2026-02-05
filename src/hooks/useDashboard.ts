 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { differenceInDays, addYears, startOfYear, endOfYear, format } from "date-fns";
 
 export interface DashboardKPIs {
   vencidos: number;
   urgentes: number;
   proximos: number;
   emBreve: number;
   totalProcessos: number;
   tempoMedioPublicacao: number;
   totalServidores: number;
 }
 
 export interface ProcessosPorAno {
   ano: number;
   quantidade: number;
 }
 
 export interface ProcessosPorSituacao {
   situacao: string;
   quantidade: number;
   percentual: number;
 }
 
 const DIAS_QUINQUENIO = 1826; // 5 anos
 
 export function useDashboardKPIs() {
   return useQuery({
     queryKey: ['dashboard', 'kpis'],
     queryFn: async () => {
       const today = new Date();
 
       // Get all servidores with data_admissao
       const { data: servidores, error: servError } = await supabase
         .from('servidores')
         .select('id, data_admissao, matricula');
 
       if (servError) throw servError;
 
       // Get all processos
       const { data: processos, error: procError } = await supabase
         .from('processos')
         .select('*');
 
       if (procError) throw procError;
 
       // Calculate KPIs based on quinquenios
       let vencidos = 0;
       let urgentes = 0;
       let proximos = 0;
       let emBreve = 0;
 
       servidores?.forEach(servidor => {
         if (!servidor.data_admissao) return;
 
         const admissao = new Date(servidor.data_admissao);
         const diasTrabalhados = differenceInDays(today, admissao);
         const quinqueniosCompletos = Math.floor(diasTrabalhados / DIAS_QUINQUENIO);
         const proximoQuinquenio = addYears(admissao, (quinqueniosCompletos + 1) * 5);
         const diasParaProximo = differenceInDays(proximoQuinquenio, today);
 
         // Count processos for this servidor
         const processosServidor = processos?.filter(p => p.servidor_id === servidor.id) || [];
         const quinqueniosComProcesso = new Set(processosServidor.map(p => p.quinquenio));
 
         // Check if there are quinquenios without processo
         for (let q = 1; q <= quinqueniosCompletos; q++) {
           if (!quinqueniosComProcesso.has(q)) {
             vencidos++;
           }
         }
 
         // Calculate urgency for next quinquenio
         if (diasParaProximo <= 0) {
           // Already due
         } else if (diasParaProximo <= 30) {
           urgentes++;
         } else if (diasParaProximo <= 90) {
           proximos++;
         } else if (diasParaProximo <= 180) {
           emBreve++;
         }
       });
 
       // Calculate average publication time
       const processosPublicados = processos?.filter(p => p.data_publicacao && p.data_abertura) || [];
       let tempoMedio = 0;
       if (processosPublicados.length > 0) {
         const totalDias = processosPublicados.reduce((acc, p) => {
           return acc + differenceInDays(new Date(p.data_publicacao!), new Date(p.data_abertura));
         }, 0);
         tempoMedio = Math.round(totalDias / processosPublicados.length);
       }
 
       return {
         vencidos,
         urgentes,
         proximos,
         emBreve,
         totalProcessos: processos?.length || 0,
         tempoMedioPublicacao: tempoMedio,
         totalServidores: servidores?.length || 0,
       } as DashboardKPIs;
     },
   });
 }
 
 export function useProcessosPorAno() {
   return useQuery({
     queryKey: ['dashboard', 'processos-por-ano'],
     queryFn: async () => {
       const currentYear = new Date().getFullYear();
       const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
 
       const { data: processos, error } = await supabase
         .from('processos')
         .select('data_abertura');
 
       if (error) throw error;
 
       const result: ProcessosPorAno[] = years.map(ano => ({
         ano,
         quantidade: processos?.filter(p => {
           const year = new Date(p.data_abertura).getFullYear();
           return year === ano;
         }).length || 0,
       }));
 
       return result;
     },
   });
 }
 
 export function useProcessosPorSituacao() {
   return useQuery({
     queryKey: ['dashboard', 'processos-por-situacao'],
     queryFn: async () => {
       const { data: processos, error } = await supabase
         .from('processos')
         .select('situacao');
 
       if (error) throw error;
 
       const total = processos?.length || 1;
       const situacoes = ['DEFERIDO', 'INDEFERIDO', 'EM_ANALISE', 'DEFERIDO_PUBLICADO'];
 
       const result: ProcessosPorSituacao[] = situacoes.map(situacao => {
         const quantidade = processos?.filter(p => p.situacao === situacao).length || 0;
         return {
           situacao,
           quantidade,
           percentual: Math.round((quantidade / total) * 100),
         };
       });
 
       return result;
     },
   });
 }
 
 export function useServidoresProximos() {
   return useQuery({
     queryKey: ['dashboard', 'servidores-proximos'],
     queryFn: async () => {
       const today = new Date();
 
       const { data: servidores, error } = await supabase
         .from('servidores')
         .select('id, nome, matricula, data_admissao');
 
       if (error) throw error;
 
       const result = servidores
         ?.map(servidor => {
           if (!servidor.data_admissao) return null;
 
           const admissao = new Date(servidor.data_admissao);
           const diasTrabalhados = differenceInDays(today, admissao);
           const quinqueniosCompletos = Math.floor(diasTrabalhados / DIAS_QUINQUENIO);
           const proximoQuinquenio = addYears(admissao, (quinqueniosCompletos + 1) * 5);
           const diasParaProximo = differenceInDays(proximoQuinquenio, today);
 
           if (diasParaProximo > 180 || diasParaProximo < 0) return null;
 
           return {
             ...servidor,
             quinquenio: quinqueniosCompletos + 1,
             diasRestantes: diasParaProximo,
             dataVencimento: format(proximoQuinquenio, 'dd/MM/yyyy'),
           };
         })
         .filter(Boolean)
         .sort((a, b) => (a?.diasRestantes || 0) - (b?.diasRestantes || 0))
         .slice(0, 10);
 
       return result;
     },
   });
 }