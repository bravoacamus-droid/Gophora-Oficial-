import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Play, Rocket, GraduationCap, Users, Zap, Video, BookOpen, UserPlus, X } from 'lucide-react';
import gophoraLogo from '@/assets/gophora-logo.png';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveProject {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  deadline: string | null;
  video_link: string | null;
  resource_link: string | null;
}

// 72h countdown from project creation. If deadline set, use it instead.
const getCountdown = (project: LiveProject) => {
  const target = project.deadline
    ? new Date(project.deadline).getTime()
    : new Date(project.created_at).getTime() + 72 * 60 * 60 * 1000;
  const diff = target - Date.now();
  if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  return { h, m, s, expired: false };
};

const ProjectCard = ({ project, onAction, isEs }: { project: LiveProject; onAction: () => void; isEs: boolean }) => {
  const [time, setTime] = useState(getCountdown(project));

  useEffect(() => {
    const t = setInterval(() => setTime(getCountdown(project)), 1000);
    return () => clearInterval(t);
  }, [project]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      className="relative rounded-2xl border border-primary/20 bg-card p-6 hover:border-primary/50 transition-all hover:shadow-[0_0_30px_rgba(251,113,23,0.15)]"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1.5 text-xs font-heading font-semibold text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {isEs ? 'EN EJECUCIÓN' : 'RUNNING'}
        </span>
        {project.category && (
          <span className="text-xs font-body text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
            {project.category}
          </span>
        )}
      </div>
      <h3 className="text-lg font-heading font-bold mb-2 line-clamp-2">{project.title}</h3>
      {project.description && (
        <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Clock className="h-4 w-4 text-primary" />
        <div className="flex-1">
          <div className="text-xs text-muted-foreground font-body">{isEs ? 'Entrega en' : 'Delivery in'}</div>
          <div className="font-heading font-bold text-primary tabular-nums">
            {time.expired
              ? (isEs ? 'ENTREGADO' : 'DELIVERED')
              : `${String(time.h).padStart(2, '0')}h ${String(time.m).padStart(2, '0')}m ${String(time.s).padStart(2, '0')}s`}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={onAction}>
          <Video className="h-3 w-3" /> {isEs ? 'Ver en vivo' : 'Watch live'}
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={onAction}>
          <Play className="h-3 w-3" /> {isEs ? 'Grabaciones' : 'Recordings'}
        </Button>
        <Button size="sm" className="text-xs gap-1 bg-primary hover:bg-primary/90 text-white" onClick={onAction}>
          <UserPlus className="h-3 w-3" /> {isEs ? 'Participar' : 'Join'}
        </Button>
      </div>
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [projects, setProjects] = useState<LiveProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, title, description, category, created_at, deadline, video_link, resource_link')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (!error && data) setProjects(data as LiveProject[]);
        setLoading(false);
      });
  }, []);

  const handleProjectAction = () => setShowRegisterPrompt(true);

  const scrollToProjects = () => {
    document.getElementById('proyectos-en-vivo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const steps = isEs
    ? [
        { icon: Rocket, title: 'Entra y explora', desc: 'Mira proyectos reales ejecutándose ahora, sin necesidad de registrarte.' },
        { icon: UserPlus, title: 'Únete gratis', desc: 'Regístrate en segundos y recibe misiones recomendadas para ti.' },
        { icon: Zap, title: 'Ejecuta con IA', desc: 'Completa trabajos con inteligencia artificial mientras aprendes en vivo.' },
        { icon: Users, title: 'Gana desde el día uno', desc: 'Recibe pago al aprobar la entrega. Simple, rápido, real.' },
      ]
    : [
        { icon: Rocket, title: 'Enter and explore', desc: 'See real projects running right now, no sign-up needed.' },
        { icon: UserPlus, title: 'Join free', desc: 'Sign up in seconds and receive missions tailored for you.' },
        { icon: Zap, title: 'Execute with AI', desc: 'Complete jobs using artificial intelligence while you learn live.' },
        { icon: Users, title: 'Earn from day one', desc: 'Get paid when your delivery is approved. Simple, fast, real.' },
      ];

  const trainFeatures = isEs
    ? [
        { icon: Video, title: 'Webinars en vivo', desc: 'Ve a tutores ejecutando proyectos en tiempo real con las herramientas IA más actuales.' },
        { icon: Play, title: 'Grabaciones de misiones', desc: 'Accede a la biblioteca completa de proyectos reales ya ejecutados.' },
        { icon: GraduationCap, title: 'Misiones de aprendizaje', desc: 'Entrena con ejercicios prácticos y desbloquea niveles para acceder a mejores misiones.' },
      ]
    : [
        { icon: Video, title: 'Live webinars', desc: 'Watch tutors execute real-time projects with the latest AI tools.' },
        { icon: Play, title: 'Mission recordings', desc: 'Access the full library of real projects already executed.' },
        { icon: GraduationCap, title: 'Learning missions', desc: 'Train with practical exercises and unlock levels to access better missions.' },
      ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="container relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-heading font-semibold tracking-wider uppercase text-primary">
              {isEs ? 'Proyectos ejecutándose ahora' : 'Projects running right now'}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight leading-[1.05] mb-6"
          >
            {isEs ? (
              <>
                Completa trabajos en menos de{' '}
                <span className="text-gradient-primary italic">72 horas</span>{' '}
                con inteligencia artificial
              </>
            ) : (
              <>
                Complete jobs in under{' '}
                <span className="text-gradient-primary italic">72 hours</span>{' '}
                with artificial intelligence
              </>
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body leading-relaxed"
          >
            {isEs
              ? 'Aprende viendo proyectos reales en vivo y empieza a generar ingresos desde el primer día.'
              : 'Learn by watching real projects live and start earning from day one.'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={scrollToProjects}
              className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-white min-w-[220px]"
            >
              <Video className="h-4 w-4" /> {isEs ? 'Ver proyectos en vivo' : 'See live projects'}
            </Button>
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto gap-2 border-primary text-primary hover:bg-primary/5 min-w-[220px]"
              >
                {isEs ? 'Unirme gratis' : 'Join free'} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== PROYECTOS EJECUTÁNDOSE AHORA ========== */}
      <section id="proyectos-en-vivo" className="py-24 bg-card/30">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3">
              {isEs ? 'En vivo' : 'Live'}
            </p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              {isEs ? 'Proyectos ejecutándose ahora' : 'Projects running right now'}
            </h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              {isEs
                ? 'Mira en vivo cómo se completan trabajos reales con IA. Únete al evento, ve la grabación o aplica para participar.'
                : 'Watch real AI-powered jobs get completed live. Join the event, watch the recording, or apply to participate.'}
            </p>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-card p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-16 bg-muted rounded mb-4" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/50">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-body">
                {isEs ? (
                  <>
                    No hay proyectos activos en este momento.{' '}
                    <Link to="/register" className="text-primary font-semibold hover:underline">Únete gratis</Link>
                    {' '}y te avisamos cuando haya uno nuevo.
                  </>
                ) : (
                  <>
                    No active projects right now.{' '}
                    <Link to="/register" className="text-primary font-semibold hover:underline">Join free</Link>
                    {' '}and we'll let you know when a new one drops.
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(p => (
                <ProjectCard key={p.id} project={p} onAction={handleProjectAction} isEs={isEs} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== CÓMO FUNCIONA ========== */}
      <section className="py-24">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3">
              {isEs ? 'Cómo funciona' : 'How it works'}
            </p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold">
              {isEs ? 'Del registro al pago en 72 horas' : 'From sign-up to payment in 72 hours'}
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {i < 3 && <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary/50 to-transparent z-0" />}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-xs font-heading font-bold text-primary mb-2 tracking-widest">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-lg font-heading font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CAPACÍTATE PARA TRABAJAR ========== */}
      <section className="py-24 bg-card/30">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3">
              {isEs ? 'Educación' : 'Education'}
            </p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              {isEs ? 'Capacítate para trabajar' : 'Train to work'}
            </h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              {isEs
                ? 'Aprende haciendo. Misiones de aprendizaje, webinars en vivo y grabaciones de proyectos reales ejecutados con IA.'
                : 'Learn by doing. Learning missions, live webinars and recordings of real AI-powered projects.'}
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {trainFeatures.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border/50 bg-background p-6 hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-24 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container max-w-3xl text-center"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
            {isEs ? 'Empieza hoy. Gana esta semana.' : 'Start today. Earn this week.'}
          </h2>
          <p className="text-lg text-muted-foreground font-body mb-10">
            {isEs
              ? 'Únete gratis a GOPHORA y recibe tu primera misión recomendada.'
              : 'Join GOPHORA free and get your first recommended mission.'}
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-white min-w-[220px]">
              {isEs ? 'Unirme gratis' : 'Join free'} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={gophoraLogo} alt="GOPHORA" className="h-6 dark:invert" />
              <span className="text-xs text-muted-foreground font-body">
                {isEs ? 'Trabajo + aprendizaje con IA' : 'Work + learning with AI'}
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-body text-muted-foreground">
              <Link to="/about" className="hover:text-primary transition-colors">{isEs ? 'Sobre nosotros' : 'About us'}</Link>
              <Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link>
              <Link to="/organizations" className="hover:text-primary transition-colors">{isEs ? 'Organizaciones' : 'Organizations'}</Link>
            </nav>
            <p className="text-sm text-muted-foreground font-body">© 2026 GOPHORA.</p>
          </div>
        </div>
      </footer>

      {/* ========== REGISTER PROMPT MODAL (tipo Uber) ========== */}
      <AnimatePresence>
        {showRegisterPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowRegisterPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-card border border-border"
              onClick={e => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRegisterPrompt(false)}
                className="absolute top-3 right-3 z-10"
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-heading font-bold mb-3">
                  {isEs ? 'Regístrate para participar' : 'Sign up to participate'}
                </h3>
                <p className="text-muted-foreground font-body mb-6">
                  {isEs
                    ? 'Únete gratis a GOPHORA para acceder al evento en vivo, grabaciones y aplicar a este tipo de misiones.'
                    : 'Join GOPHORA free to access the live event, recordings, and apply for these missions.'}
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => navigate('/register')}
                  >
                    {isEs ? 'Unirme gratis' : 'Join free'} <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    {isEs ? 'Ya tengo cuenta' : 'I already have an account'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
