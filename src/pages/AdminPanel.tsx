import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, FolderOpen, Zap, DollarSign, BarChart3, CheckCircle, XCircle, Ban, UserCheck, CreditCard, Banknote, ExternalLink, Wallet, Building2, Bitcoin } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const tabs = ['Users', 'Projects', 'Missions', 'Fund Releases', 'Withdrawals', 'Payments', 'Revenue'] as const;
type Tab = typeof tabs[number];
const tabIcons: Record<Tab, any> = { Users, Projects: FolderOpen, Missions: Zap, 'Fund Releases': Banknote, Withdrawals: Wallet, Payments: CreditCard, Revenue: BarChart3 };

const AdminPanel = () => {
  const { t } = useLanguage();
  const { isAdmin, user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Users');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [pendingReleases, setPendingReleases] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [withdrawalNotes, setWithdrawalNotes] = useState<Record<string, string>>({});

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
      const [statsData, usersData, projectsData, missionsData, releasesData, withdrawalsData] = await Promise.all([
        adminCall('get_stats'),
        adminCall('get_users'),
        adminCall('get_projects'),
        adminCall('get_missions'),
        adminCall('get_pending_releases'),
        adminCall('get_withdrawals'),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setProjects(projectsData);
      setMissions(missionsData);
      setPendingReleases(releasesData || []);
      setWithdrawalRequests(withdrawalsData || []);
    } catch (err: any) {
      console.error('Admin load error:', err);
      toast.error(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [adminCall]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handlePaymentStatus = async (projectId: string, status: string) => {
    try {
      await adminCall('update_payment_status', { project_id: projectId, payment_status: status });
      toast.success(`Payment marked as ${status}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApproveMission = async (missionId: string) => {
    try {
      await adminCall('approve_mission', { mission_id: missionId });
      toast.success('Mission approved');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRejectMission = async (missionId: string) => {
    try {
      await adminCall('reject_mission', { mission_id: missionId });
      toast.success('Mission rejected');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReleaseFunds = async (applicationId: string) => {
    setReleasingId(applicationId);
    try {
      await adminCall('release_funds', { application_id: applicationId });
      toast.success('Fondos liberados exitosamente');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReleasingId(null);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await adminCall('suspend_user', { user_id: userId });
      toast.success('User suspended');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingId(withdrawalId);
    try {
      await adminCall('process_withdrawal', {
        withdrawal_id: withdrawalId,
        new_status: newStatus,
        admin_note: withdrawalNotes[withdrawalId] || null,
      });
      toast.success(newStatus === 'approved' ? 'Retiro aprobado' : 'Retiro rechazado');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await adminCall('activate_user', { user_id: userId });
      toast.success('User activated');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-500/10 text-blue-500',
      approved: 'bg-green-500/10 text-green-500',
      rejected: 'bg-destructive/10 text-destructive',
      paid: 'bg-green-500/10 text-green-500',
      unpaid: 'bg-yellow-500/10 text-yellow-500',
      pending: 'bg-yellow-500/10 text-yellow-500',
      active: 'bg-green-500/10 text-green-500',
    };
    return (
      <span className={`text-xs font-heading font-semibold px-2 py-1 rounded-full ${colors[status] || 'bg-muted text-muted-foreground'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-heading font-bold mb-8">{t('admin.title')}</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Users', value: stats.totalUsers, icon: Users },
            { label: 'Projects', value: stats.totalProjects, icon: FolderOpen },
            { label: 'Missions', value: stats.totalMissions, icon: Zap },
            { label: 'Paid Budget', value: `$${stats.paidBudget?.toLocaleString()}`, icon: DollarSign },
            { label: 'Commission', value: `$${stats.commission?.toLocaleString()}`, icon: BarChart3 },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-xl font-heading font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-body">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tabIcons[tab];
          return (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="font-heading text-xs gap-2 whitespace-nowrap"
            >
              <Icon className="h-3 w-3" /> {tab}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          {/* USERS TAB */}
          {activeTab === 'Users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/50">
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Email</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Name</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Type</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Joined</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="p-4 text-sm font-body">{u.email}</td>
                      <td className="p-4 text-sm font-body">{u.full_name || '—'}</td>
                      <td className="p-4">{statusBadge(u.account_type)}</td>
                      <td className="p-4 text-sm text-muted-foreground font-body">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        {u.id !== user?.id && (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-xs font-heading text-destructive gap-1" onClick={() => handleSuspendUser(u.id)}>
                              <Ban className="h-3 w-3" /> Suspend
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs font-heading text-green-500 gap-1" onClick={() => handleActivateUser(u.id)}>
                              <UserCheck className="h-3 w-3" /> Activate
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-body">No users yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'Projects' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/50">
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Project</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Owner</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Budget</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Payment</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Status</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
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
                              <CreditCard className="h-3 w-3" /> Mark Paid
                            </Button>
                          )}
                          {p.payment_status === 'paid' && (
                            <Button variant="ghost" size="sm" className="text-xs font-heading text-yellow-500 gap-1" onClick={() => handlePaymentStatus(p.id, 'unpaid')}>
                              <CreditCard className="h-3 w-3" /> Mark Unpaid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground font-body">No projects yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* MISSIONS TAB */}
          {activeTab === 'Missions' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/50">
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Mission</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Project</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Skill</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Reward</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Payment</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Status</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <div className="text-sm font-heading font-semibold">{m.title}</div>
                        <div className="text-xs text-muted-foreground font-body mt-1">{m.hours}h @ ${m.hourly_rate}/hr</div>
                      </td>
                      <td className="p-4 text-sm font-body">{m.projects?.title || '—'}</td>
                      <td className="p-4">
                        <span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">{m.skill}</span>
                      </td>
                      <td className="p-4 text-sm font-heading font-semibold text-primary">${Number(m.reward).toLocaleString()}</td>
                      <td className="p-4">{statusBadge(m.projects?.payment_status || 'unpaid')}</td>
                      <td className="p-4">{statusBadge(m.status)}</td>
                      <td className="p-4">
                        {m.status === 'open' && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-heading text-green-500 gap-1"
                              onClick={() => handleApproveMission(m.id)}
                              disabled={m.projects?.payment_status !== 'paid'}
                              title={m.projects?.payment_status !== 'paid' ? 'Project must be paid first' : 'Approve mission'}
                            >
                              <CheckCircle className="h-3 w-3" /> Approve
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs font-heading text-destructive gap-1" onClick={() => handleRejectMission(m.id)}>
                              <XCircle className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        )}
                        {m.status === 'approved' && <span className="text-xs text-green-500 font-heading">✓ Approved</span>}
                        {m.status === 'rejected' && <span className="text-xs text-destructive font-heading">✗ Rejected</span>}
                      </td>
                    </tr>
                  ))}
                  {missions.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground font-body">No missions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* FUND RELEASES TAB */}
          {activeTab === 'Fund Releases' && (
            <div className="divide-y divide-border/50">
              {pendingReleases.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-body">No hay entregas aprobadas pendientes de liberación de fondos</div>
              )}
              {pendingReleases.map((r: any) => (
                <div key={r.id} className="p-4 md:p-6 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading font-semibold">{r.missionTitle}</h3>
                      <p className="text-sm text-muted-foreground font-body">
                        {r.projectTitle} • Explorer: {r.explorerName || r.explorerEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-heading font-semibold text-primary">${r.missionReward?.toLocaleString()}</span>
                      <span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                        APROBADA POR EMPRESA
                      </span>
                    </div>
                  </div>
                  {r.delivery_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <a href={r.delivery_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-body truncate">
                        {r.delivery_url}
                      </a>
                    </div>
                  )}
                  {r.review_note && (
                    <p className="text-sm text-muted-foreground font-body italic">Nota: {r.review_note}</p>
                  )}
                  <Button
                    size="sm"
                    className="gap-1 font-heading text-xs"
                    onClick={() => handleReleaseFunds(r.id)}
                    disabled={releasingId === r.id}
                  >
                    <Banknote className="h-3 w-3" />
                    {releasingId === r.id ? 'Liberando...' : 'Liberar fondos'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* WITHDRAWALS TAB */}
          {activeTab === 'Withdrawals' && (
            <div className="divide-y divide-border/50">
              {withdrawalRequests.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-body">No hay solicitudes de retiro</div>
              )}
              {withdrawalRequests.map((w: any) => {
                const isPending = w.status === 'pending';
                return (
                  <div key={w.id} className="p-4 md:p-6 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${w.method === 'bank' ? 'bg-primary/10' : 'bg-accent/50'}`}>
                          {w.method === 'bank' ? <Building2 className="h-4 w-4 text-primary" /> : <Bitcoin className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-sm">
                            ${Number(w.amount).toLocaleString()} — {w.explorerEmail}
                          </p>
                          <p className="text-xs text-muted-foreground font-body">
                            {w.method === 'bank'
                              ? `${w.bank_name} • Cuenta: ${w.bank_account} • Titular: ${w.bank_holder}`
                              : `${w.crypto_network} • ${w.crypto_address}`}
                          </p>
                          <p className="text-xs text-muted-foreground font-body">{new Date(w.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-heading font-semibold px-2 py-1 rounded-full ${
                        w.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        w.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {w.status.toUpperCase()}
                      </span>
                    </div>

                    {isPending && (
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <Input
                          placeholder="Nota (opcional)"
                          value={withdrawalNotes[w.id] || ''}
                          onChange={(e) => setWithdrawalNotes(prev => ({ ...prev, [w.id]: e.target.value }))}
                          className="flex-1 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="gap-1 font-heading text-xs"
                            onClick={() => handleProcessWithdrawal(w.id, 'approved')}
                            disabled={processingId === w.id}
                          >
                            <CheckCircle className="h-3 w-3" /> Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 font-heading text-xs text-destructive border-destructive/30"
                            onClick={() => handleProcessWithdrawal(w.id, 'rejected')}
                            disabled={processingId === w.id}
                          >
                            <XCircle className="h-3 w-3" /> Rechazar
                          </Button>
                        </div>
                      </div>
                    )}

                    {w.admin_note && (
                      <p className="text-sm text-muted-foreground font-body italic">Nota: {w.admin_note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* REVENUE TAB */}
          {activeTab === 'Revenue' && stats && (
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">Total Budget (All Projects)</p>
                  <p className="text-2xl font-heading font-bold mt-1">${stats.totalBudget?.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">Paid Budget</p>
                  <p className="text-2xl font-heading font-bold text-green-500 mt-1">${stats.paidBudget?.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">GOPHORA Commission (10%)</p>
                  <p className="text-2xl font-heading font-bold text-primary mt-1">${stats.commission?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
