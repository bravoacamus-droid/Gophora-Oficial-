import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Instagram, Twitter, Linkedin, Github } from 'lucide-react';
import { Input } from '@/components/ui/input';

const STEPS = [
  {
    key: 'interests',
    titleEn: 'What are you interested in?',
    titleEs: '¿Qué te interesa?',
    options: [
      { en: 'Technology', es: 'Tecnología' }, { en: 'Design', es: 'Diseño' }, { en: 'Marketing', es: 'Marketing' },
      { en: 'Writing', es: 'Escritura' }, { en: 'Finance', es: 'Finanzas' }, { en: 'Music', es: 'Música' },
      { en: 'Sports', es: 'Deportes' }, { en: 'Travel', es: 'Viajes' }, { en: 'Gaming', es: 'Videojuegos' },
      { en: 'Health', es: 'Salud' }, { en: 'Education', es: 'Educación' }, { en: 'Science', es: 'Ciencia' },
      { en: 'Art', es: 'Arte' }, { en: 'Photography', es: 'Fotografía' }, { en: 'Cooking', es: 'Cocina' },
    ],
  },
  {
    key: 'skills',
    titleEn: 'What skills do you have?',
    titleEs: '¿Qué habilidades tienes?',
    options: [
      { en: 'Web Development', es: 'Desarrollo Web' }, { en: 'Graphic Design', es: 'Diseño Gráfico' },
      { en: 'Copywriting', es: 'Redacción' }, { en: 'Data Analysis', es: 'Análisis de Datos' },
      { en: 'Video Editing', es: 'Edición de Video' }, { en: 'Social Media', es: 'Redes Sociales' },
      { en: 'SEO', es: 'SEO' }, { en: 'Translation', es: 'Traducción' }, { en: 'Sales', es: 'Ventas' },
      { en: 'Project Management', es: 'Gestión de Proyectos' }, { en: 'UI/UX Design', es: 'Diseño UI/UX' },
      { en: 'Photography', es: 'Fotografía' }, { en: 'Public Speaking', es: 'Oratoria' },
      { en: 'Research', es: 'Investigación' }, { en: 'Customer Support', es: 'Atención al Cliente' },
    ],
  },
  {
    key: 'hobbies',
    titleEn: 'What do you do for fun?',
    titleEs: '¿Qué haces por diversión?',
    options: [
      { en: 'Reading', es: 'Lectura' }, { en: 'Hiking', es: 'Senderismo' }, { en: 'Painting', es: 'Pintura' },
      { en: 'Dancing', es: 'Baile' }, { en: 'Yoga', es: 'Yoga' }, { en: 'Coding', es: 'Programación' },
      { en: 'Volunteering', es: 'Voluntariado' }, { en: 'Streaming', es: 'Streaming' },
      { en: 'Podcasting', es: 'Podcasting' }, { en: 'Gardening', es: 'Jardinería' },
      { en: 'Fitness', es: 'Fitness' }, { en: 'Board Games', es: 'Juegos de Mesa' },
      { en: 'Film', es: 'Cine' }, { en: 'Fashion', es: 'Moda' }, { en: 'DIY Crafts', es: 'Manualidades' },
    ],
  },
  {
    key: 'education',
    titleEn: 'What is your education level?',
    titleEs: '¿Cuál es tu nivel educativo?',
    options: [
      { en: 'High School', es: 'Preparatoria' }, { en: 'Associate Degree', es: 'Técnico Superior' },
      { en: "Bachelor's Degree", es: 'Licenciatura' }, { en: "Master's Degree", es: 'Maestría' },
      { en: 'PhD', es: 'Doctorado' }, { en: 'Self-Taught', es: 'Autodidacta' },
      { en: 'Bootcamp', es: 'Bootcamp' }, { en: 'Certifications', es: 'Certificaciones' },
      { en: 'Currently Studying', es: 'Estudiando Actualmente' },
    ],
  },
  {
    key: 'talents',
    titleEn: 'What are you naturally good at?',
    titleEs: '¿En qué eres naturalmente bueno?',
    options: [
      { en: 'Problem Solving', es: 'Resolución de Problemas' }, { en: 'Communication', es: 'Comunicación' },
      { en: 'Leadership', es: 'Liderazgo' }, { en: 'Creativity', es: 'Creatividad' },
      { en: 'Organization', es: 'Organización' }, { en: 'Negotiation', es: 'Negociación' },
      { en: 'Teaching', es: 'Enseñanza' }, { en: 'Adaptability', es: 'Adaptabilidad' },
      { en: 'Critical Thinking', es: 'Pensamiento Crítico' }, { en: 'Teamwork', es: 'Trabajo en Equipo' },
      { en: 'Empathy', es: 'Empatía' }, { en: 'Time Management', es: 'Gestión del Tiempo' },
    ],
  },
  {
    key: 'socials',
    titleEn: 'Connect your social networks',
    titleEs: 'Conecta tus redes sociales',
    subtitleEn: 'So Visnity AI can understand your digital signals and match you with better missions.',
    subtitleEs: 'Para que Visnity AI entienda tus señales digitales y te conecte con mejores misiones.',
    options: [],
  },
];

