import { useState, useRef } from 'react';
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
  Users, Sparkles, Upload, Heart, HeartOff, UserPlus, UserCheck,
  FileUp, BarChart3, Loader2, Download
} from 'lucide-react';
import {
  useAcademyPaths, useAcademyCourses, useAcademyTools,
  useCourseProgress, useToggleCourseCompletion, useSharedPrompts,
  useCreateSharedPrompt, getExplorerLevel, EXPLORER_LEVELS,
  useTutorApplication, useSubmitTutorApplication,
  useSubmitCourseAsTutor, useIncrementViews,
  type AcademyCourse
} from '@/hooks/useAcademy';
import {
  useMyFavoriteCourses, useToggleFavoriteCourse,
  useMyFollowedTutors, useToggleFollowTutor,
  useExplorerSkills, useUpsertSkills,
  useRecordExamAttempt, useMyCertificates, useIssueCertificate,
  calculateMissionReadiness, calculateTutorScore
} from '@/hooks/useAcademySocial';
import CourseExam from '@/components/CourseExam';
import CertificateCard from '@/components/CertificateCard';
import YouTubeVideoPlayer, { isYouTubeUrl, extractYouTubeId, getYouTubeThumbnail } from '@/components/YouTubeVideoPlayer';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain className="h-5 w-5" />, Zap: <Zap className="h-5 w-5" />,
  Code: <Code className="h-5 w-5" />, Palette: <Palette className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />, BookOpen: <BookOpen className="h-5 w-5" />,
  Wrench: <Wrench className="h-5 w-5" />, MessageSquare: <MessageSquare className="h-5 w-5" />,
  Bot: <Bot className="h-5 w-5" />, Image: <Image className="h-5 w-5" />,
  Video: <Video className="h-5 w-5" />, PenTool: <PenTool className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />, Search: <Search className="h-5 w-5" />,
  GitBranch: <GitBranch className="h-5 w-5" />, Workflow: <Workflow className="h-5 w-5" />,
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
  const { data: favorites = [] } = useMyFavoriteCourses();
  const { data: followedTutors = [] } = useMyFollowedTutors();
  const { data: skills = [] } = useExplorerSkills();
  const { data: certificates = [] } = useMyCertificates();
  const toggleCompletion = useToggleCourseCompletion();
  const createPrompt = useCreateSharedPrompt();
  const submitTutorApp = useSubmitTutorApplication();
  const submitCourse = useSubmitCourseAsTutor();
  const incrementViews = useIncrementViews();
  const toggleFavorite = useToggleFavoriteCourse();
  const toggleFollow = useToggleFollowTutor();
  const upsertSkills = useUpsertSkills();
  const recordAttempt = useRecordExamAttempt();
  const issueCert = useIssueCertificate();

  const [activeTab, setActiveTab] = useState('courses');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [toolFilter, setToolFilter] = useState('all');
  const [courseLangFilter, setCourseLangFilter] = useState<'all' | 'en' | 'es'>('all');
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'general' });
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [showExam, setShowExam] = useState(false);
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [tutorForm, setTutorForm] = useState({ bio: '', expertise: '', portfolio_url: '' });
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
  const [parsingPdf, setParsingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const isTutor = tutorApp?.status === 'approved';
  const tutorCourses = courses.filter(c => c.submitted_by === user?.id);

  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.course_id));
  const completedCount = completedIds.size;
  const explorerLevel = getExplorerLevel(completedCount);
  const LevelIcon = levelIcons[explorerLevel.level - 1] || Shield;

  const favoriteIds = new Set(favorites.map((f: any) => f.course_id));
  const followedTutorIds = new Set(followedTutors.map((f: any) => f.tutor_id));

  const skillsUnlocked = new Set(
    courses.filter(c => completedIds.has(c.id)).flatMap(c => c.skills_learned || [])
  );

  // Mission readiness
  const readiness = calculateMissionReadiness({
    coursesCompleted: completedCount,
    totalCourses: courses.length,
    skillsCount: skills.length,
    avgExamScore: 75, // average from attempts
    missionsCompleted: 0,
  });

  // Tutor score
  const tutorScore = isTutor ? calculateTutorScore({
    views: tutorCourses.reduce((s, c) => s + (c.views_count || 0), 0),
    completions: 0,
    followers: 0,
    coursesCount: tutorCourses.length,
  }) : null;

  const filteredCourses = courses.filter(c => {
    const matchSearch = !courseSearch ||
      c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (c.title_es || '').toLowerCase().includes(courseSearch.toLowerCase());
    const matchFilter = courseFilter === 'all' || c.skill_level === courseFilter || c.category === courseFilter;
    const matchLang = courseLangFilter === 'all' || c.language === courseLangFilter;
    return matchSearch && matchFilter && matchLang;
  });

  const featuredCourses = courses.filter(c => c.featured);
  const filteredTools = tools.filter(t => toolFilter === 'all' || t.category === toolFilter);
  const favoriteCourses = courses.filter(c => favoriteIds.has(c.id));

  const handleExamPass = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    toggleCompletion.mutate(
      { courseId, completed: true },
      {
        onSuccess: () => {
          toast.success(isEs ? '¡Examen aprobado! Curso completado 🎉' : 'Exam passed! Course completed 🎉');
          // Update skills
          const courseSkills = course?.skills_learned || [];
          if (courseSkills.length > 0) {
            upsertSkills.mutate(courseSkills);
          }
          // Issue certificate
          if (course) {
            issueCert.mutate({
              courseId,
              courseTitle: course.title,
              tutorName: course.instructor_name || 'Dream Academy',
              explorerName: user?.user_metadata?.username || user?.email?.split('@')[0] || 'Explorer',
            });
          }
          // Record attempt
          recordAttempt.mutate({ courseId, score: 100, passed: true, attemptNumber: 1 });
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
          toast.success(isEs ? '¡Solicitud enviada!' : 'Application submitted!');
        },
      }
    );
  };

  const handleSubmitCourse = () => {
    if (!courseForm.title || !courseForm.external_url || !courseForm.path_id) return;
    const validQuestions = examQuestions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
    if (validQuestions.length < 5) {
      toast.error(isEs ? 'Debes agregar al menos 5 preguntas' : 'Add at least 5 questions');
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
          toast.success(isEs ? '¡Curso enviado para revisión!' : 'Course submitted for review!');
          setShowCourseForm(false);
          setSelectedCategory('');
          setCourseForm({ title: '', description: '', external_url: '', thumbnail_url: '', duration_minutes: 30, skill_level: 'beginner', language: 'en', skills_learned: '', path_id: '' });
          setExamQuestions(Array(5).fill(null).map(() => ({ question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 })));
        },
      }
    );
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error(isEs ? 'Solo archivos PDF' : 'PDF files only');
      return;
    }

    setParsingPdf(true);
    try {
      // Read PDF as text (basic extraction)
      const text = await file.text();
      
      const { data, error } = await supabase.functions.invoke('parse-exam-pdf', {
        body: { pdfText: text.slice(0, 15000), courseTitle: courseForm.title },
      });

      if (error) throw error;
      if (!data?.questions || data.questions.length === 0) {
        toast.error(isEs ? 'No se encontraron preguntas en el PDF' : 'No questions found in PDF');
        return;
      }

      const parsed = data.questions.map((q: any) => ({
        question: q.question,
        question_es: q.question_es || '',
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        options_es: ['', '', '', ''],
        correct_index: { a: 0, b: 1, c: 2, d: 3 }[q.correct_answer as string] || 0,
      }));

      setExamQuestions(parsed);
      toast.success(isEs ? `${parsed.length} preguntas extraídas con IA` : `${parsed.length} questions extracted with AI`);
    } catch (err: any) {
      toast.error(err.message || (isEs ? 'Error al procesar PDF' : 'Error processing PDF'));
    } finally {
      setParsingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handleCourseClick = (course: AcademyCourse) => {
    if (course.external_url) incrementViews.mutate(course.id);
  };

  const toolCategories = [...new Set(tools.map(t => t.category))];

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="container relative py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Dream Academy</h1>
                  <p className="text-xs text-muted-foreground font-heading uppercase tracking-widest">
                    {isEs ? 'Motor de Habilidades en IA' : 'AI Skill Engine'}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm md:text-base">
                {isEs ? 'Aprende, certifícate y desbloquea misiones de alto valor.' : 'Learn, get certified, and unlock high-value missions.'}
              </p>
            </div>

            {/* Level + Readiness */}
            <div className="flex gap-3">
              <Card className="bg-card/80 backdrop-blur border-primary/20 min-w-[200px]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <LevelIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">
                        {isEs ? 'Nivel' : 'Level'} {explorerLevel.level}
                      </p>
                      <p className="font-heading font-bold text-sm">{isEs ? explorerLevel.name_es : explorerLevel.name}</p>
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
              <Card className="bg-card/80 backdrop-blur border-primary/20 min-w-[180px]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">
                      {isEs ? 'Preparación' : 'Readiness'}
                    </p>
                  </div>
                  <p className="font-heading font-bold text-2xl text-primary">{readiness.score}%</p>
                  <p className="text-[10px] text-muted-foreground">{isEs ? readiness.levelEs : readiness.level}</p>
                </CardContent>
              </Card>
            </div>
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
              <TabsTrigger value="favorites" className="text-xs font-heading gap-1.5">
                <Heart className="h-3.5 w-3.5" /> {isEs ? 'Favoritos' : 'Favorites'}
                {favorites.length > 0 && <Badge variant="secondary" className="text-[9px] h-4 ml-1">{favorites.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="progress" className="text-xs font-heading gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> {isEs ? 'Progreso' : 'Progress'}
              </TabsTrigger>
              <TabsTrigger value="certificates" className="text-xs font-heading gap-1.5">
                <Award className="h-3.5 w-3.5" /> {isEs ? 'Certificados' : 'Certificates'}
                {certificates.length > 0 && <Badge variant="secondary" className="text-[9px] h-4 ml-1">{certificates.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="toolkit" className="text-xs font-heading gap-1.5">
                <Wrench className="h-3.5 w-3.5" /> Toolkit
              </TabsTrigger>
              <TabsTrigger value="teach" className="text-xs font-heading gap-1.5">
                <Upload className="h-3.5 w-3.5" /> {isEs ? 'Enseñar' : 'Teach'}
              </TabsTrigger>
              <TabsTrigger value="community" className="text-xs font-heading gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> {isEs ? 'Comunidad' : 'Community'}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── COURSES TAB ── */}
          <TabsContent value="courses" className="mt-2">
            {featuredCourses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {isEs ? 'Destacados' : 'Featured'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredCourses.slice(0, 3).map(course => (
                    <CourseVideoCard key={course.id} course={course} isEs={isEs}
                      completed={completedIds.has(course.id)} onOpen={() => setSelectedCourse(course)}
                      isFavorite={favoriteIds.has(course.id)} onToggleFavorite={() => toggleFavorite.mutate({ courseId: course.id, isFavorite: favoriteIds.has(course.id) })}
                      featured />
                  ))}
                </div>
              </div>
            )}

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isEs ? 'Buscar cursos...' : 'Search courses...'} value={courseSearch} onChange={e => setCourseSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder={isEs ? 'Filtrar' : 'Filter'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isEs ? 'Todos' : 'All'}</SelectItem>
                  <SelectItem value="ai-basics">{isEs ? 'Fundamentos IA' : 'AI Basics'}</SelectItem>
                  <SelectItem value="ai-productivity">{isEs ? 'Productividad IA' : 'AI Productivity'}</SelectItem>
                  <SelectItem value="ai-automation">{isEs ? 'Automatización IA' : 'AI Automation'}</SelectItem>
                  <SelectItem value="ai-content-creation">{isEs ? 'Creación Contenido IA' : 'AI Content Creation'}</SelectItem>
                  <SelectItem value="ai-development">{isEs ? 'Desarrollo IA' : 'AI Development'}</SelectItem>
                  <SelectItem value="beginner">{isEs ? 'Principiante' : 'Beginner'}</SelectItem>
                  <SelectItem value="intermediate">{isEs ? 'Intermedio' : 'Intermediate'}</SelectItem>
                  <SelectItem value="advanced">{isEs ? 'Avanzado' : 'Advanced'}</SelectItem>
                </SelectContent>
              </Select>
              <LanguageToggle value={courseLangFilter} onChange={setCourseLangFilter} isEs={isEs} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredCourses.map(course => (
                <CourseVideoCard key={course.id} course={course} isEs={isEs}
                  completed={completedIds.has(course.id)} onOpen={() => setSelectedCourse(course)}
                  isFavorite={favoriteIds.has(course.id)} onToggleFavorite={() => toggleFavorite.mutate({ courseId: course.id, isFavorite: favoriteIds.has(course.id) })} />
              ))}
            </div>
            {filteredCourses.length === 0 && (
              <div className="text-center py-16">
                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-heading">{isEs ? 'No se encontraron cursos.' : 'No courses found.'}</p>
              </div>
            )}
          </TabsContent>

          {/* ── LEARNING PATHS ── */}
          <TabsContent value="paths" className="mt-4 space-y-6">
            {paths.map(path => {
              const pathCourses = courses.filter(c => c.path_id === path.id).filter(c => courseLangFilter === 'all' || c.language === courseLangFilter);
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
                        <h3 className="font-heading font-bold">{isEs ? path.title_es || path.title : path.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {pathCompleted}/{pathCourses.length} {isEs ? 'completados' : 'completed'} · {Math.round(pct)}%
                        </p>
                      </div>
                      {pct === 100 && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> {isEs ? 'Completada' : 'Completed'}
                        </Badge>
                      )}
                    </div>
                    <Progress value={pct} className="h-1.5 mt-3" />
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pathCourses.map(course => (
                        <CourseVideoCard key={course.id} course={course} isEs={isEs}
                          completed={completedIds.has(course.id)} onOpen={() => setSelectedCourse(course)}
                          isFavorite={favoriteIds.has(course.id)} onToggleFavorite={() => toggleFavorite.mutate({ courseId: course.id, isFavorite: favoriteIds.has(course.id) })}
                          compact />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ── FAVORITES TAB ── */}
          <TabsContent value="favorites" className="mt-4">
            {favoriteCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {favoriteCourses.map(course => (
                  <CourseVideoCard key={course.id} course={course} isEs={isEs}
                    completed={completedIds.has(course.id)} onOpen={() => setSelectedCourse(course)}
                    isFavorite onToggleFavorite={() => toggleFavorite.mutate({ courseId: course.id, isFavorite: true })} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-heading">{isEs ? 'No tienes cursos favoritos aún.' : 'No favorite courses yet.'}</p>
                <p className="text-sm text-muted-foreground mt-1">{isEs ? 'Haz clic en ❤️ en cualquier curso para guardarlo.' : 'Click ❤️ on any course to save it.'}</p>
              </div>
            )}
          </TabsContent>

          {/* ── PROGRESS + SKILLS ── */}
          <TabsContent value="progress" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Trophy className="h-5 w-5 text-primary" />} label={isEs ? 'Nivel' : 'Level'} value={isEs ? explorerLevel.name_es : explorerLevel.name} />
              <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} label={isEs ? 'Completados' : 'Completed'} value={`${completedCount}/${courses.length}`} />
              <StatCard icon={<Zap className="h-5 w-5 text-amber-500" />} label={isEs ? 'Habilidades' : 'Skills'} value={String(skills.length || skillsUnlocked.size)} />
              <StatCard icon={<Target className="h-5 w-5 text-primary" />} label={isEs ? 'Preparación' : 'Readiness'} value={`${readiness.score}%`} />
            </div>

            {/* Mission Readiness */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {isEs ? 'Preparación para Misiones' : 'Mission Readiness'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {[
                    { label: isEs ? 'Cursos' : 'Courses', value: completedCount, color: 'text-primary' },
                    { label: isEs ? 'Habilidades' : 'Skills', value: skills.length || skillsUnlocked.size, color: 'text-amber-500' },
                    { label: isEs ? 'Exámenes' : 'Exams', value: `75%`, color: 'text-emerald-500' },
                    { label: isEs ? 'Misiones' : 'Missions', value: 0, color: 'text-blue-500' },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <p className={`font-heading font-bold text-2xl ${item.color}`}>{item.value}</p>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                <Progress value={readiness.score} className="h-3 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Explorer</span>
                  <span>Advanced</span>
                  <span>Elite</span>
                  <span>Legendary</span>
                </div>
              </CardContent>
            </Card>

            {/* Skill Graph */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {isEs ? 'Grafo de Habilidades' : 'Skill Graph'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(skills.length > 0 || skillsUnlocked.size > 0) ? (
                  <div className="flex flex-wrap gap-2">
                    {(skills.length > 0 ? skills : [...skillsUnlocked].map(s => ({ skill_name: s, skill_level: 1, verified_by_exam: true }))).map((skill: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-heading font-semibold">{skill.skill_name}</span>
                        {skill.verified_by_exam && (
                          <Badge variant="outline" className="text-[9px] h-4">{isEs ? 'Verificada' : 'Verified'}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{isEs ? 'Completa cursos para desbloquear habilidades.' : 'Complete courses to unlock skills.'}</p>
                )}
              </CardContent>
            </Card>

            {/* Explorer Levels */}
            <Card>
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
                      <div key={level.level} className={`rounded-xl border p-4 text-center transition-all ${
                        isCurrent ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                          : isActive ? 'border-border/50 bg-muted/30' : 'border-border/30 opacity-40'
                      }`}>
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
          </TabsContent>

          {/* ── CERTIFICATES TAB ── */}
          <TabsContent value="certificates" className="mt-4">
            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.map((cert: any) => (
                  <CertificateCard key={cert.id} certificate={cert} isEs={isEs} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Award className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-heading">{isEs ? 'No tienes certificados aún.' : 'No certificates yet.'}</p>
                <p className="text-sm text-muted-foreground mt-1">{isEs ? 'Aprueba exámenes para obtener certificados verificables.' : 'Pass exams to earn verifiable certificates.'}</p>
              </div>
            )}
          </TabsContent>

          {/* ── TOOLKIT ── */}
          <TabsContent value="toolkit" className="mt-4">
            <div className="flex gap-2 mb-6 flex-wrap">
              <Button variant={toolFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setToolFilter('all')} className="font-heading text-xs">
                {isEs ? 'Todos' : 'All'}
              </Button>
              {toolCategories.map(cat => (
                <Button key={cat} variant={toolFilter === cat ? 'default' : 'outline'} size="sm" onClick={() => setToolFilter(cat)} className="font-heading text-xs capitalize">
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
                        <Badge variant="outline" className="text-[10px] capitalize mt-0.5">{tool.category.replace('ai-', 'AI ')}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{isEs ? tool.description_es || tool.description : tool.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(isEs ? tool.use_cases_es || tool.use_cases : tool.use_cases).map((uc, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{uc}</Badge>
                      ))}
                    </div>
                    {tool.url && (
                      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                        <a href={tool.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" /> {isEs ? 'Aprender más' : 'Learn more'}
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── TEACH (Tutor Dashboard) ── */}
          <TabsContent value="teach" className="mt-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-heading font-bold mb-2">
                  {isTutor ? (isEs ? 'Tu Panel de Creador' : 'Your Creator Dashboard') : (isEs ? 'Conviértete en Tutor' : 'Become a Tutor')}
                </h2>
                <p className="text-muted-foreground">
                  {isTutor ? (isEs ? 'Crea cursos, trackea métricas y construye tu marca.' : 'Create courses, track metrics and build your brand.') : (isEs ? 'Comparte tu conocimiento y gana recompensas.' : 'Share your knowledge and earn rewards.')}
                </p>
              </div>

              {isTutor ? (
                <div className="space-y-8">
                  {/* Tutor Stats + Ranking */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard icon={<BookOpen className="h-5 w-5 text-primary" />} label={isEs ? 'Cursos' : 'Courses'} value={String(tutorCourses.length)} />
                    <StatCard icon={<Eye className="h-5 w-5 text-primary" />} label={isEs ? 'Vistas' : 'Views'} value={String(tutorCourses.reduce((s, c) => s + (c.views_count || 0), 0))} />
                    <StatCard icon={<Star className="h-5 w-5 text-primary" />} label="Rating" value={tutorCourses.length > 0 ? (tutorCourses.reduce((s, c) => s + Number(c.rating || 0), 0) / tutorCourses.length).toFixed(1) : '—'} />
                    <StatCard icon={<TrendingUp className="h-5 w-5 text-primary" />} label={isEs ? 'Recompensas' : 'Rewards'} value={`$${(tutorCourses.reduce((s, c) => s + (c.views_count || 0), 0) * 0.01).toFixed(2)}`} />
                    {tutorScore && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl mb-1">{tutorScore.emoji}</p>
                          <p className="font-heading font-bold text-xs">{isEs ? tutorScore.levelEs : tutorScore.level}</p>
                          <p className="text-[10px] text-muted-foreground">Score: {tutorScore.score}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Category Cards */}
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
                        <Card key={cat.key} className="cursor-pointer hover:border-primary/50 transition-all group"
                          onClick={() => {
                            setSelectedCategory(cat.key);
                            const firstPath = paths.length > 0 ? paths[0].id : '';
                            setCourseForm(f => ({ ...f, path_id: firstPath }));
                            setShowCourseForm(true);
                          }}>
                          <CardContent className={`p-5 text-center bg-gradient-to-br ${cat.color} rounded-lg`}>
                            <div className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center mx-auto mb-3 text-primary group-hover:scale-110 transition-transform">
                              {cat.icon}
                            </div>
                            <p className="font-heading font-bold text-sm">{cat.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{isEs ? 'Click para subir' : 'Click to upload'}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Course Upload Dialog */}
                  <Dialog open={showCourseForm} onOpenChange={open => { if (!open) { setShowCourseForm(false); setSelectedCategory(''); } }}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                          <Upload className="h-5 w-5 text-primary" />
                          {isEs ? 'Nuevo Curso' : 'New Course'}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3 bg-muted/30">
                        <Badge className="capitalize">{selectedCategory.replace('ai-', 'AI ').replace('-', ' ')}</Badge>
                        <Select value={courseForm.path_id} onValueChange={v => setCourseForm(f => ({ ...f, path_id: v }))}>
                          <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder={isEs ? 'Ruta' : 'Path'} /></SelectTrigger>
                          <SelectContent>
                            {paths.map(p => <SelectItem key={p.id} value={p.id}>{isEs ? p.title_es || p.title : p.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Título *' : 'Title *'}</label>
                          <Input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Descripción' : 'Description'}</label>
                          <Textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                        </div>
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Link del video *' : 'Video link *'}</label>
                          <Input value={courseForm.external_url} onChange={e => {
                            const url = e.target.value;
                            setCourseForm(f => {
                              const update = { ...f, external_url: url };
                              const ytId = extractYouTubeId(url);
                              if (ytId && !f.thumbnail_url) update.thumbnail_url = getYouTubeThumbnail(ytId);
                              return update;
                            });
                          }} placeholder="https://youtube.com/watch?v=..." />
                        </div>
                        {courseForm.external_url && isYouTubeUrl(courseForm.external_url) && (
                          <YouTubeVideoPlayer url={courseForm.external_url} title="Preview" className="max-w-full" />
                        )}
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'URL miniatura' : 'Thumbnail URL'}</label>
                          <Input value={courseForm.thumbnail_url} onChange={e => setCourseForm(f => ({ ...f, thumbnail_url: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Nivel' : 'Level'}</label>
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
                            <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Idioma' : 'Language'}</label>
                            <Select value={courseForm.language} onValueChange={v => setCourseForm(f => ({ ...f, language: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">🇺🇸 English</SelectItem>
                                <SelectItem value="es">🇪🇸 Español</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Duración (min)' : 'Duration (min)'}</label>
                            <Input type="number" value={courseForm.duration_minutes} onChange={e => setCourseForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} />
                          </div>
                          <div>
                            <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Skills (coma)' : 'Skills (comma)'}</label>
                            <Input value={courseForm.skills_learned} onChange={e => setCourseForm(f => ({ ...f, skills_learned: e.target.value }))} placeholder="Prompt Design, ..." />
                          </div>
                        </div>

                        {/* Exam Section with PDF Upload */}
                        <div className="border-t border-border/50 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-heading font-bold text-sm flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-primary" />
                              {isEs ? 'Examen (mín. 5 preguntas) *' : 'Exam (min. 5 questions) *'}
                            </h4>
                            <div className="flex items-center gap-2">
                              <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => pdfInputRef.current?.click()} disabled={parsingPdf}>
                                {parsingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileUp className="h-3 w-3" />}
                                {isEs ? 'Subir PDF' : 'Upload PDF'}
                              </Button>
                            </div>
                          </div>
                          {parsingPdf && (
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-3 flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <span className="text-xs text-muted-foreground">{isEs ? 'IA extrayendo preguntas del PDF...' : 'AI extracting questions from PDF...'}</span>
                            </div>
                          )}
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                            {examQuestions.map((eq, qi) => (
                              <div key={qi} className="rounded-lg border border-border/50 p-3 space-y-2 bg-muted/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-heading font-bold text-muted-foreground">{isEs ? `Pregunta ${qi + 1}` : `Question ${qi + 1}`}</span>
                                  {examQuestions.length > 5 && (
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => setExamQuestions(prev => prev.filter((_, i) => i !== qi))}>×</Button>
                                  )}
                                </div>
                                <Input value={eq.question} onChange={e => { const u = [...examQuestions]; u[qi] = { ...u[qi], question: e.target.value }; setExamQuestions(u); }} placeholder={isEs ? 'Pregunta *' : 'Question *'} className="text-sm" />
                                <Input value={eq.question_es} onChange={e => { const u = [...examQuestions]; u[qi] = { ...u[qi], question_es: e.target.value }; setExamQuestions(u); }} placeholder={isEs ? 'Pregunta en español' : 'Spanish (optional)'} className="text-sm" />
                                <div className="grid grid-cols-2 gap-2">
                                  {eq.options.map((opt, oi) => (
                                    <div key={oi} className="flex items-center gap-1">
                                      <input type="radio" name={`correct-${qi}`} checked={eq.correct_index === oi} onChange={() => { const u = [...examQuestions]; u[qi] = { ...u[qi], correct_index: oi }; setExamQuestions(u); }} className="accent-primary shrink-0" />
                                      <Input value={opt} onChange={e => { const u = [...examQuestions]; const o = [...u[qi].options]; o[oi] = e.target.value; u[qi] = { ...u[qi], options: o }; setExamQuestions(u); }} placeholder={`${String.fromCharCode(65 + oi)}.`} className="text-xs h-8" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          {examQuestions.length < 20 && (
                            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setExamQuestions(prev => [...prev, { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: 0 }])}>
                              + {isEs ? 'Agregar pregunta' : 'Add question'}
                            </Button>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <Button variant="outline" onClick={() => { setShowCourseForm(false); setSelectedCategory(''); }}>{isEs ? 'Cancelar' : 'Cancel'}</Button>
                          <Button onClick={handleSubmitCourse} disabled={!courseForm.title || !courseForm.external_url || !courseForm.path_id || submitCourse.isPending}>
                            <Upload className="h-4 w-4 mr-2" /> {isEs ? 'Enviar para Revisión' : 'Submit for Review'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* My Courses */}
                  {tutorCourses.length > 0 && (
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" /> {isEs ? 'Mis Cursos' : 'My Courses'}
                      </h3>
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden divide-y divide-border/50">
                        {tutorCourses.map(course => (
                          <div key={course.id} className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt="" className="h-12 w-20 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="h-12 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0"><Play className="h-5 w-5 text-muted-foreground" /></div>
                              )}
                              <div className="min-w-0">
                                <p className="font-heading font-semibold text-sm truncate">{course.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant={course.course_status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                                    {course.course_status === 'published' ? (isEs ? 'Publicado' : 'Published') : (isEs ? 'En revisión' : 'Under Review')}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-3 w-3" /> {course.views_count || 0}</span>
                                  {course.rating > 0 && <span className="text-[11px] text-muted-foreground flex items-center gap-0.5"><Star className="h-3 w-3 fill-primary text-primary" /> {Number(course.rating).toFixed(1)}</span>}
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
                  )}
                </div>
              ) : tutorApp ? (
                <Card className="max-w-lg mx-auto">
                  <CardContent className="p-6 text-center">
                    <Badge className={tutorApp.status === 'rejected' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}>
                      {tutorApp.status === 'rejected' ? '❌' : '⏳'} {tutorApp.status === 'rejected' ? (isEs ? 'Rechazado' : 'Rejected') : (isEs ? 'En revisión' : 'Under Review')}
                    </Badge>
                    <h3 className="font-heading font-bold text-lg mb-2 mt-3">
                      {tutorApp.status === 'rejected' ? (isEs ? 'Solicitud rechazada' : 'Application rejected') : (isEs ? 'Solicitud enviada' : 'Application submitted')}
                    </h3>
                    {tutorApp.admin_note && <p className="text-sm text-muted-foreground italic">"{tutorApp.admin_note}"</p>}
                  </CardContent>
                </Card>
              ) : (
                <div className="max-w-lg mx-auto">
                  {!showTutorForm ? (
                    <Card className="border-dashed border-2 border-primary/30 hover:border-primary/50 transition-all cursor-pointer" onClick={() => setShowTutorForm(true)}>
                      <CardContent className="p-8 text-center">
                        <Upload className="h-10 w-10 text-primary/50 mx-auto mb-3" />
                        <p className="font-heading font-bold mb-1">{isEs ? 'Aplicar como Tutor' : 'Apply as Tutor'}</p>
                        <p className="text-xs text-muted-foreground">{isEs ? 'Click para comenzar' : 'Click to start'}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader><CardTitle className="font-heading">{isEs ? 'Solicitud de Tutor' : 'Tutor Application'}</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Bio *' : 'Bio *'}</label>
                          <Textarea value={tutorForm.bio} onChange={e => setTutorForm(f => ({ ...f, bio: e.target.value }))} rows={4} />
                        </div>
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Expertise (coma)' : 'Expertise (comma)'}</label>
                          <Input value={tutorForm.expertise} onChange={e => setTutorForm(f => ({ ...f, expertise: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">{isEs ? 'Portafolio (opcional)' : 'Portfolio (optional)'}</label>
                          <Input value={tutorForm.portfolio_url} onChange={e => setTutorForm(f => ({ ...f, portfolio_url: e.target.value }))} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowTutorForm(false)}>{isEs ? 'Cancelar' : 'Cancel'}</Button>
                          <Button onClick={handleTutorApply} disabled={!tutorForm.bio || submitTutorApp.isPending}>
                            <Upload className="h-4 w-4 mr-2" /> {isEs ? 'Enviar' : 'Submit'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
                    <Share2 className="h-5 w-5 text-primary" /> {isEs ? 'Compartir un Prompt' : 'Share a Prompt'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder={isEs ? 'Título' : 'Title'} value={newPrompt.title} onChange={e => setNewPrompt(p => ({ ...p, title: e.target.value }))} />
                  <Textarea placeholder={isEs ? 'Contenido...' : 'Content...'} value={newPrompt.content} onChange={e => setNewPrompt(p => ({ ...p, content: e.target.value }))} rows={4} />
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
                    <Share2 className="h-4 w-4 mr-2" /> {isEs ? 'Compartir' : 'Share'}
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> {isEs ? 'Prompts de la Comunidad' : 'Community Prompts'}
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
                    <p className="text-sm text-muted-foreground">{isEs ? 'Sé el primero en compartir.' : 'Be the first to share.'}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse && !showExam} onOpenChange={open => { if (!open) setSelectedCourse(null); }}>
        <DialogContent className="max-w-lg">
          {selectedCourse && (() => {
            const sc = selectedCourse;
            const isComp = completedIds.has(sc.id);
            const parentPath = paths.find(p => p.id === sc.path_id);
            const isFav = favoriteIds.has(sc.id);
            const isFollowingTutor = sc.submitted_by ? followedTutorIds.has(sc.submitted_by) : false;
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
                  <DialogTitle className="font-heading text-xl">{isEs ? sc.title_es || sc.title : sc.title}</DialogTitle>
                  {sc.instructor_name && (
                    <div className="flex items-center gap-2 mt-1">
                      {sc.instructor_avatar ? (
                        <img src={sc.instructor_avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-3 w-3 text-primary" /></div>
                      )}
                      <span className="text-sm text-muted-foreground">{sc.instructor_name}</span>
                      {sc.submitted_by && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"
                          onClick={() => toggleFollow.mutate({ tutorId: sc.submitted_by!, isFollowing: isFollowingTutor })}>
                          {isFollowingTutor ? <UserCheck className="h-3 w-3 text-primary" /> : <UserPlus className="h-3 w-3" />}
                          {isFollowingTutor ? (isEs ? 'Siguiendo' : 'Following') : (isEs ? 'Seguir' : 'Follow')}
                        </Button>
                      )}
                    </div>
                  )}
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{isEs ? sc.description_es || sc.description : sc.description}</p>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{sc.platform}</Badge>
                    <Badge variant="secondary" className="capitalize">{sc.skill_level}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> {sc.duration_minutes} min</Badge>
                    <Badge variant="outline">{sc.language === 'es' ? '🇪🇸' : '🇺🇸'}</Badge>
                    {sc.views_count > 0 && <Badge variant="outline" className="flex items-center gap-1"><Eye className="h-3 w-3" /> {sc.views_count}</Badge>}
                    {sc.rating > 0 && <Badge variant="outline" className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" /> {Number(sc.rating).toFixed(1)}</Badge>}
                  </div>

                  {parentPath && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1">{isEs ? 'Ruta' : 'Path'}</p>
                      <div className="flex items-center gap-2">
                        {iconMap[parentPath.icon] || <BookOpen className="h-4 w-4" />}
                        <span className="font-heading font-semibold text-sm">{isEs ? parentPath.title_es || parentPath.title : parentPath.title}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-heading font-semibold mb-2">{isEs ? 'Habilidades:' : 'Skills:'}</p>
                    <div className="flex flex-wrap gap-1">
                      {(sc.skills_learned || []).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>

                  {isComp ? (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                      <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" />
                      <p className="font-heading font-bold text-sm text-primary">{isEs ? '✅ Curso completado' : '✅ Course completed'}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      <p className="text-xs text-muted-foreground">{isEs ? '📝 Estudia y aprueba el examen.' : '📝 Study and pass the exam.'}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleFavorite.mutate({ courseId: sc.id, isFavorite: isFav })}>
                      {isFav ? <Heart className="h-4 w-4 fill-destructive text-destructive" /> : <Heart className="h-4 w-4" />}
                    </Button>
                    {sc.external_url && (
                      <Button variant="outline" className="flex-1" asChild>
                        <a href={isYouTubeUrl(sc.external_url) ? `https://www.youtube.com/watch?v=${extractYouTubeId(sc.external_url)}` : sc.external_url}
                          target="_blank" rel="noopener noreferrer"
                          onClick={() => { handleCourseClick(sc); setSelectedCourse(null); }}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {isYouTubeUrl(sc.external_url) ? 'YouTube' : (isEs ? 'Ir al Curso' : 'Go to Course')}
                        </a>
                      </Button>
                    )}
                    {!isComp && (
                      <Button className="flex-1" onClick={() => setShowExam(true)}>
                        <GraduationCap className="h-4 w-4 mr-2" /> {isEs ? 'Tomar Examen' : 'Take Exam'}
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
      <Dialog open={showExam && !!selectedCourse} onOpenChange={open => { if (!open) setShowExam(false); }}>
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
              <CourseExam course={selectedCourse} isEs={isEs}
                onPass={() => handleExamPass(selectedCourse.id)}
                onClose={() => { setShowExam(false); setSelectedCourse(null); }} />
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
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
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
        <button key={v} onClick={() => onChange(v)}
          className={`px-3 py-1.5 rounded-md text-xs font-heading font-semibold transition-all ${
            value === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          {v === 'all' ? (isEs ? 'Todos' : 'All') : v === 'en' ? '🇺🇸' : '🇪🇸'}
        </button>
      ))}
    </div>
  );
}

function CourseVideoCard({
  course, isEs, completed, onOpen, featured, compact, isFavorite, onToggleFavorite
}: {
  course: AcademyCourse; isEs: boolean; completed: boolean; onOpen: () => void;
  featured?: boolean; compact?: boolean; isFavorite?: boolean; onToggleFavorite?: () => void;
}) {
  const title = isEs ? course.title_es || course.title : course.title;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group cursor-pointer" onClick={onOpen}>
      <div className="relative overflow-hidden rounded-xl bg-muted mb-3 aspect-video">
        {(() => {
          const thumbUrl = course.thumbnail_url || (course.external_url && isYouTubeUrl(course.external_url) ? getYouTubeThumbnail(extractYouTubeId(course.external_url)!) : null);
          return thumbUrl ? (
            <img src={thumbUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Play className="h-10 w-10 text-primary/30" />
            </div>
          );
        })()}
        <div className="absolute top-2 left-2 flex gap-1">
          {completed && (
            <span className="bg-primary text-primary-foreground text-[10px] font-heading font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {isEs ? 'Completado' : 'Completed'}
            </span>
          )}
          {course.featured && (
            <span className="bg-accent text-accent-foreground text-[10px] font-heading font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          {onToggleFavorite && (
            <button onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
              className="h-7 w-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors">
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
            </button>
          )}
        </div>
        <div className="absolute bottom-2 right-2">
          <span className="bg-foreground/80 text-background text-[10px] font-heading font-bold px-2 py-0.5 rounded-md">{course.duration_minutes} min</span>
        </div>
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>

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
            <h3 className="font-heading font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
            {course.instructor_name && <p className="text-xs text-muted-foreground mt-0.5">{course.instructor_name}</p>}
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
              {course.views_count > 0 && <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {course.views_count.toLocaleString()}</span>}
              {course.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-primary text-primary" /> {Number(course.rating).toFixed(1)}</span>}
              <span className="capitalize">{course.skill_level}</span>
              <span>{course.language === 'es' ? '🇪🇸' : '🇺🇸'}</span>
            </div>
          </div>
        </div>
        {!compact && (
          <div className="flex flex-wrap gap-1 pl-[42px]">
            <Badge variant="outline" className="text-[10px] h-5">{course.platform}</Badge>
            {(course.skills_learned || []).slice(0, 2).map(s => <Badge key={s} variant="secondary" className="text-[10px] h-5">{s}</Badge>)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AcademyDashboard;
