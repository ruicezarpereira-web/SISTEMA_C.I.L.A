import { supabase } from '@/integrations/supabase/client';
import {
  parsePlanilhaGeral,
  TODAS_AS_ABAS,
  type AbasImportacao,
  type ParsePlanilhaResult,
  type OcorrenciaPlanilha,
} from './import-planilha-geral';

/**
 * Executor da importação da planilha geral.
 *
 * - `dryRun: true` não grava nada: só conta o que cairia em cada categoria.
 * - toda gravação é idempotente (upsert por chave natural), então rodar duas
 *   vezes com o mesmo arquivo não duplica nada.
 * - quinquênios históricos nascem já com status/datas da planilha; o motor de
 *   cálculo nunca é chamado sobre eles (quinquênios DEFERIDO são ignorados pelo
 *   recálculo, e a inserção não dispara o gatilho de próximo quinquênio, que
 *   responde apenas a UPDATE de status).
 */

export type ModoImportacao = 'COMPLETA' | 'SERVIDORES' | 'EVENTOS';

export interface ReconciliacaoEventos {
  novas: number;
  existentes: number;
  ignoradasExclusao: number;
  comErro: number;
}

export interface ImportSummary {
  dryRun: boolean;
  modo: ModoImportacao;
  /** por tipo de linha (afastamentos/faltas): novas, já existentes, ignoradas por exclusão manual, com erro */
  reconciliacao: { afastamentos: ReconciliacaoEventos; faltas: ReconciliacaoEventos } | null;
  /** ids das ocorrências inseridas nesta execução */
  ocorrenciasInseridasIds: string[];
  /** eventos IMPORTADO ativos, no intervalo do arquivo, sem correspondência na planilha */
  eventosAusentesNaPlanilha: string[];
  /** modo Atualizar servidores */
  servidoresNovos: number;
  servidoresAtualizados: number;
  alteracoesCadastrais: number;
  servidoresAusentesNaPlanilha: string[];
  abasEncontradas: Record<string, string | null>;
  servidores: number;
  matriculas: number;
  quinquenios: number;
  quinqueniosDeferidos: number;
  gozos: number;
  processos: number;
  processosVinculados: number;
  afastamentos: number;
  faltas: number;
  faltasLegadoSemDias: number;
  estornos: number;
  motivosNaoMapeados: { motivo: string; ocorrencias: number }[];
  motivosForaDeEscopo: { motivo: string; ocorrencias: number }[];
  situacoesProcessoNaoMapeadas: { motivo: string; ocorrencias: number }[];
  afastamentosRuSemServidor: string[];
  /** só na gravação real: registros efetivamente gravados (lotes sem erro) */
  gravados: Record<string, number> | null;
  quinqueniosEmAbertoCriados: number;
  /** "VÍNCULO: n" para servidores cujo vínculo não dá direito automático */
  servidoresSemDireito: string[];
  erros: string[];
  revisaoEstornos: string[];
  revisaoFaltasSemDias: string[];
}

const LOTE = 200;

async function emLotes<T>(itens: T[], fn: (lote: T[]) => Promise<void>) {
  for (let i = 0; i < itens.length; i += LOTE) {
    await fn(itens.slice(i, i + LOTE));
  }
}

function contarPorChave(chaves: (string | null)[]) {
  const mapa = new Map<string, number>();
  chaves.forEach((c) => {
    if (!c) return;
    mapa.set(c, (mapa.get(c) ?? 0) + 1);
  });
  return mapa;
}

