import * as XLSX from 'xlsx';
import type { TipoOcorrencia } from './quinquenio-calc';

/**
 * Rodada 2 — leitura da estrutura real da planilha RELATORIO_GERAL_DE_LICENÇAS.xlsm.
 *
 * Princípios:
 * - nunca inferir dado ausente (célula vazia => null);
 * - nada é gravado aqui: este módulo só interpreta e reporta;
 * - toda ambiguidade vira item de relatório, sem interromper o processamento.
 */

export const DIAS_QUINQUENIO = 1825;

/** Número de processo só com contexto ("Proc. Nº ...") ou célula só com o número. */
const RX_SOLO = /^\s*(\d+\/\d{4})\s*$/;
const RX_CONTEXTO =
  /(?:proc(?:esso)?\.?\s*(?:n[ºo°]\.?)?\s*|n[ºo°]\.?\s*)(\d+\/\d{4})(?![\d/])/i;

export function extrairProcessoAnterior(texto: string | null): string | null {
  if (!texto) return null;
  const m = texto.match(RX_SOLO) ?? texto.match(RX_CONTEXTO);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------- utilidades

function excelDateToISO(serial: number): string | null {
  if (!serial || isNaN(serial)) return null;
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

export function parseDataCelula(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'number') return excelDateToISO(value);
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return null;
    const br = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
    const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  return null;
}

function texto(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const t = String(value).trim();
  return t === '' ? null : t;
}

/** RU e matrícula são TEXT: zeros à esquerda precisam ser preservados. */
function chaveTexto(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return String(value).trim();
  const t = String(value).trim();
  return t === '' ? null : t;
}

export function addDiasISO(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().split('T')[0];
}

export function diffDiasISO(a: string, b: string): number {
  const ms = new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime();
  return Math.round(ms / 86400000);
}

function normalizarChaveTexto(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function acharAba(wb: XLSX.WorkBook, termos: string[]): string | null {
  for (const nome of wb.SheetNames) {
    const n = normalizarChaveTexto(nome);
    if (termos.some((t) => n.includes(t))) return nome;
  }
  return null;
}

function lerAba(wb: XLSX.WorkBook, nome: string, linhaCabecalho: number): Record<string, unknown>[] {
  const ws = wb.Sheets[nome];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    range: linhaCabecalho - 1,
    raw: true,
  });
}

/** Busca o valor de uma coluna por nome normalizado (tolerante a acento/espaço). */
function col(row: Record<string, unknown>, ...nomes: string[]): unknown {
  const alvo = nomes.map(normalizarChaveTexto);
  for (const [k, v] of Object.entries(row)) {
    const nk = normalizarChaveTexto(k);
    if (alvo.some((a) => nk === a || nk.replace(/[.:]/g, '') === a.replace(/[.:]/g, ''))) return v;
  }
  return null;
}

// ---------------------------------------------------------------- tipos

export interface GozoHistorico {
  numero_periodo: number;
  data_inicio: string;
  data_fim: string | null;
  dias: number | null;
}

export interface QuinquenioHistorico {
  numero: number;
  processo_planilha: string | null;
  data_inicio: string;
  data_fim_base: string;
  data_fim_ajustada: string;
  dias_acrescimo: number;
  status: 'DEFERIDO' | 'EM_AQUISICAO';
  gozos: GozoHistorico[];
}

export interface ServidorHistorico {
  nome: string;
  data_nascimento: string | null;
  sexo: string | null;
  matricula: string;
  registro_unico: string;
  rg: string | null;
  cpf: string | null;
  data_admissao: string | null;
  cargo: string | null;
  lotacao: string | null;
  vinculo: string | null;
  filiacao: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  quinquenios: QuinquenioHistorico[];
}

export interface ProcessoPlanilha {
  matricula: string | null;
  requerente: string | null;
  numero_processo: string | null;
  processo_anterior: string | null;
  quinquenio: number | null;
  data_abertura: string | null;
  data_final: string | null;
  responsavel: string | null;
  status: string;
  situacao: string;
  situacao_planilha: string | null;
  data_publicacao: string | null;
  nivel: string | null;
}

