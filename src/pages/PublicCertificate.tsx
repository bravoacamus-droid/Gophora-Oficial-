import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import PremiumCertificate, { type PremiumCertificateData } from '@/components/PremiumCertificate';
import CertificateModal from '@/components/CertificateModal';

interface CertificateRow {
  id: string;
  certificate_code: string;
  course_title: string;
  achievement_title: string | null;
  achievement_summary: string | null;
  tutor_name: string | null;
  explorer_name: string | null;
  cert_type: string;
  issued_at: string;
}

const PublicCertificate = () => {
  const { code } = useParams<{ code: string }>();
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [cert, setCert] = useState<CertificateRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullView, setShowFullView] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    (supabase as any)
      .from('certificates')
      .select('id, certificate_code, course_title, achievement_title, achievement_summary, tutor_name, explorer_name, cert_type, issued_at')
      .eq('certificate_code', code)
      .maybeSingle()
      .then(({ data }: any) => {
        setCert(data as CertificateRow);
        setLoading(false);
      });
  }, [code]);

  const buildData = (): PremiumCertificateData | null => {
    if (!cert) return null;
    return {
      explorerName: cert.explorer_name || 'Explorer',
      courseTitle: cert.course_title,
      achievementTitle: cert.achievement_title,
      achievementSummary: cert.achievement_summary,
      tutorName: cert.tutor_name,
      certificateCode: cert.certificate_code,
      issuedAt: cert.issued_at,
      certType: cert.cert_type,
      verifyUrl: `${window.location.origin}/cert/${cert.certificate_code}`,
      isEs,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-heading font-bold">
            {isEs ? 'Certificado no encontrado' : 'Certificate not found'}
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            {isEs
              ? `No encontramos un certificado válido con el código "${code}". Verificá que el código sea correcto.`
              : `We could not find a valid certificate with code "${code}". Check that the code is correct.`}
          </p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {isEs ? 'Volver al inicio' : 'Back to home'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const data = buildData()!;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Verification banner */}
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-base">
              {isEs ? 'Certificado verificado' : 'Verified certificate'}
            </p>
            <p className="text-sm text-muted-foreground font-body">
              {isEs
                ? `Emitido por GOPHORA Academy a ${cert.explorer_name} el ${new Date(cert.issued_at).toLocaleDateString('es')}.`
                : `Issued by GOPHORA Academy to ${cert.explorer_name} on ${new Date(cert.issued_at).toLocaleDateString('en')}.`}
            </p>
          </div>
          <Button onClick={() => setShowFullView(true)} className="bg-primary hover:bg-primary/90 text-white">
            {isEs ? 'Ver y descargar' : 'View and download'}
          </Button>
        </div>

        {/* Inline scaled-down preview */}
        <div className="bg-muted/40 rounded-xl p-6 flex justify-center overflow-hidden">
          <div
            style={{
              transform: 'scale(0.65)',
              transformOrigin: 'top center',
              width: 1200,
              height: 848 * 0.65,
            }}
          >
            <PremiumCertificate data={data} />
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center text-xs text-muted-foreground font-body">
          {isEs
            ? 'Este certificado fue emitido oficialmente por GOPHORA Academy. Su autenticidad puede verificarse en cualquier momento desde esta página.'
            : 'This certificate was officially issued by GOPHORA Academy. Its authenticity can be verified anytime from this page.'}
        </div>
      </div>

      <CertificateModal
        open={showFullView}
        onClose={() => setShowFullView(false)}
        certificate={data}
        isEs={isEs}
      />
    </div>
  );
};

export default PublicCertificate;
