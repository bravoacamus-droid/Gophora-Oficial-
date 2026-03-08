import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Clock, DollarSign, User, Zap } from 'lucide-react';

const missions = [
  { id: 1, title: 'Design Mobile App Onboarding', skill: 'Design', time: '4h', reward: '$150', client: 'TechCorp', status: 'Available' },
  { id: 2, title: 'Build REST API Endpoints', skill: 'Web Development', time: '8h', reward: '$320', client: 'StartupXYZ', status: 'Available' },
  { id: 3, title: 'SEO Audit & Report', skill: 'Marketing', time: '3h', reward: '$100', client: 'AgencyPro', status: 'Available' },
  { id: 4, title: 'Data Visualization Dashboard', skill: 'Data', time: '6h', reward: '$250', client: 'DataCo', status: 'Available' },
  { id: 5, title: 'Competitive Analysis Report', skill: 'Research', time: '5h', reward: '$180', client: 'InnovateLab', status: 'Available' },
  { id: 6, title: 'Email Template Design', skill: 'Design', time: '2h', reward: '$80', client: 'MailFlow', status: 'Available' },
  { id: 7, title: 'Database Schema Optimization', skill: 'Web Development', time: '4h', reward: '$200', client: 'CloudBase', status: 'Available' },
  { id: 8, title: 'Social Media Content Plan', skill: 'Marketing', time: '3h', reward: '$120', client: 'BrandUp', status: 'Available' },
];

const skills = ['All', 'Design', 'Web Development', 'Marketing', 'Data', 'Research', 'Operations'];

const Marketplace = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');

  const filtered = missions.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchSkill = selectedSkill === 'All' || m.skill === selectedSkill;
    return matchSearch && matchSkill;
  });

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold">{t('marketplace.title')}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t('marketplace.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {skills.map(skill => (
            <Button
              key={skill}
              variant={selectedSkill === skill ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSkill(skill)}
              className="font-heading text-xs whitespace-nowrap"
            >
              {skill}
            </Button>
          ))}
        </div>
      </div>

      {/* Mission Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(mission => (
          <div key={mission.id} className="rounded-xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                {mission.skill}
              </span>
              <Zap className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-heading font-bold mb-3">{mission.title}</h3>
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground font-body">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {mission.time}</span>
              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {mission.reward}</span>
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {mission.client}</span>
            </div>
            <Button className="w-full font-heading text-xs tracking-wide" size="sm">
              {t('marketplace.apply')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
