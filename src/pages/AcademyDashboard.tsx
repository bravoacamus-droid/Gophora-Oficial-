import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Brain, Zap, Code, Palette, Briefcase, Rocket, Trophy, Star,
  BookOpen, Search, ExternalLink, CheckCircle2, Circle, Clock,
  Wrench, Share2, MessageSquare, TrendingUp, Target, Award,
  GraduationCap, Flame, Shield, Bot, Image, Video, PenTool,
  FileText, GitBranch, Workflow
} from 'lucide-react';
import {
  useAcademyPaths, useAcademyCourses, useAcademyTools,
  useCourseProgress, useToggleCourseCompletion, useSharedPrompts,
  useCreateSharedPrompt, getExplorerLevel, EXPLORER_LEVELS,
  type AcademyCourse
} from '@/hooks/useAcademy';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Code: <Code className="h-5 w-5" />,
  Palette: <Palette className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Wrench: <Wrench className="h-5 w-5" />,
  MessageSquare: <MessageSquare className="h-5 w-5" />,
  Bot: <Bot className="h-5 w-5" />,
  Image: <Image className="h-5 w-5" />,
  Video: <Video className="h-5 w-5" />,
  PenTool: <PenTool className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Search: <Search className="h-5 w-5" />,
  GitBranch: <GitBranch className="h-5 w-5" />,
  Workflow: <Workflow className="h-5 w-5" />,
};

const levelIcons = [Shield, Star, Flame, Rocket, Award];

