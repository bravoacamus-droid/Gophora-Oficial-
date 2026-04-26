import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Copy, Eye, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CertificateModal from '@/components/CertificateModal';

interface CertificateCardProps {
  certificate: {
    id: string;
    course_title: string;
    tutor_name: string | null;
    explorer_name: string | null;
    issued_at: string;
    certificate_code: string;
    cert_type?: string;
    achievement_title?: string | null;
    achievement_summary?: string | null;
  };
  isEs: boolean;
}

export default function CertificateCard({ certificate, isEs }: CertificateCardProps) {
  const [open, setOpen] = useState(false);
  const isPath = certificate.cert_type === 'path';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificate.certificate_code);
    toast.success(isEs ? 'Código copiado' : 'Code copied');
  };

  return (
    <>
      <Card className="overflow-hidden border-primary/20 hover:border-primary/40 transition-all group">
        <div className="h-2 bg-gradient-to-r from-primary to-orange-400" />
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {isPath ? <Map className="h-6 w-6 text-primary" /> : <Award className="h-6 w-6 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-heading font-bold text-sm leading-tight truncate">
                  {certificate.course_title}
                </h4>
                {isPath && (
                  <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30">
                    {isEs ? 'RUTA' : 'PATH'}
                  </Badge>
                )}
              </div>
              {certificate.tutor_name && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEs ? 'Instructor' : 'Instructor'}: {certificate.tutor_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {isEs ? 'Emitido' : 'Issued'}: {new Date(certificate.issued_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono">
              {certificate.certificate_code}
            </Badge>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyCode} title={isEs ? 'Copiar código' : 'Copy code'}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              className="ml-auto text-xs gap-1 bg-primary hover:bg-primary/90 text-white"
              onClick={() => setOpen(true)}
            >
              <Eye className="h-3 w-3" />
              {isEs ? 'Ver y descargar' : 'View & download'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <CertificateModal
        open={open}
        onClose={() => setOpen(false)}
        isEs={isEs}
        certificate={{
          explorerName: certificate.explorer_name || 'Explorer',
          courseTitle: certificate.course_title,
          achievementTitle: certificate.achievement_title || null,
          achievementSummary: certificate.achievement_summary || null,
          tutorName: certificate.tutor_name,
          certificateCode: certificate.certificate_code,
          issuedAt: certificate.issued_at,
          certType: certificate.cert_type || 'course',
          verifyUrl: `${window.location.origin}/cert/${certificate.certificate_code}`,
          isEs,
        }}
      />
    </>
  );
}
