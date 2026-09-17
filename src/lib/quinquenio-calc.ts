import { addDays, parseISO, startOfDay } from 'date-fns';

/** Dias-base de um quinquênio (data_inicio + 1825 dias). */
export const DIAS_QUINQUENIO_BASE = 1825;

/** Total de dias de licença-prêmio por quinquênio deferido. */
export const DIAS_LICENCA_PREMIO = 90;

/** Máximo de períodos de gozo por quinquênio. */
export const MAX_PERIODOS_GOZO = 3;

export type TipoOcorrencia =
  | 'FALTA_INJUSTIFICADA'
  | 'SUSPENSAO'
  | 'ATESTADO'
  | 'FALTA_JUSTIFICADA'
  | 'AFASTAMENTO_REMUNERADO'
  | 'LICENCA_SEM_VENCIMENTO'
  | 'LICENCA_SEM_ONUS'
  | 'MANDATO_ELETIVO_NAO_REMUNERADO';

export type StatusQuinquenio =
  | 'EM_AQUISICAO'
  | 'ADQUIRIDO_SUGERIDO'
  | 'DEFERIDO'
  | 'INDEFERIDO'
  | 'RETIFICADO';

/** Acréscimo de dias ao prazo do quinquênio, por tipo de ocorrência. */
export const ACRESCIMO_POR_TIPO: Record<TipoOcorrencia, number> = {
  FALTA_INJUSTIFICADA: 10,
  SUSPENSAO: 10,
  ATESTADO: 1,
  FALTA_JUSTIFICADA: 1,
  AFASTAMENTO_REMUNERADO: 1,
  LICENCA_SEM_VENCIMENTO: 1,
  LICENCA_SEM_ONUS: 1,
  MANDATO_ELETIVO_NAO_REMUNERADO: 1,
};

export const LABEL_TIPO_OCORRENCIA: Record<TipoOcorrencia, string> = {
  FALTA_INJUSTIFICADA: 'Falta injustificada',
  SUSPENSAO: 'Suspensão disciplinar',
  ATESTADO: 'Atestado médico',
  FALTA_JUSTIFICADA: 'Falta justificada',
  AFASTAMENTO_REMUNERADO: 'Afastamento remunerado',
  LICENCA_SEM_VENCIMENTO: 'Licença sem vencimento',
  LICENCA_SEM_ONUS: 'Licença sem ônus',
  MANDATO_ELETIVO_NAO_REMUNERADO: 'Mandato eletivo não remunerado',
};

export function acrescimoDoTipo(tipo: string): number {
  return ACRESCIMO_POR_TIPO[tipo as TipoOcorrencia] ?? 1;
}

/** Vigência da LC 173/2020 (suspensão de contagem para fins remuneratórios). */
const LC_173_INICIO = parseISO('2020-05-28');
const LC_173_FIM = parseISO('2021-12-31');

export interface OcorrenciaInput {
  id?: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  dias_acrescimo?: number | null;
}

export interface QuinquenioInput {
  numero: number;
  data_inicio: string;
  data_fim_base?: string | null;
  status?: StatusQuinquenio;
}

export interface QuinquenioResult {
  numero: number;
  dataInicio: Date;
  dataFimBase: Date;
  dataFimAjustada: Date;
  diasAcrescimo: number;
  ocorrencias: Array<{ tipo: string; dias: number; inicio: Date; fim: Date }>;
  acrescimoPorTipo: Partial<Record<TipoOcorrencia, { quantidade: number; dias: number }>>;
  status: StatusQuinquenio;
  afetadoLc1732020: boolean;
  diasRestantes: number;
}

function sobrepoe(aIni: Date, aFim: Date, bIni: Date, bFim: Date): boolean {
  return aIni <= bFim && aFim >= bIni;
}

/**
 * Calcula um quinquênio: soma os acréscimos das ocorrências que se sobrepõem
 * ao período base e devolve a data fim ajustada + status sugerido.
 * O status DEFERIDO/INDEFERIDO/RETIFICADO nunca é atribuído automaticamente.
 */
