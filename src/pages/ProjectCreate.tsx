import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { Cpu, Upload, Zap } from 'lucide-react';

const categories = ['Marketing', 'Web Development', 'Design', 'Data', 'Research', 'Operations'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];

const ProjectCreate = () => {
  const { t } = useLanguage();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 2000);
  };

  const mockMissions = [
    { title: 'Design wireframes for homepage', skill: 'Design', time: '3h', reward: '$120' },
    { title: 'Develop responsive header component', skill: 'Web Development', time: '4h', reward: '$160' },
    { title: 'Create brand color palette', skill: 'Design', time: '2h', reward: '$80' },
    { title: 'Write SEO-optimized copy', skill: 'Marketing', time: '3h', reward: '$100' },
    { title: 'Setup analytics tracking', skill: 'Data', time: '2h', reward: '$90' },
  ];

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-heading font-bold mb-8">{t('project.create_title')}</h1>

      {!analyzed ? (
        <form onSubmit={handleAnalyze} className="space-y-6 rounded-xl border border-border/50 bg-card p-6">
          <div>
            <Label className="font-heading text-xs tracking-wider uppercase">{t('project.title')}</Label>
            <Input className="mt-1.5" placeholder="E-commerce Website Redesign" required />
          </div>
          <div>
            <Label className="font-heading text-xs tracking-wider uppercase">{t('project.description')}</Label>
            <Textarea className="mt-1.5 min-h-[120px]" placeholder="Describe your project in detail..." required />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-heading text-xs tracking-wider uppercase">{t('project.category')}</Label>
              <select className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 text-sm font-body">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="font-heading text-xs tracking-wider uppercase">{t('project.priority')}</Label>
              <select className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 text-sm font-body">
                {priorities.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-heading text-xs tracking-wider uppercase">{t('project.deadline')}</Label>
              <Input type="date" className="mt-1.5" required />
            </div>
            <div>
              <Label className="font-heading text-xs tracking-wider uppercase">{t('project.budget')}</Label>
              <Input type="number" className="mt-1.5" placeholder="5000" required />
            </div>
          </div>
          <div>
            <Label className="font-heading text-xs tracking-wider uppercase">{t('project.files')}</Label>
            <div className="mt-1.5 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-body">Drag & drop files or click to browse</p>
            </div>
          </div>
          <Button type="submit" variant="hero" className="w-full gap-2" disabled={analyzing}>
            {analyzing ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" /> {t('project.analyze')}
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="h-6 w-6 text-primary" />
              <h2 className="font-heading font-bold text-lg">AI Mission Architect</h2>
            </div>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Your project has been analyzed and divided into {mockMissions.length} executable micro-missions.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/50">
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Mission</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Skill</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Time</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Reward</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockMissions.map((m, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-body text-sm">{m.title}</td>
                      <td className="p-4">
                        <span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">{m.skill}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-body">{m.time}</td>
                      <td className="p-4 text-sm font-heading font-semibold text-primary">{m.reward}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-xs font-heading">Edit</Button>
                          <Button variant="ghost" size="sm" className="text-xs font-heading text-destructive">Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setAnalyzed(false)} className="font-heading">Back to Edit</Button>
            <Button variant="hero" className="flex-1 font-heading gap-2">
              <Zap className="h-4 w-4" /> Publish Missions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCreate;
