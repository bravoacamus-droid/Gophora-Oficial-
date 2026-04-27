import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePassportStats, useExplorerBadges, SKILL_LEVELS, BADGE_DEFINITIONS } from '@/hooks/useSkillPassport';
import CertificateCard from '@/components/CertificateCard';
import { motion } from 'framer-motion';
import {
  Shield, Award, BookOpen, Target, Star, Zap, TrendingUp, Share2,
  CheckCircle, Clock, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar,
  ResponsiveContainer,
} from 'recharts';

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const levelColors: Record<string, string> = {
  'Explorer': 'text-muted-foreground',
  'Advanced Explorer': 'text-blue-500',
  'Elite Explorer': 'text-purple-500',
  'Legendary Explorer': 'text-primary',
};

const levelIcons: Record<string, string> = {
  'Explorer': '🧭',
  'Advanced Explorer': '⚡',
  'Elite Explorer': '🔥',
  'Legendary Explorer': '👑',
};

interface SkillPassportProps {
  explorerId?: string;
  isPublic?: boolean;
}

export default function SkillPassport({ explorerId, isPublic }: SkillPassportProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const { data: stats, isLoading } = usePassportStats(explorerId);
  const { data: badges } = useExplorerBadges(explorerId);
  const [copied, setCopied] = useState(false);
  const [openedBadge, setOpenedBadge] = useState<{ key: string; earned: boolean; awarded?: any } | null>(null);
  const [openedCert, setOpenedCert] = useState<any | null>(null);

  const handleShare = () => {
    // Prefer the user's stable public_slug. Fall back to the user_id if the
    // slug isn't loaded yet (shouldn't happen post-migration but is safe).
    const slug = stats?.publicSlug || explorerId;
    if (!slug) {
      toast.error(isEs ? 'Pasaporte aún no disponible para compartir' : 'Passport not ready to share yet');
      return;
    }
    const url = `${window.location.origin}/passport/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(
      isEs ? 'Link copiado al portapapeles' : 'Link copied to clipboard',
      { description: url }
    );
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-muted-foreground font-body">
        {isEs ? 'No se encontró el pasaporte.' : 'Passport not found.'}
      </div>
    );
  }

  // Radar chart data from categories
  const radarData = Object.entries(stats.categories).map(([cat, skills]) => {
    const avg = skills.reduce((s: number, sk: any) => s + (sk.skill_level || 1), 0) / skills.length;
    return { category: cat, value: Math.round(avg * 20), fullMark: 100 };
  });

  // If no categories, use placeholder
  const hasRadar = radarData.length >= 3;

  const displayName =
    stats.profile?.full_name
      || (stats.profile?.username ? `@${stats.profile.username}` : null)
      || (stats as any).explorerProfile?.name
      || (isEs ? 'Explorador' : 'Explorer');

  return (
    <div className="space-y-6">
      {/* ─── Passport Header ─── */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0}>
        <Card className="overflow-hidden border-primary/20">
          <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-3xl shrink-0">
                  {levelIcons[stats.level] || '🧭'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
                      {isEs ? 'Pasaporte de Habilidades' : 'Skill Passport'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-heading font-black mt-1">{displayName}</h2>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-primary text-primary-foreground font-heading font-bold text-[10px] h-5 px-1.5">
                        Lvl {stats.calculatedLevel || 1}
                      </Badge>
                      <span className={`text-sm font-heading font-bold ${levelColors[stats.level] || 'text-foreground'}`}>
                        {isEs ? stats.levelEs : stats.level}
                      </span>
                    </div>
                    <div className="w-full md:w-48 space-y-1 mt-1">
                      <div className="flex justify-between text-[9px] font-heading font-bold uppercase tracking-wider text-muted-foreground">
                        <span>XP Progress</span>
                        <span>{stats.levelProgress}%</span>
                      </div>
                      <Progress value={stats.levelProgress} className="h-1.5 bg-primary/10" />
                    </div>
                  </div>
                </div>
              </div>
              {!isPublic && (
                <Button variant="outline" size="sm" className="gap-2 font-heading text-xs" onClick={handleShare}>
                  {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                  {copied ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Compartir Pasaporte' : 'Share Passport')}
                </Button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
              {[
                { icon: BookOpen, label: isEs ? 'Cursos' : 'Courses', value: stats.coursesCompleted },
                { icon: CheckCircle, label: isEs ? 'Exámenes' : 'Exams', value: stats.examsPassed },
                { icon: Target, label: isEs ? 'Misiones' : 'Missions', value: stats.missionsCompleted },
                { icon: Star, label: isEs ? 'Habilidades' : 'Skills', value: stats.skills.length },
                { icon: Award, label: isEs ? 'Insignias' : 'Badges', value: (badges || []).length },
                { icon: Zap, label: 'Total XP', value: stats.totalXP || 0 },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/30">
                  <stat.icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-lg font-heading font-bold leading-none">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Bio + Track Record ─── */}
      {(stats.profile?.bio || stats.missionsCompleted > 0 || (stats as any).rating != null) && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0.5}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                {isEs ? 'Trayectoria pública' : 'Public track record'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.profile?.bio && (
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{stats.profile.bio}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-heading font-bold uppercase tracking-wider text-muted-foreground">
                      {isEs ? 'Misiones entregadas' : 'Missions delivered'}
                    </span>
                  </div>
                  <p className="text-lg font-heading font-bold">{stats.missionsCompleted}</p>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-heading font-bold uppercase tracking-wider text-muted-foreground">
                      {isEs ? 'Tiempo prom. entrega' : 'Avg delivery time'}
                    </span>
                  </div>
                  <p className="text-lg font-heading font-bold">
                    {(stats as any).avgDeliveryHours != null
                      ? `${(stats as any).avgDeliveryHours}h`
                      : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star className="h-3 w-3 text-amber-500" />
                    <span className="text-[9px] font-heading font-bold uppercase tracking-wider text-muted-foreground">
                      {isEs ? 'Calificación' : 'Rating'}
                    </span>
                  </div>
                  <p className="text-lg font-heading font-bold">
                    {(stats as any).rating != null && (stats as any).rating > 0
                      ? `${Number((stats as any).rating).toFixed(1)} ★`
                      : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-heading font-bold uppercase tracking-wider text-muted-foreground">
                      {isEs ? 'Ganado en GOPHORA' : 'Earned on GOPHORA'}
                    </span>
                  </div>
                  <p className="text-lg font-heading font-bold">${(stats.totalEarnings || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Mission Readiness ─── */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={1}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isEs ? 'Puntuación de Preparación para Misiones' : 'Mission Readiness Score'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="3"
                    strokeDasharray={`${stats.readinessScore} ${100 - stats.readinessScore}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-heading font-black">
                  {stats.readinessScore}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  { label: isEs ? 'Cursos' : 'Courses', value: Math.min(stats.coursesCompleted * 20, 100) },
                  { label: isEs ? 'Habilidades' : 'Skills', value: Math.min(stats.skills.length * 15, 100) },
                  { label: isEs ? 'Exámenes' : 'Exams', value: stats.avgExamScore },
                  { label: isEs ? 'Misiones' : 'Missions', value: Math.min(stats.missionsCompleted * 10, 100) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-body w-20 shrink-0">{item.label}</span>
                    <Progress value={item.value} className="h-1.5 flex-1" />
                    <span className="text-xs font-heading font-semibold w-8 text-right">{Math.round(item.value)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Tabs: Skills / Badges / Radar ─── */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={2}>
        <Tabs defaultValue="skills">
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto border-b border-border/50 rounded-none gap-0">
            <TabsTrigger value="skills" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 font-heading text-sm">
              {isEs ? 'Habilidades' : 'Skills'}
            </TabsTrigger>
            <TabsTrigger value="badges" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 font-heading text-sm">
              {isEs ? 'Insignias' : 'Badges'}
            </TabsTrigger>
            {hasRadar && (
              <TabsTrigger value="radar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 font-heading text-sm">
                {isEs ? 'Radar' : 'Radar'}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Skills Tab */}
          <TabsContent value="skills" className="mt-4">
            {Object.entries(stats.categories).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground font-body text-sm">
                {isEs ? 'Aún no tienes habilidades verificadas. ¡Completa cursos y exámenes!' : 'No verified skills yet. Complete courses and exams!'}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(stats.categories).map(([category, skills]) => (
                  <div key={category}>
                    <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      {category}
                    </h3>
                    <div className="grid gap-2">
                      {(skills as any[]).map((skill: any) => {
                        const levelInfo = SKILL_LEVELS[skill.skill_level as number] || SKILL_LEVELS[1];
                        return (
                          <div key={skill.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-semibold text-sm">{skill.skill_name}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {isEs ? levelInfo.es : levelInfo.en}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                                {isEs ? 'Verificado por' : 'Verified by'} {skill.verification_source || 'exam'}
                              </p>
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <div
                                  key={n}
                                  className={`w-2.5 h-2.5 rounded-full ${n <= (skill.skill_level || 1) ? 'bg-primary' : 'bg-muted'}`}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BADGE_DEFINITIONS.map((def) => {
                const awarded = (badges || []).find((b: any) => b.badge_key === def.key);
                const earned = !!awarded;
                return (
                  <button
                    key={def.key}
                    type="button"
                    onClick={() => setOpenedBadge({ key: def.key, earned, awarded })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all hover:scale-[1.02] ${earned
                        ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer'
                        : 'border-border/20 opacity-50 grayscale hover:opacity-80 cursor-pointer'
                      }`}
                  >
                    <span className="text-2xl">{earned ? def.icon : '🔒'}</span>
                    <span className="text-xs font-heading font-bold leading-tight">
                      {isEs ? def.nameEs : def.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-body">{def.condition}</span>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* Radar Tab */}
          {hasRadar && (
            <TabsContent value="radar" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <RechartsRadar
                          name="Skills"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>

      {/* ─── Certificates ─── */}
      {stats.certificates.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={3}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                {isEs ? 'Certificados' : 'Certificates'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {stats.certificates.map((cert: any) => (
                  <button
                    key={cert.id}
                    type="button"
                    onClick={() => setOpenedCert(cert)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm truncate group-hover:text-primary transition-colors">{cert.course_title}</p>
                      <p className="text-[10px] text-muted-foreground font-body">
                        {new Date(cert.issued_at).toLocaleDateString()} • {cert.certificate_code}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEs ? 'Ver' : 'View'} →
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Badge detail modal ─── */}
      <Dialog open={!!openedBadge} onOpenChange={(o) => !o && setOpenedBadge(null)}>
        <DialogContent className="max-w-md">
          {openedBadge && (() => {
            const def = BADGE_DEFINITIONS.find((b) => b.key === openedBadge.key);
            if (!def) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading flex items-center gap-2">
                    <span className="text-3xl">{openedBadge.earned ? def.icon : '🔒'}</span>
                    <span>{isEs ? def.nameEs : def.name}</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className={`rounded-lg border p-4 ${openedBadge.earned ? 'border-primary/30 bg-primary/5' : 'border-border/40 bg-muted/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {openedBadge.earned ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={`text-xs font-heading font-bold uppercase tracking-wider ${openedBadge.earned ? 'text-primary' : 'text-muted-foreground'}`}>
                        {openedBadge.earned
                          ? (isEs ? 'Insignia obtenida' : 'Badge earned')
                          : (isEs ? 'Insignia bloqueada' : 'Badge locked')}
                      </span>
                    </div>
                    <p className="text-sm font-body">
                      <span className="font-heading font-bold">{isEs ? 'Cómo se obtiene: ' : 'How to earn: '}</span>
                      {def.condition}
                    </p>
                    {openedBadge.earned && openedBadge.awarded?.earned_at && (
                      <p className="text-xs text-muted-foreground font-body mt-2">
                        {isEs ? 'Otorgada el ' : 'Awarded on '}
                        {new Date(openedBadge.awarded.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {!openedBadge.earned && !isPublic && (
                    <p className="text-xs text-muted-foreground font-body">
                      {isEs
                        ? 'Seguí completando misiones, exámenes y cursos para desbloquearla. La verificamos automáticamente.'
                        : 'Keep finishing missions, exams and courses to unlock it. We verify automatically.'}
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Certificate modal ─── */}
      <Dialog open={!!openedCert} onOpenChange={(o) => !o && setOpenedCert(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {openedCert && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  {openedCert.course_title}
                </DialogTitle>
              </DialogHeader>
              <div className="pt-2">
                <CertificateCard certificate={openedCert} isEs={isEs} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