export async function importarPlanilhaGeral(
  file: File,
  opts: { dryRun: boolean; modo?: ModoImportacao; onProgress?: (pct: number, etapa: string) => void }
): Promise<ImportSummary> {
  const { dryRun, onProgress } = opts;
  const modo = opts.modo ?? 'COMPLETA';
  const progresso = (p: number, etapa: string) => onProgress?.(p, etapa);

  progresso(5, 'Lendo a planilha');
  const abas: AbasImportacao =
    modo === 'COMPLETA' ? TODAS_AS_ABAS
    : modo === 'SERVIDORES' ? { servidores: true, processos: false, afastamentos: false, faltas: false }
    : { servidores: false, processos: false, afastamentos: true, faltas: true };
  const parsed: ParsePlanilhaResult = await parsePlanilhaGeral(file, abas);
  const erros = [...parsed.erros];

  const totalGozos = parsed.servidores.reduce(
    (acc, s) => acc + s.quinquenios.reduce((a, q) => a + q.gozos.length, 0),
    0
  );
  const totalQuinquenios = parsed.servidores.reduce((acc, s) => acc + s.quinquenios.length, 0);
  const totalDeferidos = parsed.servidores.reduce(
    (acc, s) => acc + s.quinquenios.filter((q) => q.status === 'DEFERIDO').length,
    0
  );

  const resumo: ImportSummary = {
    dryRun,
    modo,
    reconciliacao: null,
    ocorrenciasInseridasIds: [],
    eventosAusentesNaPlanilha: [],
    servidoresNovos: 0,
    servidoresAtualizados: 0,
    alteracoesCadastrais: 0,
    servidoresAusentesNaPlanilha: [],
    abasEncontradas: parsed.abasEncontradas,
    servidores: parsed.servidores.length,
    matriculas: parsed.servidores.filter((s) => s.matricula).length,
    quinquenios: totalQuinquenios,
    quinqueniosDeferidos: totalDeferidos,
    gozos: totalGozos,
    processos: parsed.processosLidos,
    processosVinculados: 0,
    afastamentos: parsed.afastamentos.length,
    faltas: parsed.faltas.length,
    faltasLegadoSemDias: parsed.faltasLegado.filter((f) => f.motivo_legado === 'SEM_QUANTIDADE_DIAS').length,
    estornos: parsed.faltasLegado.filter((f) => f.motivo_legado === 'ESTORNO').length,
    motivosNaoMapeados: parsed.motivosNaoMapeados,
    motivosForaDeEscopo: parsed.motivosForaDeEscopo,
    situacoesProcessoNaoMapeadas: parsed.situacoesProcessoNaoMapeadas,
    afastamentosRuSemServidor: [],
    gravados: null,
    quinqueniosEmAbertoCriados: 0,
    servidoresSemDireito: [],
    erros,
    revisaoEstornos: [],
    revisaoFaltasSemDias: [],
  };

  // ---- relatório de revisão manual (independe de gravar ou não)
  const semDiasPorMatricula = contarPorChave(
    parsed.faltasLegado.filter((f) => f.motivo_legado === 'SEM_QUANTIDADE_DIAS').map((f) => f.matricula)
  );
  resumo.revisaoFaltasSemDias = [...semDiasPorMatricula.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([mat, n]) => `Matrícula ${mat}: ${n} falta(s) sem quantidade de dias definida`);

  const compToNum = (c: string | null) => {
    if (!c) return null;
    const m = c.match(/(\d{4})/);
    const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
    const up = c.toUpperCase();
    const mes = meses.findIndex((x) => up.includes(x)) + 1;
    if (!m || !mes) return null;
    return Number(m[1]) * 12 + mes;
  };

  parsed.faltasLegado
    .filter((f) => f.motivo_legado === 'ESTORNO')
    .forEach((est) => {
      const alvo = compToNum(est.competencia);
      const relacionadas = parsed.faltas.filter((f) => {
        if (f.matricula !== est.matricula || !alvo) return false;
        const num = Number(f.data_inicio.slice(0, 4)) * 12 + Number(f.data_inicio.slice(5, 7));
        return num <= alvo && num >= alvo - 3;
      });
      resumo.revisaoEstornos.push(
        `Matrícula ${est.matricula} — estorno em ${est.competencia ?? '—'} (R$ ${est.valor ?? '—'}): ` +
          (relacionadas.length
            ? `faltas importadas na janela: ${relacionadas
                .map((f) => `${f.data_inicio.slice(0, 7)} (${f.quantidade_dias} dia(s))`)
                .join(', ')}`
            : 'nenhuma falta importada na janela de 3 meses — revisar manualmente')
      );
    });

  // ---- afastamentos cujo RU não existe na aba de Servidores nem no banco
  const rusPlanilha = new Set(parsed.servidores.map((s) => s.registro_unico));
  const ausentes = contarPorChave(
    parsed.afastamentos.map((a) => a.registro_unico).filter((ru) => ru && !rusPlanilha.has(ru))
  );
  if (ausentes.size) {
    const noBanco = new Set<string>();
    await emLotes([...ausentes.keys()], async (lote) => {
      const { data } = await supabase.from('servidores').select('registro_unico').in('registro_unico', lote);
      data?.forEach((s) => noBanco.add(s.registro_unico));
    });
    resumo.afastamentosRuSemServidor = [...ausentes.entries()]
      .filter(([ru]) => !noBanco.has(ru))
      .map(([ru, n]) => `RU ${ru}: ${n} afastamento(s) — servidor não está na planilha nem no sistema`);
  }

  // ---- servidores cujo vínculo não dá direito automático (informativo)
  {
    const { data: vinc } = await supabase.from('vinculos_com_direito').select('vinculo');
    const comDireito = new Set((vinc ?? []).map((v) => v.vinculo));
    const semDireito = contarPorChave(
      parsed.servidores
        .map((s) => (s.vinculo ?? '').trim().toUpperCase())
        .filter((v) => !comDireito.has(v))
        .map((v) => v || '(vínculo vazio)')
    );
    resumo.servidoresSemDireito = [...semDireito.entries()]
      .sort((x, y) => y[1] - x[1])
      .map(([v, n]) => `${v}: ${n}`);
  }

  if (modo === 'SERVIDORES') return atualizarServidores(parsed, resumo, dryRun, progresso);
  if (modo === 'EVENTOS') return atualizarEventos(parsed, resumo, dryRun, progresso);

  if (dryRun) {
    progresso(100, 'Simulação concluída');
    return resumo;
  }

  const gravados: Record<string, number> = {
    servidores: 0, matriculas: 0, quinquenios: 0, gozos: 0, processos: 0,
    afastamentos: 0, faltas: 0, legado: 0,
  };
  resumo.gravados = gravados;

  // ---- 1. servidores + matrículas + quinquênios + gozos
  progresso(20, 'Gravando servidores');
  const payloadServidores = parsed.servidores.map((s) => ({
    nome: s.nome,
    data_nascimento: s.data_nascimento,
    sexo: s.sexo,
    matricula: s.matricula,
    registro_unico: s.registro_unico,
    rg: s.rg,
    cpf: s.cpf,
    data_admissao: s.data_admissao,
    cargo: s.cargo,
    lotacao: s.lotacao,
    vinculo: s.vinculo,
    filiacao: s.filiacao,
    endereco: s.endereco,
    telefone: s.telefone,
    email: s.email,
  }));

  const semAdmissao = payloadServidores.filter((s) => !s.data_admissao).map((s) => s.registro_unico);
  if (semAdmissao.length) {
    erros.push(
      `${semAdmissao.length} servidor(es) sem data de admissão na planilha não foram gravados (RU: ${semAdmissao
        .slice(0, 10)
        .join(', ')}${semAdmissao.length > 10 ? '…' : ''})`
    );
  }

  await emLotes(
    payloadServidores.filter((s) => s.data_admissao),
    async (lote) => {
      const { error } = await supabase
        .from('servidores')
        .upsert(lote as never, { onConflict: 'registro_unico' });
      if (error) erros.push(`Servidores: ${error.message}`);
    else gravados.servidores += lote.length;
    }
  );

  // mapa RU -> id
  const ruToId = new Map<string, string>();
  const rus = parsed.servidores.map((s) => s.registro_unico);
  await emLotes(rus, async (lote) => {
    const { data, error } = await supabase
      .from('servidores')
      .select('id, registro_unico, matricula')
      .in('registro_unico', lote);
    if (error) erros.push(`Leitura de servidores: ${error.message}`);
    data?.forEach((s) => ruToId.set(s.registro_unico, s.id));
  });

  progresso(35, 'Gravando histórico de matrículas');
  const matriculas = parsed.servidores
    .filter((s) => s.matricula && ruToId.has(s.registro_unico))
    .map((s) => ({ servidor_id: ruToId.get(s.registro_unico)!, matricula: s.matricula }));
  await emLotes(matriculas, async (lote) => {
    const { error } = await supabase
      .from('matriculas_historico')
      .upsert(lote as never, { onConflict: 'servidor_id,matricula' });
    if (error) erros.push(`Matrículas: ${error.message}`);
    else gravados.matriculas += lote.length;
  });

  progresso(45, 'Gravando quinquênios históricos');
  const quinquenios = parsed.servidores.flatMap((s) => {
    const sid = ruToId.get(s.registro_unico);
    if (!sid) return [];
    return s.quinquenios.map((q) => ({
      servidor_id: sid,
      numero: q.numero,
      data_inicio: q.data_inicio,
      data_fim_base: q.data_fim_base,
      data_fim_ajustada: q.data_fim_ajustada,
      dias_acrescimo: q.dias_acrescimo,
      status: q.status,
    }));
  });
  await emLotes(quinquenios, async (lote) => {
    const { error } = await supabase
      .from('quinquenios')
      .upsert(lote as never, { onConflict: 'servidor_id,numero' });
    if (error) erros.push(`Quinquênios: ${error.message}`);
    else gravados.quinquenios += lote.length;
  });

  // mapa (servidor_id|numero) -> quinquenio_id
  const quinqIds = new Map<string, string>();
  const servidorIds = [...ruToId.values()];
  await emLotes(servidorIds, async (lote) => {
    const { data, error } = await supabase
      .from('quinquenios')
      .select('id, servidor_id, numero')
      .in('servidor_id', lote);
    if (error) erros.push(`Leitura de quinquênios: ${error.message}`);
    data?.forEach((q) => quinqIds.set(`${q.servidor_id}|${q.numero}`, q.id));
  });

  progresso(55, 'Gravando períodos de gozo');
  const gozos = parsed.servidores.flatMap((s) => {
    const sid = ruToId.get(s.registro_unico);
    if (!sid) return [];
    return s.quinquenios.flatMap((q) => {
      const qid = quinqIds.get(`${sid}|${q.numero}`);
      if (!qid) return [];
      return q.gozos
        .filter((g) => g.data_fim && g.dias !== null && g.dias > 0)
        .map((g) => ({
          quinquenio_id: qid,
          numero_periodo: g.numero_periodo,
          data_inicio: g.data_inicio,
          data_fim: g.data_fim!,
          dias: g.dias!,
        }));
    });
  });
  await emLotes(gozos, async (lote) => {
    const { error } = await supabase
      .from('gozos')
      .upsert(lote as never, { onConflict: 'quinquenio_id,numero_periodo' });
    if (error) erros.push(`Gozos: ${error.message}`);
    else gravados.gozos += lote.length;
  });

  // ---- 2. processos
  progresso(65, 'Gravando processos');
  const matToId = new Map<string, string>();
  await emLotes(servidorIds, async (lote) => {
    const { data, error } = await supabase
      .from('matriculas_historico')
      .select('servidor_id, matricula')
      .in('servidor_id', lote);
    if (error) erros.push(`Leitura de matrículas: ${error.message}`);
    data?.forEach((m) => matToId.set(m.matricula, m.servidor_id));
  });

  const processos = parsed.processos
    .map((p) => {
      const sid = p.matricula ? matToId.get(p.matricula) : undefined;
      if (!sid) {
        erros.push(
          `Processo ${p.numero_processo ?? '—'}: matrícula ${p.matricula ?? '—'} não corresponde a nenhum servidor importado`
        );
        return null;
      }
      if (!p.numero_processo || !p.data_abertura) {
        erros.push(
          `Processo de ${p.requerente ?? p.matricula}: número ou data de abertura ausente — não importado`
        );
        return null;
      }
      return {
        servidor_id: sid,
        numero_processo: p.numero_processo,
        processo_anterior: p.processo_anterior,
        data_abertura: p.data_abertura,
        data_final: p.data_final,
        quinquenio: p.quinquenio ?? 0,
        responsavel: p.responsavel,
        status: p.status,
        situacao: p.situacao,
        situacao_planilha: p.situacao_planilha,
        data_publicacao: p.data_publicacao,
        nivel: p.nivel,
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  await emLotes(processos, async (lote) => {
    const { error } = await supabase
      .from('processos')
      .upsert(lote as never, { onConflict: 'numero_processo' });
    if (error) erros.push(`Processos: ${error.message}`);
    else gravados.processos += lote.length;
  });

  // vincula quinquenios.processo_id
  const numeros = processos.map((p) => p.numero_processo as string);
  const procIds = new Map<string, string>();
  await emLotes(numeros, async (lote) => {
    const { data, error } = await supabase
      .from('processos')
      .select('id, numero_processo')
      .in('numero_processo', lote);
    if (error) erros.push(`Leitura de processos: ${error.message}`);
    data?.forEach((p) => procIds.set(p.numero_processo, p.id));
  });

  for (const p of processos) {
    const qid = quinqIds.get(`${p.servidor_id}|${p.quinquenio}`);
    const pid = procIds.get(p.numero_processo as string);
    if (!qid || !pid) continue;
    const { error } = await supabase.from('quinquenios').update({ processo_id: pid }).eq('id', qid);
    if (error) erros.push(`Vínculo processo/quinquênio: ${error.message}`);
    else resumo.processosVinculados += 1;
  }

  // ---- 3. afastamentos -> ocorrencias
  progresso(80, 'Gravando afastamentos');
  const toOcorrencia = (o: OcorrenciaPlanilha, sid: string) => ({
    servidor_id: sid,
    tipo: o.tipo,
    data_inicio: o.data_inicio,
    data_fim: o.data_fim,
    quantidade_dias: o.quantidade_dias,
    documento_referencia: o.documento_referencia,
    observacoes: o.observacoes,
  });

  const ocorrAfast = parsed.afastamentos
    .map((o) => {
      const sid = o.registro_unico ? ruToId.get(o.registro_unico) : undefined;
      if (!sid) {
        erros.push(`Afastamento de RU ${o.registro_unico}: servidor não encontrado — não importado`);
        return null;
      }
      return toOcorrencia(o, sid);
    })
    .filter(Boolean) as Record<string, unknown>[];

  // ---- 4. faltas (pós 06/2019 com dias) -> ocorrencias; resto -> legado
  progresso(90, 'Gravando faltas');
  const ocorrFaltas = parsed.faltas
    .map((o) => {
      const sid = o.matricula ? matToId.get(o.matricula) : undefined;
      if (!sid) {
        erros.push(`Falta da matrícula ${o.matricula}: servidor não encontrado — não importada`);
        return null;
      }
      return toOcorrencia(o, sid);
    })
    .filter(Boolean) as Record<string, unknown>[];

  {
    const rec = await reconciliarOcorrencias(
      ocorrAfast as unknown as OcorrenciaGravar[],
      ocorrFaltas as unknown as OcorrenciaGravar[],
      false,
      erros
    );
    resumo.reconciliacao = rec.reconciliacao;
    resumo.ocorrenciasInseridasIds = rec.idsInseridos;
    resumo.eventosAusentesNaPlanilha = rec.ausentes;
    gravados.afastamentos = rec.reconciliacao.afastamentos.novas;
    gravados.faltas = rec.reconciliacao.faltas.novas;
  }

  const legado = parsed.faltasLegado.map((f) => ({
    servidor_id: f.matricula ? matToId.get(f.matricula) ?? null : null,
    evento: f.evento,
    tipo_evento: f.tipo_evento,
    competencia: f.competencia,
    valor: f.valor,
    referencia: f.referencia,
    situacao: f.situacao,
    precisa_revisao: true,
  }));
  await emLotes(legado, async (lote) => {
    const { error } = await supabase
      .from('faltas_historico_legado')
      .upsert(lote as never, { onConflict: 'servidor_id,evento,competencia,valor', ignoreDuplicates: true });
    if (error) erros.push(`Faltas (legado): ${error.message}`);
    else gravados.legado += lote.length;
  });

  // ---- 5. quinquênios em aberto + atualização da situação pela data
  progresso(95, 'Criando quinquênios em aberto');
  const contarQuinq = async () => {
    let total = 0;
    await emLotes(servidorIds, async (lote) => {
      const { count } = await supabase
        .from('quinquenios')
        .select('id', { count: 'exact', head: true })
        .in('servidor_id', lote);
      total += count ?? 0;
    });
    return total;
  };
  const antes = await contarQuinq();
  for (let i = 0; i < servidorIds.length; i += 20) {
    await Promise.all(
      servidorIds.slice(i, i + 20).map(async (id) => {
        const { error } = await supabase.rpc('garantir_quinquenios_em_aberto', { _servidor_id: id });
        if (error) erros.push(`Quinquênio em aberto: ${error.message}`);
      })
    );
  }
  const { error: errAtualizar } = await supabase.rpc('atualizar_situacao_quinquenios');
  if (errAtualizar) erros.push(`Atualização da situação dos quinquênios: ${errAtualizar.message}`);
  resumo.quinqueniosEmAbertoCriados = Math.max(0, (await contarQuinq()) - antes);


  await supabase.from('logs_atividade').insert({
    tipo_acao: 'UPLOAD',
    detalhes:
      `Importação da planilha geral: ${resumo.servidores} servidores, ${resumo.quinquenios} quinquênios, ` +
      `${resumo.gozos} gozos, ${resumo.processos} processos, ${resumo.afastamentos} afastamentos, ` +
      `${resumo.faltas} faltas, ${legado.length} registros em revisão manual`,
  });

  progresso(100, 'Importação concluída');
  return resumo;
}

// ============================================================ Rodada 3.1

type Progresso = (p: number, etapa: string) => void;

export interface OcorrenciaGravar {
  servidor_id: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  quantidade_dias: number;
  documento_referencia: string | null;
  observacoes: string | null;
}

const chaveOcorrencia = (o: { servidor_id: string; tipo: string; data_inicio: string; data_fim: string; quantidade_dias: number }) =>
  `${o.servidor_id}|${o.tipo}|${o.data_inicio}|${o.data_fim}|${o.quantidade_dias}`;

const vazio = (): ReconciliacaoEventos => ({ novas: 0, existentes: 0, ignoradasExclusao: 0, comErro: 0 });

/** lê todas as linhas paginando (limite de 1000 por requisição) */
async function lerTudo<T>(montar: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, erros: string[], rotulo: string) {
  const out: T[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await montar(de, de + 999);
    if (error) { erros.push(`${rotulo}: ${error.message}`); break; }
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/**
 * Reconciliação: procura cada linha pela chave natural, INCLUINDO excluídas.
 * Nova → insere com origem IMPORTADO; existente ativa → não mexe;
 * existente excluída → ignora (nunca reativa). Nunca apaga nada.
 */
export async function reconciliarOcorrencias(
  afast: OcorrenciaGravar[],
  faltas: OcorrenciaGravar[],
  dryRun: boolean,
  erros: string[]
) {
  const reconciliacao = { afastamentos: vazio(), faltas: vazio() };
  const idsInseridos: string[] = [];
  const servidorIds = [...new Set([...afast, ...faltas].map((o) => o.servidor_id))];

  type Exist = { id: string; servidor_id: string; tipo: string; data_inicio: string; data_fim: string; quantidade_dias: number; excluida_em: string | null; origem: string };
  const existentes: Exist[] = [];
  for (let i = 0; i < servidorIds.length; i += 50) {
    const lote = servidorIds.slice(i, i + 50);
    existentes.push(...(await lerTudo<Exist>(
      (de, ate) => supabase
        .from('ocorrencias')
        .select('id, servidor_id, tipo, data_inicio, data_fim, quantidade_dias, excluida_em, origem')
        .in('servidor_id', lote)
        .order('id')
        .range(de, ate) as never,
      erros, 'Leitura de ocorrências'
    )));
  }
  const porChave = new Map(existentes.map((e) => [chaveOcorrencia(e), e]));

  const chavesArquivo = new Set<string>();
  const novas: { o: OcorrenciaGravar; grupo: 'afastamentos' | 'faltas' }[] = [];
  const classificar = (lista: OcorrenciaGravar[], grupo: 'afastamentos' | 'faltas') => {
    for (const o of lista) {
      const k = chaveOcorrencia(o);
      if (chavesArquivo.has(k)) { reconciliacao[grupo].existentes += 1; continue; } // repetida no próprio arquivo
      chavesArquivo.add(k);
      const e = porChave.get(k);
      if (!e) novas.push({ o, grupo });
      else if (e.excluida_em) reconciliacao[grupo].ignoradasExclusao += 1;
      else reconciliacao[grupo].existentes += 1;
    }
  };
  classificar(afast, 'afastamentos');
  classificar(faltas, 'faltas');

  if (dryRun) {
    novas.forEach((n) => (reconciliacao[n.grupo].novas += 1));
  } else {
    for (let i = 0; i < novas.length; i += LOTE) {
      const lote = novas.slice(i, i + LOTE);
      const { data, error } = await supabase
        .from('ocorrencias')
        .insert(lote.map((n) => ({ ...n.o, origem: 'IMPORTADO' })) as never)
        .select('id');
      if (error) {
        erros.push(`Ocorrências: ${error.message}`);
        lote.forEach((n) => (reconciliacao[n.grupo].comErro += 1));
      } else {
        lote.forEach((n) => (reconciliacao[n.grupo].novas += 1));
        data?.forEach((d) => idsInseridos.push(d.id));
      }
    }
  }

  // informativo: importados antes, ativos, no intervalo do arquivo, sem correspondência
  const datas = [...afast, ...faltas].map((o) => o.data_inicio).sort();
  const ausentes: string[] = [];
  if (datas.length) {
    const min = datas[0], max = datas[datas.length - 1];
    existentes
      .filter((e) => e.origem === 'IMPORTADO' && !e.excluida_em && e.data_inicio >= min && e.data_inicio <= max && !chavesArquivo.has(chaveOcorrencia(e)))
      .forEach((e) => ausentes.push(e));
  }
  let ausentesTexto: string[] = [];
  if (ausentes.length) {
    const ids = [...new Set((ausentes as unknown as Exist[]).map((e) => e.servidor_id))];
    const nomes = new Map<string, string>();
    await emLotes(ids, async (lote) => {
      const { data } = await supabase.from('servidores').select('id, nome, registro_unico').in('id', lote);
      data?.forEach((s) => nomes.set(s.id, `${s.nome} (RU ${s.registro_unico})`));
    });
    ausentesTexto = (ausentes as unknown as Exist[]).map(
      (e) => `${nomes.get(e.servidor_id) ?? e.servidor_id}: ${e.tipo} de ${e.data_inicio} a ${e.data_fim} (${e.quantidade_dias} dia(s))`
    );
  }
  return { reconciliacao, idsInseridos, ausentes: ausentesTexto };
}

const CAMPOS_HISTORICO = ['nome', 'cargo', 'lotacao', 'vinculo'] as const;

/** Modo "Atualizar servidores": só a aba de servidores. */
async function atualizarServidores(parsed: ParsePlanilhaResult, resumo: ImportSummary, dryRun: boolean, progresso: Progresso) {
  const erros = resumo.erros;
  const hoje = new Date().toISOString().slice(0, 10);

  progresso(20, 'Comparando com o cadastro');
  type Atual = { id: string; registro_unico: string; matricula: string; nome: string; cargo: string | null; lotacao: string | null; vinculo: string | null; ativo: boolean };
  const atuais = await lerTudo<Atual>(
    (de, ate) => supabase.from('servidores').select('id, registro_unico, matricula, nome, cargo, lotacao, vinculo, ativo').order('id').range(de, ate) as never,
    erros, 'Leitura de servidores'
  );
  const porRu = new Map(atuais.map((a) => [a.registro_unico, a]));
  const rusPlanilha = new Set(parsed.servidores.map((s) => s.registro_unico));
  resumo.servidoresAusentesNaPlanilha = atuais
    .filter((a) => a.ativo && !rusPlanilha.has(a.registro_unico))
    .map((a) => `RU ${a.registro_unico} — ${a.nome} — matrícula ${a.matricula}`);

  const validos = parsed.servidores.filter((s) => {
    if (!s.data_admissao) { erros.push(`Servidor RU ${s.registro_unico}: sem data de admissão — não gravado`); return false; }
    return true;
  });
  const novos = validos.filter((s) => !porRu.has(s.registro_unico));
  const existentes = validos.filter((s) => porRu.has(s.registro_unico));

  // alterações cadastrais (para o relatório e para o histórico)
  const alteracoes: { servidor_id: string; campo: string; valor_anterior: string | null; valor_novo: string | null; origem: string }[] = [];
  const mudancasMatricula: { servidor_id: string; anterior: string; nova: string }[] = [];
  for (const s of existentes) {
    const a = porRu.get(s.registro_unico)!;
    for (const c of CAMPOS_HISTORICO) {
      const antes = (a[c] ?? null) as string | null;
      const depois = (s[c] ?? null) as string | null;
      if ((antes ?? '') !== (depois ?? '')) alteracoes.push({ servidor_id: a.id, campo: c, valor_anterior: antes, valor_novo: depois, origem: 'IMPORTACAO' });
    }
    if (s.matricula && s.matricula !== a.matricula) {
      alteracoes.push({ servidor_id: a.id, campo: 'matricula', valor_anterior: a.matricula, valor_novo: s.matricula, origem: 'IMPORTACAO' });
      mudancasMatricula.push({ servidor_id: a.id, anterior: a.matricula, nova: s.matricula });
    }
  }
  resumo.servidoresNovos = novos.length;
  resumo.servidoresAtualizados = existentes.length;
  resumo.alteracoesCadastrais = alteracoes.length;

  if (dryRun) { progresso(100, 'Simulação concluída'); return resumo; }

  const gravados: Record<string, number> = { servidores: 0, matriculas: 0, quinquenios: 0, gozos: 0 };
  resumo.gravados = gravados;
  // payload cadastral: nunca inclui ativo / data_inativacao / motivo_inativacao
  const cadastro = (s: ParsePlanilhaResult['servidores'][number]) => ({
    nome: s.nome, data_nascimento: s.data_nascimento, sexo: s.sexo, matricula: s.matricula,
    registro_unico: s.registro_unico, rg: s.rg, cpf: s.cpf, data_admissao: s.data_admissao,
    cargo: s.cargo, lotacao: s.lotacao, vinculo: s.vinculo, filiacao: s.filiacao,
    endereco: s.endereco, telefone: s.telefone, email: s.email,
  });

  progresso(35, 'Gravando servidores');
  const ruToId = new Map(atuais.map((a) => [a.registro_unico, a.id]));
  await emLotes(novos, async (lote) => {
    const { data, error } = await supabase.from('servidores').insert(lote.map(cadastro) as never).select('id, registro_unico');
    if (error) erros.push(`Servidores novos: ${error.message}`);
    else { gravados.servidores += lote.length; data?.forEach((d) => ruToId.set(d.registro_unico, d.id)); }
  });
  for (const s of existentes) {
    const { error } = await supabase.from('servidores').update(cadastro(s) as never).eq('id', porRu.get(s.registro_unico)!.id);
    if (error) erros.push(`Servidor RU ${s.registro_unico}: ${error.message}`);
    else gravados.servidores += 1;
  }
  await emLotes(alteracoes, async (lote) => {
    const { error } = await supabase.from('servidores_alteracoes').insert(lote as never);
    if (error) erros.push(`Histórico de alterações: ${error.message}`);
  });

  progresso(50, 'Gravando histórico de matrículas');
  // servidores novos: matrícula inicial
  const matNovos = novos.filter((s) => s.matricula && ruToId.has(s.registro_unico))
    .map((s) => ({ servidor_id: ruToId.get(s.registro_unico)!, matricula: s.matricula }));
  await emLotes(matNovos, async (lote) => {
    const { error } = await supabase.from('matriculas_historico').upsert(lote as never, { onConflict: 'servidor_id,matricula', ignoreDuplicates: true });
    if (error) erros.push(`Matrículas: ${error.message}`); else gravados.matriculas += lote.length;
  });
  // matrícula trocada: encerra a vigência da anterior e registra a nova (sem duplicar)
  for (const m of mudancasMatricula) {
    await supabase.from('matriculas_historico').update({ vigente_ate: hoje })
      .eq('servidor_id', m.servidor_id).eq('matricula', m.anterior).is('vigente_ate', null);
    const { error } = await supabase.from('matriculas_historico')
      .upsert({ servidor_id: m.servidor_id, matricula: m.nova, vigente_de: hoje } as never, { onConflict: 'servidor_id,matricula', ignoreDuplicates: true });
    if (error) erros.push(`Matrícula ${m.nova}: ${error.message}`); else gravados.matriculas += 1;
  }

  progresso(65, 'Gravando quinquênios que ainda não existem');
  const servidorIds = validos.map((s) => ruToId.get(s.registro_unico)).filter(Boolean) as string[];
  const existentesQ = new Set<string>();
  await emLotes(servidorIds, async (lote) => {
    const rows = await lerTudo<{ servidor_id: string; numero: number }>(
      (de, ate) => supabase.from('quinquenios').select('servidor_id, numero').in('servidor_id', lote).order('id').range(de, ate) as never,
      erros, 'Leitura de quinquênios'
    );
    rows.forEach((q) => existentesQ.add(`${q.servidor_id}|${q.numero}`));
  });
  const novosQ = validos.flatMap((s) => {
    const sid = ruToId.get(s.registro_unico);
    if (!sid) return [];
    return s.quinquenios.filter((q) => !existentesQ.has(`${sid}|${q.numero}`)).map((q) => ({ s: sid, q }));
  });
  const novosQIds = new Map<string, string>();
  await emLotes(novosQ, async (lote) => {
    const { data, error } = await supabase.from('quinquenios').insert(lote.map(({ s, q }) => ({
      servidor_id: s, numero: q.numero, data_inicio: q.data_inicio, data_fim_base: q.data_fim_base,
      data_fim_ajustada: q.data_fim_ajustada, dias_acrescimo: q.dias_acrescimo, status: q.status,
    })) as never).select('id, servidor_id, numero');
    if (error) erros.push(`Quinquênios: ${error.message}`);
    else { gravados.quinquenios += lote.length; data?.forEach((d) => novosQIds.set(`${d.servidor_id}|${d.numero}`, d.id)); }
  });

  progresso(80, 'Gravando períodos de gozo dos quinquênios novos');
  const gozos = novosQ.flatMap(({ s, q }) => {
    const qid = novosQIds.get(`${s}|${q.numero}`);
    if (!qid) return [];
    return q.gozos.filter((g) => g.data_fim && g.dias !== null && g.dias > 0)
      .map((g) => ({ quinquenio_id: qid, numero_periodo: g.numero_periodo, data_inicio: g.data_inicio, data_fim: g.data_fim!, dias: g.dias! }));
  });
  await emLotes(gozos, async (lote) => {
    const { error } = await supabase.from('gozos').upsert(lote as never, { onConflict: 'quinquenio_id,numero_periodo', ignoreDuplicates: true });
    if (error) erros.push(`Gozos: ${error.message}`); else gravados.gozos += lote.length;
  });

  progresso(92, 'Criando quinquênios em aberto dos servidores novos');
  const idsNovos = novos.map((s) => ruToId.get(s.registro_unico)).filter(Boolean) as string[];
  for (const id of idsNovos) {
    const { error } = await supabase.rpc('garantir_quinquenios_em_aberto', { _servidor_id: id });
    if (error) erros.push(`Quinquênio em aberto: ${error.message}`);
  }

  await supabase.from('logs_atividade').insert({
    tipo_acao: 'UPLOAD',
    detalhes: `Atualização de servidores: ${novos.length} novos, ${existentes.length} atualizados, ${alteracoes.length} alterações cadastrais`,
  });
  progresso(100, 'Atualização concluída');
  return resumo;
}

/** Modo "Atualizar afastamentos e faltas": servidores resolvidos só pelo banco. */
async function atualizarEventos(parsed: ParsePlanilhaResult, resumo: ImportSummary, dryRun: boolean, progresso: Progresso) {
  const erros = resumo.erros;
  progresso(20, 'Localizando servidores no sistema');
  const ruToId = new Map<string, string>();
  const rus = [...new Set(parsed.afastamentos.map((a) => a.registro_unico).filter(Boolean) as string[])];
  await emLotes(rus, async (lote) => {
    const { data, error } = await supabase.from('servidores').select('id, registro_unico').in('registro_unico', lote);
    if (error) erros.push(`Leitura de servidores: ${error.message}`);
    data?.forEach((s) => ruToId.set(s.registro_unico, s.id));
  });
  const matToId = new Map<string, string>();
  const mats = [...new Set([...parsed.faltas, ...parsed.faltasLegado].map((f) => f.matricula).filter(Boolean) as string[])];
  await emLotes(mats, async (lote) => {
    const { data, error } = await supabase.from('matriculas_historico').select('servidor_id, matricula').in('matricula', lote);
    if (error) erros.push(`Leitura de matrículas: ${error.message}`);
    data?.forEach((m) => matToId.set(m.matricula, m.servidor_id));
  });

  const toOc = (o: OcorrenciaPlanilha, sid: string): OcorrenciaGravar => ({
    servidor_id: sid, tipo: o.tipo, data_inicio: o.data_inicio, data_fim: o.data_fim,
    quantidade_dias: o.quantidade_dias, documento_referencia: o.documento_referencia, observacoes: o.observacoes,
  });
  let semServAfast = 0, semServFaltas = 0;
  const afast = parsed.afastamentos.flatMap((o) => {
    const sid = o.registro_unico ? ruToId.get(o.registro_unico) : undefined;
    if (!sid) { semServAfast += 1; erros.push(`Afastamento de RU ${o.registro_unico}: servidor não encontrado no sistema — não importado`); return []; }
    return [toOc(o, sid)];
  });
  const faltas = parsed.faltas.flatMap((o) => {
    const sid = o.matricula ? matToId.get(o.matricula) : undefined;
    if (!sid) { semServFaltas += 1; erros.push(`Falta da matrícula ${o.matricula}: servidor não encontrado no sistema — não importada`); return []; }
    return [toOc(o, sid)];
  });

  progresso(50, dryRun ? 'Comparando com os eventos existentes' : 'Gravando eventos novos');
  const rec = await reconciliarOcorrencias(afast, faltas, dryRun, erros);
  rec.reconciliacao.afastamentos.comErro += semServAfast;
  rec.reconciliacao.faltas.comErro += semServFaltas;
  resumo.reconciliacao = rec.reconciliacao;
  resumo.ocorrenciasInseridasIds = rec.idsInseridos;
  resumo.eventosAusentesNaPlanilha = rec.ausentes;

  if (dryRun) { progresso(100, 'Simulação concluída'); return resumo; }

  const gravados: Record<string, number> = {
    afastamentos: rec.reconciliacao.afastamentos.novas, faltas: rec.reconciliacao.faltas.novas, legado: 0,
  };
  resumo.gravados = gravados;
  progresso(85, 'Gravando faltas para revisão');
  const legado = parsed.faltasLegado.map((f) => ({
    servidor_id: f.matricula ? matToId.get(f.matricula) ?? null : null,
    evento: f.evento, tipo_evento: f.tipo_evento, competencia: f.competencia, valor: f.valor,
    referencia: f.referencia, situacao: f.situacao, precisa_revisao: true,
  }));
  await emLotes(legado, async (lote) => {
    const { error } = await supabase.from('faltas_historico_legado')
      .upsert(lote as never, { onConflict: 'servidor_id,evento,competencia,valor', ignoreDuplicates: true });
    if (error) erros.push(`Faltas (legado): ${error.message}`); else gravados.legado += lote.length;
  });

  await supabase.from('logs_atividade').insert({
    tipo_acao: 'UPLOAD',
    detalhes: `Atualização de afastamentos e faltas: ${rec.idsInseridos.length} eventos novos, ` +
      `${rec.reconciliacao.afastamentos.ignoradasExclusao + rec.reconciliacao.faltas.ignoradasExclusao} ignorados por exclusão manual`,
  });
  progresso(100, 'Atualização concluída');
  return resumo;
}
