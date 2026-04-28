// Generates a simple equity-investment "letter of intent" PDF that the
// investor digitally signs (clicking "Submit offer" is the signature) and
// uploads to storage. This is intentionally lightweight — not a legal
// contract. The platform's role is to store a tamper-resistant record of
// what was offered, with names, amounts, percentages and timestamps.
//
// jsPDF is loaded dynamically so it lives in the same lazy chunk as
// CertificateModal — keeps the main bundle slim.

interface AgreementData {
  projectTitle: string;
  projectIndustry: string;
  ownerName: string;
  investorName: string;
  investorEmail: string;
  amountUsd: number;
  equityPercent: number;
  fundingPercent: number;
  totalCost: number;
  message?: string;
  date: Date;
  isEs: boolean;
}

export async function generateInvestorAgreementPdf(d: AgreementData): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 60;
  let y = margin;

  // Header band
  doc.setFillColor(15, 15, 18);
  doc.rect(0, 0, pageWidth, 110, 'F');
  doc.setTextColor(255, 158, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('GOPHORA', margin, 50);
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(d.isEs ? 'Acuerdo Simple de Inversión' : 'Simple Investment Agreement', margin, 70);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(d.isEs ? 'Carta de intención no vinculante hasta aceptación de la empresa' : 'Non-binding letter of intent until accepted by the company', margin, 88);

  // Reset for body
  y = 145;
  doc.setTextColor(20, 20, 20);

  // Project block
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(d.isEs ? 'PROYECTO' : 'PROJECT', margin, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(truncate(d.projectTitle, 80), margin, y);
  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${d.isEs ? 'Industria' : 'Industry'}: ${d.projectIndustry}`, margin, y);
  y += 16;
  doc.text(`${d.isEs ? 'Costo total estimado' : 'Estimated total cost'}: $${d.totalCost.toLocaleString()} USD`, margin, y);
  y += 30;

  // Parties
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(d.isEs ? 'PARTES' : 'PARTIES', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${d.isEs ? 'Inversor' : 'Investor'}: ${d.investorName} <${d.investorEmail}>`, margin, y);
  y += 14;
  doc.text(`${d.isEs ? 'Empresa / Owner del proyecto' : 'Company / Project owner'}: ${d.ownerName}`, margin, y);
  y += 24;

  // Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(d.isEs ? 'TÉRMINOS DE LA OFERTA' : 'OFFER TERMS', margin, y);
  y += 20;

  // Amount + equity highlight box
  doc.setFillColor(255, 158, 0, 0.15 as any);
  doc.setDrawColor(255, 158, 0);
  doc.roundedRect(margin, y - 6, pageWidth - margin * 2, 70, 8, 8, 'FD');
  doc.setTextColor(180, 110, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(d.isEs ? 'INVERSIÓN OFRECIDA' : 'INVESTMENT OFFERED', margin + 14, y + 12);
  doc.setFontSize(22);
  doc.setTextColor(15, 15, 18);
  doc.text(`$${d.amountUsd.toLocaleString()} USD`, margin + 14, y + 36);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`${d.fundingPercent}% ${d.isEs ? 'del costo total estimado del proyecto' : 'of the estimated total project cost'}`, margin + 14, y + 52);

  // Equity on right
  doc.setFillColor(245, 245, 250);
  doc.setDrawColor(180, 180, 200);
  const equityX = pageWidth / 2 + 20;
  doc.roundedRect(equityX, y - 6, pageWidth - margin - equityX, 70, 8, 8, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 100);
  doc.text(d.isEs ? 'EQUITY A RECIBIR' : 'EQUITY GRANTED', equityX + 14, y + 12);
  doc.setFontSize(22);
  doc.setTextColor(15, 15, 18);
  doc.text(`${d.equityPercent}%`, equityX + 14, y + 36);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(d.isEs ? 'sobre la empresa / proyecto' : 'in the company / project', equityX + 14, y + 52);
  y += 90;

  // Conditions
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const conditions = d.isEs ? [
    `1. El Inversor ofrece aportar $${d.amountUsd.toLocaleString()} USD a cambio de ${d.equityPercent}% de equity en el proyecto/empresa indicado.`,
    `2. Esta oferta es válida hasta que la empresa la acepte, rechace o el Inversor la retire.`,
    `3. Si la empresa acepta, las partes firmarán un acuerdo formal con los términos legales completos antes del desembolso de los fondos.`,
    `4. La equity ofrecida sigue la tabla estándar de GOPHORA: 10% inversión → 5% equity, 25% → 10%, 50% → 15%.`,
    `5. GOPHORA actúa como plataforma facilitadora; no es parte del acuerdo final entre Inversor y Empresa.`,
    `6. Esta carta no constituye obligación de pago ni transferencia de equity hasta su aceptación formal.`,
  ] : [
    `1. The Investor offers to contribute $${d.amountUsd.toLocaleString()} USD in exchange for ${d.equityPercent}% equity in the listed project/company.`,
    `2. This offer is valid until accepted, declined, or withdrawn by the Investor.`,
    `3. If the company accepts, the parties shall sign a formal agreement with full legal terms prior to disbursement of funds.`,
    `4. Equity follows GOPHORA's standard ladder: 10% funding → 5% equity, 25% → 10%, 50% → 15%.`,
    `5. GOPHORA is a facilitating platform only; it is not a party to the final agreement between Investor and Company.`,
    `6. This letter does not constitute an obligation to pay or transfer equity until formally accepted.`,
  ];
  for (const c of conditions) {
    const lines = doc.splitTextToSize(c, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 4;
  }

  // Optional message
  if (d.message) {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(d.isEs ? 'Mensaje del Inversor:' : 'Investor message:', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const msgLines = doc.splitTextToSize(d.message, pageWidth - margin * 2);
    doc.text(msgLines, margin, y);
    y += msgLines.length * 12;
  }

  // Signature block
  if (y > 680) { doc.addPage(); y = margin; }
  y += 30;
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, margin + 200, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text(d.isEs ? 'Firma digital del Inversor' : 'Investor digital signature', margin, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(d.investorName, margin, y + 28);
  doc.text(d.investorEmail, margin, y + 40);
  doc.text(`${d.isEs ? 'Firmado el' : 'Signed on'} ${d.date.toISOString().slice(0, 19).replace('T', ' ')} UTC`, margin, y + 52);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('GOPHORA · gophora.com · ' + d.date.toISOString(), margin, doc.internal.pageSize.getHeight() - 30);

  return doc.output('blob');
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}
