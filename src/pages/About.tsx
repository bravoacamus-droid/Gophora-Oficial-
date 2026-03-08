import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Target, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import gophoraLogo from '@/assets/gophora-logo.png';

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl">
          <p className="text-xs font-heading font-semibold tracking-[0.25em] text-primary uppercase text-center mb-3">
            {t('about.badge')}
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-center mb-6">
            {t('about.title')}
          </h1>
          <p className="text-lg text-muted-foreground font-body text-center max-w-2xl mx-auto mb-16 leading-relaxed">
            {t('about.desc')}
          </p>

          <div className="grid sm:grid-cols-2 gap-8 mb-16">
            {[
              { icon: Target, title: t('about.mission.title'), desc: t('about.mission.desc') },
              { icon: Sparkles, title: t('about.vision.title'), desc: t('about.vision.desc') },
              { icon: Shield, title: t('about.values.title'), desc: t('about.values.desc') },
              { icon: Users, title: t('about.community.title'), desc: t('about.community.desc') },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/register">
              <Button variant="hero" size="lg">{t('about.cta')}</Button>
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

export default About;
