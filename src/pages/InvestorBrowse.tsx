import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, DollarSign, Search, Loader2, Sparkles, FileText, ExternalLink,
  CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { generateInvestorAgreementPdf } from '@/lib/investorAgreement';

const db = supabase as any;

interface OpenProject {
  id: string;
  title: string;
  description: string | null;
  industry: string | null;
  category: string | null;
  budget: number | null;
  cost_estimate: number | null;
  cost_justification: string | null;
  funding_percent_sought: number | null;
  equity_offered_percent: number | null;
  resource_link: string | null;
  video_link: string | null;
  specs_pdf_url: string | null;
  user_id: string;
  created_at: string;
  owner_email?: string | null;
  owner_name?: string | null;
}

const equityForFunding = (p: number) => (p >= 50 ? 15 : p >= 25 ? 10 : p >= 10 ? 5 : 0);

const useOpenProjects = () => useQuery({
  queryKey: ['investor-open-projects'],
  queryFn: async (): Promise<OpenProject[]> => {
    const { data, error } = await db
      .from('projects')
      .select(`
        id, title, description, industry, category, budget, cost_estimate, cost_justification,
        funding_percent_sought, equity_offered_percent, resource_link, video_link, specs_pdf_url,
        user_id, created_at,
        profiles (email, full_name)
      `)
      .eq('open_to_investors', true)
      .neq('status', 'completed')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((p: any) => ({
      ...p,
      owner_email: p.profiles?.email || null,
      owner_name: p.profiles?.full_name || null,
    }));
  },
});