export interface OcorrenciaPlanilha {
  registro_unico: string | null;
  matricula: string | null;
  nome: string | null;
  tipo: TipoOcorrencia;
  data_inicio: string;
  data_fim: string;
  quantidade_dias: number;
  documento_referencia: string | null;
  observacoes: string | null;
}

export interface FaltaLegado {
  matricula: string | null;
  evento: string | null;
  tipo_evento: string | null;
  competencia: string | null;
  valor: number | null;
  referencia: string | null;
  situacao: string | null;
  motivo_legado: 'SEM_QUANTIDADE_DIAS' | 'ESTORNO';
}

export interface ParsePlanilhaResult {
  servidores: ServidorHistorico[];
  processos: ProcessoPlanilha[];
  afastamentos: OcorrenciaPlanilha[];
  faltas: OcorrenciaPlanilha[];
  faltasLegado: FaltaLegado[];
  erros: string[];
  motivosNaoMapeados: { motivo: string; ocorrencias: number }[];
  motivosForaDeEscopo: { motivo: string; ocorrencias: number }[];
  /** linhas de processo lidas (inclui as rejeitadas por status/situação não mapeados) */
  processosLidos: number;
  situacoesProcessoNaoMapeadas: { motivo: string; ocorrencias: number }[];
  abasEncontradas: Record<string, string | null>;
}

// ------------------------------------------- processos: dicionários explícitos

const STATUS_PROCESSO_VALIDOS = new Set(['ATIVO', 'PENDENTE', 'FINALIZADO']);

/** Comparação pela chave normalizada INTEIRA (nunca substring). */
const MAPA_SITUACAO_PROCESSO: Record<string, string> = {
  'DEFERIDO PUBLICADO': 'DEFERIDO_PUBLICADO',
  'INDEF. PUBLICADO': 'INDEFERIDO',
  'ENC. P/ PUBL. (INDEFERIDO)': 'INDEFERIDO',
};

