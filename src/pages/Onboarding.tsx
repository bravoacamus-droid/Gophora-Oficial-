import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
    const { user, accountType, refreshProfile, updateAccountType } = useAuth();
    const navigate = useNavigate();
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
        } catch (err) {
            console.error(err);
            toast.error('Error al procesar el onboarding');
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
                    user_id: user?.id,
                    company_name: companyName,
                    industry: industry,
                    budget_monthly: parseFloat(budget) || 0
                }) as any);

            toast.success('¡Dashboard personalizado listo!');
            await refreshProfile();
            navigate('/company');
        } catch (err) {
            console.error(err);
            toast.error('Error al procesar el onboarding');
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
                                <h1 className="text-3xl font-heading font-black">Bienvenido a GOPHORA</h1>
                                <p className="text-muted-foreground font-body">Elige cómo quieres usar la plataforma</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleSelectRole('explorer')}
                                    className="p-6 rounded-2xl border-2 border-border hover:border-primary transition-all text-left group"
                                >
                                    <User className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-heading font-bold text-lg">Soy Explorer</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Quiero completar misiones y ganar dinero con mis habilidades.</p>
                                </button>
                                <button
                                    onClick={() => handleSelectRole('company')}
                                    className="p-6 rounded-2xl border-2 border-border hover:border-primary transition-all text-left group"
                                >
                                    <Building2 className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-heading font-bold text-lg">Soy Empresa</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Quiero delegar tareas y escalar mi negocio con talento verificado.</p>
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
                                <Sparkles className="h-3.5 w-3.5" /> Onboarding Inteligente
                            </div>
                            <h1 className="text-3xl md:text-4xl font-heading font-black">
                                {accountType === 'explorer' ? '¡Bienvenido, Explorer!' : '¡Bienvenida, Empresa!'}
                            </h1>
                            <p className="text-muted-foreground font-body">
                                Vamos a configurar tu perfil usando IA para que empieces a {accountType === 'explorer' ? 'ganar' : 'crecer'} hoy mismo.
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
                                    ¿Equivocado? Cambiar de rol o tipo de cuenta
                                </Button>
                            </div>
                            <Button size="lg" className="w-full font-heading tracking-wide h-14 text-lg" onClick={nextStep}>
                                Comenzar Configuración <ArrowRight className="ml-2 h-5 w-5" />
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
                                    <Label className="text-xs uppercase tracking-widest font-heading">¿Qué sabes hacer? (Tus skills)</Label>
                                    <Textarea
                                        placeholder="Ej: Edición de video, Diseño UI, Redacción, React, Ventas..."
                                        value={skills}
                                        onChange={e => setSkills(e.target.value)}
                                        className="h-24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">¿Cuánto tiempo tienes al día?</Label>
                                    <Input
                                        type="number"
                                        placeholder="Horas por día (ej: 3)"
                                        value={availability}
                                        onChange={e => setAvailability(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">¿Cuál es tu objetivo?</Label>
                                    <Input
                                        placeholder="Ej: Ganar dinero rápido, Aprender nuevas skills..."
                                        value={objective}
                                        onChange={e => setObjective(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button disabled={!skills || loading} className="w-full font-heading tracking-wide h-14" onClick={handleExplorerOnboarding}>
                                {aiAnalyzing ? (
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 animate-spin" /> IA Generando Skill Passport...
                                    </span>
                                ) : (
                                    <>Generar mi Perfil <ArrowRight className="ml-2 h-5 w-5" /></>
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
                                    <Label className="text-xs uppercase tracking-widest font-heading">Nombre de la Empresa / Proyecto</Label>
                                    <Input
                                        placeholder="Ej: Gophora Tech"
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">Industria</Label>
                                    <Input
                                        placeholder="Ej: Marketing, Desarrollo, E-commerce..."
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">¿Qué misiones necesitas delegar?</Label>
                                    <Textarea
                                        placeholder="Ej: Crear contenido para redes, soporte técnico, prospección..."
                                        value={needs}
                                        onChange={e => setNeeds(e.target.value)}
                                        className="h-24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest font-heading">Presupuesto Mensual ($)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Ej: 1000"
                                        value={budget}
                                        onChange={e => setBudget(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button disabled={!companyName || loading} className="w-full font-heading tracking-wide h-14" onClick={handleCompanyOnboarding}>
                                {aiAnalyzing ? (
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 animate-spin" /> IA Diseñando tu Estrategia...
                                    </span>
                                ) : (
                                    <>Finalizar Configuración <ArrowRight className="ml-2 h-5 w-5" /></>
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
