 import { differenceInDays, addYears, addDays, isWithinInterval, parseISO } from 'date-fns';
 
 export interface QuinquenioResult {
   numero: number;
   dataInicio: Date;
   dataFim: Date;
   diasCorridos: number;
   faltas: { quantidade: number; diasDesconto: number };
   atestados: { quantidade: number; diasDesconto: number };
   outrosAfastamentos: { lista: any[]; diasDesconto: number };
   totalDescontos: number;
   diasLiquidos: number;
   resultado: 'DEFERIDO' | 'INDEFERIDO';
   diferenca: number;
 }
 
 const DIAS_QUINQUENIO = 1826; // 5 anos em dias
 const DESCONTO_FALTA = 1;
 const DESCONTO_ATESTADO = 0; // Atestados até 15 dias não descontam
 
 export function calcularQuinquenios(
   dataAdmissao: Date,
   faltas: Array<{ competencia: string | null; valor: number }>,
   afastamentos: Array<{
     motivo: string;
     inicio_evento: string;
     fim_evento: string;
     motivo_descricao?: string | null;
   }>
 ): QuinquenioResult[] {
   const hoje = new Date();
   const diasTrabalhados = differenceInDays(hoje, dataAdmissao);
   const quinqueniosCompletos = Math.floor(diasTrabalhados / DIAS_QUINQUENIO);
 
   const resultados: QuinquenioResult[] = [];
 
   for (let i = 1; i <= quinqueniosCompletos + 1; i++) {
     const dataInicio = addYears(dataAdmissao, (i - 1) * 5);
     const dataFim = addDays(addYears(dataAdmissao, i * 5), -1);
     const diasCorridos = Math.min(differenceInDays(hoje, dataInicio), DIAS_QUINQUENIO);
 
     if (diasCorridos <= 0) continue;
 
     // Count faltas in this period
     const faltasNoPeriodo = faltas.filter(f => {
       if (!f.competencia) return false;
       const [mes, ano] = f.competencia.split('/').map(Number);
       if (!mes || !ano) return false;
       const dataFalta = new Date(ano, mes - 1, 15);
       return isWithinInterval(dataFalta, { start: dataInicio, end: dataFim });
     });
     const quantidadeFaltas = faltasNoPeriodo.reduce((acc, f) => acc + (f.valor || 1), 0);
 
     // Count afastamentos
     const afastamentosNoPeriodo = afastamentos.filter(a => {
       const inicio = parseISO(a.inicio_evento);
       return isWithinInterval(inicio, { start: dataInicio, end: dataFim });
     });
 
     const atestados = afastamentosNoPeriodo.filter(a => a.motivo === 'ATESTADO_LICENCA_MEDICA');
     const outros = afastamentosNoPeriodo.filter(a => 
       a.motivo !== 'ATESTADO_LICENCA_MEDICA' && 
       a.motivo !== 'LICENCA_PREMIO' &&
       a.motivo !== 'FERIAS'
     );
 
     // Calculate atestados days (only count those > 15 days)
     let diasAtestados = 0;
     atestados.forEach(a => {
       const dias = differenceInDays(parseISO(a.fim_evento), parseISO(a.inicio_evento)) + 1;
       if (dias > 15) {
         diasAtestados += dias;
       }
     });
 
     // Calculate outros afastamentos days
     let diasOutros = 0;
     outros.forEach(a => {
       diasOutros += differenceInDays(parseISO(a.fim_evento), parseISO(a.inicio_evento)) + 1;
     });
 
     const diasFaltas = quantidadeFaltas * DESCONTO_FALTA;
     const totalDescontos = diasFaltas + diasAtestados + diasOutros;
     const diasLiquidos = diasCorridos - totalDescontos;
     const diferenca = diasLiquidos - DIAS_QUINQUENIO;
 
     resultados.push({
       numero: i,
       dataInicio,
       dataFim,
       diasCorridos,
       faltas: { quantidade: quantidadeFaltas, diasDesconto: diasFaltas },
       atestados: { quantidade: atestados.length, diasDesconto: diasAtestados },
       outrosAfastamentos: { lista: outros, diasDesconto: diasOutros },
       totalDescontos,
       diasLiquidos,
       resultado: diasLiquidos >= DIAS_QUINQUENIO ? 'DEFERIDO' : 'INDEFERIDO',
       diferenca,
     });
   }
 
   return resultados;
 }