const AcademyDashboard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isEs = language === 'es';

  const { data: paths = [] } = useAcademyPaths();
  const { data: courses = [] } = useAcademyCourses();
  const { data: tools = [] } = useAcademyTools();
  const { data: progress = [] } = useCourseProgress();
  const { data: prompts = [] } = useSharedPrompts();
  const toggleCompletion = useToggleCourseCompletion();
  const createPrompt = useCreateSharedPrompt();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [toolFilter, setToolFilter] = useState('all');
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'general' });

  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.course_id));
  const completedCount = completedIds.size;
  const explorerLevel = getExplorerLevel(completedCount);
  const LevelIcon = levelIcons[explorerLevel.level - 1] || Shield;

  const skillsUnlocked = new Set(
    courses.filter(c => completedIds.has(c.id)).flatMap(c => c.skills_learned || [])
  );

  const filteredCourses = courses.filter(c => {
    const matchSearch = !courseSearch ||
      c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (c.title_es || '').toLowerCase().includes(courseSearch.toLowerCase());
    const matchFilter = courseFilter === 'all' ||
      c.skill_level === courseFilter ||
      c.category === courseFilter ||
      c.language === courseFilter;
    return matchSearch && matchFilter;
  });

  const filteredTools = tools.filter(t =>
    toolFilter === 'all' || t.category === toolFilter
  );

  const handleToggleCourse = (courseId: string) => {
    const isCompleted = completedIds.has(courseId);
    toggleCompletion.mutate(
      { courseId, completed: !isCompleted },
      {
        onSuccess: () => toast.success(isCompleted
          ? (isEs ? 'Curso desmarcado' : 'Course unmarked')
          : (isEs ? '¡Curso completado! 🎉' : 'Course completed! 🎉')),
      }
    );
  };

  const handleSharePrompt = () => {
    if (!newPrompt.title || !newPrompt.content) return;
    createPrompt.mutate(newPrompt, {
      onSuccess: () => {
        setNewPrompt({ title: '', content: '', category: 'general' });
        toast.success(isEs ? '¡Prompt compartido!' : 'Prompt shared!');
      },
    });
  };

  const toolCategories = [...new Set(tools.map(t => t.category))];

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="container relative py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="h-8 w-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
                  Gophora AI Academy
                </h1>
              </div>
              <p className="text-muted-foreground max-w-xl">
                {isEs
                  ? 'Entrena para completar misiones 3X más rápido con herramientas de IA.'
                  : 'Train to complete missions 3X faster with AI tools.'}
              </p>
            </div>

            {/* Level Badge */}
            <Card className="bg-card/80 backdrop-blur border-primary/20 min-w-[260px]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <LevelIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider">
                      {isEs ? 'Nivel' : 'Level'} {explorerLevel.level}
                    </p>
                    <p className="font-heading font-bold text-sm">
                      {isEs ? explorerLevel.name_es : explorerLevel.name}
                    </p>
                  </div>
                </div>
                <Progress value={explorerLevel.progressToNext} className="h-2" />
                {explorerLevel.nextLevel && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {completedCount}/{explorerLevel.nextLevel.minCourses} {isEs ? 'cursos para' : 'courses to'}{' '}
                    {isEs ? explorerLevel.nextLevel.name_es : explorerLevel.nextLevel.name}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="container mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-7 gap-1 h-auto p-1">
            <TabsTrigger value="dashboard" className="text-xs font-heading">
              <Target className="h-3.5 w-3.5 mr-1" /> {isEs ? 'Panel' : 'Dashboard'}
            </TabsTrigger>
            <TabsTrigger value="paths" className="text-xs font-heading">
              <BookOpen className="h-3.5 w-3.5 mr-1" /> {isEs ? 'Rutas' : 'Paths'}
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-xs font-heading">
              <GraduationCap className="h-3.5 w-3.5 mr-1" /> {isEs ? 'Cursos' : 'Courses'}
            </TabsTrigger>
            <TabsTrigger value="toolkit" className="text-xs font-heading">
              <Wrench className="h-3.5 w-3.5 mr-1" /> Toolkit
            </TabsTrigger>
            <TabsTrigger value="unlocks" className="text-xs font-heading">
              <Star className="h-3.5 w-3.5 mr-1" /> Unlocks
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs font-heading">
              <TrendingUp className="h-3.5 w-3.5 mr-1" /> {isEs ? 'Progreso' : 'Progress'}
            </TabsTrigger>
            <TabsTrigger value="community" className="text-xs font-heading">
              <Share2 className="h-3.5 w-3.5 mr-1" /> {isEs ? 'Comunidad' : 'Community'}
            </TabsTrigger>
          </TabsList>

          {/* 1. DASHBOARD */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Trophy className="h-5 w-5 text-primary" />}
                label={isEs ? 'Nivel de IA' : 'AI Level'}
                value={isEs ? explorerLevel.name_es : explorerLevel.name}
              />
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                label={isEs ? 'Cursos completados' : 'Courses Completed'}
                value={`${completedCount}/${courses.length}`}
              />
              <StatCard
                icon={<Zap className="h-5 w-5 text-amber-500" />}
                label={isEs ? 'Habilidades desbloqueadas' : 'Skills Unlocked'}
                value={String(skillsUnlocked.size)}
              />
              <StatCard
                icon={<Rocket className="h-5 w-5 text-primary" />}
                label={isEs ? 'Multiplicador' : 'Productivity'}
                value={`${explorerLevel.multiplier}x`}
              />
            </div>

            {/* Level Progression */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  {isEs ? 'Niveles de Explorador' : 'Explorer Levels'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {EXPLORER_LEVELS.map((level, i) => {
                    const Icon = levelIcons[i];
                    const isCurrentOrPast = explorerLevel.level >= level.level;
                    return (
                      <div
                        key={level.level}
                        className={`rounded-lg border p-3 text-center transition-all ${
                          explorerLevel.level === level.level
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : isCurrentOrPast
                            ? 'border-border/50 bg-muted/30'
                            : 'border-border/30 opacity-50'
                        }`}
                      >
                        <Icon className={`h-6 w-6 mx-auto mb-1 ${isCurrentOrPast ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="font-heading text-xs font-bold">Lv.{level.level}</p>
                        <p className="text-[10px] text-muted-foreground">{isEs ? level.name_es : level.name}</p>
                        <p className="text-[10px] text-primary font-semibold mt-1">{level.multiplier}x</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Access Paths */}
            <h3 className="font-heading font-bold mb-3">{isEs ? 'Rutas de Aprendizaje' : 'Learning Paths'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paths.map(path => {
                const pathCourses = courses.filter(c => c.path_id === path.id);
                const pathCompleted = pathCourses.filter(c => completedIds.has(c.id)).length;
                const pct = pathCourses.length ? (pathCompleted / pathCourses.length) * 100 : 0;
                return (
                  <Card
                    key={path.id}
                    className="cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => setActiveTab('paths')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          {iconMap[path.icon] || <BookOpen className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-sm truncate">
                            {isEs ? path.title_es || path.title : path.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pathCompleted}/{pathCourses.length} {isEs ? 'cursos' : 'courses'}
                          </p>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* 2. LEARNING PATHS */}
          <TabsContent value="paths" className="mt-6 space-y-6">
            {paths.map(path => {
              const pathCourses = courses.filter(c => c.path_id === path.id);
              return (
                <Card key={path.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {iconMap[path.icon] || <BookOpen className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="font-heading text-lg">
                          {isEs ? path.title_es || path.title : path.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {isEs ? path.description_es || path.description : path.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pathCourses.map(course => (
                        <CourseRow
                          key={course.id}
                          course={course}
                          isEs={isEs}
                          completed={completedIds.has(course.id)}
                          onToggle={() => handleToggleCourse(course.id)}
                          loading={toggleCompletion.isPending}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* 3. COURSE LIBRARY */}
          <TabsContent value="courses" className="mt-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isEs ? 'Buscar cursos...' : 'Search courses...'}
                  value={courseSearch}
                  onChange={e => setCourseSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isEs ? 'Todos' : 'All'}</SelectItem>
                  <SelectItem value="beginner">{isEs ? 'Principiante' : 'Beginner'}</SelectItem>
                  <SelectItem value="intermediate">{isEs ? 'Intermedio' : 'Intermediate'}</SelectItem>
                  <SelectItem value="advanced">{isEs ? 'Avanzado' : 'Advanced'}</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEs={isEs}
                  completed={completedIds.has(course.id)}
                  onToggle={() => handleToggleCourse(course.id)}
                  loading={toggleCompletion.isPending}
                />
              ))}
            </div>
            {filteredCourses.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                {isEs ? 'No se encontraron cursos.' : 'No courses found.'}
              </p>
            )}
          </TabsContent>

          {/* 4. AI TOOLKIT */}
          <TabsContent value="toolkit" className="mt-6">
            <div className="flex gap-2 mb-6 flex-wrap">
              <Button
                variant={toolFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setToolFilter('all')}
                className="font-heading text-xs"
              >
                {isEs ? 'Todos' : 'All'}
              </Button>
              {toolCategories.map(cat => (
                <Button
                  key={cat}
                  variant={toolFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setToolFilter(cat)}
                  className="font-heading text-xs capitalize"
                >
                  {cat.replace('ai-', 'AI ')}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map(tool => (
                <Card key={tool.id} className="hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {iconMap[tool.icon] || <Wrench className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-sm">{tool.name}</h4>
                        <Badge variant="outline" className="text-[10px] capitalize mt-0.5">
                          {tool.category.replace('ai-', 'AI ')}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {isEs ? tool.description_es || tool.description : tool.description}
                    </p>
                    <div className="space-y-1 mb-3">
                      <p className="text-xs font-heading font-semibold">{isEs ? 'Casos de uso:' : 'Use cases:'}</p>
                      <div className="flex flex-wrap gap-1">
                        {(isEs ? tool.use_cases_es || tool.use_cases : tool.use_cases).map((uc, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{uc}</Badge>
                        ))}
                      </div>
                    </div>
                    {tool.url && (
                      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                        <a href={tool.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {isEs ? 'Aprender más' : 'Learn more'}
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 5. MISSION UNLOCKS */}
          <TabsContent value="unlocks" className="mt-6">
            <div className="space-y-4">
              {paths.map(path => {
                const pathCourses = courses.filter(c => c.path_id === path.id);
                const allCompleted = pathCourses.length > 0 && pathCourses.every(c => completedIds.has(c.id));
                const someCompleted = pathCourses.some(c => completedIds.has(c.id));
                const missionExamples = getMissionExamples(path.title, isEs);
                return (
                  <Card key={path.id} className={allCompleted ? 'border-primary/30 bg-primary/5' : ''}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                          allCompleted ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          {allCompleted ? <CheckCircle2 className="h-5 w-5 text-primary" /> : iconMap[path.icon] || <BookOpen className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-heading font-bold text-sm">
                            {isEs ? path.title_es || path.title : path.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {allCompleted
                              ? (isEs ? '✅ Ruta completada — Misiones desbloqueadas' : '✅ Path completed — Missions unlocked')
                              : someCompleted
                              ? (isEs ? '🔄 En progreso' : '🔄 In progress')
                              : (isEs ? '🔒 No iniciada' : '🔒 Not started')}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {missionExamples.map((m, i) => (
                          <div key={i} className={`rounded-md border p-2 text-xs ${
                            allCompleted ? 'border-primary/20 bg-background' : 'opacity-50'
                          }`}>
                            <p className="font-heading font-semibold">{m.title}</p>
                            <p className="text-muted-foreground text-[10px]">{m.desc}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* 6. PROGRESS TRACKER */}
          <TabsContent value="progress" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                label={isEs ? 'Cursos completados' : 'Courses Completed'}
                value={`${completedCount}`}
              />
              <StatCard
                icon={<Zap className="h-5 w-5 text-amber-500" />}
                label={isEs ? 'Habilidades ganadas' : 'Skills Gained'}
                value={`${skillsUnlocked.size}`}
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-primary" />}
                label={isEs ? 'Multiplicador de productividad' : 'Productivity Multiplier'}
                value={`${explorerLevel.multiplier}x`}
              />
              <StatCard
                icon={<Target className="h-5 w-5 text-primary" />}
                label={isEs ? 'Nivel' : 'Level'}
                value={isEs ? explorerLevel.name_es : explorerLevel.name}
              />
            </div>

            {/* Productivity Score Visual */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  {isEs ? 'Puntuación de Productividad IA' : 'AI Productivity Score'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {[
                    { label: isEs ? 'Sin IA' : 'No AI', value: '1.0x', active: explorerLevel.multiplier >= 1 },
                    { label: isEs ? 'Principiante' : 'Beginner', value: '1.5x', active: explorerLevel.multiplier >= 1.5 },
                    { label: isEs ? 'Asistido por IA' : 'AI Assisted', value: '2.0x', active: explorerLevel.multiplier >= 2 },
                    { label: isEs ? 'Operador IA' : 'AI Operator', value: '2.5x', active: explorerLevel.multiplier >= 2.5 },
                    { label: isEs ? 'Arquitecto' : 'Architect', value: '3.0x', active: explorerLevel.multiplier >= 3 },
                  ].map((item, i) => (
                    <div key={i} className="flex-1 text-center">
                      <div className={`h-16 rounded-lg flex items-center justify-center font-heading font-bold text-lg ${
                        item.active ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.value}
                      </div>
                      <p className="text-[10px] mt-1 text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skills List */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  {isEs ? 'Habilidades Desbloqueadas' : 'Skills Unlocked'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skillsUnlocked.size > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {[...skillsUnlocked].map(skill => (
                      <Badge key={skill} className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isEs ? 'Completa cursos para desbloquear habilidades.' : 'Complete courses to unlock skills.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 7. COMMUNITY */}
          <TabsContent value="community" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Share Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    {isEs ? 'Compartir un Prompt' : 'Share a Prompt'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder={isEs ? 'Título del prompt' : 'Prompt title'}
                    value={newPrompt.title}
                    onChange={e => setNewPrompt(p => ({ ...p, title: e.target.value }))}
                  />
                  <Textarea
                    placeholder={isEs ? 'Contenido del prompt...' : 'Prompt content...'}
                    value={newPrompt.content}
                    onChange={e => setNewPrompt(p => ({ ...p, content: e.target.value }))}
                    rows={4}
                  />
                  <Select value={newPrompt.category} onValueChange={v => setNewPrompt(p => ({ ...p, category: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="coding">{isEs ? 'Programación' : 'Coding'}</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="automation">{isEs ? 'Automatización' : 'Automation'}</SelectItem>
                      <SelectItem value="creative">{isEs ? 'Creativo' : 'Creative'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSharePrompt} disabled={createPrompt.isPending} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    {isEs ? 'Compartir' : 'Share'}
                  </Button>
                </CardContent>
              </Card>

              {/* Shared Prompts */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    {isEs ? 'Prompts de la Comunidad' : 'Community Prompts'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prompts.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {prompts.map(p => (
                        <div key={p.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-heading font-semibold text-sm">{p.title}</p>
                            <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{p.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isEs ? 'Sé el primero en compartir un prompt.' : 'Be the first to share a prompt.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Sub-components
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-heading">{label}</p>
          <p className="font-heading font-bold text-lg">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseRow({ course, isEs, completed, onToggle, loading }: {
  course: AcademyCourse; isEs: boolean; completed: boolean; onToggle: () => void; loading: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
      completed ? 'border-primary/20 bg-primary/5' : 'hover:border-border'
    }`}>
      <button onClick={onToggle} disabled={loading} className="shrink-0">
        {completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-heading font-semibold ${completed ? 'line-through text-muted-foreground' : ''}`}>
          {isEs ? course.title_es || course.title : course.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-[10px]">{course.platform}</Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-3 w-3" /> {course.duration_minutes}min
          </span>
          <Badge variant="secondary" className="text-[10px] capitalize">{course.skill_level}</Badge>
        </div>
      </div>
      {course.external_url && (
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <a href={course.external_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );
}

function CourseCard({ course, isEs, completed, onToggle, loading }: {
  course: AcademyCourse; isEs: boolean; completed: boolean; onToggle: () => void; loading: boolean;
}) {
  return (
    <Card className={`hover:border-primary/30 transition-all ${completed ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-heading font-bold text-sm">
            {isEs ? course.title_es || course.title : course.title}
          </h4>
          <button onClick={onToggle} disabled={loading}>
            {completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {isEs ? course.description_es || course.description : course.description}
        </p>
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-[10px]">{course.platform}</Badge>
          <Badge variant="secondary" className="text-[10px] capitalize">{course.skill_level}</Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-3 w-3" /> {course.duration_minutes}min
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {(course.skills_learned || []).map(s => (
            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
          ))}
        </div>
        {course.external_url && (
          <Button size="sm" className="w-full text-xs" asChild>
            <a href={course.external_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              {isEs ? 'Iniciar Curso' : 'Start Course'}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function getMissionExamples(pathTitle: string, isEs: boolean) {
  const examples: Record<string, { title: string; desc: string }[]> = {
    'AI Foundations for Explorers': [
      { title: isEs ? 'Asistente de Investigación' : 'Research Assistant', desc: isEs ? 'Investigación con IA' : 'AI-powered research' },
      { title: isEs ? 'Escritura de Contenido' : 'Content Writing', desc: isEs ? 'Creación de contenido con IA' : 'AI content creation' },
      { title: isEs ? 'Análisis de Datos' : 'Data Analysis', desc: isEs ? 'Análisis con prompts' : 'Prompt-based analysis' },
    ],
    'AI Automation': [
      { title: isEs ? 'Optimización de Flujos' : 'Workflow Optimization', desc: isEs ? 'Automatización de procesos' : 'Process automation' },
      { title: isEs ? 'Automatización de Datos' : 'Data Automation', desc: isEs ? 'Pipelines de datos con IA' : 'AI data pipelines' },
      { title: isEs ? 'Creación de Agentes IA' : 'AI Agent Creation', desc: isEs ? 'Agentes autónomos' : 'Autonomous agents' },
    ],
    'Claude Code & AI Development': [
      { title: isEs ? 'Desarrollo con IA' : 'AI Development', desc: isEs ? 'Código asistido' : 'AI-assisted code' },
      { title: isEs ? 'Herramientas Custom' : 'Custom Tools', desc: isEs ? 'Construcción de herramientas' : 'Tool building' },
      { title: isEs ? 'Integración de APIs' : 'API Integration', desc: isEs ? 'Conexiones inteligentes' : 'Smart connections' },
    ],
    'AI for Creative Work': [
      { title: isEs ? 'Diseño con IA' : 'AI Design', desc: isEs ? 'Visuales generados' : 'Generated visuals' },
      { title: isEs ? 'Producción de Video' : 'Video Production', desc: isEs ? 'Videos con IA' : 'AI-powered video' },
      { title: isEs ? 'Contenido Creativo' : 'Creative Content', desc: isEs ? 'Contenido multimedia' : 'Multimedia content' },
    ],
    'AI for Business Execution': [
      { title: isEs ? 'Marketing con IA' : 'AI Marketing', desc: isEs ? 'Campañas automatizadas' : 'Automated campaigns' },
      { title: isEs ? 'Documentación' : 'Documentation', desc: isEs ? 'Docs automatizados' : 'Automated docs' },
      { title: isEs ? 'Sistemas de Productividad' : 'Productivity Systems', desc: isEs ? 'Sistemas inteligentes' : 'Smart systems' },
    ],
  };
  return examples[pathTitle] || [
    { title: isEs ? 'Misión General' : 'General Mission', desc: isEs ? 'Misión con IA' : 'AI mission' },
  ];
}

export default AcademyDashboard;
