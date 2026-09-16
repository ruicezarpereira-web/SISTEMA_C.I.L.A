 import jsPDF from 'jspdf';
 import autoTable from 'jspdf-autotable';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { QuinquenioResult } from './quinquenio-calc';
 
 interface ServidorData {
   nome: string;
   matricula: string;
   cargo: string | null;
   lotacao: string | null;
   data_admissao: string;
   cpf: string | null;
   rg: string | null;
 }
 
 export function gerarCertidao(
   servidor: ServidorData,
   quinquenios: QuinquenioResult[],
   autoridade?: { cargo: string; nome: string }
 ): jsPDF {
   const doc = new jsPDF();
   const pageWidth = doc.internal.pageSize.getWidth();
   const margin = 20;
 
   // Header
   doc.setFontSize(12);
   doc.setFont('helvetica', 'bold');
   doc.text('PREFEITURA MUNICIPAL DE SALVADOR', pageWidth / 2, 20, { align: 'center' });
   doc.text('SUPERINTENDÊNCIA DE TRÂNSITO DE SALVADOR - TRANSALVADOR', pageWidth / 2, 27, { align: 'center' });
   doc.setFontSize(10);
   doc.setFont('helvetica', 'normal');
   doc.text('Coordenadoria de Recursos Humanos', pageWidth / 2, 34, { align: 'center' });
 
   // Title
   doc.setFontSize(14);
   doc.setFont('helvetica', 'bold');
   doc.text('CERTIDÃO DE TEMPO DE SERVIÇO PARA LICENÇA PRÊMIO', pageWidth / 2, 50, { align: 'center' });
 
   // Servidor info
   doc.setFontSize(10);
   doc.setFont('helvetica', 'normal');
   let y = 65;
 
   const info = [
     ['Nome:', servidor.nome],
     ['Matrícula:', servidor.matricula],
     ['CPF:', servidor.cpf || 'N/I'],
     ['Cargo:', servidor.cargo || 'N/I'],
     ['Lotação:', servidor.lotacao || 'N/I'],
     ['Data de Admissão:', format(new Date(servidor.data_admissao), 'dd/MM/yyyy')],
   ];
 
   info.forEach(([label, value]) => {
     doc.setFont('helvetica', 'bold');
     doc.text(label, margin, y);
     doc.setFont('helvetica', 'normal');
     doc.text(value, margin + 40, y);
     y += 6;
   });
 
   // Quinquenios table
   y += 10;
   doc.setFont('helvetica', 'bold');
   doc.text('DEMONSTRATIVO DE QUINQUÊNIOS', margin, y);
   y += 5;
 
  const tableData = quinquenios.map(q => [
    `${q.numero}º`,
    format(q.dataInicio, 'dd/MM/yyyy'),
    format(q.dataFimBase, 'dd/MM/yyyy'),
    q.diasAcrescimo.toString(),
    format(q.dataFimAjustada, 'dd/MM/yyyy'),
    q.status,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Quinq.', 'Início', 'Fim base', 'Acréscimo', 'Fim ajustado', 'Situação']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 15 },
      5: { fontStyle: 'bold' },
    },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const deferidos = quinquenios.filter(q => q.status === 'DEFERIDO').length;

 
   doc.setFont('helvetica', 'bold');
   doc.text(`Total de quinquênios deferidos: ${deferidos}`, margin, finalY);
   doc.text(`Total de meses de licença prêmio: ${deferidos * 3}`, margin, finalY + 6);
 
   // Certificate text
   const certText = `Certifico que o(a) servidor(a) acima identificado(a) faz jus a ${deferidos} quinquênio(s) de licença prêmio, totalizando ${deferidos * 3} meses de licença, conforme demonstrativo acima.`;
   
   doc.setFont('helvetica', 'normal');
   const splitText = doc.splitTextToSize(certText, pageWidth - 2 * margin);
   doc.text(splitText, margin, finalY + 20);
 
   // Date and signature
   const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
   doc.text(`Salvador, ${dataAtual}`, pageWidth / 2, finalY + 45, { align: 'center' });
 
   if (autoridade) {
     doc.text('_'.repeat(40), pageWidth / 2, finalY + 60, { align: 'center' });
     doc.setFont('helvetica', 'bold');
     doc.text(autoridade.nome, pageWidth / 2, finalY + 67, { align: 'center' });
     doc.setFont('helvetica', 'normal');
     doc.text(autoridade.cargo, pageWidth / 2, finalY + 73, { align: 'center' });
   }
 
   return doc;
 }
 
 export function downloadPDF(doc: jsPDF, filename: string) {
   doc.save(filename);
 }