export function calcularQuinquenio(
  quinquenio: QuinquenioInput,
  ocorrencias: OcorrenciaInput[],
  hoje: Date = startOfDay(new Date())
): QuinquenioResult {
  const dataInicio = parseISO(quinquenio.data_inicio);
  const dataFimBase = quinquenio.data_fim_base
    ? parseISO(quinquenio.data_fim_base)
    : addDays(dataInicio, DIAS_QUINQUENIO_BASE);

  const todas = ocorrencias.map((o) => ({
    tipo: o.tipo,
    inicio: parseISO(o.data_inicio),
    fim: parseISO(o.data_fim),
    dias: o.dias_acrescimo ?? acrescimoDoTipo(o.tipo),
  }));

  // Cálculo convergente: uma ocorrência que cai dentro da janela já esticada
  // também conta, podendo esticar a janela ainda mais.
  let dataFimAjustada = dataFimBase;
  let diasAcrescimo = 0;
  let noPeriodo = todas.filter((o) => sobrepoe(o.inicio, o.fim, dataInicio, dataFimBase));

  for (let i = 0; i < 50; i++) {
    noPeriodo = todas.filter((o) => sobrepoe(o.inicio, o.fim, dataInicio, dataFimAjustada));
    const novoTotal = noPeriodo.reduce((acc, o) => acc + o.dias, 0);
    const novaData = addDays(dataFimBase, novoTotal);
    if (novoTotal === diasAcrescimo && novaData.getTime() === dataFimAjustada.getTime()) {
      break;
    }
    diasAcrescimo = novoTotal;
    dataFimAjustada = novaData;
  }

  const acrescimoPorTipo: QuinquenioResult['acrescimoPorTipo'] = {};
  noPeriodo.forEach((o) => {
    const chave = o.tipo as TipoOcorrencia;
    const atual = acrescimoPorTipo[chave] ?? { quantidade: 0, dias: 0 };
    acrescimoPorTipo[chave] = { quantidade: atual.quantidade + 1, dias: atual.dias + o.dias };
  });

  const statusManual =
    quinquenio.status === 'DEFERIDO' ||
    quinquenio.status === 'INDEFERIDO' ||
    quinquenio.status === 'RETIFICADO';

  const status: StatusQuinquenio = statusManual
    ? (quinquenio.status as StatusQuinquenio)
    : dataFimAjustada <= hoje
      ? 'ADQUIRIDO_SUGERIDO'
      : 'EM_AQUISICAO';

  return {
    numero: quinquenio.numero,
    dataInicio,
    dataFimBase,
    dataFimAjustada,
    diasAcrescimo,
    ocorrencias: noPeriodo.map(({ tipo, dias, inicio, fim }) => ({ tipo, dias, inicio, fim })),
    acrescimoPorTipo,
    status,
    // Marcador manual: nunca é calculado automaticamente (LC 173/2020 revogada).
    afetadoLc1732020: false,
    diasRestantes: Math.max(
      0,
      Math.ceil((dataFimAjustada.getTime() - hoje.getTime()) / 86400000)
    ),
  };
}

/**
 * Projeta a série de quinquênios de um servidor a partir da data de admissão.
 * Usada apenas para sugestão/pré-visualização; os registros persistidos em
 * `quinquenios` são a fonte oficial.
 */
export function projetarQuinquenios(
  dataAdmissao: string,
  ocorrencias: OcorrenciaInput[],
  hoje: Date = startOfDay(new Date())
): QuinquenioResult[] {
  const resultados: QuinquenioResult[] = [];
  let inicio = parseISO(dataAdmissao);
  let numero = 1;

  while (numero <= 20) {
    const calc = calcularQuinquenio(
      { numero, data_inicio: inicio.toISOString().slice(0, 10) },
      ocorrencias,
      hoje
    );
    resultados.push(calc);
    if (calc.dataFimAjustada > hoje) break;
    inicio = addDays(calc.dataFimAjustada, 1);
    numero += 1;
  }

  return resultados;
}

/** Saldo de licença-prêmio (90 dias) restante para um quinquênio. */
export function saldoGozo(gozos: Array<{ dias: number }>): number {
  const usados = gozos.reduce((acc, g) => acc + (g.dias || 0), 0);
  return DIAS_LICENCA_PREMIO - usados;
}
