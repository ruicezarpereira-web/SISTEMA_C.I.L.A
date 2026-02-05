 import * as XLSX from 'xlsx';
 
 export interface ServidorImport {
   nome: string;
   data_nascimento: string | null;
   sexo: string | null;
   matricula: string;
   registro_unico: string | null;
   rg: string | null;
   cpf: string | null;
   data_admissao: string;
   cargo: string | null;
   lotacao: string | null;
   vinculo: string | null;
 }
 
 export interface FaltaImport {
   matricula: string;
   nome_servidor: string | null;
   evento: string | null;
   tipo_evento: string | null;
   competencia: string | null;
   referencia: string | null;
   tipo_referencia: string | null;
   tipo_folha: string | null;
   cargo: string | null;
   situacao: string | null;
   valor: number;
 }
 
 export interface AfastamentoImport {
   matricula: string;
   registro_unico: string | null;
   nome_servidor: string | null;
   motivo: string;
   motivo_descricao: string | null;
   documento_referencia: string | null;
   inicio_evento: string;
   fim_evento: string;
   cargo: string | null;
   gerencia: string | null;
 }
 
 function excelDateToJSDate(serial: number): string | null {
   if (!serial || isNaN(serial)) return null;
   const utc_days = Math.floor(serial - 25569);
   const date = new Date(utc_days * 86400 * 1000);
   return date.toISOString().split('T')[0];
 }
 
 function parseDate(value: any): string | null {
   if (!value) return null;
   if (typeof value === 'number') {
     return excelDateToJSDate(value);
   }
   if (typeof value === 'string') {
     // Try DD/MM/YYYY format
     const parts = value.split('/');
     if (parts.length === 3) {
       return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
     }
     // Try ISO format
     const date = new Date(value);
     if (!isNaN(date.getTime())) {
       return date.toISOString().split('T')[0];
     }
   }
   return null;
 }
 
 function normalizeMotivo(motivo: string | null): string {
   if (!motivo) return 'OUTROS';
   const upper = motivo.toUpperCase();
   if (upper.includes('FERIAS') || upper.includes('FÉRIAS')) return 'FERIAS';
   if (upper.includes('ATESTADO') || upper.includes('LICENCA MEDICA') || upper.includes('LICENÇA MÉDICA')) return 'ATESTADO_LICENCA_MEDICA';
   if (upper.includes('LICENCA PREMIO') || upper.includes('LICENÇA PRÊMIO')) return 'LICENCA_PREMIO';
   return 'OUTROS';
 }
 
 export async function parseServidoresExcel(file: File): Promise<ServidorImport[]> {
   const data = await file.arrayBuffer();
   const workbook = XLSX.read(data);
   const sheetName = workbook.SheetNames[0];
   const worksheet = workbook.Sheets[sheetName];
   const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
 
   return jsonData.map((row: any) => ({
     nome: row['Nome'] || row['NOME'] || row['nome'] || '',
     data_nascimento: parseDate(row['Data Nascimento'] || row['DATA_NASCIMENTO'] || row['data_nascimento']),
     sexo: (row['Sexo'] || row['SEXO'] || row['sexo'] || '').substring(0, 1).toUpperCase() || null,
     matricula: String(row['Matricula'] || row['MATRICULA'] || row['matricula'] || ''),
     registro_unico: row['Registro Único'] || row['REGISTRO_UNICO'] || row['registro_unico'] || null,
     rg: row['RG'] || row['rg'] || null,
     cpf: row['CPF'] || row['cpf'] || null,
     data_admissao: parseDate(row['Data Admissão'] || row['DATA_ADMISSAO'] || row['data_admissao']) || new Date().toISOString().split('T')[0],
     cargo: row['Cargo'] || row['CARGO'] || row['cargo'] || null,
     lotacao: row['Lotação'] || row['LOTACAO'] || row['lotacao'] || null,
     vinculo: row['Vínculo'] || row['VINCULO'] || row['vinculo'] || null,
   })).filter(s => s.matricula && s.nome);
 }
 
 export async function parseFaltasExcel(file: File): Promise<FaltaImport[]> {
   const data = await file.arrayBuffer();
   const workbook = XLSX.read(data);
   const sheetName = workbook.SheetNames[0];
   const worksheet = workbook.Sheets[sheetName];
   const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
 
   return jsonData.map((row: any) => ({
     matricula: String(row['Matricula'] || row['MATRICULA'] || row['matricula'] || ''),
     nome_servidor: row['Nome'] || row['NOME'] || row['nome_servidor'] || null,
     evento: row['Evento'] || row['EVENTO'] || row['evento'] || null,
     tipo_evento: row['Tipo Evento'] || row['TIPO_EVENTO'] || row['tipo_evento'] || null,
     competencia: row['Competência'] || row['COMPETENCIA'] || row['competencia'] || null,
     referencia: row['Referência'] || row['REFERENCIA'] || row['referencia'] || null,
     tipo_referencia: row['Tipo Referência'] || row['TIPO_REFERENCIA'] || row['tipo_referencia'] || null,
     tipo_folha: row['Tipo Folha'] || row['TIPO_FOLHA'] || row['tipo_folha'] || null,
     cargo: row['Cargo'] || row['CARGO'] || row['cargo'] || null,
     situacao: row['Situação'] || row['SITUACAO'] || row['situacao'] || null,
     valor: Number(row['Valor'] || row['VALOR'] || row['valor'] || 0),
   })).filter(f => f.matricula);
 }
 
 export async function parseAfastamentosExcel(file: File): Promise<AfastamentoImport[]> {
   const data = await file.arrayBuffer();
   const workbook = XLSX.read(data);
   const sheetName = workbook.SheetNames[0];
   const worksheet = workbook.Sheets[sheetName];
   const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
 
   return jsonData.map((row: any) => ({
     matricula: String(row['Matricula'] || row['MATRICULA'] || row['matricula'] || ''),
     registro_unico: row['Registro Único'] || row['REGISTRO_UNICO'] || row['registro_unico'] || null,
     nome_servidor: row['Nome'] || row['NOME'] || row['nome_servidor'] || null,
     motivo: normalizeMotivo(row['Motivo'] || row['MOTIVO'] || row['motivo']),
     motivo_descricao: row['Descrição'] || row['DESCRICAO'] || row['motivo_descricao'] || null,
     documento_referencia: row['Documento'] || row['DOCUMENTO'] || row['documento_referencia'] || null,
     inicio_evento: parseDate(row['Início'] || row['INICIO'] || row['inicio_evento']) || new Date().toISOString().split('T')[0],
     fim_evento: parseDate(row['Fim'] || row['FIM'] || row['fim_evento']) || new Date().toISOString().split('T')[0],
     cargo: row['Cargo'] || row['CARGO'] || row['cargo'] || null,
     gerencia: row['Gerência'] || row['GERENCIA'] || row['gerencia'] || null,
   })).filter(a => a.matricula);
 }