const useMyOffers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-investor-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('investor_offers')
        .select('id, project_id, amount_usd, equity_percent, status, message, created_at, signed_pdf_url')
        .eq('investor_user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

const InvestorBrowse = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading } = useOpenProjects();
  const { data: myOffers = [] } = useMyOffers();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [selected, setSelected] = useState<OpenProject | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [signing, setSigning] = useState(false);

  const myOfferByProject = useMemo(() => {
    const m = new Map<string, any>();
    myOffers.forEach((o: any) => m.set(o.project_id, o));
    return m;
  }, [myOffers]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => { if (p.industry) set.add(p.industry); });
    return Array.from(set);
  }, [projects]);

  const filtered = projects.filter((p) => {
    const t = (p.title || '').toLowerCase() + ' ' + (p.description || '').toLowerCase();
    if (search && !t.includes(search.toLowerCase())) return false;
    if (industryFilter !== 'all' && p.industry !== industryFilter) return false;
    if (tierFilter !== 'all' && String(p.funding_percent_sought) !== tierFilter) return false;
    return true;
  });

  const submitOffer = useMutation({
    mutationFn: async (payload: { project: OpenProject; amount: number; message: string; pdfBlob: Blob }) => {
      if (!user) throw new Error('Not authenticated');

      // 1) Upload signed PDF to investor-agreements/<userId>/<projectId>-<ts>.pdf
      const ts = Date.now();
      const path = `${user.id}/${payload.project.id}-${ts}.pdf`;
      const { error: upErr } = await supabase.storage
        .from('investor-agreements')
        .upload(path, payload.pdfBlob, { contentType: 'application/pdf', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('investor-agreements').getPublicUrl(path);

      // 2) Insert investor_offer
      const equityPct = equityForFunding(payload.project.funding_percent_sought || 0);
      const { error } = await db.from('investor_offers').insert({
        project_id: payload.project.id,
        investor_user_id: user.id,
        amount_usd: payload.amount,
        equity_percent: equityPct,
        message: payload.message || null,
        status: 'pending',
        signed_pdf_url: urlData.publicUrl,
        signed_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-investor-offers'] });
      toast.success(isEs ? 'Oferta enviada y documento firmado guardado' : 'Offer sent and signed agreement saved');
      setSelected(null);
      setOfferAmount('');
      setOfferMessage('');
    },
    onError: (err: any) => {
      toast.error(err?.message || (isEs ? 'No se pudo enviar la oferta' : 'Could not submit offer'));
    },
  });

  const handleSubmitOffer = async () => {
    if (!selected || !user) return;
    const amt = Number(offerAmount);
    if (!amt || amt < 100) {
      toast.error(isEs ? 'Monto mínimo $100' : 'Minimum $100');
      return;
    }
    setSigning(true);
    try {
      const equityPct = equityForFunding(selected.funding_percent_sought || 0);
      const pdfBlob = await generateInvestorAgreementPdf({
        projectTitle: selected.title,
        projectIndustry: selected.industry || selected.category || 'General',
        ownerName: selected.owner_name || selected.owner_email || 'Project owner',
        investorName: user.user_metadata?.full_name || user.email || 'Investor',
        investorEmail: user.email || '',
        amountUsd: amt,
        equityPercent: equityPct,
        fundingPercent: selected.funding_percent_sought || 0,
        totalCost: selected.cost_estimate || selected.budget || 0,
        message: offerMessage,
        date: new Date(),
        isEs,
      });
      await submitOffer.mutateAsync({ project: selected, amount: amt, message: offerMessage, pdfBlob });
    } catch (err: any) {
      toast.error(err?.message || (isEs ? 'No se pudo generar el documento' : 'Could not generate document'));
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-heading font-bold uppercase tracking-widest text-amber-500">
            {isEs ? 'Modo Inversor' : 'Investor Mode'}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          {isEs ? 'Proyectos abiertos a inversión' : 'Projects open to investment'}
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          {isEs
            ? 'Cada proyecto fue cotizado por la IA de GOPHORA. Hace una oferta firmando el acuerdo simple de equity.'
            : 'Every project was AI-quoted by GOPHORA. Make an offer by signing the simple equity agreement.'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isEs ? 'Buscar proyecto…' : 'Search project…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder={isEs ? 'Industria' : 'Industry'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isEs ? 'Todas las industrias' : 'All industries'}</SelectItem>
            {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder={isEs ? 'Equity' : 'Equity'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isEs ? 'Todos los tickets' : 'All tickets'}</SelectItem>
            <SelectItem value="10">10% inversión · 5% equity</SelectItem>
            <SelectItem value="25">25% inversión · 10% equity</SelectItem>
            <SelectItem value="50">50% inversión · 15% equity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground font-body text-sm">
            {isEs
              ? 'No hay proyectos abiertos a inversión por ahora. Vuelve pronto — las empresas suben proyectos cada día.'
              : 'No projects open to investment yet. Check back soon.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const equity = p.equity_offered_percent ?? equityForFunding(p.funding_percent_sought || 0);
            const totalCost = p.cost_estimate || p.budget || 0;
            const fundingPct = p.funding_percent_sought || 0;
            const investmentNeeded = Math.round((totalCost * fundingPct) / 100);
            const myOffer = myOfferByProject.get(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="cursor-pointer hover:border-amber-500/40 transition-colors h-full" onClick={() => setSelected(p)}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-amber-500">{p.industry || 'General'}</p>
                        <h3 className="font-heading font-bold text-base mt-1 line-clamp-2">{p.title}</h3>
                      </div>
                      {myOffer && (
                        <Badge variant="outline" className="text-[9px] shrink-0">
                          {myOffer.status === 'pending' && <Clock className="h-2.5 w-2.5 mr-1" />}
                          {myOffer.status === 'accepted' && <CheckCircle className="h-2.5 w-2.5 mr-1 text-green-500" />}
                          {myOffer.status === 'declined' && <XCircle className="h-2.5 w-2.5 mr-1 text-red-500" />}
                          {myOffer.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-body line-clamp-2">{p.description}</p>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
                      <div>
                        <p className="text-[9px] uppercase font-heading text-muted-foreground tracking-wider">{isEs ? 'Costo IA' : 'AI Cost'}</p>
                        <p className="text-sm font-heading font-bold">${totalCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-heading text-muted-foreground tracking-wider">{isEs ? 'Buscan' : 'Need'}</p>
                        <p className="text-sm font-heading font-bold text-amber-600">${investmentNeeded.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-heading text-muted-foreground tracking-wider">Equity</p>
                        <p className="text-sm font-heading font-bold text-primary">{equity}%</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs gap-1 mt-2">
                      {myOffer ? (isEs ? 'Ver mi oferta' : 'View my offer') : (isEs ? 'Ver y ofertar' : 'Review & offer')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Project + offer modal */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (() => {
            const equity = selected.equity_offered_percent ?? equityForFunding(selected.funding_percent_sought || 0);
            const totalCost = selected.cost_estimate || selected.budget || 0;
            const fundingPct = selected.funding_percent_sought || 0;
            const investmentNeeded = Math.round((totalCost * fundingPct) / 100);
            const existingOffer = myOfferByProject.get(selected.id);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    {selected.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  {/* Headline numbers */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                      <p className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground">{isEs ? 'Costo total IA' : 'Total cost (AI)'}</p>
                      <p className="text-xl font-heading font-bold">${totalCost.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-center">
                      <p className="text-[10px] font-heading uppercase tracking-wider text-amber-500">{isEs ? 'Buscan' : 'Need'}</p>
                      <p className="text-xl font-heading font-bold text-amber-600">${investmentNeeded.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{fundingPct}% {isEs ? 'del proyecto' : 'of project'}</p>
                    </div>
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                      <p className="text-[10px] font-heading uppercase tracking-wider text-primary">Equity</p>
                      <p className="text-xl font-heading font-bold text-primary">{equity}%</p>
                      <p className="text-[10px] text-muted-foreground">{isEs ? 'que ofrecen' : 'offered'}</p>
                    </div>
                  </div>

                  {/* AI justification */}
                  {selected.cost_justification && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                      <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" /> {isEs ? 'Justificación IA' : 'AI rationale'}
                      </p>
                      <p className="text-xs text-muted-foreground font-body whitespace-pre-wrap">{selected.cost_justification}</p>
                    </div>
                  )}

                  {/* Description */}
                  {selected.description && (
                    <div>
                      <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-muted-foreground mb-1">{isEs ? 'Descripción' : 'Description'}</p>
                      <p className="text-sm font-body">{selected.description}</p>
                    </div>
                  )}

                  {/* Resources */}
                  <div className="grid sm:grid-cols-3 gap-2">
                    {selected.video_link && (
                      <a href={selected.video_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 p-2.5 text-xs">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-heading font-bold">{isEs ? 'Pitch video' : 'Pitch video'}</span>
                      </a>
                    )}
                    {selected.resource_link && (
                      <a href={selected.resource_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 p-2.5 text-xs">
                        <ExternalLink className="h-3 w-3" />
                        <span className="font-heading font-bold">{isEs ? 'Recursos' : 'Resources'}</span>
                      </a>
                    )}
                    {selected.specs_pdf_url && (
                      <a href={selected.specs_pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 p-2.5 text-xs">
                        <FileText className="h-3 w-3" />
                        <span className="font-heading font-bold">Specs PDF</span>
                      </a>
                    )}
                  </div>

                  {/* Existing offer or new offer form */}
                  {existingOffer ? (
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-heading font-bold uppercase tracking-wider">{isEs ? 'Tu oferta' : 'Your offer'}</p>
                        <Badge variant="outline">{existingOffer.status}</Badge>
                      </div>
                      <p className="text-xl font-heading font-bold">${Number(existingOffer.amount_usd).toLocaleString()} <span className="text-xs text-muted-foreground font-body">por {Number(existingOffer.equity_percent)}% equity</span></p>
                      {existingOffer.message && <p className="text-xs text-muted-foreground font-body italic">{existingOffer.message}</p>}
                      {existingOffer.signed_pdf_url && (
                        <a href={existingOffer.signed_pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs font-heading text-primary hover:underline flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {isEs ? 'Ver acuerdo firmado' : 'View signed agreement'}
                        </a>
                      )}
                    </div>
                  ) : selected.user_id === user?.id ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-muted-foreground font-body">
                      {isEs ? 'Es tu propio proyecto — no podés invertir en él.' : "It's your own project — you can't invest in it."}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                      <p className="text-xs font-heading font-bold uppercase tracking-wider text-amber-600">{isEs ? 'Hacer una oferta' : 'Make an offer'}</p>
                      <div>
                        <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Monto a invertir (USD)' : 'Investment amount (USD)'}</label>
                        <Input
                          type="number"
                          min={100}
                          placeholder={String(investmentNeeded)}
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground font-body mt-1">
                          {isEs ? `A cambio recibís ${equity}% de equity. La empresa puede aceptar, rechazar o negociar.` : `In exchange you receive ${equity}% equity. The company can accept, decline or negotiate.`}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Mensaje (opcional)' : 'Message (optional)'}</label>
                        <Textarea
                          rows={2}
                          placeholder={isEs ? 'Por qué querés invertir, qué aportás más allá del capital...' : 'Why you want to invest, what you bring beyond capital...'}
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                        />
                      </div>
                      <div className="rounded-md border border-amber-500/20 bg-background p-3 text-[11px] font-body text-foreground/80 leading-relaxed">
                        <p className="font-heading font-bold text-xs mb-1">{isEs ? 'Acuerdo simple de equity' : 'Simple equity agreement'}</p>
                        <p>
                          {isEs
                            ? `Al enviar la oferta firmás digitalmente un acuerdo simple: ${user?.email || 'inversor'} aporta $${Number(offerAmount || investmentNeeded).toLocaleString()} USD y recibe ${equity}% de equity en "${selected.title}" si la empresa acepta. El documento queda guardado en tu cuenta.`
                            : `By submitting the offer you digitally sign a simple agreement: ${user?.email || 'investor'} contributes $${Number(offerAmount || investmentNeeded).toLocaleString()} USD and receives ${equity}% equity in "${selected.title}" if the company accepts. The document is saved to your account.`}
                        </p>
                      </div>
                      <Button
                        onClick={handleSubmitOffer}
                        disabled={signing || submitOffer.isPending || !offerAmount}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        {signing || submitOffer.isPending
                          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isEs ? 'Firmando…' : 'Signing…'}</>
                          : <><DollarSign className="h-4 w-4 mr-2" />{isEs ? 'Firmar y enviar oferta' : 'Sign and submit offer'}</>}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvestorBrowse;
