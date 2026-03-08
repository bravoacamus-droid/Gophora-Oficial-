import { Zap, Users, BarChart3, ArrowRight, Target, Cpu, Globe, Rocket } from 'lucide-react';
import gophoraLogo from '@/assets/gophora-logo.png';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Landing = () => {
  const { t } = useLanguage();

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
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-8">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-xs font-heading font-semibold tracking-wider text-primary uppercase">Mission-Driven Execution</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight leading-none mb-6">
            {t('landing.title')}
            <br />
            <span className="text-gradient-primary">{t('landing.title2')}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body">
            {t('landing.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?type=company">
              <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2">
                {t('landing.cta.company')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register?type=explorer">
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto gap-2">
                {t('landing.cta.explorer')} <Globe className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* How It Works */}
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

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Ready to Launch?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto font-body">
            Join GOPHORA and transform how you execute projects.
          </p>
          <Link to="/register">
            <Button variant="hero" size="lg" className="gap-2">
              Get Started <Rocket className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-body">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="font-heading font-bold tracking-wider">GOPHORA</span>
          </div>
          <p>© 2026 GOPHORA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
