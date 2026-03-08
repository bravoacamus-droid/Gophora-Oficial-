import { Zap, Users, BarChart3, ArrowRight, Target, Cpu, Globe, Rocket, ShieldAlert, Compass, Brain, Fingerprint, UserCheck, Eye, Navigation, Crosshair, Send, Shield, Star, Coins, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import gophoraLogo from '@/assets/gophora-logo.png';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Landing = () => {
  const { t } = useLanguage();

  const erosionCards = [
    { icon: Rocket, title: t('landing.erosion.initiative.title'), desc: t('landing.erosion.initiative.desc') },
    { icon: Target, title: t('landing.erosion.purpose.title'), desc: t('landing.erosion.purpose.desc') },
    { icon: Compass, title: t('landing.erosion.exploration.title'), desc: t('landing.erosion.exploration.desc') },
    { icon: Brain, title: t('landing.erosion.decision.title'), desc: t('landing.erosion.decision.desc') },
    { icon: Fingerprint, title: t('landing.erosion.identity.title'), desc: t('landing.erosion.identity.desc') },
    { icon: UserCheck, title: t('landing.erosion.agency.title'), desc: t('landing.erosion.agency.desc') },
  ];

  const visnitySteps = [
    { icon: Eye, title: 'Discovery', desc: t('landing.visnity.discovery') },
    { icon: Navigation, title: 'Direction', desc: t('landing.visnity.direction') },
    { icon: Crosshair, title: 'Decision', desc: t('landing.visnity.decision') },
    { icon: Send, title: 'Deployment', desc: t('landing.visnity.deployment') },
    { icon: Star, title: 'Destiny', desc: t('landing.visnity.destiny') },
    { icon: Shield, title: 'Defense', desc: t('landing.visnity.defense') },
  ];

  const comparisonRows = [
    { without: t('landing.compare.without1'), withAI: t('landing.compare.with1') },
    { without: t('landing.compare.without2'), withAI: t('landing.compare.with2') },
    { without: t('landing.compare.without3'), withAI: t('landing.compare.with3') },
    { without: t('landing.compare.without4'), withAI: t('landing.compare.with4') },
    { without: t('landing.compare.without5'), withAI: t('landing.compare.with5') },
    { without: t('landing.compare.without6'), withAI: t('landing.compare.with6') },
  ];

  const activationFeatures = [
    { icon: Zap, title: t('landing.activation.missions.title'), desc: t('landing.activation.missions.desc') },
    { icon: Sparkles, title: t('landing.activation.instant.title'), desc: t('landing.activation.instant.desc') },
    { icon: Brain, title: t('landing.activation.ai.title'), desc: t('landing.activation.ai.desc') },
    { icon: Coins, title: t('landing.activation.reputation.title'), desc: t('landing.activation.reputation.desc') },
  ];

  const stats = [
    { value: '500+', label: t('landing.stats.projects') },
    { value: '12K+', label: t('landing.stats.missions') },
    { value: '3K+', label: t('landing.stats.explorers') },
    { value: '10x', label: t('landing.stats.faster') },
  ];

  const steps = [
    { icon: Target, title: t('how.step1.title'), desc: t('how.step1.desc') },
    { icon: Cpu, title: t('how.step2.title'), desc: t('how.step2.desc') },
    { icon: Users, title: t('how.step3.title'), desc: t('how.step3.desc') },
    { icon: Zap, title: t('how.step4.title'), desc: t('how.step4.desc') },
  ];

  return (
    <div className="min-h-screen">
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden py-24 md:py-40">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-3xl" />
        <div className="container relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-8">
            <span className="text-xs font-heading font-semibold tracking-[0.2em] text-primary uppercase">
              {t('landing.badge')}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight leading-[1.05] mb-4">
            {t('landing.hero.line1')}
            <br />
            <span className="text-gradient-primary italic">{t('landing.hero.line2')}</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-muted-foreground mb-6">
            {t('landing.hero.line3')}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 font-body leading-relaxed">
            {t('landing.hero.desc')}
          </p>
          <p className="text-primary font-heading font-semibold text-sm mb-10">
            {t('landing.hero.choice')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2">
                {t('landing.hero.cta1')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto gap-2">
                {t('landing.hero.cta2')} <Globe className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== THE SILENT EROSION ========== */}
      <section className="py-24 bg-card/50">
        <div className="container max-w-5xl">
          <p className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase text-center mb-3">
            {t('landing.erosion.badge')}
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
            {t('landing.erosion.title')}
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12 font-body">
            {t('landing.erosion.desc')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {erosionCards.map((card, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-background p-6 hover:border-primary/30 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <card.icon className="h-6 w-6 text-destructive group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{card.desc}</p>
              </div>
            ))}
          </div>
          <blockquote className="text-center mt-12 text-lg md:text-xl italic text-muted-foreground font-body max-w-2xl mx-auto border-l-4 border-primary/30 pl-6">
            "{t('landing.erosion.quote')}"
          </blockquote>
        </div>
      </section>

      {/* ========== THE COUNTERFORCE ========== */}
      <section className="py-24">
        <div className="container max-w-4xl text-center">
          <p className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3">
            {t('landing.counterforce.badge')}
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            {t('landing.counterforce.title')}
          </h2>
          <p className="text-muted-foreground font-body mb-10 max-w-3xl mx-auto leading-relaxed">
            {t('landing.counterforce.desc')}
          </p>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 md:p-10">
            <h3 className="font-heading font-bold text-lg mb-6 text-primary">{t('landing.counterforce.axioms_title')}</h3>
            <ul className="space-y-4 text-left max-w-2xl mx-auto">
              {[1, 2, 3].map(i => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm font-body text-foreground/90">{t(`landing.counterforce.axiom${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ========== VISNITY AI ========== */}
      <section className="py-24 bg-card/50">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-heading font-semibold tracking-wider text-primary uppercase">Visnity AI</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold">{t('landing.visnity.title')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visnitySteps.map((step, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-background p-6 text-center hover:border-primary/30 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== COMPARISON TABLE ========== */}
      <section className="py-24">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
            {t('landing.compare.title')}
          </h2>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="p-4 bg-destructive/10 text-center font-heading font-bold text-sm text-destructive">
                ❌ {t('landing.compare.col_without')}
              </div>
              <div className="p-4 bg-primary/10 text-center font-heading font-bold text-sm text-primary">
                ✓ {t('landing.compare.col_with')}
              </div>
            </div>
            {comparisonRows.map((row, i) => (
              <div key={i} className={`grid grid-cols-2 ${i < comparisonRows.length - 1 ? 'border-b border-border/50' : ''}`}>
                <div className="p-4 text-sm font-body text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  {row.without}
                </div>
                <div className="p-4 text-sm font-body text-foreground border-l border-border/50 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  {row.withAI}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ACTIVATION ECONOMY ========== */}
      <section className="py-24 bg-card/50">
        <div className="container max-w-5xl">
          <p className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase text-center mb-3">
            {t('landing.activation.badge')}
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
            {t('landing.activation.title')}
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12 font-body">
            {t('landing.activation.desc')}
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {activationFeatures.map((feat, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-background p-6 hover:border-primary/30 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feat.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PHORA TOKEN ========== */}
      <section className="py-24">
        <div className="container max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            {t('landing.phora.title')}
          </h2>
          <p className="text-lg text-muted-foreground italic font-body mb-2">{t('landing.phora.subtitle')}</p>
          <ul className="space-y-3 text-left max-w-xl mx-auto mt-8 mb-8">
            {[1, 2, 3, 4].map(i => (
              <li key={i} className="flex items-start gap-3">
                <Coins className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm font-body text-foreground/90">{t(`landing.phora.point${i}`)}</span>
              </li>
            ))}
          </ul>
          <blockquote className="text-lg italic text-muted-foreground font-body border-l-4 border-primary/30 pl-6 text-left max-w-xl mx-auto">
            "{t('landing.phora.quote')}"
          </blockquote>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="container grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className={`py-8 md:py-12 text-center ${i > 0 ? 'border-l border-border/50' : ''}`}>
              <div className="text-3xl md:text-4xl font-heading font-black text-primary">{stat.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground font-body mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-24">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-16">{t('how.title')}</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative group">
                {i < 3 && <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary/50 to-transparent z-0" />}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:glow-primary transition-shadow">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-xs font-heading font-bold text-primary mb-2 tracking-widest">STEP {i + 1}</div>
                  <h3 className="text-lg font-heading font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== MANIFESTO ========== */}
      <section className="py-24 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5">
        <div className="container max-w-3xl text-center">
          <p className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase mb-3">
            {t('landing.manifesto.badge')}
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-8">
            {t('landing.manifesto.title')}
          </h2>
          <p className="text-xl md:text-2xl italic font-body text-muted-foreground mb-3 leading-relaxed">
            "{t('landing.manifesto.line1')}
          </p>
          <p className="text-xl md:text-2xl italic font-body text-primary font-semibold mb-10">
            {t('landing.manifesto.line2')}"
          </p>
          <p className="text-lg font-heading font-bold tracking-wide mb-8">
            {t('landing.manifesto.tagline')}
          </p>
          <p className="text-muted-foreground font-body mb-8">{t('landing.manifesto.cta_text')}</p>
          <Link to="/register">
            <Button variant="hero" size="lg" className="gap-2">
              {t('landing.hero.cta1')} <Rocket className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={gophoraLogo} alt="GOPHORA" className="h-6 dark:invert" />
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