interface ExplorerOnboardingProps {
  onComplete: () => void;
}

const ExplorerOnboarding = ({ onComplete }: ExplorerOnboardingProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({
    interests: [], skills: [], hobbies: [], education: [], talents: [],
  });
  const [socials, setSocials] = useState<Record<string, string>>({
    instagram: '', twitter: '', linkedin: '', tiktok: '', github: '',
  });
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isSocialsStep = current.key === 'socials';

  const toggle = (option: string) => {
    setSelections(prev => {
      const arr = prev[current.key] || [];
      return {
        ...prev,
        [current.key]: arr.includes(option) ? arr.filter(o => o !== option) : [...arr, option],
      };
    });
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const socialLinks = Object.fromEntries(
        Object.entries(socials).filter(([, v]) => v.trim())
      );
      const { error } = await supabase
        .from('profiles')
        .update({
          interests: selections.interests,
          skills: selections.skills,
          hobbies: selections.hobbies,
          education: selections.education,
          talents: selections.talents,
          social_links: socialLinks,
          onboarding_completed: true,
        } as any)
        .eq('id', user.id);
      if (error) throw error;
      toast.success(language === 'en' ? 'Profile updated!' : '¡Perfil actualizado!');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const socialFields = [
    { key: 'instagram', icon: Instagram, label: 'Instagram', placeholder: '@username' },
    { key: 'twitter', icon: Twitter, label: 'X (Twitter)', placeholder: '@username' },
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', placeholder: 'linkedin.com/in/...' },
    { key: 'tiktok', icon: Sparkles, label: 'TikTok', placeholder: '@username' },
    { key: 'github', icon: Github, label: 'GitHub', placeholder: 'github.com/...' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <div className="text-center mb-6">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-heading font-bold">
                {language === 'en' ? current.titleEn : current.titleEs}
              </h2>
              {isSocialsStep && (
                <p className="text-sm text-muted-foreground font-body mt-2">
                  {language === 'en' ? current.subtitleEn : current.subtitleEs}
                </p>
              )}
              {!isSocialsStep && (
                <p className="text-sm text-muted-foreground font-body mt-1">
                  {language === 'en' ? 'Select all that apply' : 'Selecciona todas las que apliquen'}
                </p>
              )}
            </div>

            {!isSocialsStep ? (
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {current.options.map(option => {
                  const optionKey = typeof option === 'string' ? option : option.en;
                  const optionLabel = typeof option === 'string' ? option : (language === 'en' ? option.en : option.es);
                  const selected = (selections[current.key] || []).includes(optionKey);
                  return (
                    <button
                      key={optionKey}
                      type="button"
                      onClick={() => toggle(optionKey)}
                      className={`px-4 py-2 rounded-full text-sm font-heading font-medium transition-all border ${
                        selected
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {optionLabel}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {socialFields.map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <field.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder={field.placeholder}
                      value={socials[field.key]}
                      onChange={e => setSocials(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center font-body pt-2">
                  {language === 'en'
                    ? 'Optional — you can add these later from your profile.'
                    : 'Opcional — puedes agregar esto después desde tu perfil.'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="gap-1 font-heading"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'en' ? 'Back' : 'Atrás'}
          </Button>

          {isLast ? (
            <Button onClick={handleFinish} disabled={saving} className="gap-1 font-heading">
              {saving
                ? (language === 'en' ? 'Saving...' : 'Guardando...')
                : (language === 'en' ? 'Finish' : 'Finalizar')}
              <Sparkles className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setStep(s => s + 1)} className="gap-1 font-heading">
              {language === 'en' ? 'Next' : 'Siguiente'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorerOnboarding;
