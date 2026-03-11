import { useState, useEffect, useCallback, useMemo } from 'react';
import YouTubeVideoPlayer, { isYouTubeUrl } from '@/components/YouTubeVideoPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, FolderOpen, Zap, DollarSign, BarChart3, CheckCircle, XCircle, Ban, UserCheck,
  CreditCard, Banknote, ExternalLink, Wallet, Building2, Bitcoin, CalendarIcon, Search, X,
  Download, Image, ChevronDown, ChevronUp, FileText, Clock, ArrowRight, Eye, GraduationCap, Plus, Trash2, Star, Play
} from 'lucide-react';
import { format, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import { Textarea } from '@/components/ui/textarea';

const tabs = ['Overview', 'Fund Releases', 'Withdrawals', 'Missions', 'Projects', 'Users', 'Payments', 'Revenue', 'Courses', 'Tutors'] as const;
type Tab = typeof tabs[number];
const tabIcons: Record<Tab, any> = {
  Overview: BarChart3, 'Fund Releases': Banknote, Withdrawals: Wallet,
  Missions: Zap, Projects: FolderOpen, Users, Payments: CreditCard, Revenue: DollarSign, Courses: GraduationCap, Tutors: UserCheck
};

const AdminPanel = () => {
  const { t } = useLanguage();
  const { isAdmin, user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [missionFilter, setMissionFilter] = useState<string>('active');
  const [pendingReleases, setPendingReleases] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [withdrawalNotes, setWithdrawalNotes] = useState<Record<string, string>>({});
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<any>(null);

  // Courses management state
  const [adminCourses, setAdminCourses] = useState<any[]>([]);
  const [academyPaths, setAcademyPaths] = useState<any[]>([]);
  const [tutorApplications, setTutorApplications] = useState<any[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedCoursePreview, setSelectedCoursePreview] = useState<any>(null);
  const [courseStatusFilter, setCourseStatusFilter] = useState<string>('all');
  const [newCourse, setNewCourse] = useState({
    title: '', title_es: '', description: '', description_es: '', platform: '',
    external_url: '', duration_minutes: 30, skill_level: 'beginner', language: 'en',
    skills_learned: '', category: 'general', tool: '', path_id: '', sort_order: 0,
    instructor_name: '', thumbnail_url: '', featured: false,
  });

  // Withdrawal filters
  const [wFilterUser, setWFilterUser] = useState<string>('all');
  const [wFilterMethod, setWFilterMethod] = useState<string>('all');
  const [wFilterStatus, setWFilterStatus] = useState<string>('all');
  const [wFilterDateFrom, setWFilterDateFrom] = useState<Date | undefined>();
  const [wFilterDateTo, setWFilterDateTo] = useState<Date | undefined>();

  const withdrawalUsers = Array.from(
    new Map(withdrawalRequests.map((w: any) => [w.user_id, { id: w.user_id, email: w.explorerEmail, name: w.explorerName }])).values()
  );

  const filterWithdrawals = useCallback((items: any[]) => {
    return items.filter((w: any) => {
      if (wFilterUser !== 'all' && w.user_id !== wFilterUser) return false;
      if (wFilterMethod !== 'all' && w.method !== wFilterMethod) return false;
      if (wFilterStatus !== 'all' && w.status !== wFilterStatus) return false;
      const wDate = new Date(w.created_at);
      if (wFilterDateFrom && wDate < startOfDay(wFilterDateFrom)) return false;
      if (wFilterDateTo && wDate > endOfDay(wFilterDateTo)) return false;
      return true;
    });
  }, [wFilterUser, wFilterMethod, wFilterStatus, wFilterDateFrom, wFilterDateTo]);

  const hasActiveFilters = wFilterUser !== 'all' || wFilterMethod !== 'all' || wFilterStatus !== 'all' || wFilterDateFrom || wFilterDateTo;
  const clearFilters = () => { setWFilterUser('all'); setWFilterMethod('all'); setWFilterStatus('all'); setWFilterDateFrom(undefined); setWFilterDateTo(undefined); };

  // Daily report generation
  const generateDailyReport = (methodFilter: 'all' | 'bank' | 'crypto' = 'all') => {
    const today = new Date();
    const filtered = withdrawalRequests.filter((w: any) => {
      if (methodFilter !== 'all' && w.method !== methodFilter) return false;
      return true;
    });

    if (filtered.length === 0) { toast.error('No hay datos para exportar'); return; }

    const methodLabel = methodFilter === 'bank' ? 'Banco' : methodFilter === 'crypto' ? 'Crypto' : 'Todos';
    const headers = ['Estado', 'Explorer Email', 'Nombre', 'Monto', 'Método',
      'Banco', 'Cuenta', 'Titular', 'Red Crypto', 'Wallet', 'QR URL',
      'Fecha Solicitud', 'Fecha Procesado', 'Nota Admin'];

    const rows = filtered.map((w: any) => [
      w.status, w.explorerEmail, w.explorerName || '', Number(w.amount),
      w.method === 'bank' ? 'Banco' : 'Crypto',
      w.bank_name || '', w.bank_account || '', w.bank_holder || '',
      w.crypto_network || '', w.crypto_address || '', w.qr_image_url || '',
      new Date(w.created_at).toLocaleDateString(),
      w.processed_at ? new Date(w.processed_at).toLocaleDateString() : '',
      w.admin_note || '',
    ]);

    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_retiros_${methodLabel}_${format(today, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Reporte de retiros (${methodLabel}) descargado`);
  };

  // Withdrawal daily summary
  const withdrawalSummary = useMemo(() => {
    const pending = withdrawalRequests.filter((w: any) => w.status === 'pending');
    const pendingBank = pending.filter((w: any) => w.method === 'bank');
    const pendingCrypto = pending.filter((w: any) => w.method === 'crypto');
    const approved = withdrawalRequests.filter((w: any) => w.status === 'approved');

    return {
      totalPending: pending.length,
      pendingAmount: pending.reduce((s: number, w: any) => s + Number(w.amount), 0),
      bankPending: pendingBank.length,
      bankAmount: pendingBank.reduce((s: number, w: any) => s + Number(w.amount), 0),
      cryptoPending: pendingCrypto.length,
      cryptoAmount: pendingCrypto.reduce((s: number, w: any) => s + Number(w.amount), 0),
      totalApproved: approved.length,
      approvedAmount: approved.reduce((s: number, w: any) => s + Number(w.amount), 0),
    };
  }, [withdrawalRequests]);

  const adminCall = useCallback(async (action: string, params: any = {}) => {
    const { data, error } = await supabase.functions.invoke('admin-actions', {
      body: { action, ...params },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData, projectsData, missionsData, releasesData, withdrawalsData, paymentsData, coursesData, pathsData, tutorData] = await Promise.all([
        adminCall('get_stats'), adminCall('get_users'), adminCall('get_projects'),
        adminCall('get_missions'), adminCall('get_pending_releases'),
        adminCall('get_withdrawals'), adminCall('get_payment_history'),
        adminCall('get_academy_courses'), adminCall('get_academy_paths'),
        adminCall('get_tutor_applications'),
      ]);
      setStats(statsData); setUsers(usersData); setProjects(projectsData);
      setMissions(missionsData); setPendingReleases(releasesData || []);
      setWithdrawalRequests(withdrawalsData || []); setPaymentHistory(paymentsData || []);
      setAdminCourses(coursesData || []); setAcademyPaths(pathsData || []);
      setTutorApplications(tutorData || []);
    } catch (err: any) {
      console.error('Admin load error:', err);
      toast.error(err.message || 'Failed to load admin data');
    } finally { setLoading(false); }
  }, [adminCall]);

  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin, loadData]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const handlePaymentStatus = async (projectId: string, status: string) => {
    try { await adminCall('update_payment_status', { project_id: projectId, payment_status: status }); toast.success(`Payment marked as ${status}`); loadData(); } catch (err: any) { toast.error(err.message); }
  };
  const handleApproveMission = async (missionId: string) => {
    try { await adminCall('approve_mission', { mission_id: missionId }); toast.success('Mission approved'); loadData(); } catch (err: any) { toast.error(err.message); }
  };
  const handleRejectMission = async (missionId: string) => {
    try { await adminCall('reject_mission', { mission_id: missionId }); toast.success('Mission rejected'); loadData(); } catch (err: any) { toast.error(err.message); }
  };
  const handleReleaseFunds = async (applicationId: string) => {
    setReleasingId(applicationId);
    try { await adminCall('release_funds', { application_id: applicationId }); toast.success('Fondos liberados exitosamente'); setSelectedRelease(null); loadData(); } catch (err: any) { toast.error(err.message); } finally { setReleasingId(null); }
  };
  const handleSuspendUser = async (userId: string) => {
    try { await adminCall('suspend_user', { user_id: userId }); toast.success('User suspended'); loadData(); } catch (err: any) { toast.error(err.message); }
  };
  const handleActivateUser = async (userId: string) => {
    try { await adminCall('activate_user', { user_id: userId }); toast.success('User activated'); loadData(); } catch (err: any) { toast.error(err.message); }
  };
  const handleProcessWithdrawal = async (withdrawalId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingId(withdrawalId);
    try {
      await adminCall('process_withdrawal', { withdrawal_id: withdrawalId, new_status: newStatus, admin_note: withdrawalNotes[withdrawalId] || null });
      toast.success(newStatus === 'approved' ? 'Retiro aprobado' : 'Retiro rechazado'); loadData();
    } catch (err: any) { toast.error(err.message); } finally { setProcessingId(null); }
  };

  const handleAddCourse = async () => {
    try {
      await adminCall('create_course', {
        ...newCourse,
        skills_learned: newCourse.skills_learned.split(',').map((s: string) => s.trim()).filter(Boolean),
        duration_minutes: Number(newCourse.duration_minutes),
        sort_order: Number(newCourse.sort_order),
      });
      toast.success('Curso agregado');
      setShowAddCourse(false);
      setNewCourse({ title: '', title_es: '', description: '', description_es: '', platform: '', external_url: '', duration_minutes: 30, skill_level: 'beginner', language: 'en', skills_learned: '', category: 'general', tool: '', path_id: '', sort_order: 0, instructor_name: '', thumbnail_url: '', featured: false });
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('¿Eliminar este curso? Se borrará también el progreso de los exploradores.')) return;
    try {
      await adminCall('delete_course', { course_id: courseId });
      toast.success('Curso eliminado');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-500/10 text-blue-500', approved: 'bg-green-500/10 text-green-500',
      rejected: 'bg-destructive/10 text-destructive', paid: 'bg-green-500/10 text-green-500',
      unpaid: 'bg-yellow-500/10 text-yellow-500', pending: 'bg-yellow-500/10 text-yellow-500',
      active: 'bg-green-500/10 text-green-500', completed: 'bg-green-500/10 text-green-500',
      funds_released: 'bg-green-500/10 text-green-500',
    };
    return <span className={`text-xs font-heading font-semibold px-2 py-1 rounded-full ${colors[status] || 'bg-muted text-muted-foreground'}`}>{status.toUpperCase()}</span>;
  };

  const FilterBar = () => (
    <div className="p-4 border-b border-border/50 bg-muted/30 flex flex-wrap items-center gap-3">
      <Search className="h-4 w-4 text-muted-foreground" />
      <Select value={wFilterUser} onValueChange={setWFilterUser}>
        <SelectTrigger className="w-[180px] text-sm"><SelectValue placeholder="Todos los usuarios" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los usuarios</SelectItem>
          {withdrawalUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.email}{u.name ? ` (${u.name})` : ''}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={wFilterMethod} onValueChange={setWFilterMethod}>
        <SelectTrigger className="w-[130px] text-sm"><SelectValue placeholder="Método" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="bank">Banco</SelectItem>
          <SelectItem value="crypto">Crypto</SelectItem>
        </SelectContent>
      </Select>
      <Select value={wFilterStatus} onValueChange={setWFilterStatus}>
        <SelectTrigger className="w-[130px] text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="approved">Aprobado</SelectItem>
          <SelectItem value="rejected">Rechazado</SelectItem>
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2 text-xs font-heading", !wFilterDateFrom && "text-muted-foreground")}>
            <CalendarIcon className="h-3 w-3" />{wFilterDateFrom ? format(wFilterDateFrom, 'dd/MM/yyyy') : 'Desde'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={wFilterDateFrom} onSelect={setWFilterDateFrom} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2 text-xs font-heading", !wFilterDateTo && "text-muted-foreground")}>
            <CalendarIcon className="h-3 w-3" />{wFilterDateTo ? format(wFilterDateTo, 'dd/MM/yyyy') : 'Hasta'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={wFilterDateTo} onSelect={setWFilterDateTo} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="gap-1 text-xs font-heading text-muted-foreground" onClick={clearFilters}><X className="h-3 w-3" /> Limpiar</Button>
      )}
    </div>
  );

  return (
    <div className="container py-8 max-w-7xl">
      <h1 className="text-2xl md:text-3xl font-heading font-bold mb-8">{t('admin.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tabIcons[tab];
          const count = tab === 'Fund Releases' ? pendingReleases.length :
                        tab === 'Withdrawals' ? withdrawalRequests.filter((w: any) => w.status === 'pending').length : 0;
          return (
            <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} size="sm"
              onClick={() => setActiveTab(tab)} className="font-heading text-xs gap-2 whitespace-nowrap relative">
              <Icon className="h-3 w-3" /> {tab}
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'Overview' && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Usuarios', value: stats.totalUsers, icon: Users },
                  { label: 'Proyectos', value: stats.totalProjects, icon: FolderOpen },
                  { label: 'Misiones', value: stats.totalMissions, icon: Zap },
                  { label: 'Budget Pagado', value: `$${stats.paidBudget?.toLocaleString()}`, icon: DollarSign },
                  { label: 'Comisión', value: `$${stats.commission?.toLocaleString()}`, icon: BarChart3 },
                ].map((stat, i) => (
                  <div key={i} className="rounded-xl border border-border/50 bg-card p-4 text-center">
                    <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-xl font-heading font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground font-body">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Action Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Pending Releases */}
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 cursor-pointer hover:border-yellow-500/50 transition-colors"
                  onClick={() => setActiveTab('Fund Releases')}>
                  <div className="flex items-center justify-between mb-3">
                    <Banknote className="h-6 w-6 text-yellow-500" />
                    <span className="text-2xl font-heading font-bold text-yellow-500">{pendingReleases.length}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-sm">Fondos por Liberar</h3>
                  <p className="text-xs text-muted-foreground font-body mt-1">Entregas aprobadas pendientes de pago</p>
                </div>

                {/* Pending Withdrawals */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setActiveTab('Withdrawals')}>
                  <div className="flex items-center justify-between mb-3">
                    <Wallet className="h-6 w-6 text-primary" />
                    <span className="text-2xl font-heading font-bold text-primary">{withdrawalSummary.totalPending}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-sm">Retiros Pendientes</h3>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    ${withdrawalSummary.pendingAmount.toLocaleString()} por procesar
                  </p>
                </div>

                {/* Withdrawal Summary */}
                <div className="rounded-xl border border-border/50 bg-card p-5">
                  <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" /> Resumen de Retiros
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground font-body">
                        <Building2 className="h-3 w-3" /> Banco
                      </span>
                      <span className="font-heading font-semibold">{withdrawalSummary.bankPending} · ${withdrawalSummary.bankAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground font-body">
                        <Bitcoin className="h-3 w-3" /> Crypto
                      </span>
                      <span className="font-heading font-semibold">{withdrawalSummary.cryptoPending} · ${withdrawalSummary.cryptoAmount.toLocaleString()}</span>
                    </div>
                    <hr className="border-border/50" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-body">Total aprobado</span>
                      <span className="font-heading font-semibold text-green-500">${withdrawalSummary.approvedAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Report Buttons */}
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
                  <Download className="h-4 w-4" /> Generar Reportes
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" className="gap-2 text-xs font-heading" onClick={() => generateDailyReport('all')}>
                    <Download className="h-3 w-3" /> Reporte Completo
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-xs font-heading" onClick={() => generateDailyReport('bank')}>
                    <Building2 className="h-3 w-3" /> Reporte Banco
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-xs font-heading" onClick={() => generateDailyReport('crypto')}>
                    <Bitcoin className="h-3 w-3" /> Reporte Crypto
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── FUND RELEASES TAB ── */}
          {activeTab === 'Fund Releases' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/50 bg-card">
                <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                  <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-primary" /> Entregas aprobadas — pendientes de liberar fondos
                  </h2>
                  <Badge variant="secondary" className="font-heading">{pendingReleases.length} pendientes</Badge>
                </div>
                {pendingReleases.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground font-body">
                    <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500/30" />
                    No hay entregas pendientes de liberación
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/50">
                          <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Misión</th>
                          <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Proyecto</th>
                          <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Explorer</th>
                          <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Monto</th>
                          <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Entrega</th>
                          <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingReleases.map((r: any) => (
                          <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                            <td className="p-4">
                              <div className="text-sm font-heading font-semibold">{r.missionTitle}</div>
                            </td>
                            <td className="p-4 text-sm font-body text-muted-foreground">{r.projectTitle}</td>
                            <td className="p-4">
                              <div className="text-sm font-body">{r.explorerName || r.explorerEmail}</div>
                              {r.explorerName && <div className="text-xs text-muted-foreground">{r.explorerEmail}</div>}
                            </td>
                            <td className="p-4 text-sm font-heading font-bold text-primary">${r.missionReward?.toLocaleString()}</td>
                            <td className="p-4">
                              {r.delivery_url && (
                                <a href={r.delivery_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-body">
                                  <ExternalLink className="h-3 w-3" /> Ver entrega
                                </a>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="gap-1 font-heading text-xs"
                                  onClick={() => setSelectedRelease(r)}>
                                  <Eye className="h-3 w-3" /> Detalle
                                </Button>
                                <Button size="sm" className="gap-1 font-heading text-xs"
                                  onClick={() => handleReleaseFunds(r.id)} disabled={releasingId === r.id}>
                                  <Banknote className="h-3 w-3" /> {releasingId === r.id ? 'Liberando...' : 'Liberar'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Release Detail Modal */}
          <Dialog open={!!selectedRelease} onOpenChange={() => setSelectedRelease(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Detalle de Entrega</DialogTitle>
              </DialogHeader>
              {selectedRelease && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-muted-foreground font-heading uppercase">Misión</p><p className="text-sm font-body font-semibold">{selectedRelease.missionTitle}</p></div>
                    <div><p className="text-xs text-muted-foreground font-heading uppercase">Proyecto</p><p className="text-sm font-body">{selectedRelease.projectTitle}</p></div>
                    <div><p className="text-xs text-muted-foreground font-heading uppercase">Explorer</p><p className="text-sm font-body">{selectedRelease.explorerName || selectedRelease.explorerEmail}</p></div>
                    <div><p className="text-xs text-muted-foreground font-heading uppercase">Monto</p><p className="text-sm font-heading font-bold text-primary">${selectedRelease.missionReward?.toLocaleString()}</p></div>
                  </div>
                  {selectedRelease.delivery_url && (
                    <div>
                      <p className="text-xs text-muted-foreground font-heading uppercase mb-1">URL de Entrega</p>
                      <a href={selectedRelease.delivery_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline font-body break-all flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 shrink-0" /> {selectedRelease.delivery_url}
                      </a>
                    </div>
                  )}
                  {selectedRelease.review_note && (
                    <div>
                      <p className="text-xs text-muted-foreground font-heading uppercase mb-1">Nota de Revisión</p>
                      <p className="text-sm font-body italic">{selectedRelease.review_note}</p>
                    </div>
                  )}
                  <Button className="w-full gap-2 font-heading" onClick={() => handleReleaseFunds(selectedRelease.id)}
                    disabled={releasingId === selectedRelease.id}>
                    <Banknote className="h-4 w-4" /> {releasingId === selectedRelease.id ? 'Liberando fondos...' : 'Confirmar Liberación de Fondos'}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ── WITHDRAWALS TAB ── */}
          {activeTab === 'Withdrawals' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground font-heading uppercase">Pendientes</p>
                  <p className="text-2xl font-heading font-bold text-yellow-500">{withdrawalSummary.totalPending}</p>
                  <p className="text-xs text-muted-foreground font-body">${withdrawalSummary.pendingAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground font-heading uppercase">Banco Pendiente</p>
                  <p className="text-2xl font-heading font-bold">{withdrawalSummary.bankPending}</p>
                  <p className="text-xs text-muted-foreground font-body">${withdrawalSummary.bankAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground font-heading uppercase">Crypto Pendiente</p>
                  <p className="text-2xl font-heading font-bold">{withdrawalSummary.cryptoPending}</p>
                  <p className="text-xs text-muted-foreground font-body">${withdrawalSummary.cryptoAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground font-heading uppercase">Total Aprobado</p>
                  <p className="text-2xl font-heading font-bold text-green-500">{withdrawalSummary.totalApproved}</p>
                  <p className="text-xs text-muted-foreground font-body">${withdrawalSummary.approvedAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Report Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2 text-xs font-heading" onClick={() => generateDailyReport('all')}>
                  <Download className="h-3 w-3" /> Reporte Completo
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs font-heading" onClick={() => generateDailyReport('bank')}>
                  <Building2 className="h-3 w-3" /> Solo Banco
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs font-heading" onClick={() => generateDailyReport('crypto')}>
                  <Bitcoin className="h-3 w-3" /> Solo Crypto
                </Button>
              </div>

              <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <FilterBar />
                <div className="divide-y divide-border/50">
                  {filterWithdrawals(withdrawalRequests).length === 0 && (
                    <div className="p-8 text-center text-muted-foreground font-body">No hay solicitudes de retiro</div>
                  )}
                  {filterWithdrawals(withdrawalRequests).map((w: any) => {
                    const isPending = w.status === 'pending';
                    return (
                      <div key={w.id} className="p-4 md:p-6 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${w.method === 'bank' ? 'bg-primary/10' : 'bg-accent/50'}`}>
                              {w.method === 'bank' ? <Building2 className="h-4 w-4 text-primary" /> : <Bitcoin className="h-4 w-4 text-primary" />}
                            </div>
                            <div className="space-y-1">
                              <p className="font-heading font-semibold text-sm">${Number(w.amount).toLocaleString()} — {w.explorerEmail}</p>
                              {w.explorerName && <p className="text-xs text-muted-foreground font-body">{w.explorerName}</p>}
                              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 mt-2 space-y-1">
                                <p className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                                  {w.method === 'bank' ? 'Datos bancarios' : 'Datos crypto'}
                                </p>
                                {w.method === 'bank' ? (
                                  <>
                                    <p className="text-sm font-body"><span className="text-muted-foreground">Banco:</span> {w.bank_name || '—'}</p>
                                    <p className="text-sm font-body"><span className="text-muted-foreground">Cuenta:</span> {w.bank_account || '—'}</p>
                                    <p className="text-sm font-body"><span className="text-muted-foreground">Titular:</span> {w.bank_holder || '—'}</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm font-body"><span className="text-muted-foreground">Red:</span> {w.crypto_network || '—'}</p>
                                    <p className="text-sm font-body"><span className="text-muted-foreground">Dirección:</span> <span className="break-all">{w.crypto_address || '—'}</span></p>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-body">{new Date(w.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {statusBadge(w.status)}
                            {w.qr_image_url && (
                              <a href={w.qr_image_url} target="_blank" rel="noopener noreferrer">
                                <img src={w.qr_image_url} alt="QR Code" className="h-24 w-24 rounded-lg border border-border/50 object-cover hover:opacity-80 transition-opacity" />
                              </a>
                            )}
                          </div>
                        </div>
                        {isPending && (
                          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                            <Input placeholder="Nota (opcional)" value={withdrawalNotes[w.id] || ''}
                              onChange={(e) => setWithdrawalNotes(prev => ({ ...prev, [w.id]: e.target.value }))} className="flex-1 text-sm" />
                            <div className="flex gap-2">
                              <Button size="sm" className="gap-1 font-heading text-xs" onClick={() => handleProcessWithdrawal(w.id, 'approved')} disabled={processingId === w.id}>
                                <CheckCircle className="h-3 w-3" /> Aprobar
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 font-heading text-xs text-destructive border-destructive/30"
                                onClick={() => handleProcessWithdrawal(w.id, 'rejected')} disabled={processingId === w.id}>
                                <XCircle className="h-3 w-3" /> Rechazar
                              </Button>
                            </div>
                          </div>
                        )}
                        {w.admin_note && <p className="text-sm text-muted-foreground font-body italic">Nota: {w.admin_note}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── MISSIONS TAB ── */}
          {activeTab === 'Missions' && (
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-muted/30">
                <span className="text-xs font-heading uppercase tracking-wider text-muted-foreground">Filtro:</span>
                {[
                  { value: 'active', label: 'Activas' },
                  { value: 'completed', label: 'Completadas' },
                  { value: 'rejected', label: 'Rechazadas' },
                  { value: 'all', label: 'Todas' },
                ].map(f => (
                  <Button key={f.value} variant={missionFilter === f.value ? 'default' : 'outline'} size="sm"
                    className="text-xs font-heading" onClick={() => setMissionFilter(f.value)}>{f.label}</Button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/50">
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Misión</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Proyecto</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Skill</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Recompensa</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Pago</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Estado</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missions
                      .filter(m => {
                        if (missionFilter === 'active') return ['open', 'approved'].includes(m.status);
                        if (missionFilter === 'completed') return m.status === 'completed';
                        if (missionFilter === 'rejected') return m.status === 'rejected';
                        return true;
                      })
                      .map(m => (
                        <>
                          <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer"
                            onClick={() => setExpandedMission(expandedMission === m.id ? null : m.id)}>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {expandedMission === m.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                                <div>
                                  <div className="text-sm font-heading font-semibold">{m.title}</div>
                                  <div className="text-xs text-muted-foreground font-body mt-1">{m.hours}h @ ${m.hourly_rate}/hr</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm font-body">{m.projects?.title || '—'}</td>
                            <td className="p-4"><span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">{m.skill}</span></td>
                            <td className="p-4 text-sm font-heading font-semibold text-primary">${Number(m.reward).toLocaleString()}</td>
                            <td className="p-4">{statusBadge(m.projects?.payment_status || 'unpaid')}</td>
                            <td className="p-4">{statusBadge(m.status)}</td>
                            <td className="p-4" onClick={e => e.stopPropagation()}>
                              {m.status === 'open' && (
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" className="text-xs font-heading text-green-500 gap-1"
                                    onClick={() => handleApproveMission(m.id)} disabled={m.projects?.payment_status !== 'paid'}
                                    title={m.projects?.payment_status !== 'paid' ? 'El proyecto debe estar pagado' : 'Aprobar misión'}>
                                    <CheckCircle className="h-3 w-3" /> Aprobar
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-xs font-heading text-destructive gap-1" onClick={() => handleRejectMission(m.id)}>
                                    <XCircle className="h-3 w-3" /> Rechazar
                                  </Button>
                                </div>
                              )}
                              {m.status === 'approved' && <span className="text-xs text-green-500 font-heading">✓ Aprobada</span>}
                              {m.status === 'rejected' && <span className="text-xs text-destructive font-heading">✗ Rechazada</span>}
                              {m.status === 'completed' && <span className="text-xs text-muted-foreground font-heading">✓ Completada</span>}
                            </td>
                          </tr>
                          {expandedMission === m.id && (
                            <tr key={`${m.id}-detail`} className="border-b border-border/50 bg-muted/20">
                              <td colSpan={7} className="p-6">
                                <div className="space-y-4">
                                  <h4 className="font-heading font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                    <Image className="h-4 w-4" /> Prueba de Pago del Proyecto
                                  </h4>
                                  {m.projects?.payment_screenshot_url ? (
                                    <div className="space-y-3">
                                      <a href={m.projects.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img src={m.projects.payment_screenshot_url} alt="Comprobante de pago"
                                          className="max-w-md max-h-80 rounded-lg border border-border/50 object-contain hover:opacity-90 transition-opacity" />
                                      </a>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground font-body italic">No se proporcionó captura de pago</p>
                                  )}
                                  {m.projects?.tx_hash && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground font-heading uppercase">TX Hash:</span>
                                      <code className="font-mono text-xs text-primary bg-primary/5 px-2 py-1 rounded">{m.projects.tx_hash}</code>
                                    </div>
                                  )}
                                  {m.description && (
                                    <div>
                                      <span className="text-xs text-muted-foreground font-heading uppercase">Descripción:</span>
                                      <p className="text-sm font-body mt-1">{m.description}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    {missions.length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground font-body">No hay misiones</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PROJECTS TAB ── */}
          {activeTab === 'Projects' && (
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/50">
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Proyecto</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Propietario</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Budget</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Pago</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Estado</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <div className="text-sm font-heading font-semibold">{p.title}</div>
                          <div className="text-xs text-muted-foreground font-body mt-1">{p.category} • {p.priority}</div>
                        </td>
                        <td className="p-4 text-sm font-body">{p.profiles?.email || '—'}</td>
                        <td className="p-4 text-sm font-heading font-semibold text-primary">${Number(p.budget).toLocaleString()}</td>
                        <td className="p-4">{statusBadge(p.payment_status)}</td>
                        <td className="p-4">{statusBadge(p.status)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {p.payment_status !== 'paid' && (
                              <Button variant="ghost" size="sm" className="text-xs font-heading text-green-500 gap-1" onClick={() => handlePaymentStatus(p.id, 'paid')}>
                                <CreditCard className="h-3 w-3" /> Marcar Pagado
                              </Button>
                            )}
                            {p.payment_status === 'paid' && (
                              <Button variant="ghost" size="sm" className="text-xs font-heading text-yellow-500 gap-1" onClick={() => handlePaymentStatus(p.id, 'unpaid')}>
                                <CreditCard className="h-3 w-3" /> Marcar No Pagado
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground font-body">No hay proyectos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === 'Users' && (
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/50">
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Email</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Nombre</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Tipo</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Registro</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                        <td className="p-4 text-sm font-body">{u.email}</td>
                        <td className="p-4 text-sm font-body">{u.full_name || '—'}</td>
                        <td className="p-4">{statusBadge(u.account_type)}</td>
                        <td className="p-4 text-sm text-muted-foreground font-body">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          {u.id !== user?.id && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="text-xs font-heading text-destructive gap-1" onClick={() => handleSuspendUser(u.id)}>
                                <Ban className="h-3 w-3" /> Suspender
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs font-heading text-green-500 gap-1" onClick={() => handleActivateUser(u.id)}>
                                <UserCheck className="h-3 w-3" /> Activar
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-body">No hay usuarios</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PAYMENTS TAB ── */}
          {activeTab === 'Payments' && (
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/50">
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Misión</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Proyecto</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Explorer</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Monto</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Entregado</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Revisado</th>
                      <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((p: any) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                        <td className="p-4 text-sm font-heading font-semibold">{p.missionTitle}</td>
                        <td className="p-4 text-sm font-body">{p.projectTitle}</td>
                        <td className="p-4">
                          <div className="text-sm font-body">{p.explorerEmail}</div>
                          {p.explorerName && <div className="text-xs text-muted-foreground">{p.explorerName}</div>}
                        </td>
                        <td className="p-4 text-sm font-heading font-semibold text-primary">${Number(p.missionReward).toLocaleString()}</td>
                        <td className="p-4 text-xs text-muted-foreground font-body">{p.delivered_at ? new Date(p.delivered_at).toLocaleDateString() : '—'}</td>
                        <td className="p-4 text-xs text-muted-foreground font-body">{p.reviewed_at ? new Date(p.reviewed_at).toLocaleDateString() : '—'}</td>
                        <td className="p-4">
                          <span className={`text-xs font-heading font-semibold px-2 py-1 rounded-full ${
                            p.status === 'funds_released' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                          }`}>{p.status === 'funds_released' ? 'PAGADO' : p.status.toUpperCase()}</span>
                        </td>
                      </tr>
                    ))}
                    {paymentHistory.length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground font-body">No hay pagos registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REVENUE TAB ── */}
          {activeTab === 'Revenue' && stats && (
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">Budget Total</p>
                  <p className="text-2xl font-heading font-bold mt-1">${stats.totalBudget?.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">Budget Pagado</p>
                  <p className="text-2xl font-heading font-bold text-green-500 mt-1">${stats.paidBudget?.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">Comisión GOPHORA (10%)</p>
                  <p className="text-2xl font-heading font-bold text-primary mt-1">${stats.commission?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── COURSES TAB ── */}
          {activeTab === 'Courses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> Dream Academy — Cursos ({adminCourses.length})
                </h2>
                <Button onClick={() => setShowAddCourse(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Agregar Curso
                </Button>
              </div>

              {/* Add Course Form */}
              {showAddCourse && (
                <div className="rounded-xl border border-primary/30 bg-card p-6 space-y-4">
                  <h3 className="font-heading font-bold text-lg">Nuevo Curso</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Título (EN) *</label>
                      <Input value={newCourse.title} onChange={e => setNewCourse(c => ({ ...c, title: e.target.value }))} placeholder="Course title" />
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Título (ES)</label>
                      <Input value={newCourse.title_es} onChange={e => setNewCourse(c => ({ ...c, title_es: e.target.value }))} placeholder="Título del curso" />
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Descripción (EN)</label>
                      <Textarea value={newCourse.description} onChange={e => setNewCourse(c => ({ ...c, description: e.target.value }))} placeholder="Course description" rows={2} />
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Descripción (ES)</label>
                      <Textarea value={newCourse.description_es} onChange={e => setNewCourse(c => ({ ...c, description_es: e.target.value }))} placeholder="Descripción del curso" rows={2} />
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Plataforma</label>
                      <Input value={newCourse.platform} onChange={e => setNewCourse(c => ({ ...c, platform: e.target.value }))} placeholder="YouTube, Coursera, etc." />
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">URL del Curso *</label>
                      <Input value={newCourse.external_url} onChange={e => setNewCourse(c => ({ ...c, external_url: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Ruta de Aprendizaje *</label>
                      <Select value={newCourse.path_id} onValueChange={v => setNewCourse(c => ({ ...c, path_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar ruta" /></SelectTrigger>
                        <SelectContent>
                          {academyPaths.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Idioma</label>
                      <Select value={newCourse.language} onValueChange={v => setNewCourse(c => ({ ...c, language: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="es">🇪🇸 Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Nivel</label>
                      <Select value={newCourse.skill_level} onValueChange={v => setNewCourse(c => ({ ...c, skill_level: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Categoría</label>
                      <Select value={newCourse.category} onValueChange={v => setNewCourse(c => ({ ...c, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai-foundations">AI Foundations</SelectItem>
                          <SelectItem value="automation">Automation</SelectItem>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Duración (minutos)</label>
                      <Input type="number" value={newCourse.duration_minutes} onChange={e => setNewCourse(c => ({ ...c, duration_minutes: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="text-xs font-heading font-semibold text-muted-foreground">Skills (separadas por coma)</label>
                      <Input value={newCourse.skills_learned} onChange={e => setNewCourse(c => ({ ...c, skills_learned: e.target.value }))} placeholder="Prompt Design, Automation, ..." />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddCourse(false)}>Cancelar</Button>
                    <Button onClick={handleAddCourse} disabled={!newCourse.title || !newCourse.path_id}>
                      <Plus className="h-4 w-4 mr-1" /> Crear Curso
                    </Button>
                  </div>
                </div>
              )}

              {/* Courses Table */}
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="p-3 text-left text-xs font-heading font-semibold text-muted-foreground">Curso</th>
                        <th className="p-3 text-left text-xs font-heading font-semibold text-muted-foreground">Ruta</th>
                        <th className="p-3 text-left text-xs font-heading font-semibold text-muted-foreground">Plataforma</th>
                        <th className="p-3 text-left text-xs font-heading font-semibold text-muted-foreground">Estado</th>
                        <th className="p-3 text-left text-xs font-heading font-semibold text-muted-foreground">Idioma</th>
                        <th className="p-3 text-left text-xs font-heading font-semibold text-muted-foreground">Video</th>
                        <th className="p-3 text-left text-xs font-heading font-semibold text-muted-foreground">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminCourses.map((course: any) => (
                        <tr key={course.id} className="border-b border-border/30 hover:bg-muted/20">
                          <td className="p-3">
                            <p className="text-sm font-heading font-semibold">{course.title}</p>
                            {course.title_es && <p className="text-xs text-muted-foreground">{course.title_es}</p>}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{course.path_title}</td>
                          <td className="p-3 text-xs">{course.platform}</td>
                          <td className="p-3">
                            {course.course_status === 'published' ? (
                              <Badge className="bg-green-500/10 text-green-500 text-xs">Publicado</Badge>
                            ) : course.course_status === 'pending_review' ? (
                              <Badge className="bg-yellow-500/10 text-yellow-500 text-xs">Pendiente</Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground text-xs">{course.course_status}</Badge>
                            )}
                          </td>
                          <td className="p-3 text-xs">{course.language === 'es' ? '🇪🇸' : '🇺🇸'}</td>
                          <td className="p-3">
                            {course.external_url && isYouTubeUrl(course.external_url) ? (
                              <Button variant="ghost" size="sm" className="text-primary gap-1" onClick={() => setSelectedCoursePreview(course)}>
                                <Play className="h-3 w-3" /> Preview
                              </Button>
                            ) : course.external_url ? (
                              <a href={course.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Abrir
                              </a>
                            ) : '—'}
                          </td>
                          <td className="p-3 flex items-center gap-1">
                            {course.course_status === 'pending_review' && (
                              <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-400" onClick={async () => {
                                try {
                                  await adminCall('update_course_status', { course_id: course.id, status: 'published' });
                                  toast.success('Curso publicado');
                                  loadData();
                                } catch (err: any) { toast.error(err.message); }
                              }}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {course.course_status === 'published' && (
                              <Button variant="ghost" size="sm" className="text-yellow-500 hover:text-yellow-400" onClick={async () => {
                                try {
                                  await adminCall('update_course_status', { course_id: course.id, status: 'pending_review' });
                                  toast.success('Curso despublicado');
                                  loadData();
                                } catch (err: any) { toast.error(err.message); }
                              }}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteCourse(course.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {adminCourses.length === 0 && (
                        <tr><td colSpan={7} className="p-8 text-center text-muted-foreground font-body">No hay cursos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* YouTube Video Preview Dialog */}
              <Dialog open={!!selectedCoursePreview} onOpenChange={() => setSelectedCoursePreview(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedCoursePreview?.title}</DialogTitle>
                  </DialogHeader>
                  {selectedCoursePreview?.external_url && (
                    <YouTubeVideoPlayer url={selectedCoursePreview.external_url} title={selectedCoursePreview.title} />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ── TUTORS TAB ── */}
          {activeTab === 'Tutors' && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Solicitudes de Tutor ({tutorApplications.length})
              </h2>
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                {tutorApplications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground font-body">No hay solicitudes de tutor</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {tutorApplications.map((app: any) => (
                      <div key={app.id} className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="font-heading font-semibold text-base">{app.full_name || 'Sin nombre'}</p>
                            <p className="text-xs text-muted-foreground">{app.email || app.user_id}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {format(new Date(app.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                            </p>
                          </div>
                          <div>{statusBadge(app.status)}</div>
                        </div>

                        {/* Bio */}
                        <div className="rounded-lg bg-muted/30 p-3">
                          <p className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-1">Biografía</p>
                          <p className="text-sm">{app.bio}</p>
                        </div>

                        {/* Expertise */}
                        {app.expertise && app.expertise.length > 0 && (
                          <div>
                            <p className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-2">Expertise</p>
                            <div className="flex flex-wrap gap-1.5">
                              {app.expertise.map((skill: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Portfolio URL */}
                        {app.portfolio_url && (
                          <div>
                            <p className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-1">Portfolio / Link</p>
                            <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1.5 break-all">
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" /> {app.portfolio_url}
                            </a>
                          </div>
                        )}

                        {/* Admin note if reviewed */}
                        {app.admin_note && (
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nota del Admin</p>
                            <p className="text-sm">{app.admin_note}</p>
                          </div>
                        )}

                        {/* Reviewed date */}
                        {app.reviewed_at && (
                          <p className="text-xs text-muted-foreground">
                            Revisado: {format(new Date(app.reviewed_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                          </p>
                        )}

                        {app.status === 'pending' && (
                          <div className="flex gap-2 justify-end pt-2 border-t border-border/30">
                            <Button size="sm" className="gap-1 text-xs font-heading" onClick={async () => {
                              try { await adminCall('review_tutor', { application_id: app.id, status: 'approved' }); toast.success('Tutor aprobado'); loadData(); } catch (err: any) { toast.error(err.message); }
                            }}>
                              <CheckCircle className="h-3 w-3" /> Aprobar
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-xs font-heading text-destructive" onClick={async () => {
                              try { await adminCall('review_tutor', { application_id: app.id, status: 'rejected' }); toast.success('Tutor rechazado'); loadData(); } catch (err: any) { toast.error(err.message); }
                            }}>
                              <XCircle className="h-3 w-3" /> Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
