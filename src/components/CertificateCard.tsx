import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CertificateCardProps {
  certificate: {
    id: string;
    course_title: string;
    tutor_name: string | null;
    explorer_name: string | null;
    issued_at: string;
    certificate_code: string;
  };
  isEs: boolean;
}

export default function CertificateCard({ certificate, isEs }: CertificateCardProps) {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificate.certificate_code);
    toast.success(isEs ? 'Código copiado' : 'Code copied');
  };

  return (
    <Card className="overflow-hidden border-primary/20 hover:border-primary/40 transition-all">
      <div className="h-2 bg-gradient-to-r from-primary to-orange-400" />
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-heading font-bold text-sm leading-tight truncate">
              {certificate.course_title}
            </h4>
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
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyCode}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
