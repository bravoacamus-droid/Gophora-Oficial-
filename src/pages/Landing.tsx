import { Zap, ArrowRight, Target, Cpu, Users, Globe, Rocket, Clock, TrendingUp, LayoutGrid, Calendar } from 'lucide-react';
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
    { icon: Clock, title: t('landing.benefits.speed.title'), desc: t('landing.benefits.speed.desc') },
    { icon: TrendingUp, title: t('landing.benefits.scale.title'), desc: t('landing.benefits.scale.desc') },
    { icon: LayoutGrid, title: t('landing.benefits.structure.title'), desc: t('landing.benefits.structure.desc') },
    { icon: Globe, title: t('landing.benefits.global.title'), desc: t('landing.benefits.global.desc') },
  ];

  const steps = [
    { icon: Target, num: '01', title: t('landing.steps.1.title'), desc: t('landing.steps.1.desc') },
    { icon: Cpu, num: '02', title: t('landing.steps.2.title'), desc: t('landing.steps.2.desc') },
    { icon: Users, num: '03', title: t('landing.steps.3.title'), desc: t('landing.steps.3.desc') },
    { icon: Zap, num: '04', title: t('landing.steps.4.title'), desc: t('landing.steps.4.desc') },
  ];

  const tractionStats = [
    { value: '$50K', label: t('landing.traction.processed') },
    { value: '$5K', label: t('landing.traction.revenue') },
    { value: '20', label: t('landing.traction.projects') },
    { value: '∞', label: t('landing.traction.agencies') },
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
            {t('landing.hero.title1')}{' '}
            <span className="text-gradient-primary italic">{t('landing.hero.title2')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 font-body leading-relaxed"
          >
            {t('landing.hero.subtitle')}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-primary font-heading font-semibold text-sm mb-10"
          >
            {t('landing.hero.tagline')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register">
              <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2">
                {t('landing.hero.cta_start')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="hero-outline"
              size="lg"
              className="w-full sm:w-auto gap-2"
              onClick={() => window.open('https://calendar.app.google/KHFmF25rhPbACBHK7', '_blank')}
            >
              {t('landing.hero.cta_demo')} <Calendar className="h-4 w-4" />
            </Button>
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
            {t('landing.gap.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-heading font-bold mb-8">
            {t('landing.gap.title')}
          </motion.h2>
          <motion.div variants={fadeUp} custom={2} className="space-y-6 text-lg md:text-xl font-body text-muted-foreground leading-relaxed">
            <p><span className="text-foreground font-semibold">{t('landing.gap.ideas')}</span><br />{t('landing.gap.execution')}</p>
            <p>{t('landing.gap.teams')}</p>
            <p className="text-base">
              {t('landing.gap.meetings')}<br />
              {t('landing.gap.freelancers')}<br />
              {t('landing.gap.projects')}
            </p>
            <p className="text-foreground font-heading font-bold text-xl md:text-2xl pt-4">
              {t('landing.gap.not_talent')}<br />
              <span className="text-primary">{t('landing.gap.coordination')}</span>
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
            {t('landing.shift.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-heading font-bold mb-12 text-center">
            {t('landing.shift.title')}
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div variants={scaleIn} custom={2} className="rounded-xl border border-border/50 bg-background p-8">
              <p className="text-xs font-heading font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-4">{t('landing.shift.old_label')}</p>
              <p className="text-muted-foreground font-body leading-relaxed">
                {t('landing.shift.old_desc')} <span className="text-destructive font-semibold">{t('landing.shift.old_result')}</span>
              </p>
            </motion.div>
            <motion.div variants={scaleIn} custom={3} className="rounded-xl border border-primary/30 bg-primary/5 p-8">
              <p className="text-xs font-heading font-semibold tracking-[0.2em] text-primary uppercase mb-4">{t('landing.shift.new_label')}</p>
              <p className="text-foreground font-body leading-relaxed">
                {t('landing.shift.new_desc')} <span className="text-primary font-semibold">{t('landing.shift.new_result')}</span>
              </p>
            </motion.div>
          </div>
          <motion.p variants={fadeUp} custom={4} className="text-center mt-8 text-lg font-heading font-bold text-primary">
            {t('landing.shift.powers')}
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
            {t('landing.product.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-heading font-bold mb-6">
            {t('landing.product.title')}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground font-body leading-relaxed mb-4">
            {t('landing.product.desc')}
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-muted-foreground font-body">
            {t('landing.product.no_hiring')}<br />{t('landing.product.no_chaos')}
          </motion.p>
          <motion.p variants={fadeUp} custom={4} className="text-xl font-heading font-bold text-primary mt-6">
            {t('landing.product.outcome')}
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
            {t('landing.how.badge')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-heading font-bold text-center mb-16"
          >
            {t('landing.how.title')}
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
            {t('landing.benefits.badge')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-heading font-bold text-center mb-12"
          >
            {t('landing.benefits.title')}
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
            {t('landing.example.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
            {t('landing.example.title')}
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div variants={scaleIn} custom={2} className="rounded-xl border border-border/50 bg-background p-8">
              <p className="text-xs font-heading font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-4">{t('landing.example.traditional_label')}</p>
              <ul className="space-y-2 text-sm text-muted-foreground font-body">
                <li className="flex items-center gap-2"><span>•</span> {t('landing.example.trad1')}</li>
                <li className="flex items-center gap-2"><span>•</span> {t('landing.example.trad2')}</li>
                <li className="flex items-center gap-2"><span>•</span> {t('landing.example.trad3')}</li>
                <li className="flex items-center gap-2"><span>•</span> {t('landing.example.trad4')}</li>
              </ul>
            </motion.div>
            <motion.div variants={scaleIn} custom={3} className="rounded-xl border border-primary/30 bg-primary/5 p-8">
              <p className="text-xs font-heading font-semibold tracking-[0.2em] text-primary uppercase mb-4">{t('landing.example.gophora_label')}</p>
              <p className="text-sm text-foreground font-body mb-3">{t('landing.example.gophora1')}</p>
              <p className="text-sm text-foreground font-body font-semibold mb-3">{t('landing.example.gophora2')}</p>
              <p className="text-primary font-heading font-bold text-lg">{t('landing.example.gophora3')}</p>
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
            {t('landing.traction.badge')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-2xl md:text-3xl font-heading font-bold text-center mb-2">
            {t('landing.traction.title')}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground text-center mb-10 font-body">{t('landing.traction.since')}</motion.p>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={staggerContainer}
          >
            {tractionStats.map((stat, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="text-center">
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
            {t('landing.why.badge')}
          </motion.p>
          <motion.p variants={fadeUp} custom={1} className="text-xl md:text-2xl text-muted-foreground font-body mb-4">
            {t('landing.why.organize')}
          </motion.p>
          <motion.h2 variants={fadeUp} custom={2} className="text-3xl md:text-5xl font-heading font-bold mb-4">
            GOPHORA <span className="text-primary">{t('landing.why.completes')}</span> {t('landing.why.work')}
          </motion.h2>
          <motion.p variants={fadeUp} custom={3} className="text-lg text-muted-foreground font-body">
            {t('landing.why.difference')}
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
            {t('landing.future.badge')}
          </motion.p>
          <motion.p variants={fadeUp} custom={1} className="text-xl md:text-2xl font-body text-muted-foreground leading-relaxed mb-6">
            {t('landing.future.line1')}
          </motion.p>
          <motion.p variants={fadeUp} custom={2} className="text-xl md:text-2xl font-heading font-bold text-foreground mb-6">
            {t('landing.future.line2_pre')} <span className="text-primary">{t('landing.future.line2_highlight')}</span>
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-muted-foreground font-body">
            {t('landing.future.line3')}
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
            {t('landing.cta.title')}
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground font-body mb-10">
            {t('landing.cta.desc')}
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2">
                {t('landing.cta.start')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://calendar.app.google/KHFmF25rhPbACBHK7" target="_blank" rel="noopener noreferrer">
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto gap-2">
                {t('landing.cta.demo')} <Calendar className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={gophoraLogo} alt="GOPHORA" className="h-6 dark:invert" />
              <span className="text-xs text-muted-foreground font-body">{t('landing.footer.tagline')}</span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-body text-muted-foreground">
              <Link to="/about" className="hover:text-primary transition-colors">{t('nav.about')}</Link>
              <Link to="/faq" className="hover:text-primary transition-colors">{t('nav.faq')}</Link>
              <Link to="/organizations" className="hover:text-primary transition-colors">{t('nav.organizations')}</Link>
            </nav>
            <p className="text-sm text-muted-foreground font-body">© 2026 GOPHORA. {t('landing.footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
