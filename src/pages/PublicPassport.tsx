import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import SkillPassport from '@/components/SkillPassport';
import { Shield } from 'lucide-react';

const PublicPassport = () => {
  const { explorerId } = useParams<{ explorerId: string }>();
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-heading font-bold">
            GOPHORA {isEs ? 'Pasaporte de Habilidades' : 'Skill Passport'}
          </h1>
        </div>
        <SkillPassport explorerId={explorerId} isPublic />
      </div>
    </div>
  );
};

export default PublicPassport;