/** Data de célula em dd/mm/aaaa; se não for data, devolve o texto original. */
function formatarDataBR(value: unknown): string | null {
  const iso = parseDataCelula(value);
  if (!iso) return texto(value);
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ------------------------------------------- dicionário explícito de motivos

/**
 * Mapeamento EXPLÍCITO de MOTIVO (texto livre da planilha) para o enum de
 * ocorrencias.tipo. Qualquer motivo fora desta lista NÃO é importado — é
 * reportado em `motivosNaoMapeados` para decisão manual.
 */
const MAPA_MOTIVO: Record<string, TipoOcorrencia> = {
  'FALTA INJUSTIFICADA': 'FALTA_INJUSTIFICADA',
  'FALTAS INJUSTIFICADAS': 'FALTA_INJUSTIFICADA',
  'FALTA NAO JUSTIFICADA': 'FALTA_INJUSTIFICADA',
  SUSPENSAO: 'SUSPENSAO',
  'SUSPENSAO DISCIPLINAR': 'SUSPENSAO',
  ATESTADO: 'ATESTADO',
  'ATESTADO MEDICO': 'ATESTADO',
  'LICENCA MEDICA': 'ATESTADO',
  'LICENCA PARA TRATAMENTO DE SAUDE': 'ATESTADO',
  'LICENCA SAUDE': 'ATESTADO',
  'FALTA JUSTIFICADA': 'FALTA_JUSTIFICADA',
  'FALTAS JUSTIFICADAS': 'FALTA_JUSTIFICADA',
  'LICENCA SEM VENCIMENTO': 'LICENCA_SEM_VENCIMENTO',
  'LICENCA SEM VENCIMENTOS': 'LICENCA_SEM_VENCIMENTO',
  'LICENCA SEM ONUS': 'LICENCA_SEM_ONUS',
  'LICENCA SEM ONUS PARA O ORGAO': 'LICENCA_SEM_ONUS',
  'MANDATO ELETIVO NAO REMUNERADO': 'MANDATO_ELETIVO_NAO_REMUNERADO',
  'MANDATO ELETIVO SEM REMUNERACAO': 'MANDATO_ELETIVO_NAO_REMUNERADO',
  'AFASTAMENTO REMUNERADO': 'AFASTAMENTO_REMUNERADO',
  'CESSAO COM ONUS': 'AFASTAMENTO_REMUNERADO',
  'ATESTADO/LICENCA MEDICA': 'ATESTADO',
  // ATENÇÃO: nunca adicionar a chave 'FALTA' isolada — faltas só entram pela aba 3.
};

/**
 * Motivos JÁ REVISADOS e confirmados como sem efeito na licença-prêmio.
 * Aparecem no relatório como "fora do escopo", não como pendência.
 */
const MOTIVOS_FORA_DE_ESCOPO = new Set([
  'FERIAS',
  'FERIAS GOZO',
  'RESTRICAO FUNCIONAL',
  'LICENCA PREMIO OU ESPECIAL',
  'FALTA',
  'OUTROS',
]);

function ehForaDeEscopo(motivoNormalizado: string): boolean {
  if (MOTIVOS_FORA_DE_ESCOPO.has(motivoNormalizado)) return true;
  if (motivoNormalizado.startsWith('FALECIMENTO')) return true; // ex.: "FALECIMENTO(7)"
  return false;
}

/** Normaliza o motivo: sem acento, maiúsculo, sem pontos, barra sem espaços ao redor. */
function normalizarMotivo(motivo: string): string {
  return normalizarChaveTexto(motivo).replace(/\./g, '').replace(/\s*\/\s*/g, '/').trim();
}

export function mapearMotivo(motivo: string | null): TipoOcorrencia | null {
  if (!motivo) return null;
  return MAPA_MOTIVO[normalizarMotivo(motivo)] ?? null;
}

const MESES: Record<string, number> = {
  JANEIRO: 1, FEVEREIRO: 2, MARCO: 3, ABRIL: 4, MAIO: 5, JUNHO: 6,
  JULHO: 7, AGOSTO: 8, SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12,
};

/** "JULHO/2019" -> { ano: 2019, mes: 7, primeiroDia: "2019-07-01" } */
export function parseCompetencia(valor: unknown): { ano: number; mes: number; primeiroDia: string } | null {
  const t = texto(valor);
  if (!t) return null;
  const partes = normalizarChaveTexto(t).split(/[/\-\s]+/).filter(Boolean);
  if (partes.length < 2) return null;
  const mes = MESES[partes[0]] ?? Number(partes[0]);
  const ano = Number(partes[1]);
  if (!mes || !ano || mes < 1 || mes > 12 || ano < 1900) return null;
  return { ano, mes, primeiroDia: `${ano}-${String(mes).padStart(2, '0')}-01` };
}

// ---------------------------------------------------------------- parser

export async function parsePlanilhaGeral(file: File): Promise<ParsePlanilhaResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });

  const abaServidores = acharAba(wb, ['DADOS DE SERVIDORES', 'DADOS DOS SERVIDORES']);
  const abaProcessos = acharAba(wb, ['CONTROLE DE PROCESSOS']);
  const abaAfastamentos = acharAba(wb, ['AFASTAMENTO']);
  const abaFaltas = acharAba(wb, ['REGISTRO DE FALTAS', 'FALTAS']);

  const erros: string[] = [];
  const result: ParsePlanilhaResult = {
    servidores: [],
    processos: [],
    afastamentos: [],
    faltas: [],
    faltasLegado: [],
    erros,
    motivosNaoMapeados: [],
    motivosForaDeEscopo: [],
    processosLidos: 0,
    situacoesProcessoNaoMapeadas: [],
    abasEncontradas: {
      servidores: abaServidores,
      processos: abaProcessos,
      afastamentos: abaAfastamentos,
      faltas: abaFaltas,
    },
  };

  // ---------------- Aba 4.Dados de Servidores (cabeçalho na linha 1)
  if (!abaServidores) {
    erros.push('Aba "4.Dados de Servidores" não encontrada na planilha.');
  } else {
    const ws = wb.Sheets[abaServidores];
    const header = (XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, range: 0 })[0] ?? []) as unknown[];

    // monta dinamicamente os blocos de quinquênio achando "{N}º QUINQUÊNIO PROC."
    const blocos: { numero: number; indiceProc: number }[] = [];
    header.forEach((h, idx) => {
      const n = normalizarChaveTexto(String(h ?? ''));
      const m = n.match(/^(\d+)[ºO°]?\s*QUINQUENIO\s+PROC/);
      if (m) blocos.push({ numero: Number(m[1]), indiceProc: idx });
    });
    blocos.sort((a, b) => a.numero - b.numero);

    const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, range: 0, defval: null });
    const linhas = matriz.slice(1);

    linhas.forEach((linha, i) => {
      const numeroLinha = i + 2;
      const nome = texto(linha[0]);
      if (!nome) return; // linha vazia: ignorar silenciosamente

      const matricula = chaveTexto(linha[3]);
      const ru = chaveTexto(linha[4]);
      if (!ru) {
        erros.push(`Servidores, linha ${numeroLinha}: RU ausente (${nome})`);
        return;
      }

      const quinquenios: QuinquenioHistorico[] = [];
      for (const bloco of blocos) {
        const b = bloco.indiceProc;
        const proc = texto(linha[b]);
        const inicio = parseDataCelula(linha[b + 1]);
        const fimPlanilha = parseDataCelula(linha[b + 2]);
        if (!proc && !inicio) continue; // bloco inexistente para esse servidor

        if (!inicio) {
          erros.push(
            `Servidores, linha ${numeroLinha} (${nome}): ${bloco.numero}º quinquênio tem processo "${proc}" mas INÍCIO vazio — não importado`
          );
          continue;
        }

        const fimBase = addDiasISO(inicio, DIAS_QUINQUENIO - 1); // contagem inclusiva
        let fimAjustada = fimPlanilha ?? fimBase;
        let acrescimo = diffDiasISO(fimAjustada, fimBase);
        if (acrescimo < 0) {
          erros.push(
            `Servidores, linha ${numeroLinha} (${nome}): ${bloco.numero}º quinquênio com FIM (${fimPlanilha}) anterior ao fim-base (${fimBase}) — acréscimo negativo ignorado`
          );
          acrescimo = 0;
          fimAjustada = fimBase;
        }

        const hoje = new Date().toISOString().split('T')[0];
        const status: 'DEFERIDO' | 'EM_AQUISICAO' =
          fimPlanilha && fimPlanilha <= hoje ? 'DEFERIDO' : 'EM_AQUISICAO';

        const gozos: GozoHistorico[] = [];
        for (let p = 1; p <= 3; p++) {
          const gi = b + 2 + (p - 1) * 2 + 1;
          const gInicio = parseDataCelula(linha[gi]);
          const gFim = parseDataCelula(linha[gi + 1]);
          if (!gInicio) continue;
          gozos.push({
            numero_periodo: p,
            data_inicio: gInicio,
            data_fim: gFim,
            dias: gFim ? diffDiasISO(gFim, gInicio) + 1 : null,
          });
        }

        quinquenios.push({
          numero: bloco.numero,
          processo_planilha: proc,
          data_inicio: inicio,
          data_fim_base: fimBase,
          data_fim_ajustada: fimAjustada,
          dias_acrescimo: acrescimo,
          status,
          gozos,
        });
      }

      result.servidores.push({
        nome,
        data_nascimento: parseDataCelula(linha[1]),
        sexo: texto(linha[2])?.substring(0, 1).toUpperCase() ?? null,
        matricula: matricula ?? ru,
        registro_unico: ru,
        rg: texto(linha[5]),
        cpf: texto(linha[6]),
        data_admissao: parseDataCelula(linha[7]),
        cargo: texto(linha[8]),
        lotacao: texto(linha[9]),
        vinculo: texto(linha[10]),
        filiacao: texto(linha[11]),
        endereco: texto(linha[12]),
        telefone: texto(linha[13]),
        email: texto(linha[14]),
        quinquenios,
      });
    });
  }

  // ---------------- Aba 2. Controle de Processos (CABEÇALHO NA LINHA 2)
  const situacoesNaoMapeadas = new Map<string, number>();
  if (!abaProcessos) {
    erros.push('Aba "2. Controle de Processos" não encontrada na planilha.');
  } else {
    const rows = lerAba(wb, abaProcessos, 2);
    rows.forEach((row, i) => {
      const numeroLinha = i + 3;
      const numeroProcesso = texto(col(row, 'PROC. Nº', 'PROC Nº', 'PROC. N', 'PROCESSO'));
      const matricula = chaveTexto(col(row, 'MATRICULA', 'MATRÍCULA'));
      const quinqRaw = texto(col(row, 'QUINQ. Nº', 'QUINQ Nº', 'QUINQ. N'));
      const quinquenio = quinqRaw ? Number(quinqRaw.replace(/\D/g, '')) || null : null;

      if (!numeroProcesso && !matricula) return; // linha vazia

      if (!matricula) {
        erros.push(`Processos, linha ${numeroLinha}: matrícula ausente (processo ${numeroProcesso ?? '—'})`);
        return;
      }

      result.processosLidos += 1;

      const situacaoBruta = texto(col(row, 'SITUAÇÃO', 'SITUACAO'));
      const statusBruto = texto(col(row, 'STATUS'));
      const statusProcessoBruto = texto(col(row, 'STATUS DO PROCESSO'));
      const situacaoPlanilha =
        [situacaoBruta, statusBruto, statusProcessoBruto].filter(Boolean).join(' | ') || null;

      const statusNorm = statusBruto ? normalizarChaveTexto(statusBruto) : null;
      const status = statusNorm && STATUS_PROCESSO_VALIDOS.has(statusNorm) ? statusNorm : null;
      const situacao = situacaoBruta
        ? MAPA_SITUACAO_PROCESSO[normalizarChaveTexto(situacaoBruta)] ?? null
        : null;

      if (!status || !situacao) {
        if (!status) {
          const k = `STATUS: ${statusBruto ?? '(vazio)'}`;
          situacoesNaoMapeadas.set(k, (situacoesNaoMapeadas.get(k) ?? 0) + 1);
        }
        if (!situacao) {
          const k = `SITUAÇÃO: ${situacaoBruta ?? '(vazio)'}`;
          situacoesNaoMapeadas.set(k, (situacoesNaoMapeadas.get(k) ?? 0) + 1);
        }
        erros.push(
          `Processos, linha ${numeroLinha} (processo ${numeroProcesso ?? '—'}): status/situação não mapeados — não importado`
        );
        return;
      }

      // data de publicação só quando "PUBLICADO NO D.O.M ... DE dd.mm.aaaa"
      let dataPublicacao: string | null = null;
      if (statusProcessoBruto) {
        const n = normalizarChaveTexto(statusProcessoBruto);
        const m = n.match(/PUBLICADO NO D\.?O\.?M.*?\bDE\s+(\d{1,2})[./](\d{1,2})[./](\d{4})/);
        if (m && !n.includes('ENCAMINHADO')) {
          dataPublicacao = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
        }
      }

      // PROCESSO ANTERIOR é mensagem de fórmula: extrair só o número
      const anteriorTexto = texto(col(row, 'PROCESSO ANTERIOR'));
      const anteriorNum = extrairProcessoAnterior(anteriorTexto);

      result.processos.push({
        matricula,
        requerente: texto(col(row, 'REQUERENTE')),
        numero_processo: numeroProcesso,
        processo_anterior: anteriorNum,
        quinquenio,
        data_abertura: parseDataCelula(col(row, 'ABERTURA DO PROC/', 'ABERTURA DO PROC', 'ABERTURA')),
        data_final: parseDataCelula(col(row, 'DATA FINAL')),
        responsavel: texto(col(row, 'RESPONSÁVEL', 'RESPONSAVEL')),
        status,
        situacao,
        situacao_planilha: situacaoPlanilha,
        data_publicacao: dataPublicacao,
        nivel: texto(col(row, 'FINALIZADO EM:', 'FINALIZADO EM')),
      });
    });
    result.situacoesProcessoNaoMapeadas = [...situacoesNaoMapeadas.entries()]
      .map(([motivo, ocorrencias]) => ({ motivo, ocorrencias }))
      .sort((a, b) => b.ocorrencias - a.ocorrencias);
  }

  // ---------------- Aba 7.Afastamentos (cabeçalho na linha 1)
  const motivosNaoMapeados = new Map<string, number>();
  const motivosForaDeEscopo = new Map<string, number>();
  if (!abaAfastamentos) {
    erros.push('Aba "7.Afastamentos" não encontrada na planilha.');
  } else {
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[abaAfastamentos], {
      header: 1,
      range: 0,
      defval: null,
    });
    const linhas = matriz.slice(1);

    linhas.forEach((linha, i) => {
      const numeroLinha = i + 2;
      const matricula = chaveTexto(linha[0]);
      const ru = chaveTexto(linha[1]);
      const nome = texto(linha[2]);
      const motivoBruto = texto(linha[3]);
      if (!matricula && !ru && !motivoBruto) return;

      if (!ru) {
        erros.push(`Afastamentos, linha ${numeroLinha}: RU ausente (${nome ?? matricula ?? '—'})`);
        return;
      }

      const tipo = mapearMotivo(motivoBruto);
      if (!tipo) {
        const chave = motivoBruto ?? '(vazio)';
        if (motivoBruto && ehForaDeEscopo(normalizarMotivo(motivoBruto))) {
          motivosForaDeEscopo.set(chave, (motivosForaDeEscopo.get(chave) ?? 0) + 1);
        } else {
          motivosNaoMapeados.set(chave, (motivosNaoMapeados.get(chave) ?? 0) + 1);
        }
        return;
      }

      // ⚠️ colunas 5/6 (INÍCIO/FIM DO RELATÓRIO) são intervalo de filtro, não evento.
      const inicio = parseDataCelula(linha[8]);
      const fim = parseDataCelula(linha[9]);
      if (!inicio || !fim) {
        erros.push(
          `Afastamentos, linha ${numeroLinha} (${nome ?? ru}): INÍCIO/FIM DO EVENTO ausente — não importado`
        );
        return;
      }
      if (fim < inicio) {
        erros.push(`Afastamentos, linha ${numeroLinha} (${nome ?? ru}): FIM DO EVENTO anterior ao INÍCIO — não importado`);
        return;
      }

      // DIAS PASSADOS (coluna 20) é a fonte de verdade da duração do evento.
      const diasPassados = linha[20];
      const qtdDias =
        typeof diasPassados === 'number' && diasPassados > 0
          ? Math.round(diasPassados)
          : diffDiasISO(fim, inicio) + 1; // reserva: calcula pela data se a coluna vier vazia

      const docs = [
        texto(linha[4]) ? `DOC: ${texto(linha[4])}` : null,
        motivoBruto ? `MOTIVO PLANILHA: ${motivoBruto}` : null,
      ].filter(Boolean);
      const obs = [
        texto(linha[7]) ? `CADASTRO DO AFASTAMENTO: ${formatarDataBR(linha[7])}` : null,
        texto(linha[19]) ? `CID: ${texto(linha[19])}` : null,
        texto(linha[21]) ? `PORTARIA: ${texto(linha[21])}` : null,
        texto(linha[24]) ? `OBS: ${texto(linha[24])}` : null,
      ].filter(Boolean);

      result.afastamentos.push({
        registro_unico: ru,
        matricula,
        nome,
        tipo,
        data_inicio: inicio,
        data_fim: fim,
        quantidade_dias: qtdDias,
        documento_referencia: docs.length ? docs.join(' | ') : null,
        observacoes: obs.length ? obs.join(' | ') : null,
      });
    });
  }

  // ---------------- Aba 3.Registro de Faltas
  if (!abaFaltas) {
    erros.push('Aba "3.Registro de Faltas" não encontrada na planilha.');
  } else {
    const rows = lerAba(wb, abaFaltas, 1);
    const LIMITE = { ano: 2019, mes: 6 };

    rows.forEach((row, i) => {
      const numeroLinha = i + 2;
      const matricula = chaveTexto(col(row, 'Matrícula', 'Matricula', 'MATRICULA'));
      const evento = texto(col(row, 'Evento', 'EVENTO'));
      const tipoEvento = texto(col(row, 'Tipo de Evento', 'Tipo Evento', 'TIPO DE EVENTO'));
      const competenciaBruta = texto(col(row, 'Competência', 'Competencia', 'COMPETENCIA'));
      const referencia = texto(col(row, 'Referência', 'Referencia', 'REFERENCIA'));
      const tipoReferencia = texto(col(row, 'Tipo de Referência', 'Tipo Referência', 'TIPO DE REFERENCIA'));
      const valorRaw = col(row, 'Valor', 'VALOR');
      const valor = valorRaw === null || valorRaw === undefined || valorRaw === '' ? null : Number(valorRaw);
      const situacao = texto(col(row, 'Situação', 'Situacao', 'SITUACAO'));

      if (!matricula && !evento) return;
      if (!matricula) {
        erros.push(`Faltas, linha ${numeroLinha}: matrícula ausente (evento ${evento ?? '—'})`);
        return;
      }

      const eventoNorm = normalizarChaveTexto(evento ?? '');
      const comp = parseCompetencia(competenciaBruta);

      // C) estornos: nunca entram no cálculo
      if (eventoNorm.includes('EST FALTA') || normalizarChaveTexto(tipoEvento ?? '') === 'PROVENTO') {
        result.faltasLegado.push({
          matricula,
          evento,
          tipo_evento: tipoEvento,
          competencia: competenciaBruta,
          valor: Number.isFinite(valor as number) ? (valor as number) : null,
          referencia,
          situacao,
          motivo_legado: 'ESTORNO',
        });
        return;
      }

      if (!eventoNorm.includes('FALTA')) return; // outros eventos de folha: fora de escopo

      const qtd = referencia !== null ? Number(String(referencia).replace(',', '.')) : NaN;
      const qtdValida =
        normalizarChaveTexto(tipoReferencia ?? '').startsWith('DIA') && Number.isFinite(qtd) && qtd > 0;
      const posLimite = !!comp && (comp.ano > LIMITE.ano || (comp.ano === LIMITE.ano && comp.mes >= LIMITE.mes));

      // A) falta recente com quantidade confiável
      if (comp && posLimite && qtdValida) {
        const doc = `FOLHA: ${evento ?? ''}${valor !== null && Number.isFinite(valor) ? ` | VALOR: R$ ${valor}` : ''}`;
        result.faltas.push({
          registro_unico: null,
          matricula,
          nome: null,
          tipo: 'FALTA_INJUSTIFICADA',
          data_inicio: comp.primeiroDia,
          data_fim: comp.primeiroDia,
          quantidade_dias: Math.round(qtd),
          documento_referencia: doc,
          observacoes: `Competência ${competenciaBruta}${situacao ? ` | ${situacao}` : ''}`,
        });
        return;
      }

      // B) sem quantidade confiável
      result.faltasLegado.push({
        matricula,
        evento,
        tipo_evento: tipoEvento,
        competencia: competenciaBruta,
        valor: Number.isFinite(valor as number) ? (valor as number) : null,
        referencia,
        situacao,
        motivo_legado: 'SEM_QUANTIDADE_DIAS',
      });
    });
  }

  result.motivosNaoMapeados = [...motivosNaoMapeados.entries()]
    .map(([motivo, ocorrencias]) => ({ motivo, ocorrencias }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias);
  result.motivosForaDeEscopo = [...motivosForaDeEscopo.entries()]
    .map(([motivo, ocorrencias]) => ({ motivo, ocorrencias }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias);

  return result;
}
