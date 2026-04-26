import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PremiumCertificate, { type PremiumCertificateData } from '@/components/PremiumCertificate';

interface Props {
  open: boolean;
  onClose: () => void;
  certificate: PremiumCertificateData | null;
  isEs?: boolean;
}

const CertificateModal = ({ open, onClose, certificate, isEs = true }: Props) => {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!certRef.current || !certificate) return;
    setDownloading(true);
    try {
      // Dynamic import keeps these heavy libs out of the initial bundle.
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        backgroundColor: '#fffaf3',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      // Landscape A4 in mm: 297 x 210
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = 297;
      const pageHeight = 210;
      // Maintain aspect ratio (1200x848 ≈ 1.4151 — our chosen landscape A4-ish)
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      pdf.save(`GOPHORA-Certificado-${certificate.certificateCode}.pdf`);
      toast.success(isEs ? 'PDF descargado' : 'PDF downloaded');
    } catch (err: any) {
      toast.error(err?.message || (isEs ? 'No se pudo generar el PDF' : 'Could not generate PDF'));
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!certificate) return;
    try {
      await navigator.clipboard.writeText(certificate.verifyUrl);
      toast.success(isEs ? 'Link de verificación copiado' : 'Verification link copied');
    } catch {
      toast.error(isEs ? 'No se pudo copiar' : 'Could not copy');
    }
  };

  const handleShare = async () => {
    if (!certificate) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: isEs ? `Certificado GOPHORA — ${certificate.courseTitle}` : `GOPHORA Certificate — ${certificate.courseTitle}`,
          text: isEs
            ? `Mirá mi certificado oficial de GOPHORA: ${certificate.courseTitle}`
            : `Check out my official GOPHORA certificate: ${certificate.courseTitle}`,
          url: certificate.verifyUrl,
        });
      } catch {
        // user cancelled share — silent
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-heading text-lg">
            {isEs ? 'Certificado oficial GOPHORA' : 'Official GOPHORA Certificate'}
          </DialogTitle>
        </DialogHeader>

        {certificate && (
          <>
            {/* Action bar */}
            <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-border/50 bg-muted/20">
              <Button onClick={handleDownloadPDF} disabled={downloading} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEs ? 'Generando PDF...' : 'Generating PDF...'}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {isEs ? 'Descargar PDF' : 'Download PDF'}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                <Copy className="h-4 w-4" />
                {isEs ? 'Copiar link' : 'Copy link'}
              </Button>
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                {isEs ? 'Compartir' : 'Share'}
              </Button>
              <span className="ml-auto self-center text-[10px] font-mono text-muted-foreground">
                {certificate.certificateCode}
              </span>
            </div>

            {/* Certificate preview — centered, scaled to fit dialog */}
            <div className="bg-muted/40 p-6 flex justify-center">
              <div
                style={{
                  transform: 'scale(0.55)',
                  transformOrigin: 'top center',
                  width: 1200,
                  height: 848 * 0.55,
                }}
              >
                <PremiumCertificate ref={certRef} data={certificate} />
              </div>
            </div>

            <div className="px-6 py-4 text-xs text-muted-foreground font-body border-t border-border/50">
              {isEs
                ? 'Este certificado se puede verificar públicamente escaneando el QR o visitando el link de verificación.'
                : 'Anyone can verify this certificate by scanning the QR or visiting the verification link.'}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CertificateModal;
