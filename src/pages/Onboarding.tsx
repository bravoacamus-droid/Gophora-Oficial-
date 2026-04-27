import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getGroqCompletion } from '@/lib/groq';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Building2, User, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Onboarding = () => {
    const { user, accountType, refreshProfile, updateAccountType, isAdmin, onboardingCompleted } = useAuth();
    const { language } = useLanguage();
    const isEs = language === 'es';
    const navigate = useNavigate();

    useEffect(() => {
        if (isAdmin) {
            navigate('/admin');
        } else if (onboardingCompleted) {
            navigate(accountType === 'explorer' ? '/explorer' : '/company');
        }
    }, [isAdmin, onboardingCompleted, accountType, navigate]);
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);

    // Explorer State
    const [skills, setSkills] = useState('');
    const [availability, setAvailability] = useState('');
    const [objective, setObjective] = useState('');

    // Company State
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [needs, setNeeds] = useState('');
    const [budget, setBudget] = useState('');

    const nextStep = () => setStep(s => s + 1);

    const handleSelectRole = async (role: 'company' | 'explorer') => {
        setLoading(true);
        try {
            await updateAccountType(role);
            setStep(1);
        } catch (err) {
            toast.error('Error al seleccionar rol');
        } finally {
            setLoading(false);
        }
    };

    const handleExplorerOnboarding = async () => {
        setLoading(true);
        setAiAnalyzing(true);
        try {
            // AI analysis of skills and profile
            const prompt = `Analyze this explorer profile:
      Skills: ${skills}
      Availability: ${availability} hours/day
      Objective: ${objective}
      
      Generate a professional short bio and a list of 5 key skill keywords for their "Skill Passport".
      Format: Bio: [bio] | Skills: [s1, s2, s3, s4, s5]`;

            const aiResponse = await getGroqCompletion(prompt, "You are a GOPHORA Talent Specialist. Be professional and high-impact.");

            // Extract data
            const bio = aiResponse.split('|')[0]?.replace('Bio:', '').trim();
            const skillsArray = aiResponse.split('|')[1]?.replace('Skills:', '').split(',').map(s => s.trim()) || [];

            // 1. Create/Update public.profiles
            await supabase.from('profiles').upsert({
                id: user?.id,
                bio: bio,
                onboarding_completed: true,
                account_type: 'explorer'
            });

            // 2. Save to public.explorer_profiles
            const { data: expProfile, error: expError } = await (supabase
                .from('explorer_profiles' as any)
                .upsert({
                    id: user?.id,
                    user_id: user?.id,
                    name: user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0],
                    skills: skillsArray,
                    availability_hours: parseInt(availability) || 0
                })
                .select()
                .single() as any);

            if (expError) throw expError;

            // 3. Initialize Skill Passport
            await (supabase.from('skill_passports' as any).upsert({
                explorer_id: expProfile.id,
                skills_verified: []
            }) as any);

            toast.success('¡Skill Passport generado!');
            await refreshProfile();
            navigate('/explorer');
        } catch (err: any) {
            toast.error(err?.message || 'Error al procesar el onboarding');
        } finally {
            setLoading(false);
            setAiAnalyzing(false);
        }
    };

    const handleCompanyOnboarding = async () => {
        setLoading(true);
        setAiAnalyzing(true);
        try {
            // AI analysis
            const prompt = `Analyze this company profile:
      Name: ${companyName}
      Industry: ${industry}
      Needs: ${needs}
      Budget: $${budget}/month
      
      Suggest a specialized strategy for them to grow using GOPHORA explorers.
      Format: Strategy: [short sentence]`;

            const aiResponse = await getGroqCompletion(prompt, "You are a GOPHORA Business Consultant.");
            const strategy = aiResponse.replace('Strategy:', '').trim();

            // 1. Create/Update public.profiles
            await supabase.from('profiles').upsert({
                id: user?.id,
                bio: strategy,
                onboarding_completed: true,
                account_type: 'company'
            });

            // 2. Save to public.company_profiles
            await (supabase
                .from('company_profiles' as any)
                .upsert({
                    id: user?.id,
                    user_id: user?.id,
                    company_name: companyName,
                    industry: industry,
                    budget_monthly: parseFloat(budget) || 0
                }) as any);

            toast.success('¡Dashboard personalizado listo!');
            await refreshProfile();
            navigate('/company');
        } catch (err: any) {
            toast.error(err?.message || 'Error al procesar el onboarding');
        } finally {
            setLoading(false);
            setAiAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center bg-gradient-to-b from-background to-card/50">
            <div className="w-full max-w-xl">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8 text-center"
                        >
                            <div className="space-y-2">
                                <h1 className="text-3xl font-heading font-black">{isEs ? 'Bienvenido a GOPHORA' : 'Welcome to GOPHORA'}</h1>
                                <p className="text-muted-foreground font-body">{isEs ? '¿Qué quieres hacer en GOPHORA?' : 'What do you want to do on GOPHORA?'}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleSelectRole('explorer')}
                                    className="p-6 rounded-2xl border-2 border-border hover:border-primary transition-all text-left group"
                                >
                                    <User className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-heading font-bold text-lg">{isEs ? 'Aprender y ganar dinero' : 'Learn and earn money'}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{isEs ? 'Ejecuta misiones reales con IA, aprende viendo proyectos en vivo y genera ingresos.' : 'Run real AI missions, learn from live projects and earn income.'}</p>
                                </button>
                                <button
                                    onClick={() => handleSelectRole('company')}
                                    className="p-6 rounded-2xl border-2 border-border hover:border-primary transition-all text-left group"
                                >
                                    <Building2 className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-heading font-bold text-lg">{isEs ? 'Publicar un proyecto' : 'Publish a project'}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{isEs ? 'Completa trabajos en menos de 72 horas con una red de exploradores que usan IA.' : 'Get work done in under 72h with a network of explorers powered by AI.'}</p>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 text-center"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-heading font-semibold uppercase tracking-wider mb-2">
                                <Sparkles className="h-3.5 w-3.5" /> {isEs ? 'Onboarding Inteligente' : 'Smart Onboarding'}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-heading font-black">
                                {accountType === 'explorer'
                                    ? (isEs ? '¡Bienvenido, Explorer!' : 'Welcome, Explorer!')
                                    : (isEs ? '¡Bienvenida, Empresa!' : 'Welcome, Company!')}
                            </h1>
                            <p className="text-muted-foreground font-body">
                                {isEs
                                    ? `Vamos a configurar tu perfil usando IA para que empieces a ${accountType === 'explorer' ? 'ganar' : 'crecer'} hoy mismo.`
                                    : `Let's set up your profile with AI so you can start ${accountType === 'explorer' ? 'earning' : 'growing'} today.`}
                            </p>
                            <div className="flex flex-col gap-4 items-center py-6">
                                {accountType === 'explorer' ? (
                                    <User className="h-20 w-20 text-primary animate-pulse" />
                                ) : (
                                    <Building2 className="h-20 w-20 text-primary animate-pulse" />
                                )}
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setStep(0)}
                                    className="text-muted-foreground hover:text-primary text-xs uppercase tracking-tighter"
                                >
                                    {isEs ? '¿Equivocado? Cambiar de rol o tipo de cuenta' : 'Wrong choice? Change role or account type'}
                                </Button>
                            </div>
                            <Button size="lg" className="w-full font-heading tracking-wide h-14 text-lg" onClick={nextStep}>
                                {isEs ? 'Comenzar Configuración' : 'Start Setup'} <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </motion.div>
                    )}

                    {step === 2 && accountType === 'explorer' && (
                        <motion.div
                            key="explorer-step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">{isEs ? '¿Qué sabes hacer? (Tus skills)' : 'What can you do? (Your skills)'}</Label>
                                    <Textarea
                                        placeholder={isEs ? 'Ej: Edición de video, Diseño UI, Redacción, React, Ventas...' : 'E.g. Video editing, UI design, Copywriting, React, Sales...'}
                                        value={skills}
                                        onChange={e => setSkills(e.target.value)}
                                        className="h-24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">{isEs ? '¿Cuánto tiempo tienes al día?' : 'How much time per day?'}</Label>
                                    <Input
                                        type="number"
                                        placeholder={isEs ? 'Horas por día (ej: 3)' : 'Hours per day (e.g. 3)'}
                                        value={availability}
                                        onChange={e => setAvailability(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">{isEs ? '¿Cuál es tu objetivo?' : 'What is your goal?'}</Label>
                                    <Input
                                        placeholder={isEs ? 'Ej: Ganar dinero rápido, Aprender nuevas skills...' : 'E.g. Earn fast, learn new skills...'}
                                        value={objective}
                                        onChange={e => setObjective(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button disabled={!skills || loading} className="w-full font-heading tracking-wide h-14" onClick={handleExplorerOnboarding}>
                                {aiAnalyzing ? (
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 animate-spin" /> {isEs ? 'IA Generando Skill Passport...' : 'AI Generating Skill Passport...'}
                                    </span>
                                ) : (
                                    <>{isEs ? 'Generar mi Perfil' : 'Generate my Profile'} <ArrowRight className="ml-2 h-5 w-5" /></>
                                )}
                            </Button>
                        </motion.div>
                    )}

                    {step === 2 && accountType === 'company' && (
                        <motion.div
                            key="company-step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">{isEs ? 'Nombre de la Empresa / Proyecto' : 'Company / Project Name'}</Label>
                                    <Input
                                        placeholder={isEs ? 'Ej: Gophora Tech' : 'E.g. Gophora Tech'}
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">{isEs ? 'Industria' : 'Industry'}</Label>
                                    <Input
                                        placeholder={isEs ? 'Ej: Marketing, Desarrollo, E-commerce...' : 'E.g. Marketing, Development, E-commerce...'}
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">{isEs ? '¿Qué misiones necesitas delegar?' : 'Which missions do you need to delegate?'}</Label>
                                    <Textarea
                                        placeholder={isEs ? 'Ej: Crear contenido para redes, soporte técnico, prospección...' : 'E.g. Social media content, tech support, prospecting...'}
                                        value={needs}
                                        onChange={e => setNeeds(e.target.value)}
                                        className="h-24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">{isEs ? 'Presupuesto Mensual ($)' : 'Monthly Budget ($)'}</Label>
                                    <Input
                                        type="number"
                                        placeholder={isEs ? 'Ej: 1000' : 'E.g. 1000'}
                                        value={budget}
                                        onChange={e => setBudget(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button disabled={!companyName || loading} className="w-full font-heading tracking-wide h-14" onClick={handleCompanyOnboarding}>
                                {aiAnalyzing ? (
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 animate-spin" /> {isEs ? 'IA Diseñando tu Estrategia...' : 'AI Designing your Strategy...'}
                                    </span>
                                ) : (
                                    <>{isEs ? 'Finalizar Configuración' : 'Finish Setup'} <ArrowRight className="ml-2 h-5 w-5" /></>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
