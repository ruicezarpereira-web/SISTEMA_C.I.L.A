import { supabase } from '@/integrations/supabase/client';
import {
  parsePlanilhaGeral,
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

export interface ImportSummary {
  dryRun: boolean;
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
  opts: { dryRun: boolean; onProgress?: (pct: number, etapa: string) => void }
): Promise<ImportSummary> {
  const { dryRun, onProgress } = opts;
  const progresso = (p: number, etapa: string) => onProgress?.(p, etapa);

  progresso(5, 'Lendo a planilha');
  const parsed: ParsePlanilhaResult = await parsePlanilhaGeral(file);
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

  await emLotes(ocorrAfast, async (lote) => {
    const { error } = await supabase
      .from('ocorrencias')
      .upsert(lote as never, {
        onConflict: 'servidor_id,tipo,data_inicio,data_fim,quantidade_dias',
        ignoreDuplicates: true,
      });
    if (error) erros.push(`Afastamentos: ${error.message}`);
    else gravados.afastamentos += lote.length;
  });

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

  await emLotes(ocorrFaltas, async (lote) => {
    const { error } = await supabase
      .from('ocorrencias')
      .upsert(lote as never, {
        onConflict: 'servidor_id,tipo,data_inicio,data_fim,quantidade_dias',
        ignoreDuplicates: true,
      });
    if (error) erros.push(`Faltas: ${error.message}`);
    else gravados.faltas += lote.length;
  });

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
