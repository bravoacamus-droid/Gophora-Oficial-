import { useLanguage } from '@/contexts/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import gophoraLogo from '@/assets/gophora-logo.png';

const FAQ = () => {
  const { t } = useLanguage();

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
    { q: t('faq.q7'), a: t('faq.a7') },
    { q: t('faq.q8'), a: t('faq.a8') },
  ];

  return (
    <div className="min-h-screen">
      <section className="py-24 md:py-32">
        <div className="container max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-heading font-black text-center mb-4">
            {t('faq.title')}
          </h1>
          <p className="text-muted-foreground text-center font-body mb-12">
            {t('faq.subtitle')}
          </p>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-border/50 bg-card px-6">
                <AccordionTrigger className="font-heading font-semibold text-sm hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground font-body">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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

export default FAQ;
