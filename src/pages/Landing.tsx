import { Zap, ArrowRight, Target, Cpu, Users, Globe, Rocket, Clock, TrendingUp, LayoutGrid, Sparkles, CheckCircle, BarChart3, Building2, Calendar } from 'lucide-react';
import gophoraLogo from '@/assets/gophora-logo.png';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';

const ease: Easing = [0.25, 0.1, 0.25, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.4, delay: i * 0.08, ease },
  }),
};

const Landing = () => {
  const { t } = useLanguage();

  const benefits = [
    { icon: Clock, title: 'Faster execution', desc: 'Projects completed in days, not weeks.' },
    { icon: TrendingUp, title: 'Scalable operations', desc: 'Handle more work without increasing payroll.' },
    { icon: LayoutGrid, title: 'Structured delivery', desc: 'Clear outputs. Clear accountability.' },
    { icon: Globe, title: 'Global talent activation', desc: 'Access specialized execution instantly.' },
  ];

  const steps = [
    { icon: Target, num: '01', title: 'Submit the outcome', desc: 'Describe what needs to be done.' },
    { icon: Cpu, num: '02', title: 'Missions are generated', desc: 'Our system decomposes projects into executable units.' },
    { icon: Users, num: '03', title: 'Execution begins instantly', desc: 'Specialized talent completes missions with defined deliverables.' },
    { icon: Zap, num: '04', title: 'Results delivered', desc: 'Most projects complete in under 72 hours.' },
  ];

  const tractionStats = [
    { value: '$50K', label: 'Services processed' },
    { value: '$5K', label: 'Revenue generated' },
    { value: '20', label: 'Projects completed' },
    { value: '∞', label: 'Agencies actively using GOPHORA' },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden py-24 md:py-40">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="container relative z-10 text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight leading-[1.05] mb-6"
          >
            Execution at the speed of{' '}
            <span className="text-gradient-primary italic">intent</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 font-body leading-relaxed"
          >
            Turn complex projects into structured missions and get measurable outcomes in under 72 hours.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-primary font-heading font-semibold text-sm mb-10"
          >
            GOPHORA is the execution layer for modern companies.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register">
              <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2">
                Start executing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto gap-2">
                Book a demo <Calendar className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== THE EXECUTION GAP ========== */}
      <section className="py-24 bg-card/50">
        <motion.div
          className="container max-w-3xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3">
            Category Statement
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-heading font-bold mb-8">
            The execution gap
          </motion.h2>
          <motion.div variants={fadeUp} custom={2} className="space-y-6 text-lg md:text-xl font-body text-muted-foreground leading-relaxed">
            <p><span className="text-foreground font-semibold">Ideas move instantly.</span><br />Execution doesn't.</p>
            <p>Teams spend weeks coordinating work that should take days.</p>
            <p className="text-base">
              Meetings multiply.<br />
              Freelancers fragment.<br />
              Projects stall.
            </p>
            <p className="text-foreground font-heading font-bold text-xl md:text-2xl pt-4">
              The problem isn't talent.<br />
              <span className="text-primary">It's coordination.</span>
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== WORK IS CHANGING ========== */}
      <section className="py-24">
        <motion.div
          className="container max-w-4xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3 text-center">
            The Shift
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-heading font-bold mb-12 text-center">
            Work is changing
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              variants={scaleIn} custom={2}
              className="rounded-xl border border-border/50 bg-background p-8"
            >
              <p className="text-xs font-heading font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-4">The old model</p>
              <p className="text-muted-foreground font-body leading-relaxed">
                Hire more people → manage more tasks → <span className="text-destructive font-semibold">move slowly.</span>
              </p>
            </motion.div>
            <motion.div
              variants={scaleIn} custom={3}
              className="rounded-xl border border-primary/30 bg-primary/5 p-8"
            >
              <p className="text-xs font-heading font-semibold tracking-[0.2em] text-primary uppercase mb-4">The new model</p>
              <p className="text-foreground font-body leading-relaxed">
                Define outcomes → activate talent → <span className="text-primary font-semibold">execute instantly.</span>
              </p>
            </motion.div>
          </div>
          <motion.p variants={fadeUp} custom={4} className="text-center mt-8 text-lg font-heading font-bold text-primary">
            GOPHORA powers this shift.
          </motion.p>
        </motion.div>
      </section>

      {/* ========== PRODUCT ========== */}
      <section className="py-24 bg-card/50">
        <motion.div
          className="container max-w-3xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3">
            Product
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-heading font-bold mb-6">
            From project to outcome
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground font-body leading-relaxed mb-4">
            GOPHORA converts complex work into structured missions and orchestrates execution across global talent.
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-muted-foreground font-body">
            No hiring.<br />No coordination chaos.
          </motion.p>
          <motion.p variants={fadeUp} custom={4} className="text-xl font-heading font-bold text-primary mt-6">
            Just completed outcomes.
          </motion.p>
        </motion.div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-24">
        <div className="container max-w-5xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3 text-center"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-heading font-bold text-center mb-16"
          >
            Four steps to execution
          </motion.h2>
          <motion.div
            className="grid md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="relative group">
                {i < 3 && <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary/50 to-transparent z-0" />}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.1, boxShadow: '0 0 25px hsl(20 100% 50% / 0.3)' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6"
                  >
                    <step.icon className="h-8 w-8 text-primary" />
                  </motion.div>
                  <div className="text-xs font-heading font-bold text-primary mb-2 tracking-widest">{step.num}</div>
                  <h3 className="text-lg font-heading font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== BENEFITS ========== */}
      <section className="py-24 bg-card/50">
        <div className="container max-w-5xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3 text-center"
          >
            Product Benefits
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-heading font-bold text-center mb-12"
          >
            Why companies choose GOPHORA
          </motion.h2>
          <motion.div
            className="grid sm:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                custom={i}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="rounded-xl border border-border/50 bg-background p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== REAL EXAMPLE ========== */}
      <section className="py-24">
        <motion.div
          className="container max-w-4xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3 text-center">
            Real Example
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
            Marketing campaign execution
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div variants={scaleIn} custom={2} className="rounded-xl border border-border/50 bg-background p-8">
              <p className="text-xs font-heading font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-4">Traditional agency workflow</p>
              <ul className="space-y-2 text-sm text-muted-foreground font-body">
                <li className="flex items-center gap-2"><span className="text-muted-foreground">•</span> Recruit freelancers</li>
                <li className="flex items-center gap-2"><span className="text-muted-foreground">•</span> Coordinate tasks</li>
                <li className="flex items-center gap-2"><span className="text-muted-foreground">•</span> Review iterations</li>
                <li className="flex items-center gap-2"><span className="text-muted-foreground">•</span> Launch in weeks</li>
              </ul>
            </motion.div>
            <motion.div variants={scaleIn} custom={3} className="rounded-xl border border-primary/30 bg-primary/5 p-8">
              <p className="text-xs font-heading font-semibold tracking-[0.2em] text-primary uppercase mb-4">Using GOPHORA</p>
              <p className="text-sm text-foreground font-body mb-3">Project decomposed into missions.</p>
              <p className="text-sm text-foreground font-body font-semibold mb-3">Design. Copy. Ads. Analytics.</p>
              <p className="text-primary font-heading font-bold text-lg">Completed in 72 hours.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========== TRACTION ========== */}
      <section className="border-y border-border/50 bg-card/50">
        <motion.div
          className="container max-w-4xl py-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3 text-center">
            Traction
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-2xl md:text-3xl font-heading font-bold text-center mb-2">
            Execution infrastructure is already working.
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground text-center mb-10 font-body">Since January 2026</motion.p>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={staggerContainer}
          >
            {tractionStats.map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-heading font-black text-primary">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground font-body mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ========== WHY GOPHORA ========== */}
      <section className="py-24">
        <motion.div
          className="container max-w-3xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3">
            Why GOPHORA
          </motion.p>
          <motion.p variants={fadeUp} custom={1} className="text-xl md:text-2xl text-muted-foreground font-body mb-4">
            Most platforms organize work.
          </motion.p>
          <motion.h2 variants={fadeUp} custom={2} className="text-3xl md:text-5xl font-heading font-bold mb-4">
            GOPHORA <span className="text-primary">completes</span> work.
          </motion.h2>
          <motion.p variants={fadeUp} custom={3} className="text-lg text-muted-foreground font-body">
            That difference changes everything.
          </motion.p>
        </motion.div>
      </section>

      {/* ========== THE FUTURE ========== */}
      <section className="py-24 bg-card/50">
        <motion.div
          className="container max-w-3xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3">
            The Future
          </motion.p>
          <motion.p variants={fadeUp} custom={1} className="text-xl md:text-2xl font-body text-muted-foreground leading-relaxed mb-6">
            The next generation of companies won't scale by hiring more people.
          </motion.p>
          <motion.p variants={fadeUp} custom={2} className="text-xl md:text-2xl font-heading font-bold text-foreground mb-6">
            They will scale by <span className="text-primary">activating execution.</span>
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-muted-foreground font-body">
            GOPHORA is building the infrastructure that makes this possible.
          </motion.p>
        </motion.div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-24 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5">
        <motion.div
          className="container max-w-3xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-heading font-bold mb-6">
            Start executing faster
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground font-body mb-10">
            Submit your first project and experience structured execution.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2">
                Start your first mission <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto gap-2">
                Book a demo <Calendar className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={gophoraLogo} alt="GOPHORA" className="h-6 dark:invert" />
              <span className="text-xs text-muted-foreground font-body">Execution infrastructure for the modern economy</span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-body text-muted-foreground">
              <Link to="/about" className="hover:text-primary transition-colors">{t('nav.about')}</Link>
              <Link to="/faq" className="hover:text-primary transition-colors">{t('nav.faq')}</Link>
              <Link to="/organizations" className="hover:text-primary transition-colors">{t('nav.organizations')}</Link>
            </nav>
            <p className="text-sm text-muted-foreground font-body">© 2026 GOPHORA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
