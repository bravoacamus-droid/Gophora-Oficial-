import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import SkillPassport from '@/components/SkillPassport';
import { Shield, Loader2 } from 'lucide-react';

const PublicPassport = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [resolved, setResolved] = useState<{ id: string | null; loading: boolean; notFound: boolean }>({
    id: null,
    loading: true,
    notFound: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) {
        setResolved({ id: null, loading: false, notFound: true });
        return;
      }

      // Backwards-compat: existing share links may still pass `me` or a raw
      // user UUID. Treat 36-char dashed strings as a direct user_id, fall
      // through to slug lookup otherwise.
      if (slug === 'me') {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setResolved({ id: user?.id ?? null, loading: false, notFound: !user });
        return;
      }

      const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (looksLikeUuid) {
        if (!cancelled) setResolved({ id: slug, loading: false, notFound: false });
        return;
      }

      const { data, error } = await (supabase
        .from('explorer_profiles' as any)
        .select('user_id')
        .eq('public_slug', slug)
        .maybeSingle() as any);
      if (cancelled) return;
      if (error || !data?.user_id) {
        setResolved({ id: null, loading: false, notFound: true });
      } else {
        setResolved({ id: data.user_id, loading: false, notFound: false });
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-heading font-bold">
            GOPHORA {isEs ? 'Pasaporte de Habilidades' : 'Skill Passport'}
          </h1>
        </div>
        {resolved.loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : resolved.notFound || !resolved.id ? (
          <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground font-body">
              {isEs
                ? 'Este pasaporte no existe o el explorer aún no completó su perfil.'
                : 'This passport does not exist or the explorer has not completed their profile yet.'}
            </p>
          </div>
        ) : (
          <SkillPassport explorerId={resolved.id} isPublic />
        )}
      </div>
    </div>
  );
};

export default PublicPassport;
