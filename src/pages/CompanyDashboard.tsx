import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  FolderOpen, Zap, CheckCircle, DollarSign, Plus, ExternalLink,
  CheckCircle2, XCircle, Wallet, TrendingUp, TrendingDown, ChevronRight,
  Users, Clock, ArrowUpRight, BarChart3, Target, Calendar, FileText,
  AlertCircle, Sparkles, Activity
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ProjectRow {
  id: string;
  title: string;
  budget: number;
  status: string;
  payment_status: string;
  description: string;
  category: string;
  priority: string;
  deadline: string | null;
  resource_link: string | null;
  video_link: string | null;
  specs_pdf_url: string | null;
  created_at: string;
}

interface MissionRow {
  id: string;
  title: string;
  status: string;
  project_id: string;
  reward: number;
  skill: string;
}

interface DeliveryRow {
  id: string;
  status: string;
  delivery_url: string | null;
  delivered_at: string | null;
  mission_id: string;
  user_id: string;
  explorerName: string;
  missionTitle: string;
  missionReward: number;
  projectTitle: string;
}

interface ApplicationRow {
  id: string;
  status: string;
  user_id: string;
  mission_id: string;
  explorerName: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const CompanyDashboard = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const { user, isInvestor, toggleInvestorMode } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [editingResourceLink, setEditingResourceLink] = useState('');
  const [editingVideoLink, setEditingVideoLink] = useState('');
  const [savingResource, setSavingResource] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [profile, setProfile] = useState<{ full_name?: string; username?: string } | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [projectTab, setProjectTab] = useState('all');
  const [investorOffers, setInvestorOffers] = useState<any[]>([]);
  const [reviewingOfferId, setReviewingOfferId] = useState<string | null>(null);
  const [kpiDrilldown, setKpiDrilldown] = useState<null | 'completed_projects' | 'all_missions' | 'completed_missions' | 'explorers'>(null);
  const [presentedDeliveries, setPresentedDeliveries] = useState<any[]>([]);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [rejectingMissionId, setRejectingMissionId] = useState<string | null>(null);
  const [rejectRoundReason, setRejectRoundReason] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: compProfile }, { data: projectRows }] = await Promise.all([
      supabase.from('company_profiles' as any).select('company_name').eq('user_id', user.id).maybeSingle() as any,
      supabase.from('projects').select('id, title, budget, status, payment_status, description, category, priority, deadline, resource_link, video_link, specs_pdf_url, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    setProfile({ full_name: compProfile?.company_name });
    const pRows = (projectRows || []) as ProjectRow[];
    setProjects(pRows);

    if (pRows.length > 0) {
      const projectIds = pRows.map((p) => p.id);

      // Investor offers on this company's projects (RLS handles authorisation
      // — the project_owner_sees_offers policy is the gate). We pull the
      // investor email/name out of profiles in a second hop because there's
      // no FK between investor_offers.investor_user_id and profiles for
      // PostgREST to follow automatically.
      const { data: offerRows } = await (supabase
        .from('investor_offers' as any)
        .select('id, project_id, investor_user_id, amount_usd, equity_percent, message, status, signed_pdf_url, created_at, reviewed_at')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false }) as any);
      const offers = offerRows || [];
      const investorIds = [...new Set(offers.map((o: any) => o.investor_user_id))];
      let investorMap = new Map<string, { email: string | null; full_name: string | null }>();
      if (investorIds.length > 0) {
        const { data: invRows } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', investorIds);
        investorMap = new Map((invRows || []).map((r: any) => [r.id, { email: r.email, full_name: r.full_name }]));
      }
      const projectTitleMap = new Map(pRows.map((p) => [p.id, p.title]));
      setInvestorOffers(offers.map((o: any) => ({
        ...o,
        projectTitle: projectTitleMap.get(o.project_id) || 'Proyecto',
        investorEmail: investorMap.get(o.investor_user_id)?.email || null,
        investorName: investorMap.get(o.investor_user_id)?.full_name || null,
      })));

      const { data: missionRows } = await supabase.from('missions').select('id, title, status, project_id, reward, skill').in('project_id', projectIds);
      const mRows = (missionRows || []) as MissionRow[];
      setMissions(mRows);

      if (mRows.length > 0) {
        const missionIds = mRows.map((m) => m.id);
        const { data: assignRows } = await (supabase
          .from('mission_assignments' as any)
          .select('id, status, delivery_url, delivered_at, started_at, mission_id, explorer_id, review_note')
          .in('mission_id', missionIds) as any);
        const assigns = assignRows || [];
        const explorerIds = [...new Set(assigns.map((a: any) => a.explorer_id))];

        let explorerMap = new Map<string, string>();
        if (explorerIds.length > 0) {
          const { data: explorerRows } = await (supabase.from('explorer_profiles' as any).select('id, name').in('id', explorerIds) as any);
          explorerMap = new Map((explorerRows || []).map((p: any) => [p.id, p.name || 'Explorer']));
        }

        const missionMap = new Map(mRows.map((m) => [m.id, m]));
        const projectMap = new Map(pRows.map((p) => [p.id, p.title]));

        const deliveryAssigns = assigns.filter((a: any) => ['submitted', 'approved', 'rejected', 'completed', 'funds_released'].includes(a.status));
        setDeliveries(deliveryAssigns.map((a: any) => {
          const mission = missionMap.get(a.mission_id);
          return {
            id: a.id, status: a.status, delivery_url: a.delivery_url, delivered_at: a.delivered_at,
            mission_id: a.mission_id, user_id: a.explorer_id,
            explorerName: explorerMap.get(a.explorer_id) || 'Explorer',
            missionTitle: mission?.title || 'Mission',
            missionReward: Number(mission?.reward || 0),
            projectTitle: mission ? (projectMap.get(mission.project_id) || 'Project') : 'Project',
          };
        }));

        setApplications(assigns.map((a: any) => ({
          id: a.id, status: a.status, user_id: a.explorer_id, mission_id: a.mission_id,
          explorerName: explorerMap.get(a.explorer_id) || 'Explorer',
        })));

        // Presented deliveries — admin curated and now waiting for company
        // to pick the winner. We grab the rich row including delivery_url
        // and timing data so the comparison UI doesn't need an extra hop.
        const presented = assigns.filter((a: any) => a.status === 'presented');
        const presentedByMission = new Map<string, any[]>();
        presented.forEach((a: any) => {
          const arr = presentedByMission.get(a.mission_id) || [];
          arr.push({
            id: a.id,
            status: a.status,
            mission_id: a.mission_id,
            delivery_url: a.delivery_url,
            delivered_at: a.delivered_at,
            review_note: a.review_note,
            explorer_id: a.explorer_id,
            explorerName: explorerMap.get(a.explorer_id) || 'Explorer',
            missionTitle: missionMap.get(a.mission_id)?.title || 'Mission',
            missionReward: Number(missionMap.get(a.mission_id)?.reward || 0),
            projectTitle: projectMap.get(missionMap.get(a.mission_id)?.project_id || '') || 'Project',
          });
        });
        setPresentedDeliveries(Array.from(presentedByMission.values()).flat());
      } else {
        setDeliveries([]);
        setApplications([]);
        setPresentedDeliveries([]);
      }
    } else {
      setMissions([]);
      setDeliveries([]);
      setApplications([]);
      setInvestorOffers([]);
      setPresentedDeliveries([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const handleReview = async (appId: string, newStatus: 'approved' | 'rejected') => {
    setReviewingId(appId);
    try {
      const { error } = await (supabase
        .from('mission_assignments' as any)
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNotes[appId] || null
        })
        .eq('id', appId) as any);
      if (error) throw error;
      toast.success(newStatus === 'approved' ? (isEs ? 'Entrega aprobada' : 'Delivery approved') : (isEs ? 'Entrega rechazada' : 'Delivery rejected'));
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setReviewingId(null);
    }
  };

  const handlePickWinner = async (assignmentId: string) => {
    if (!window.confirm(isEs
      ? '¿Aprobar esta entrega? Las otras presentadas para la misma misión pasan a "no seleccionadas" y los explorers reciben la notificación.'
      : 'Approve this delivery? The other presented ones for the same mission will be marked "not selected" and those explorers will be notified.'
    )) return;
    setPickingId(assignmentId);
    try {
      const { error } = await supabase.rpc('company_pick_winner', { _assignment_id: assignmentId });
      if (error) throw error;
      toast.success(isEs ? 'Entrega aprobada — GOPHORA va a liberar los fondos' : 'Delivery approved — GOPHORA will release the funds');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setPickingId(null);
    }
  };

  const handleRejectRound = async (missionId: string) => {
    if (!rejectRoundReason.trim() || rejectRoundReason.trim().length < 5) {
      toast.error(isEs ? 'Escribí al menos 5 caracteres explicando por qué no te sirve esta ronda.' : 'Write at least 5 characters explaining why this round does not work.');
      return;
    }
    setRejectingMissionId(missionId);
    try {
      const { error } = await supabase.rpc('company_reject_round', { _mission_id: missionId, _reason: rejectRoundReason.trim() });
      if (error) throw error;
      toast.success(isEs ? 'Ronda rechazada — GOPHORA va a curar otra' : 'Round rejected — GOPHORA will curate another');
      setRejectRoundReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setRejectingMissionId(null);
    }
  };

  const handleReviewOffer = async (offerId: string, newStatus: 'accepted' | 'declined') => {
    setReviewingOfferId(offerId);
    try {
      const { error } = await (supabase
        .from('investor_offers' as any)
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id ?? null,
        })
        .eq('id', offerId) as any);
      if (error) throw error;
      toast.success(
        newStatus === 'accepted'
          ? (isEs ? 'Oferta aceptada — el inversor recibió la notificación' : 'Offer accepted — investor was notified')
          : (isEs ? 'Oferta rechazada' : 'Offer declined')
      );
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setReviewingOfferId(null);
    }
  };

  const handleUpdateResource = async (projectId: string) => {
    setSavingResource(true);
    try {
      const { error } = await supabase.from('projects').update({ resource_link: editingResourceLink }).eq('id', projectId);
      if (error) throw error;
      toast.success(isEs ? 'Recursos actualizados' : 'Resources updated');
      setSelectedProject((prev) => prev ? { ...prev, resource_link: editingResourceLink } : null);
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, resource_link: editingResourceLink } : p));
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSavingResource(false);
    }
  };

  const handleUpdateVideoLink = async (projectId: string) => {
    setSavingVideo(true);
    try {
      const { error } = await (supabase.from('projects') as any).update({ video_link: editingVideoLink || null }).eq('id', projectId);
      if (error) throw error;
      toast.success(isEs ? 'Link de transmisión actualizado' : 'Live link updated');
      setSelectedProject((prev) => prev ? { ...prev, video_link: editingVideoLink || null } : null);
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, video_link: editingVideoLink || null } : p));
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSavingVideo(false);
    }
  };

  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const completedMissions = missions.filter((m) => m.status === 'approved');
  const inProgressMissions = missions.filter((m) => m.status === 'assigned');

  // "Invertido" reflects what the company actually paid into GOPHORA (project
  // budgets where payment_status='paid'). "Pagado en Misiones" reflects how
  // much of that has been released to explorers — only assignments with
  // status='funds_released' count, because that's the moment GOPHORA moves
  // the money out. Older versions used mission.status='completed' which fires
  // ALONGSIDE funds_released so the visible total looked similar; tying the
  // calculation to assignment status is more direct and survives any future
  // mission lifecycle change.
  const totalBudget = projects
    .filter((p) => p.payment_status === 'paid')
    .reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const releasedMissionIds = new Set(
    applications.filter((a) => a.status === 'funds_released').map((a) => a.mission_id)
  );
  const usedBudget = missions
    .filter((m) => releasedMissionIds.has(m.id))
    .reduce((sum, m) => sum + Number(m.reward || 0), 0);
  const balance = totalBudget - usedBudget;
  const pendingDeliveries = deliveries.filter((d) => d.status === 'submitted');
  const uniqueExplorersTotal = new Set(applications.filter(a => ['assigned', 'submitted', 'approved', 'completed', 'funds_released'].includes(a.status)).map(a => a.user_id));

  const getMissionsForProject = (projectId: string) => missions.filter((m) => m.project_id === projectId);
  const getAppsForProject = (projectId: string) => {
    const mIds = getMissionsForProject(projectId).map((m) => m.id);
    return applications.filter((a) => mIds.includes(a.mission_id));
  };

  const filteredProjects = projectTab === 'all' ? projects : projects.filter(p => p.status === projectTab);
  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || '';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'medium': return 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { label: isEs ? 'Activo' : 'Active', cls: 'bg-primary/15 text-primary border-primary/30' };
      case 'completed': return { label: isEs ? 'Completado' : 'Completed', cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' };
      case 'paused': return { label: isEs ? 'Pausado' : 'Paused', cls: 'bg-muted text-muted-foreground border-border' };
      default: return { label: status, cls: 'bg-muted text-muted-foreground border-border' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container max-w-6xl py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p className="text-xs font-heading font-semibold tracking-[0.2em] text-primary uppercase mb-1">
                {isEs ? 'Panel de Control' : 'Command Center'}
              </p>
              <h1 className="text-3xl md:text-4xl font-heading font-black">
                {isEs ? 'Hola' : 'Hello'}, {displayName} 👋
              </h1>
              <p className="text-muted-foreground font-body text-sm mt-1">
                {isEs
                  ? `${activeProjects.length} proyecto${activeProjects.length !== 1 ? 's' : ''} activo${activeProjects.length !== 1 ? 's' : ''} • ${pendingDeliveries.length} entrega${pendingDeliveries.length !== 1 ? 's' : ''} pendiente${pendingDeliveries.length !== 1 ? 's' : ''}`
                  : `${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''} • ${pendingDeliveries.length} pending deliver${pendingDeliveries.length !== 1 ? 'ies' : 'y'}`
                }
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="flex gap-3">
              <Button
                variant={isInvestor ? "default" : "outline"}
                size="sm"
                onClick={toggleInvestorMode}
                className={`gap-2 font-heading text-xs transition-all ${isInvestor ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'border-amber-500/30 text-amber-600 hover:bg-amber-50'}`}
              >
                <TrendingUp className="h-4 w-4" />
                {isInvestor ? (isEs ? 'Modo Inversor Activo' : 'Investor Mode Active') : (isEs ? 'Activar Modo Inversor' : 'Activate Investor Mode')}
              </Button>
              <Link to="/projects/create">
                <Button variant="hero" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> {isEs ? 'Nuevo Proyecto' : 'New Project'}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-8 space-y-8">
        {/* KPI Cards — most are drill-downs except the money totals */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {([
            { icon: FolderOpen, label: isEs ? 'Proyectos Completados' : 'Completed Projects', value: String(completedProjects.length), accent: true, drill: 'completed_projects' as const },
            { icon: Target, label: isEs ? 'Misiones' : 'Missions', value: String(missions.length), drill: 'all_missions' as const },
            { icon: CheckCircle, label: isEs ? 'Misiones Completadas' : 'Missions Completed', value: String(completedMissions.length), drill: 'completed_missions' as const },
            { icon: Users, label: isEs ? 'Exploradores' : 'Explorers', value: String(uniqueExplorersTotal.size), drill: 'explorers' as const },
            { icon: DollarSign, label: isEs ? 'Invertido' : 'Invested', value: `$${totalBudget.toLocaleString()}`, drill: null },
            { icon: Wallet, label: isEs ? 'Pagado en Misiones' : 'Paid to Missions', value: `$${usedBudget.toLocaleString()}`, accent: true, drill: null },
          ] as const).map((stat, i) => {
            const isPagado = stat.label === (isEs ? 'Pagado en Misiones' : 'Paid to Missions');
            const accentClass = stat.accent
              ? (isInvestor && isPagado ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/30 bg-primary/5')
              : 'border-border/50 bg-card';
            const iconClass = stat.accent
              ? (isInvestor && isPagado ? 'text-amber-600' : 'text-primary')
              : 'text-muted-foreground';
            const interactive = stat.drill !== null;
            return (
              <motion.button
                key={i}
                type="button"
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                onClick={() => { if (stat.drill) setKpiDrilldown(stat.drill); }}
                disabled={!interactive}
                className={`rounded-xl border p-4 text-left transition-all ${accentClass} ${interactive ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : 'cursor-default'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`h-4 w-4 ${iconClass}`} />
                  <span className="text-xs text-muted-foreground font-body">{stat.label}</span>
                </div>
                <p className="text-2xl font-heading font-bold">{stat.value}</p>
                {interactive && (
                  <p className="text-[10px] text-muted-foreground/60 font-body mt-1">
                    {isEs ? 'Click para ver detalle' : 'Click for detail'}
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>

        {isInvestor && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-amber-600" />
                <h2 className="font-heading font-bold text-sm">{isEs ? 'Rendimiento (ROI)' : 'Investment ROI'}</h2>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-heading font-black text-amber-600">+12.4%</span>
                <span className="text-xs text-muted-foreground font-body mb-1">PROMEDIO ANUAL</span>
              </div>
              <Progress value={65} className="h-2 bg-amber-200" />
              <p className="text-xs text-muted-foreground font-body mt-3">
                {isEs ? 'Basado en el éxito de tus misiones asignadas y calidad de entrega.' : 'Based on mission success rate and delivery quality.'}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-4 w-4 text-primary" />
                <h2 className="font-heading font-bold text-sm">{isEs ? 'Portafolio de Inversión' : 'Investment Portfolio'}</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-body">{isEs ? 'Proyectos Propios' : 'Own Projects'}</span>
                  <span className="font-heading font-bold">{projects.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-body">{isEs ? 'Proyectos Participados' : 'Venture Projects'}</span>
                  <span className="font-heading font-bold">0</span>
                </div>
                <Link to="/invest" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[10px] h-8 border-amber-500/30 text-amber-600 hover:bg-amber-50"
                  >
                    {isEs ? 'Explorar Proyectos para Invertir' : 'Browse Projects to Invest'}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Deliveries presented for company review (curated by admin) */}
        {presentedDeliveries.length > 0 && (() => {
          // Group by mission so the company sees side-by-side comparison
          const groups = new Map<string, any[]>();
          presentedDeliveries.forEach((d: any) => {
            const arr = groups.get(d.mission_id) || [];
            arr.push(d);
            groups.set(d.mission_id, arr);
          });
          return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <h2 className="font-heading font-bold text-sm">
                    {isEs ? 'Entregables para revisar' : 'Deliveries for review'}
                  </h2>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500 text-white">
                    {presentedDeliveries.length} {isEs ? 'entregables' : 'deliveries'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-body italic">
                  {isEs
                    ? 'GOPHORA curó estos. Elegí cuál te sirve — los otros explorers reciben "no seleccionada".'
                    : 'GOPHORA curated these. Pick the one that works — the others get "not selected".'}
                </p>
              </div>

              <div className="space-y-6">
                {Array.from(groups.entries()).map(([missionId, items]) => (
                  <div key={missionId} className="rounded-lg border border-border/50 bg-card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-heading font-semibold text-sm">{items[0]?.missionTitle}</p>
                        <p className="text-[11px] text-muted-foreground font-body">{items[0]?.projectTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">{isEs ? 'Recompensa' : 'Reward'}</p>
                        <p className="text-base font-heading font-bold text-primary">${Number(items[0]?.missionReward || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                      {items.map((d: any, i: number) => (
                        <div key={d.id} className="rounded-lg border border-border/40 bg-muted/20 p-3 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="h-7 w-7 rounded-full bg-blue-500/15 flex items-center justify-center text-[11px] font-heading font-bold text-blue-500 shrink-0">
                              {i + 1}
                            </span>
                            <p className="font-heading font-semibold text-xs truncate">{d.explorerName}</p>
                          </div>
                          {d.delivery_url && (
                            <a
                              href={d.delivery_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-500 hover:underline font-heading break-all flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              {isEs ? 'Ver entregable' : 'Open delivery'}
                            </a>
                          )}
                          {d.delivered_at && (
                            <p className="text-[10px] text-muted-foreground font-body">
                              {isEs ? 'Entregado: ' : 'Delivered: '}
                              {new Date(d.delivered_at).toLocaleString(isEs ? 'es' : 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          <Button
                            size="sm"
                            className="mt-auto bg-green-600 hover:bg-green-700 text-white gap-1 text-xs"
                            disabled={pickingId === d.id}
                            onClick={() => handlePickWinner(d.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                            {pickingId === d.id ? (isEs ? 'Aprobando…' : 'Approving…') : (isEs ? 'Aprobar este' : 'Approve this')}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Reject all (force another curation round) */}
                    <div className="border-t border-border/40 p-3 bg-muted/10 space-y-2">
                      <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground">
                        {isEs ? '¿Ninguno te sirve?' : "None of these work?"}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          placeholder={isEs ? 'Decile a GOPHORA por qué (mín. 5 chars)…' : "Tell GOPHORA why (min 5 chars)…"}
                          value={rejectingMissionId === missionId ? rejectRoundReason : ''}
                          onChange={(e) => { setRejectingMissionId(missionId); setRejectRoundReason(e.target.value); }}
                          onFocus={() => setRejectingMissionId(missionId)}
                          className="flex-1 min-w-[220px] rounded-md border border-border/50 bg-background px-2.5 py-1.5 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 text-xs"
                          onClick={() => handleRejectRound(missionId)}
                        >
                          <XCircle className="h-3 w-3" />
                          {isEs ? 'Rechazar ronda' : 'Reject round'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* Investor offers received */}
        {investorOffers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <h2 className="font-heading font-bold text-sm">
                  {isEs ? 'Ofertas de Inversores' : 'Investor Offers'}
                </h2>
                {investorOffers.some((o) => o.status === 'pending') && (
                  <span className="text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500 text-white">
                    {investorOffers.filter((o) => o.status === 'pending').length} {isEs ? 'pendientes' : 'pending'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-body italic">
                {isEs
                  ? 'Aceptá para iniciar el acuerdo formal · Rechazá si no encaja'
                  : 'Accept to start formal agreement · Decline if not a fit'}
              </p>
            </div>

            <div className="space-y-3">
              {investorOffers.map((o) => {
                const isPending = o.status === 'pending';
                const investorLabel = o.investorName || o.investorEmail?.split('@')[0] || (isEs ? 'Inversor' : 'Investor');
                return (
                  <div
                    key={o.id}
                    className={`rounded-lg border p-4 ${isPending ? 'border-amber-500/40 bg-card' : 'border-border/40 bg-muted/20 opacity-80'}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-heading font-semibold text-sm">{investorLabel}</p>
                          {o.investorEmail && (
                            <span className="text-[11px] text-muted-foreground font-body truncate">{o.investorEmail}</span>
                          )}
                          <Badge
                            variant={isPending ? 'default' : 'outline'}
                            className={`text-[9px] capitalize ${
                              o.status === 'accepted' ? 'bg-green-500 text-white' :
                              o.status === 'declined' ? 'bg-destructive/15 text-destructive border-destructive/30' :
                              o.status === 'signed' ? 'bg-primary text-primary-foreground' :
                              ''
                            }`}
                          >
                            {o.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                          {isEs ? 'Proyecto: ' : 'Project: '} <span className="font-heading font-semibold text-foreground">{o.projectTitle}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-heading font-black text-amber-600">${Number(o.amount_usd).toLocaleString()}</p>
                        <p className="text-[11px] text-muted-foreground font-body">
                          {isEs ? 'por' : 'for'} <span className="font-heading font-bold text-primary">{Number(o.equity_percent)}% equity</span>
                        </p>
                      </div>
                    </div>

                    {o.message && (
                      <p className="text-xs text-muted-foreground font-body italic mb-3 leading-relaxed border-l-2 border-amber-500/30 pl-3">
                        "{o.message}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      {o.signed_pdf_url && (
                        <a
                          href={o.signed_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline font-heading"
                        >
                          <FileText className="h-3 w-3" /> {isEs ? 'Ver acuerdo firmado' : 'View signed agreement'}
                        </a>
                      )}
                      <span className="text-muted-foreground font-body ml-auto">
                        {new Date(o.created_at).toLocaleDateString(isEs ? 'es' : 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs"
                          disabled={reviewingOfferId === o.id}
                          onClick={() => handleReviewOffer(o.id, 'accepted')}
                        >
                          <CheckCircle className="h-3 w-3" />
                          {isEs ? 'Aceptar oferta' : 'Accept offer'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 text-xs"
                          disabled={reviewingOfferId === o.id}
                          onClick={() => handleReviewOffer(o.id, 'declined')}
                        >
                          <XCircle className="h-3 w-3" />
                          {isEs ? 'Rechazar' : 'Decline'}
                        </Button>
                        <p className="text-[10px] text-muted-foreground font-body italic ml-auto">
                          {isEs
                            ? 'Aceptar inicia el acuerdo formal — el monto NO se transfiere todavía.'
                            : 'Accepting starts the formal agreement — the amount is NOT transferred yet.'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Budget Overview Bar */}
        {totalBudget > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-heading font-semibold text-sm">{isEs ? 'Uso de Presupuesto' : 'Budget Usage'}</span>
              </div>
              <span className="text-xs text-muted-foreground font-body">
                ${usedBudget.toLocaleString()} / ${totalBudget.toLocaleString()} ({totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0}%)
              </span>
            </div>
            <Progress value={totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0} className="h-2" />
            <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground font-body">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> {isEs ? 'Usado' : 'Used'}: ${usedBudget.toLocaleString()}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> {isEs ? 'Disponible' : 'Available'}: ${balance.toLocaleString()}</span>
            </div>
          </motion.div>
        )}

        {/* Pending Deliveries Alert */}
        {pendingDeliveries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="rounded-xl border-2 border-yellow-500/40 bg-yellow-500/5">
              <div className="p-5 border-b border-yellow-500/20 flex items-center justify-between">
                <h2 className="font-heading font-bold flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  {isEs ? 'Acción Requerida' : 'Action Required'}
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 ml-2">{pendingDeliveries.length}</Badge>
                </h2>
                <span className="text-xs text-muted-foreground font-body">
                  {isEs ? 'Entregas esperando revisión' : 'Deliveries awaiting review'}
                </span>
              </div>
              <div className="divide-y divide-yellow-500/10">
                {pendingDeliveries.map((d) => (
                  <div key={d.id} className="p-5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading font-semibold">{d.missionTitle}</h3>
                        <p className="text-sm text-muted-foreground font-body">
                          {d.projectTitle} • <span className="text-primary font-semibold">@{d.explorerName}</span>
                          {d.delivered_at && (
                            <span className="ml-2 text-xs">
                              <Clock className="inline h-3 w-3 mr-0.5" />
                              {new Date(d.delivered_at).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-lg font-heading font-bold text-primary">${d.missionReward.toLocaleString()}</span>
                    </div>
                    {d.delivery_url && (
                      <a href={d.delivery_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-body bg-primary/5 px-3 py-1.5 rounded-lg">
                        <ArrowUpRight className="h-3 w-3" /> {isEs ? 'Ver entrega' : 'View delivery'}
                      </a>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <Input
                        placeholder={isEs ? 'Nota de revisión (opcional)' : 'Review note (optional)'}
                        value={reviewNotes[d.id] || ''}
                        onChange={(e) => setReviewNotes((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        className="flex-1 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1.5 font-heading text-xs" onClick={() => handleReview(d.id, 'approved')} disabled={reviewingId === d.id}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> {isEs ? 'Aprobar' : 'Approve'}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 font-heading text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReview(d.id, 'rejected')} disabled={reviewingId === d.id}>
                          <XCircle className="h-3.5 w-3.5" /> {isEs ? 'Rechazar' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isEs ? 'Mis Proyectos' : 'My Projects'}
            </h2>
          </div>

          <Tabs value={projectTab} onValueChange={setProjectTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all" className="font-heading text-xs">{isEs ? 'Todos' : 'All'} ({projects.length})</TabsTrigger>
              <TabsTrigger value="active" className="font-heading text-xs">{isEs ? 'Activos' : 'Active'} ({activeProjects.length})</TabsTrigger>
              <TabsTrigger value="completed" className="font-heading text-xs">{isEs ? 'Completados' : 'Completed'} ({projects.filter(p => p.status === 'completed').length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-card/50 p-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">{isEs ? 'Sin proyectos aún' : 'No projects yet'}</h3>
              <p className="text-sm text-muted-foreground font-body mb-4">
                {isEs ? 'Crea tu primer proyecto y comienza a ejecutar con exploradores globales.' : 'Create your first project and start executing with global explorers.'}
              </p>
              <Link to="/projects/create">
                <Button variant="hero" className="gap-2"><Plus className="h-4 w-4" /> {isEs ? 'Crear Proyecto' : 'Create Project'}</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProjects.map((project, i) => {
                const pMissions = getMissionsForProject(project.id);
                const completed = pMissions.filter((m) => m.status === 'approved').length;
                const totalReward = pMissions.reduce((s, m) => s + Number(m.reward), 0);
                const pApps = getAppsForProject(project.id);
                const explorerCount = new Set(pApps.filter(a => ['accepted', 'submitted', 'completed'].includes(a.status)).map(a => a.user_id)).size;
                const progressPct = pMissions.length > 0 ? (completed / pMissions.length) * 100 : 0;
                const statusBadge = getStatusBadge(project.status);
                const hasPendingDeliveries = deliveries.filter(d => d.status === 'submitted' && pMissions.some(m => m.id === d.mission_id)).length > 0;

                return (
                  <motion.div
                    key={project.id}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    onClick={() => { setSelectedProject(project); setEditingResourceLink(project.resource_link || ''); setEditingVideoLink(project.video_link || ''); }}
                    className="rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-bold text-lg truncate">{project.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold border ${statusBadge.cls}`}>{statusBadge.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold border ${getPriorityColor(project.priority)}`}>{project.priority}</span>
                          {hasPendingDeliveries && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />}
                        </div>
                        <p className="text-sm text-muted-foreground font-body truncate">{project.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-body">
                          <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {completed}/{pMissions.length} {isEs ? 'misiones' : 'missions'}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {explorerCount} {isEs ? 'exploradores' : 'explorers'}</span>
                          {project.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(project.deadline).toLocaleDateString()}</span>}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-heading font-bold text-primary">${totalReward.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground font-heading">{Math.round(progressPct)}%</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {deliveries.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-card">
            <div className="p-5 border-b border-border/50 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-heading font-bold">{isEs ? 'Actividad Reciente' : 'Recent Activity'}</h2>
            </div>
            <div className="divide-y divide-border/50">
              {deliveries.slice(0, 5).map((d) => (
                <div key={d.id} className="p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${d.status === 'completed' ? 'bg-emerald-500/15' : d.status === 'rejected' ? 'bg-destructive/15' : 'bg-yellow-500/15'}`}>
                    {d.status === 'completed' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : d.status === 'rejected' ? <XCircle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-yellow-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading font-semibold truncate">{d.missionTitle}</p>
                    <p className="text-xs text-muted-foreground font-body">@{d.explorerName} • {d.projectTitle}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-heading font-semibold border ${['approved', 'completed', 'funds_released'].includes(d.status) ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : d.status === 'rejected' ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'}`}>
                    {['approved', 'completed', 'funds_released'].includes(d.status) ? (isEs ? 'Aprobada' : 'Approved') : d.status === 'rejected' ? (isEs ? 'Rechazada' : 'Rejected') : (isEs ? 'Pendiente' : 'Pending')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Project Detail Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedProject && (() => {
            const pMissions = getMissionsForProject(selectedProject.id);
            const pApps = getAppsForProject(selectedProject.id);
            const completedM = pMissions.filter((m) => m.status === 'approved').length;
            const pendingM = pMissions.filter((m) => m.status === 'open').length;
            const uniqueExplorers = new Set(pApps.filter((a) => ['accepted', 'submitted', 'completed'].includes(a.status)).map((a) => a.user_id));
            const pUsed = pMissions.filter((m) => m.status === 'approved').reduce((s, m) => s + Number(m.reward), 0);
            const totalMissionsReward = pMissions.reduce((s, m) => s + Number(m.reward), 0);
            const progressPct = pMissions.length > 0 ? (completedM / pMissions.length) * 100 : 0;

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="font-heading text-xl">{selectedProject.title}</DialogTitle>
                    {(() => { const sb = getStatusBadge(selectedProject.status); return <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold border ${sb.cls}`}>{sb.label}</span>; })()}
                  </div>
                </DialogHeader>
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground font-body">{selectedProject.description}</p>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-body">{isEs ? 'Progreso del proyecto' : 'Project progress'}</span>
                      <span className="font-heading font-semibold">{Math.round(progressPct)}%</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border/50 p-3 text-center">
                      <DollarSign className="h-4 w-4 text-primary mx-auto mb-1" />
                      <p className="font-heading font-bold text-lg">${totalMissionsReward.toLocaleString()}</p>
                      <span className="text-[10px] text-muted-foreground font-body">{isEs ? 'Presupuesto' : 'Budget'}</span>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3 text-center">
                      <TrendingDown className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <p className="font-heading font-bold text-lg">${pUsed.toLocaleString()}</p>
                      <span className="text-[10px] text-muted-foreground font-body">{isEs ? 'Usado' : 'Used'}</span>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3 text-center">
                      <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <p className="font-heading font-bold text-lg">{uniqueExplorers.size}</p>
                      <span className="text-[10px] text-muted-foreground font-body">{isEs ? 'Exploradores' : 'Explorers'}</span>
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="rounded-lg border border-border/50 p-4 space-y-3">
                    <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> {isEs ? 'Recursos del proyecto' : 'Project Resources'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.video_link && (
                        <a href={selectedProject.video_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 hover:underline font-body font-semibold bg-red-500/5 border border-red-500/20 px-3 py-1.5 rounded-lg">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          {isEs ? 'Ver en vivo' : 'Watch live'}
                        </a>
                      )}
                      {selectedProject.resource_link && (
                        <a href={selectedProject.resource_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-body bg-primary/5 px-3 py-1.5 rounded-lg">
                          <ArrowUpRight className="h-3 w-3" /> {isEs ? 'Abrir recursos' : 'Open resources'}
                        </a>
                      )}
                      {selectedProject.specs_pdf_url && (
                        <a href={selectedProject.specs_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-body bg-blue-500/5 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                          <FileText className="h-3 w-3" /> {isEs ? 'Specs PDF' : 'Specs PDF'}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder={isEs ? 'Link de recursos (Google Drive, Dropbox...)' : 'Resource link (Google Drive, Dropbox...)'} value={editingResourceLink} onChange={(e) => setEditingResourceLink(e.target.value)} className="flex-1 text-sm" />
                      <Button size="sm" onClick={() => handleUpdateResource(selectedProject.id)} disabled={savingResource || !editingResourceLink.trim()} className="font-heading text-xs">
                        {savingResource ? '...' : (isEs ? 'Guardar' : 'Save')}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder={isEs ? 'Link de transmisión en vivo (Zoom, Google Meet...)' : 'Live stream link (Zoom, Google Meet...)'} value={editingVideoLink} onChange={(e) => setEditingVideoLink(e.target.value)} className="flex-1 text-sm" />
                      <Button size="sm" variant={editingVideoLink ? 'default' : 'outline'} onClick={() => handleUpdateVideoLink(selectedProject.id)} disabled={savingVideo || editingVideoLink === (selectedProject.video_link || '')} className="font-heading text-xs">
                        {savingVideo ? '...' : (isEs ? 'Guardar' : 'Save')}
                      </Button>
                    </div>
                  </div>

                  {/* Missions */}
                  <div>
                    <h3 className="font-heading font-semibold text-sm mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> {isEs ? 'Misiones' : 'Missions'} ({pMissions.length})</span>
                      <span className="text-xs text-muted-foreground font-body">${totalMissionsReward.toLocaleString()} total</span>
                    </h3>
                    <div className="space-y-2">
                      {pMissions.map((m) => {
                        const mApps = pApps.filter((a) => a.mission_id === m.id);
                        const activeExplorers = mApps.filter((a) => ['accepted', 'submitted', 'completed'].includes(a.status));
                        const isCompleted = m.status === 'approved';
                        return (
                          <div key={m.id} className={`rounded-lg border p-3 flex items-center justify-between ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/50'}`}>
                            <div className="flex items-center gap-3">
                              {isCompleted ? <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                              <div>
                                <p className="font-heading font-semibold text-sm">{m.title}</p>
                                <p className="text-xs text-muted-foreground font-body">{m.skill} • {activeExplorers.length > 0 ? activeExplorers.map((a) => `@${a.explorerName}`).join(', ') : (isEs ? 'Sin asignar' : 'Unassigned')}</p>
                              </div>
                            </div>
                            <span className="text-sm font-heading font-bold">${Number(m.reward).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex gap-3 flex-wrap text-xs text-muted-foreground font-body pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" /> {selectedProject.category}</span>
                    <span className={`px-2 py-0.5 rounded-full border ${getPriorityColor(selectedProject.priority)}`}>{selectedProject.priority}</span>
                    {selectedProject.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {selectedProject.deadline}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(selectedProject.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* KPI drill-down dialog */}
      <Dialog open={!!kpiDrilldown} onOpenChange={(o) => { if (!o) setKpiDrilldown(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              {kpiDrilldown === 'completed_projects' && <><FolderOpen className="h-5 w-5 text-primary" /> {isEs ? 'Proyectos Completados' : 'Completed Projects'}</>}
              {kpiDrilldown === 'all_missions' && <><Target className="h-5 w-5 text-primary" /> {isEs ? 'Todas las Misiones' : 'All Missions'}</>}
              {kpiDrilldown === 'completed_missions' && <><CheckCircle className="h-5 w-5 text-primary" /> {isEs ? 'Misiones Completadas' : 'Completed Missions'}</>}
              {kpiDrilldown === 'explorers' && <><Users className="h-5 w-5 text-primary" /> {isEs ? 'Exploradores' : 'Explorers'}</>}
            </DialogTitle>
          </DialogHeader>

          {/* Completed projects */}
          {kpiDrilldown === 'completed_projects' && (
            completedProjects.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground font-body">
                {isEs ? 'Aún no tenés proyectos marcados como completados.' : 'No completed projects yet.'}
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {completedProjects.map((p) => {
                  const projMissions = missions.filter(m => m.project_id === p.id);
                  return (
                    <div key={p.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-heading font-semibold text-sm">{p.title}</p>
                          <p className="text-[11px] text-muted-foreground font-body line-clamp-1">{p.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {projMissions.length} {isEs ? 'misiones' : 'missions'} · {p.category} · {new Date(p.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-heading font-bold text-primary">${Number(p.budget || 0).toLocaleString()}</p>
                          <Badge variant="outline" className="text-[9px] mt-1">{p.payment_status}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* All missions / Completed missions — both reuse mission rendering */}
          {(kpiDrilldown === 'all_missions' || kpiDrilldown === 'completed_missions') && (() => {
            const list = kpiDrilldown === 'completed_missions' ? completedMissions : missions;
            if (list.length === 0) {
              return (
                <p className="py-10 text-center text-sm text-muted-foreground font-body">
                  {isEs ? 'No hay misiones para mostrar.' : 'No missions to show.'}
                </p>
              );
            }
            const projectMap = new Map(projects.map((p) => [p.id, p.title]));
            const missionApps = new Map<string, any[]>();
            applications.forEach((a) => {
              const arr = missionApps.get(a.mission_id) || [];
              arr.push(a);
              missionApps.set(a.mission_id, arr);
            });
            return (
              <div className="divide-y divide-border/50">
                {list.map((m: any) => {
                  const apps = missionApps.get(m.id) || [];
                  const released = apps.some((a: any) => a.status === 'funds_released');
                  return (
                    <div key={m.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-heading font-semibold text-sm">{m.title}</p>
                          <p className="text-[11px] text-muted-foreground font-body">
                            {projectMap.get(m.project_id) || '—'} · {m.skill}
                          </p>
                          {apps.length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {apps.length} explorer{apps.length === 1 ? '' : 's'} · {apps.map((a: any) => a.explorerName).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-heading font-bold text-primary">${Number(m.reward || 0).toLocaleString()}</p>
                          <Badge variant={released ? 'default' : 'outline'} className="text-[9px] mt-1 capitalize">
                            {released ? (isEs ? 'pagada' : 'paid') : m.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Explorers */}
          {kpiDrilldown === 'explorers' && (() => {
            const explorerStats = new Map<string, { name: string; missions: number; completed: number; earned: number }>();
            applications.forEach((a) => {
              if (!['assigned', 'submitted', 'approved', 'completed', 'funds_released'].includes(a.status)) return;
              const cur = explorerStats.get(a.user_id) || { name: a.explorerName || 'Explorer', missions: 0, completed: 0, earned: 0 };
              cur.missions += 1;
              if (a.status === 'funds_released') {
                cur.completed += 1;
                const m = missions.find((mm) => mm.id === a.mission_id);
                cur.earned += Number(m?.reward || 0);
              }
              explorerStats.set(a.user_id, cur);
            });
            const list = Array.from(explorerStats.values()).sort((a, b) => b.earned - a.earned);
            if (list.length === 0) {
              return (
                <p className="py-10 text-center text-sm text-muted-foreground font-body">
                  {isEs ? 'Ningún explorer ha tomado misiones todavía.' : 'No explorers have taken missions yet.'}
                </p>
              );
            }
            return (
              <div className="divide-y divide-border/50">
                {list.map((ex, i) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading font-semibold text-sm truncate">{ex.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ex.missions} {isEs ? 'misiones tomadas' : 'taken'} · {ex.completed} {isEs ? 'pagadas' : 'paid'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-heading font-bold text-primary">${ex.earned.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{isEs ? 'ganado' : 'earned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyDashboard;
