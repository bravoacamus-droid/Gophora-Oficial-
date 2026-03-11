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
  FileText, GitBranch, Workflow, Globe, Eye, ThumbsUp, Play,
  Users, Sparkles, Upload
} from 'lucide-react';
import {
  useAcademyPaths, useAcademyCourses, useAcademyTools,
  useCourseProgress, useToggleCourseCompletion, useSharedPrompts,
  useCreateSharedPrompt, getExplorerLevel, EXPLORER_LEVELS,
  useTutorApplication, useSubmitTutorApplication,
  useSubmitCourseAsTutor, useIncrementViews,
  type AcademyCourse
} from '@/hooks/useAcademy';
import CourseExam from '@/components/CourseExam';
import YouTubeVideoPlayer, { isYouTubeUrl, extractYouTubeId, getYouTubeThumbnail } from '@/components/YouTubeVideoPlayer';
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
  const { data: tutorApp } = useTutorApplication();
  const toggleCompletion = useToggleCourseCompletion();
  const createPrompt = useCreateSharedPrompt();
  const submitTutorApp = useSubmitTutorApplication();
  const submitCourse = useSubmitCourseAsTutor();
  const incrementViews = useIncrementViews();

  const [activeTab, setActiveTab] = useState('courses');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [toolFilter, setToolFilter] = useState('all');
  const [courseLangFilter, setCourseLangFilter] = useState<'all' | 'en' | 'es'>('all');
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'general' });
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [showExam, setShowExam] = useState(false);

  // Tutor application state
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [tutorForm, setTutorForm] = useState({ bio: '', expertise: '', portfolio_url: '' });

  // Tutor course submission state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [courseForm, setCourseForm] = useState({
    title: '', description: '', external_url: '', thumbnail_url: '',
    duration_minutes: 30, skill_level: 'beginner', language: 'en',
    skills_learned: '', path_id: '',
  });
  const [examQuestions, setExamQuestions] = useState<Array<{
    question: string; question_es: string; options: string[]; options_es: string[]; correct_index: number;
  }>>([
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
  ]);

  const isTutor = tutorApp?.status === 'approved';

  // Tutor's own courses
  const tutorCourses = courses.filter(c => c.submitted_by === user?.id);
  // Also get pending courses from all courses hook (includes non-published)
  const { data: allTutorCourses = [] } = useAcademyCourses(); // published only for now

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
      c.category === courseFilter;
    const matchLang = courseLangFilter === 'all' || c.language === courseLangFilter;
    return matchSearch && matchFilter && matchLang;
  });

  const featuredCourses = courses.filter(c => c.featured);
  const filteredTools = tools.filter(t => toolFilter === 'all' || t.category === toolFilter);

  const handleExamPass = (courseId: string) => {
    toggleCompletion.mutate(
      { courseId, completed: true },
      {
        onSuccess: () => {
          toast.success(isEs ? '¡Examen aprobado! Curso completado 🎉' : 'Exam passed! Course completed 🎉');
        },
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

  const handleTutorApply = () => {
    if (!tutorForm.bio) return;
    submitTutorApp.mutate(
      {
        bio: tutorForm.bio,
        expertise: tutorForm.expertise.split(',').map(s => s.trim()).filter(Boolean),
        portfolio_url: tutorForm.portfolio_url || undefined,
      },
      {
        onSuccess: () => {
          setShowTutorForm(false);
          toast.success(isEs ? '¡Solicitud enviada! Revisaremos tu perfil.' : 'Application submitted! We will review your profile.');
        },
      }
    );
  };

  const handleSubmitCourse = () => {
    if (!courseForm.title || !courseForm.external_url || !courseForm.path_id) return;
    // Validate exam questions - at least 5 valid questions
    const validQuestions = examQuestions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
    if (validQuestions.length < 5) {
      toast.error(isEs ? 'Debes agregar al menos 5 preguntas de examen completas' : 'You must add at least 5 complete exam questions');
      return;
    }
    submitCourse.mutate(
      {
        course: {
          title: courseForm.title,
          description: courseForm.description,
          external_url: courseForm.external_url,
          thumbnail_url: courseForm.thumbnail_url || null,
          duration_minutes: courseForm.duration_minutes,
          skill_level: courseForm.skill_level,
          language: courseForm.language,
          skills_learned: courseForm.skills_learned.split(',').map(s => s.trim()).filter(Boolean),
          path_id: courseForm.path_id,
          category: selectedCategory || 'general',
          platform: 'External',
          instructor_name: user?.user_metadata?.username || user?.email?.split('@')[0] || 'Tutor',
        },
        examQuestions: validQuestions,
      },
      {
        onSuccess: () => {
          toast.success(isEs ? '¡Curso enviado! Será revisado por el equipo.' : 'Course submitted! It will be reviewed by the team.');
          setShowCourseForm(false);
          setSelectedCategory('');
          setCourseForm({ title: '', description: '', external_url: '', thumbnail_url: '', duration_minutes: 30, skill_level: 'beginner', language: 'en', skills_learned: '', path_id: '' });
          setExamQuestions([
            { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
            { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
            { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
            { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
            { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 },
          ]);
        },
      }
    );
  };

  const handleCourseClick = (course: AcademyCourse) => {
    if (course.external_url) {
      incrementViews.mutate(course.id);
    }
  };

  const toolCategories = [...new Set(tools.map(t => t.category))];


  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="container relative py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
                    Dream Academy
                  </h1>
                  <p className="text-xs text-muted-foreground font-heading uppercase tracking-widest">
                    {isEs ? 'Ecosistema de Aprendizaje en IA' : 'AI Learning Ecosystem'}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm md:text-base">
                {isEs
                  ? 'Domina la productividad con IA. Cursos gratuitos de automatización, prompt engineering y herramientas de IA.'
                  : 'Master AI productivity. Free courses on automation, prompt engineering and AI tools.'}
              </p>
            </div>

            {/* Level Card */}
            <Card className="bg-card/80 backdrop-blur border-primary/20 min-w-[240px]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <LevelIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">
                      {isEs ? 'Nivel' : 'Level'} {explorerLevel.level}
                    </p>
                    <p className="font-heading font-bold text-sm">
                      {isEs ? explorerLevel.name_es : explorerLevel.name}
                    </p>
                  </div>
                </div>
                <Progress value={explorerLevel.progressToNext} className="h-2" />
                {explorerLevel.nextLevel && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {completedCount}/{explorerLevel.nextLevel.minCourses} → {isEs ? explorerLevel.nextLevel.name_es : explorerLevel.nextLevel.name}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="container mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <TabsList className="h-auto p-1 flex-wrap">
              <TabsTrigger value="courses" className="text-xs font-heading gap-1.5">
                <Play className="h-3.5 w-3.5" /> {isEs ? 'Cursos' : 'Courses'}
              </TabsTrigger>
              <TabsTrigger value="paths" className="text-xs font-heading gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> {isEs ? 'Rutas' : 'Paths'}
              </TabsTrigger>
              <TabsTrigger value="toolkit" className="text-xs font-heading gap-1.5">
                <Wrench className="h-3.5 w-3.5" /> Toolkit
              </TabsTrigger>
              <TabsTrigger value="progress" className="text-xs font-heading gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> {isEs ? 'Progreso' : 'Progress'}
              </TabsTrigger>
              <TabsTrigger value="teach" className="text-xs font-heading gap-1.5">
                <Upload className="h-3.5 w-3.5" /> {isEs ? 'Enseñar' : 'Teach'}
              </TabsTrigger>
              <TabsTrigger value="community" className="text-xs font-heading gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> {isEs ? 'Comunidad' : 'Community'}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── COURSES TAB (YouTube-style) ── */}
          <TabsContent value="courses" className="mt-2">
            {/* Featured Section */}
            {featuredCourses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {isEs ? 'Destacados' : 'Featured'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredCourses.slice(0, 3).map(course => (
                    <CourseVideoCard
                      key={course.id}
                      course={course}
                      isEs={isEs}
                      completed={completedIds.has(course.id)}
                      onOpen={() => setSelectedCourse(course)}
                      featured
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search & Filters */}
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
                  <SelectValue placeholder={isEs ? 'Filtrar' : 'Filter'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isEs ? 'Todos' : 'All'}</SelectItem>
                  <SelectItem value="ai-basics">{isEs ? 'Fundamentos IA' : 'AI Basics'}</SelectItem>
                  <SelectItem value="ai-productivity">{isEs ? 'Productividad IA' : 'AI Productivity'}</SelectItem>
                  <SelectItem value="ai-automation">{isEs ? 'Automatización IA' : 'AI Automation'}</SelectItem>
                  <SelectItem value="ai-content-creation">{isEs ? 'Creación de Contenido IA' : 'AI Content Creation'}</SelectItem>
                  <SelectItem value="ai-development">{isEs ? 'Desarrollo IA' : 'AI Development'}</SelectItem>
                  <SelectItem value="beginner">{isEs ? 'Principiante' : 'Beginner'}</SelectItem>
                  <SelectItem value="intermediate">{isEs ? 'Intermedio' : 'Intermediate'}</SelectItem>
                  <SelectItem value="advanced">{isEs ? 'Avanzado' : 'Advanced'}</SelectItem>
                </SelectContent>
              </Select>
              <LanguageToggle value={courseLangFilter} onChange={setCourseLangFilter} isEs={isEs} />
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredCourses.map(course => (
                <CourseVideoCard
                  key={course.id}
                  course={course}
                  isEs={isEs}
                  completed={completedIds.has(course.id)}
                  onOpen={() => setSelectedCourse(course)}
                />
              ))}
            </div>
            {filteredCourses.length === 0 && (
              <div className="text-center py-16">
                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-heading">
                  {isEs ? 'No se encontraron cursos.' : 'No courses found.'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* ── LEARNING PATHS ── */}
          <TabsContent value="paths" className="mt-4 space-y-6">
            {paths.map(path => {
              const pathCourses = courses
                .filter(c => c.path_id === path.id)
                .filter(c => courseLangFilter === 'all' || c.language === courseLangFilter);
              const pathCompleted = pathCourses.filter(c => completedIds.has(c.id)).length;
              const pct = pathCourses.length ? (pathCompleted / pathCourses.length) * 100 : 0;
              if (pathCourses.length === 0) return null;
              return (
                <Card key={path.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/5 to-transparent p-5 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        {iconMap[path.icon] || <BookOpen className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-heading font-bold">
                          {isEs ? path.title_es || path.title : path.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {pathCompleted}/{pathCourses.length} {isEs ? 'completados' : 'completed'} · {Math.round(pct)}%
                        </p>
                      </div>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-3" />
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pathCourses.map(course => (
                        <CourseVideoCard
                          key={course.id}
                          course={course}
                          isEs={isEs}
                          completed={completedIds.has(course.id)}
                          onOpen={() => setSelectedCourse(course)}
                          compact
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ── TOOLKIT ── */}
          <TabsContent value="toolkit" className="mt-4">
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
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(isEs ? tool.use_cases_es || tool.use_cases : tool.use_cases).map((uc, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{uc}</Badge>
                      ))}
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

          {/* ── PROGRESS ── */}
          <TabsContent value="progress" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Trophy className="h-5 w-5 text-primary" />} label={isEs ? 'Nivel' : 'Level'} value={isEs ? explorerLevel.name_es : explorerLevel.name} />
              <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} label={isEs ? 'Completados' : 'Completed'} value={`${completedCount}/${courses.length}`} />
              <StatCard icon={<Zap className="h-5 w-5 text-amber-500" />} label={isEs ? 'Habilidades' : 'Skills'} value={String(skillsUnlocked.size)} />
              <StatCard icon={<Rocket className="h-5 w-5 text-primary" />} label={isEs ? 'Multiplicador' : 'Multiplier'} value={`${explorerLevel.multiplier}x`} />
            </div>

            {/* Explorer Level Progression */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  {isEs ? 'Niveles de Explorador' : 'Explorer Levels'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {EXPLORER_LEVELS.map((level, i) => {
                    const Icon = levelIcons[i];
                    const isActive = explorerLevel.level >= level.level;
                    const isCurrent = explorerLevel.level === level.level;
                    return (
                      <div
                        key={level.level}
                        className={`rounded-xl border p-4 text-center transition-all ${
                          isCurrent
                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                            : isActive
                            ? 'border-border/50 bg-muted/30'
                            : 'border-border/30 opacity-40'
                        }`}
                      >
                        <Icon className={`h-7 w-7 mx-auto mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="font-heading text-xs font-bold">Lv.{level.level}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-1">{isEs ? level.name_es : level.name}</p>
                        <p className="text-xs text-primary font-heading font-bold mt-1">{level.multiplier}x</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
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

          {/* ── TEACH (Tutor Dashboard) ── */}
          <TabsContent value="teach" className="mt-4">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-heading font-bold mb-2">
                  {isTutor
                    ? (isEs ? 'Tu Panel de Tutor' : 'Your Tutor Dashboard')
                    : (isEs ? 'Conviértete en Tutor' : 'Become a Tutor')}
                </h2>
                <p className="text-muted-foreground">
                  {isTutor
                    ? (isEs ? 'Sube cursos, trackea vistas y gana recompensas.' : 'Upload courses, track views and earn rewards.')
                    : (isEs ? 'Comparte tu conocimiento en IA y gana recompensas por cada vista.' : 'Share your AI knowledge and earn rewards for every view.')}
                </p>
              </div>

              {/* ─ APPROVED TUTOR DASHBOARD ─ */}
              {isTutor ? (
                <div className="space-y-8">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<BookOpen className="h-5 w-5 text-primary" />} label={isEs ? 'Cursos subidos' : 'Courses uploaded'} value={String(tutorCourses.length)} />
                    <StatCard icon={<Eye className="h-5 w-5 text-primary" />} label={isEs ? 'Vistas totales' : 'Total views'} value={String(tutorCourses.reduce((s, c) => s + (c.views_count || 0), 0))} />
                    <StatCard icon={<Star className="h-5 w-5 text-primary" />} label={isEs ? 'Rating promedio' : 'Avg rating'} value={tutorCourses.length > 0 ? (tutorCourses.reduce((s, c) => s + Number(c.rating || 0), 0) / tutorCourses.length).toFixed(1) : '—'} />
                    <StatCard icon={<TrendingUp className="h-5 w-5 text-primary" />} label={isEs ? 'Recompensas' : 'Rewards'} value={`$${(tutorCourses.reduce((s, c) => s + (c.views_count || 0), 0) * 0.01).toFixed(2)}`} />
                  </div>

                  {/* Category Cards - click to upload */}
                  <div>
                    <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {isEs ? 'Subir Curso por Categoría' : 'Upload Course by Category'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'ai-foundations', icon: <Brain className="h-6 w-6" />, label: isEs ? 'Fundamentos de IA' : 'AI Foundations', color: 'from-blue-500/10 to-blue-600/5' },
                        { key: 'automation', icon: <Zap className="h-6 w-6" />, label: isEs ? 'Automatización' : 'Automation', color: 'from-amber-500/10 to-amber-600/5' },
                        { key: 'development', icon: <Code className="h-6 w-6" />, label: isEs ? 'Desarrollo' : 'Development', color: 'from-green-500/10 to-green-600/5' },
                        { key: 'creative', icon: <Palette className="h-6 w-6" />, label: isEs ? 'Creativo' : 'Creative', color: 'from-pink-500/10 to-pink-600/5' },
                        { key: 'business', icon: <Briefcase className="h-6 w-6" />, label: isEs ? 'Negocios' : 'Business', color: 'from-purple-500/10 to-purple-600/5' },
                        { key: 'general', icon: <Globe className="h-6 w-6" />, label: 'General', color: 'from-primary/10 to-primary/5' },
                      ].map(cat => (
                        <Card
                          key={cat.key}
                          className="cursor-pointer hover:border-primary/50 transition-all group"
                          onClick={() => {
                            setSelectedCategory(cat.key);
                            // Auto-select first path if available
                            const firstPath = paths.length > 0 ? paths[0].id : '';
                            setCourseForm(f => ({ ...f, path_id: firstPath }));
                            setShowCourseForm(true);
                          }}
                        >
                          <CardContent className={`p-5 text-center bg-gradient-to-br ${cat.color} rounded-lg`}>
                            <div className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center mx-auto mb-3 text-primary group-hover:scale-110 transition-transform">
                              {cat.icon}
                            </div>
                            <p className="font-heading font-bold text-sm">{cat.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {isEs ? 'Click para subir' : 'Click to upload'}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Course Upload Dialog */}
                  <Dialog open={showCourseForm} onOpenChange={(open) => { if (!open) { setShowCourseForm(false); setSelectedCategory(''); } }}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                          <Upload className="h-5 w-5 text-primary" />
                          {isEs ? 'Nuevo Curso' : 'New Course'}
                        </DialogTitle>
                      </DialogHeader>

                      {/* Category & Path shown at top */}
                      <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3 bg-muted/30">
                        <Badge className="capitalize">{selectedCategory.replace('ai-', 'AI ').replace('-', ' ')}</Badge>
                        <Select value={courseForm.path_id} onValueChange={v => setCourseForm(f => ({ ...f, path_id: v }))}>
                          <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder={isEs ? 'Ruta de aprendizaje' : 'Learning path'} /></SelectTrigger>
                          <SelectContent>
                            {paths.map(p => (
                              <SelectItem key={p.id} value={p.id}>{isEs ? p.title_es || p.title : p.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                            {isEs ? 'Título del curso *' : 'Course title *'}
                          </label>
                          <Input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} placeholder={isEs ? 'Ej: Automatiza tu flujo con Make' : 'Ex: Automate your flow with Make'} />
                        </div>
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                            {isEs ? 'Link del curso (YouTube u otro) *' : 'Course link (YouTube or other) *'}
                          </label>
                          <Input value={courseForm.external_url} onChange={e => {
                            const url = e.target.value;
                            setCourseForm(f => {
                              const update = { ...f, external_url: url };
                              // Auto-generate thumbnail from YouTube URL
                              const ytId = extractYouTubeId(url);
                              if (ytId && !f.thumbnail_url) {
                                update.thumbnail_url = getYouTubeThumbnail(ytId);
                              }
                              return update;
                            });
                          }} placeholder="https://youtube.com/watch?v=..." />
                        </div>
                        {/* YouTube preview */}
                        {courseForm.external_url && isYouTubeUrl(courseForm.external_url) && (
                          <YouTubeVideoPlayer url={courseForm.external_url} title="Preview" className="max-w-full" />
                        )}
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                            {isEs ? 'URL de miniatura (auto-generada para YouTube)' : 'Thumbnail URL (auto-generated for YouTube)'}
                          </label>
                          <Input value={courseForm.thumbnail_url} onChange={e => setCourseForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://..." />
                        </div>
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                            {isEs ? 'Descripción' : 'Description'}
                          </label>
                          <Textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} placeholder={isEs ? 'Describe qué aprenderán los exploradores...' : 'Describe what explorers will learn...'} rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                              {isEs ? 'Nivel' : 'Level'}
                            </label>
                            <Select value={courseForm.skill_level} onValueChange={v => setCourseForm(f => ({ ...f, skill_level: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">{isEs ? 'Principiante' : 'Beginner'}</SelectItem>
                                <SelectItem value="intermediate">{isEs ? 'Intermedio' : 'Intermediate'}</SelectItem>
                                <SelectItem value="advanced">{isEs ? 'Avanzado' : 'Advanced'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                              {isEs ? 'Idioma' : 'Language'}
                            </label>
                            <Select value={courseForm.language} onValueChange={v => setCourseForm(f => ({ ...f, language: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">🇺🇸 English</SelectItem>
                                <SelectItem value="es">🇪🇸 Español</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                              {isEs ? 'Duración (min)' : 'Duration (min)'}
                            </label>
                            <Input type="number" value={courseForm.duration_minutes} onChange={e => setCourseForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} />
                          </div>
                          <div>
                            <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                              {isEs ? 'Skills (coma)' : 'Skills (comma)'}
                            </label>
                            <Input value={courseForm.skills_learned} onChange={e => setCourseForm(f => ({ ...f, skills_learned: e.target.value }))} placeholder="Prompt Design, ..." />
                          </div>
                        </div>

                        {/* Exam Questions Section */}
                        <div className="border-t border-border/50 pt-4">
                          <h4 className="font-heading font-bold text-sm mb-1 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            {isEs ? 'Preguntas del Examen (mínimo 5) *' : 'Exam Questions (minimum 5) *'}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mb-3">
                            {isEs
                              ? 'Cada pregunta debe tener 4 opciones y una respuesta correcta.'
                              : 'Each question must have 4 options and one correct answer.'}
                          </p>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                            {examQuestions.map((eq, qi) => (
                              <div key={qi} className="rounded-lg border border-border/50 p-3 space-y-2 bg-muted/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-heading font-bold text-muted-foreground">
                                    {isEs ? `Pregunta ${qi + 1}` : `Question ${qi + 1}`}
                                  </span>
                                  {examQuestions.length > 5 && (
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => {
                                      setExamQuestions(prev => prev.filter((_, i) => i !== qi));
                                    }}>×</Button>
                                  )}
                                </div>
                                <Input
                                  value={eq.question}
                                  onChange={e => {
                                    const updated = [...examQuestions];
                                    updated[qi] = { ...updated[qi], question: e.target.value };
                                    setExamQuestions(updated);
                                  }}
                                  placeholder={isEs ? 'Pregunta en inglés *' : 'Question in English *'}
                                  className="text-sm"
                                />
                                <Input
                                  value={eq.question_es}
                                  onChange={e => {
                                    const updated = [...examQuestions];
                                    updated[qi] = { ...updated[qi], question_es: e.target.value };
                                    setExamQuestions(updated);
                                  }}
                                  placeholder={isEs ? 'Pregunta en español' : 'Question in Spanish (optional)'}
                                  className="text-sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  {eq.options.map((opt, oi) => (
                                    <div key={oi} className="flex items-center gap-1">
                                      <input
                                        type="radio"
                                        name={`correct-${qi}`}
                                        checked={eq.correct_index === oi}
                                        onChange={() => {
                                          const updated = [...examQuestions];
                                          updated[qi] = { ...updated[qi], correct_index: oi };
                                          setExamQuestions(updated);
                                        }}
                                        className="accent-primary shrink-0"
                                      />
                                      <Input
                                        value={opt}
                                        onChange={e => {
                                          const updated = [...examQuestions];
                                          const newOpts = [...updated[qi].options];
                                          newOpts[oi] = e.target.value;
                                          updated[qi] = { ...updated[qi], options: newOpts };
                                          setExamQuestions(updated);
                                        }}
                                        placeholder={`${String.fromCharCode(65 + oi)}. ${isEs ? 'Opción' : 'Option'}`}
                                        className="text-xs h-8"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  {isEs ? '○ Selecciona la respuesta correcta' : '○ Select the correct answer'}
                                </p>
                              </div>
                            ))}
                          </div>
                          {examQuestions.length < 10 && (
                            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => {
                              setExamQuestions(prev => [...prev, { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 }]);
                            }}>
                              + {isEs ? 'Agregar pregunta' : 'Add question'}
                            </Button>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <Button variant="outline" onClick={() => { setShowCourseForm(false); setSelectedCategory(''); }}>
                            {isEs ? 'Cancelar' : 'Cancel'}
                          </Button>
                          <Button onClick={handleSubmitCourse} disabled={!courseForm.title || !courseForm.external_url || !courseForm.path_id || submitCourse.isPending}>
                            <Upload className="h-4 w-4 mr-2" />
                            {isEs ? 'Enviar para Revisión' : 'Submit for Review'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* My Courses */}
                  {tutorCourses.length > 0 && (
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {isEs ? 'Mis Cursos' : 'My Courses'}
                      </h3>
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                        <div className="divide-y divide-border/50">
                          {tutorCourses.map(course => (
                            <div key={course.id} className="p-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                {course.thumbnail_url ? (
                                  <img src={course.thumbnail_url} alt="" className="h-12 w-20 rounded-lg object-cover shrink-0" />
                                ) : (
                                  <div className="h-12 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <Play className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-heading font-semibold text-sm truncate">{course.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant={course.course_status === 'published' ? 'default' : course.course_status === 'pending_review' ? 'secondary' : 'outline'} className="text-[10px]">
                                      {course.course_status === 'published' ? (isEs ? 'Publicado' : 'Published') :
                                       course.course_status === 'pending_review' ? (isEs ? 'En revisión' : 'Under Review') :
                                       course.course_status}
                                    </Badge>
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                      <Eye className="h-3 w-3" /> {course.views_count || 0} {isEs ? 'vistas' : 'views'}
                                    </span>
                                    {course.rating > 0 && (
                                      <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                        <Star className="h-3 w-3 fill-primary text-primary" /> {Number(course.rating).toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-muted-foreground">{isEs ? 'Recompensa' : 'Reward'}</p>
                                <p className="font-heading font-bold text-sm text-primary">${((course.views_count || 0) * 0.01).toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : tutorApp ? (
                /* Pending/Rejected application status */
                <Card className={`border-${tutorApp.status === 'rejected' ? 'destructive' : 'border'}/30 max-w-lg mx-auto`}>
                  <CardContent className="p-6 text-center">
                    <Badge className={`mb-3 ${
                      tutorApp.status === 'rejected' ? 'bg-destructive text-destructive-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {tutorApp.status === 'rejected' ? (isEs ? '❌ Rechazado' : '❌ Rejected') :
                       (isEs ? '⏳ En revisión' : '⏳ Under Review')}
                    </Badge>
                    <h3 className="font-heading font-bold text-lg mb-2">
                      {tutorApp.status === 'rejected'
                        ? (isEs ? 'Tu solicitud fue rechazada' : 'Your application was rejected')
                        : (isEs ? 'Solicitud enviada' : 'Application submitted')}
                    </h3>
                    {tutorApp.admin_note && (
                      <p className="text-sm text-muted-foreground italic">{`"${tutorApp.admin_note}"`}</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* No application yet - show application form */
                <div className="max-w-lg mx-auto">
                  {!showTutorForm ? (
                    <Card className="border-dashed border-2 border-primary/30 hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => setShowTutorForm(true)}>
                      <CardContent className="p-8 text-center">
                        <Upload className="h-10 w-10 text-primary/50 mx-auto mb-3" />
                        <p className="font-heading font-bold mb-1">
                          {isEs ? 'Aplicar como Tutor' : 'Apply as Tutor'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isEs ? 'Haz clic para comenzar tu solicitud' : 'Click to start your application'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-heading">{isEs ? 'Solicitud de Tutor' : 'Tutor Application'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                            {isEs ? 'Cuéntanos sobre ti y tu experiencia en IA *' : 'Tell us about yourself and your AI experience *'}
                          </label>
                          <Textarea
                            value={tutorForm.bio}
                            onChange={e => setTutorForm(f => ({ ...f, bio: e.target.value }))}
                            placeholder={isEs ? 'Tu experiencia, proyectos, áreas de expertise...' : 'Your experience, projects, areas of expertise...'}
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                            {isEs ? 'Áreas de expertise (separadas por coma)' : 'Expertise areas (comma-separated)'}
                          </label>
                          <Input
                            value={tutorForm.expertise}
                            onChange={e => setTutorForm(f => ({ ...f, expertise: e.target.value }))}
                            placeholder="Prompt Engineering, AI Automation, ..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                            {isEs ? 'Link a tu portafolio (opcional)' : 'Portfolio link (optional)'}
                          </label>
                          <Input
                            value={tutorForm.portfolio_url}
                            onChange={e => setTutorForm(f => ({ ...f, portfolio_url: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowTutorForm(false)}>
                            {isEs ? 'Cancelar' : 'Cancel'}
                          </Button>
                          <Button onClick={handleTutorApply} disabled={!tutorForm.bio || submitTutorApp.isPending}>
                            <Upload className="h-4 w-4 mr-2" />
                            {isEs ? 'Enviar Solicitud' : 'Submit Application'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* What tutors can teach */}
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { icon: <Brain className="h-5 w-5" />, label: isEs ? 'Automatización IA' : 'AI Automation' },
                      { icon: <MessageSquare className="h-5 w-5" />, label: 'Prompt Engineering' },
                      { icon: <Video className="h-5 w-5" />, label: isEs ? 'Creación de Video IA' : 'AI Video Creation' },
                      { icon: <Code className="h-5 w-5" />, label: isEs ? 'Herramientas de Código IA' : 'AI Coding Tools' },
                      { icon: <TrendingUp className="h-5 w-5" />, label: isEs ? 'Marketing con IA' : 'AI Marketing' },
                      { icon: <Zap className="h-5 w-5" />, label: isEs ? 'Productividad con IA' : 'AI Productivity' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 rounded-xl border border-border/50 p-3 bg-card/50">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                          {item.icon}
                        </div>
                        <span className="text-xs font-heading font-semibold">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── COMMUNITY ── */}
          <TabsContent value="community" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse && !showExam} onOpenChange={(open) => { if (!open) setSelectedCourse(null); }}>
        <DialogContent className="max-w-lg">
          {selectedCourse && (() => {
            const sc = selectedCourse;
            const isComp = completedIds.has(sc.id);
            const parentPath = paths.find(p => p.id === sc.path_id);
            return (
              <>
                <DialogHeader>
                  {sc.external_url && isYouTubeUrl(sc.external_url) ? (
                    <YouTubeVideoPlayer url={sc.external_url} title={sc.title} className="mb-3" />
                  ) : sc.thumbnail_url ? (
                    <div className="w-full aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
                      <img src={sc.thumbnail_url} alt={sc.title} className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                  <DialogTitle className="font-heading text-xl">
                    {isEs ? sc.title_es || sc.title : sc.title}
                  </DialogTitle>
                  {sc.instructor_name && (
                    <div className="flex items-center gap-2 mt-1">
                      {sc.instructor_avatar ? (
                        <img src={sc.instructor_avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground">{sc.instructor_name}</span>
                    </div>
                  )}
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {isEs ? sc.description_es || sc.description : sc.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{sc.platform}</Badge>
                    <Badge variant="secondary" className="capitalize">{sc.skill_level}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {sc.duration_minutes} min
                    </Badge>
                    <Badge variant="outline">{sc.language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}</Badge>
                    {sc.views_count > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {sc.views_count}
                      </Badge>
                    )}
                    {sc.rating > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" /> {Number(sc.rating).toFixed(1)}
                      </Badge>
                    )}
                  </div>

                  {parentPath && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1">
                        {isEs ? 'Ruta de aprendizaje' : 'Learning Path'}
                      </p>
                      <div className="flex items-center gap-2">
                        {iconMap[parentPath.icon] || <BookOpen className="h-4 w-4" />}
                        <span className="font-heading font-semibold text-sm">
                          {isEs ? parentPath.title_es || parentPath.title : parentPath.title}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-heading font-semibold mb-2">
                      {isEs ? 'Habilidades que aprenderás:' : 'Skills you will learn:'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(sc.skills_learned || []).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>

                  {isComp ? (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                      <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" />
                      <p className="font-heading font-bold text-sm text-primary">
                        {isEs ? '✅ Curso completado' : '✅ Course completed'}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      <p className="text-xs text-muted-foreground">
                        {isEs
                          ? '📝 Estudia el curso y luego aprueba el examen para completarlo.'
                          : '📝 Study the course and pass the exam to complete it.'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {sc.external_url && (
                      <Button variant="outline" className="flex-1" asChild>
                        <a
                          href={isYouTubeUrl(sc.external_url) ? `https://www.youtube.com/watch?v=${extractYouTubeId(sc.external_url)}` : sc.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            handleCourseClick(sc);
                            // Close dialog to stop video playback
                            setSelectedCourse(null);
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {isYouTubeUrl(sc.external_url) ? (isEs ? 'Abrir en YouTube' : 'Open on YouTube') : (isEs ? 'Ir al Curso' : 'Go to Course')}
                        </a>
                      </Button>
                    )}
                    {!isComp && (
                      <Button className="flex-1" onClick={() => setShowExam(true)}>
                        <GraduationCap className="h-4 w-4 mr-2" />
                        {isEs ? 'Tomar Examen' : 'Take Exam'}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Exam Dialog */}
      <Dialog open={showExam && !!selectedCourse} onOpenChange={(open) => { if (!open) setShowExam(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {isEs ? 'Examen: ' : 'Exam: '}
                  {isEs ? selectedCourse.title_es || selectedCourse.title : selectedCourse.title}
                </DialogTitle>
              </DialogHeader>
              <CourseExam
                course={selectedCourse}
                isEs={isEs}
                onPass={() => handleExamPass(selectedCourse.id)}
                onClose={() => {
                  setShowExam(false);
                  setSelectedCourse(null);
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Sub-components ─────────────────────────────

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

function LanguageToggle({ value, onChange, isEs }: { value: 'all' | 'en' | 'es'; onChange: (v: 'all' | 'en' | 'es') => void; isEs: boolean }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-muted/50">
      {(['all', 'en', 'es'] as const).map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 rounded-md text-xs font-heading font-semibold transition-all ${
            value === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {v === 'all' ? (isEs ? 'Todos' : 'All') : v === 'en' ? '🇺🇸' : '🇪🇸'}
        </button>
      ))}
    </div>
  );
}

function CourseVideoCard({
  course, isEs, completed, onOpen, featured, compact
}: {
  course: AcademyCourse;
  isEs: boolean;
  completed: boolean;
  onOpen: () => void;
  featured?: boolean;
  compact?: boolean;
}) {
  const title = isEs ? course.title_es || course.title : course.title;
  const description = isEs ? course.description_es || course.description : course.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group cursor-pointer ${compact ? '' : ''}`}
      onClick={onOpen}
    >
      {/* Thumbnail - auto-detect YouTube thumbnail */}
      <div className={`relative overflow-hidden rounded-xl bg-muted mb-3 aspect-video`}>
        {(() => {
          const thumbUrl = course.thumbnail_url || (course.external_url && isYouTubeUrl(course.external_url) ? getYouTubeThumbnail(extractYouTubeId(course.external_url)!) : null);
          return thumbUrl ? (
            <img
              src={thumbUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Play className="h-10 w-10 text-primary/30" />
            </div>
          );
        })()}
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {completed && (
            <span className="bg-primary text-primary-foreground text-[10px] font-heading font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {isEs ? 'Completado' : 'Completed'}
            </span>
          )}
          {course.featured && (
            <span className="bg-accent text-accent-foreground text-[10px] font-heading font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {isEs ? 'Destacado' : 'Featured'}
            </span>
          )}
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1">
          <span className="bg-foreground/80 text-background text-[10px] font-heading font-bold px-2 py-0.5 rounded-md">
            {course.duration_minutes} min
          </span>
        </div>
        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2.5">
          {course.instructor_avatar ? (
            <img src={course.instructor_avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {course.instructor_name && (
              <p className="text-xs text-muted-foreground mt-0.5">{course.instructor_name}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
              {course.views_count > 0 && (
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" /> {course.views_count.toLocaleString()}
                </span>
              )}
              {course.rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-primary text-primary" /> {Number(course.rating).toFixed(1)}
                </span>
              )}
              <span className="capitalize">{course.skill_level}</span>
              <span>{course.language === 'es' ? '🇪🇸' : '🇺🇸'}</span>
            </div>
          </div>
        </div>
        {!compact && (
          <div className="flex flex-wrap gap-1 pl-[42px]">
            <Badge variant="outline" className="text-[10px] h-5">{course.platform}</Badge>
            {(course.skills_learned || []).slice(0, 2).map(s => (
              <Badge key={s} variant="secondary" className="text-[10px] h-5">{s}</Badge>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AcademyDashboard;
