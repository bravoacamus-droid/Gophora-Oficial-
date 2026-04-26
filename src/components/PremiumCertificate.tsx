import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import gophoraLogo from '@/assets/gophora-logo.png';

export interface PremiumCertificateData {
  explorerName: string;
  courseTitle: string;        // shown as the achievement headline
  achievementTitle?: string | null;  // e.g. "Ruta de aprendizaje completada"
  achievementSummary?: string | null;
  tutorName?: string | null;
  certificateCode: string;
  issuedAt: string;
  certType: 'course' | 'path' | 'achievement' | string;
  verifyUrl: string;          // QR target — public verification page
  isEs?: boolean;
}

/**
 * Premium-looking certificate intended to be rasterised by html2canvas and
 * embedded in a jsPDF landscape A4 page. Width is fixed in px (1200x848 ~
 * landscape A4 at 102 DPI) so the rasterisation produces sharp PDF output
 * without depending on the parent layout.
 */
const PremiumCertificate = forwardRef<HTMLDivElement, { data: PremiumCertificateData }>(
  ({ data }, ref) => {
    const isEs = data.isEs ?? true;
    const isPathCert = data.certType === 'path';
    const issued = new Date(data.issuedAt);

    return (
      <div
        ref={ref}
        className="relative shrink-0"
        style={{
          width: 1200,
          height: 848,
          background: 'linear-gradient(135deg, #fffaf3 0%, #fff5e6 100%)',
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#1a1a1a',
        }}
      >
        {/* Outer gold frame */}
        <div
          style={{
            position: 'absolute',
            inset: 18,
            border: '4px solid #c08416',
            borderRadius: 6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 30,
            border: '1px solid #d9a64f',
            borderRadius: 4,
          }}
        />

        {/* Subtle corner ornaments */}
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => (
          <div
            key={corner}
            style={{
              position: 'absolute',
              width: 70,
              height: 70,
              top: corner.startsWith('top') ? 32 : undefined,
              bottom: corner.startsWith('bottom') ? 32 : undefined,
              left: corner.endsWith('left') ? 32 : undefined,
              right: corner.endsWith('right') ? 32 : undefined,
              borderTop: corner.startsWith('top') ? '3px solid #c08416' : undefined,
              borderBottom: corner.startsWith('bottom') ? '3px solid #c08416' : undefined,
              borderLeft: corner.endsWith('left') ? '3px solid #c08416' : undefined,
              borderRight: corner.endsWith('right') ? '3px solid #c08416' : undefined,
            }}
          />
        ))}

        {/* Watermark wordmark */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-12deg)',
            fontSize: 220,
            fontWeight: 900,
            letterSpacing: 16,
            color: 'rgba(192, 132, 22, 0.05)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          GOPHORA
        </div>

        {/* Top header — logo + brand */}
        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' }}>
          <img
            src={gophoraLogo}
            alt="GOPHORA"
            style={{ height: 56, marginBottom: 10, filter: 'invert(1) hue-rotate(180deg)' }}
            crossOrigin="anonymous"
          />
          <div
            style={{
              fontSize: 11,
              letterSpacing: 8,
              color: '#7a4f0a',
              fontWeight: 600,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              textTransform: 'uppercase',
            }}
          >
            GOPHORA Academy · Trabajo + Aprendizaje con IA
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            position: 'absolute',
            top: 200,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 16,
              letterSpacing: 6,
              color: '#7a4f0a',
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            {isEs ? 'Certificado de Realización' : 'Certificate of Completion'}
          </div>
          <div
            style={{
              fontSize: 14,
              color: '#5a3e0a',
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
            }}
          >
            {isEs ? 'Se otorga a' : 'Awarded to'}
          </div>
        </div>

        {/* Recipient name */}
        <div
          style={{
            position: 'absolute',
            top: 290,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: '#c08416',
              letterSpacing: 1,
              borderBottom: '1px solid #c08416',
              display: 'inline-block',
              padding: '0 60px 14px',
              fontFamily: 'Georgia, serif',
            }}
          >
            {data.explorerName}
          </div>
        </div>

        {/* Achievement description */}
        <div
          style={{
            position: 'absolute',
            top: 410,
            left: 100,
            right: 100,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 18, color: '#3a3a3a', marginBottom: 18, fontStyle: 'italic' }}>
            {isPathCert
              ? (isEs
                  ? 'por completar exitosamente la ruta de aprendizaje'
                  : 'for successfully completing the learning path')
              : (isEs
                  ? 'por completar exitosamente el curso'
                  : 'for successfully completing the course')}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#1a1a1a',
              fontFamily: 'Georgia, serif',
              lineHeight: 1.25,
            }}
          >
            "{data.courseTitle}"
          </div>
          {data.achievementSummary && (
            <div
              style={{
                fontSize: 14,
                color: '#5a3e0a',
                marginTop: 16,
                maxWidth: 800,
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.5,
              }}
            >
              {data.achievementSummary}
            </div>
          )}
        </div>

        {/* Bottom row: signature, seal, QR */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 100,
            right: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          {/* Signature */}
          <div style={{ textAlign: 'center', minWidth: 240 }}>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 28,
                color: '#1a1a1a',
                marginBottom: 6,
              }}
            >
              {data.tutorName || 'GOPHORA Academy'}
            </div>
            <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 6 }}>
              <div style={{ fontSize: 11, color: '#5a3e0a', textTransform: 'uppercase', letterSpacing: 2 }}>
                {data.tutorName ? (isEs ? 'Instructor' : 'Instructor') : (isEs ? 'Director Académico' : 'Academic Director')}
              </div>
            </div>
          </div>

          {/* Round seal */}
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: '50%',
              border: '4px solid #c08416',
              background: 'radial-gradient(circle at 30% 30%, #ffd87a 0%, #c08416 70%, #7a4f0a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              boxShadow: '0 6px 12px rgba(122, 79, 10, 0.25)',
              color: '#fff',
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              textAlign: 'center',
              padding: 10,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 3 }}>GOPHORA</div>
            <div style={{ fontSize: 8, letterSpacing: 1, marginTop: 2, opacity: 0.85 }}>OFFICIAL · ACADEMY</div>
            <div
              style={{
                marginTop: 4,
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              ★
            </div>
          </div>

          {/* QR + verification */}
          <div style={{ textAlign: 'center', minWidth: 240 }}>
            <div
              style={{
                background: '#fff',
                padding: 10,
                borderRadius: 6,
                display: 'inline-block',
                border: '1px solid #c08416',
              }}
            >
              <QRCodeSVG
                value={data.verifyUrl}
                size={120}
                fgColor="#1a1a1a"
                bgColor="#ffffff"
                level="M"
                includeMargin={false}
              />
            </div>
            <div style={{ fontSize: 10, color: '#5a3e0a', marginTop: 6, letterSpacing: 1 }}>
              {isEs ? 'Verificá la autenticidad' : 'Verify authenticity'}
            </div>
          </div>
        </div>

        {/* Footer: code + date */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: '#7a4f0a',
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            letterSpacing: 1,
          }}
        >
          <div>
            {isEs ? 'CÓDIGO DE CERTIFICADO' : 'CERTIFICATE CODE'}
            <span style={{ fontWeight: 700, marginLeft: 8, color: '#1a1a1a', fontFamily: 'Menlo, monospace' }}>
              {data.certificateCode}
            </span>
          </div>
          <div>
            {isEs ? 'EMITIDO' : 'ISSUED'}
            <span style={{ fontWeight: 700, marginLeft: 8, color: '#1a1a1a' }}>
              {issued.toLocaleDateString(isEs ? 'es' : 'en', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PremiumCertificate.displayName = 'PremiumCertificate';

export default PremiumCertificate;
