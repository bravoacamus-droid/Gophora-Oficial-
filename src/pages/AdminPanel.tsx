import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Building2, FolderOpen, Zap, DollarSign, BarChart3 } from 'lucide-react';

const tabs = ['Users', 'Companies', 'Projects', 'Missions', 'Revenue Metrics'] as const;
const tabIcons = { Users, Companies: Building2, Projects: FolderOpen, Missions: Zap, 'Revenue Metrics': BarChart3 };

const mockUsers = [
  { email: 'john@techcorp.com', type: 'Company', status: 'Verified', joined: '2025-12-01' },
  { email: 'jane@startup.io', type: 'Company', status: 'Verified', joined: '2025-12-15' },
  { email: 'dev@explorer.com', type: 'Explorer', status: 'Verified', joined: '2026-01-03' },
  { email: 'design@explorer.com', type: 'Explorer', status: 'Pending', joined: '2026-02-20' },
];

const mockCompanies = [
  { name: 'TechCorp', domain: 'techcorp.com', users: 3, projects: 5 },
  { name: 'StartupXYZ', domain: 'startup.io', users: 2, projects: 3 },
];

const AdminPanel = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Users');

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-heading font-bold mb-8">{t('admin.title')}</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Users', value: '156', icon: Users },
          { label: 'Companies', value: '24', icon: Building2 },
          { label: 'Projects', value: '47', icon: FolderOpen },
          { label: 'Missions', value: '312', icon: Zap },
          { label: 'Revenue', value: '$18,400', icon: DollarSign },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 text-center">
            <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-xl font-heading font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-body">{stat.label}</div>
          </div>
        ))}
      </div>

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

      {/* Tab Content */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {activeTab === 'Users' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Email</th>
                  <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Type</th>
                  <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Status</th>
                  <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Joined</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((u, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-4 text-sm font-body">{u.email}</td>
                    <td className="p-4"><span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">{u.type}</span></td>
                    <td className="p-4"><span className={`text-xs font-heading font-semibold px-2 py-1 rounded-full ${u.status === 'Verified' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{u.status}</span></td>
                    <td className="p-4 text-sm text-muted-foreground font-body">{u.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'Companies' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Company</th>
                  <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Domain</th>
                  <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Users</th>
                  <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Projects</th>
                </tr>
              </thead>
              <tbody>
                {mockCompanies.map((c, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-4 text-sm font-heading font-semibold">{c.name}</td>
                    <td className="p-4 text-sm text-muted-foreground font-body">{c.domain}</td>
                    <td className="p-4 text-sm font-body">{c.users}</td>
                    <td className="p-4 text-sm font-body">{c.projects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(activeTab === 'Projects' || activeTab === 'Missions') && (
          <div className="p-12 text-center text-muted-foreground font-body">
            <Zap className="h-8 w-8 mx-auto mb-3 text-primary/30" />
            <p>{activeTab} management coming soon</p>
          </div>
        )}
        {activeTab === 'Revenue Metrics' && (
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-heading font-bold text-primary mt-1">$18,400</p>
              </div>
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">Talent Payments</p>
                <p className="text-2xl font-heading font-bold mt-1">$16,560</p>
              </div>
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">GOPHORA Commission (10%)</p>
                <p className="text-2xl font-heading font-bold text-primary mt-1">$1,840</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
