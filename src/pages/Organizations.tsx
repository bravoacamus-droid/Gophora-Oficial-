import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Zap, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import gophoraLogo from '@/assets/gophora-logo.png';

const Organizations = () => {
  const { t } = useLanguage();

  const benefits = [
    { icon: Zap, title: t('org.benefit1.title'), desc: t('org.benefit1.desc') },
    { icon: BarChart3, title: t('org.benefit2.title'), desc: t('org.benefit2.desc') },
    { icon: ShieldCheck, title: t('org.benefit3.title'), desc: t('org.benefit3.desc') },
    { icon: Building2, title: t('org.benefit4.title'), desc: t('org.benefit4.desc') },
  ];

  return (
    <div className="min-h-screen">
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl">
          <p className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase text-center mb-3">
            {t('org.badge')}
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-center mb-6">
            {t('org.title')}
          </h1>
          <p className="text-lg text-muted-foreground font-body text-center max-w-2xl mx-auto mb-16 leading-relaxed">
            {t('org.desc')}
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-16">
            {benefits.map((b, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/register?type=company">
              <Button variant="hero" size="lg" className="gap-2">
                {t('org.cta')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-body">
          <img src={gophoraLogo} alt="GOPHORA" className="h-6 dark:invert" />
          <p>© 2026 GOPHORA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Organizations;
