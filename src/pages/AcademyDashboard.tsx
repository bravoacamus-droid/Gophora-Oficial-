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
  FileUp, BarChart3, Loader2, Download, Copy, Map
} from 'lucide-react';
import {
  useAcademyPaths, useAcademyCourses, useAcademyTools,
  useCourseProgress, useToggleCourseCompletion, useSharedPrompts,
  useCreateSharedPrompt, getExplorerLevel, EXPLORER_LEVELS,
  useTutorApplication, useSubmitTutorApplication,
  useSubmitCourseAsTutor, useUpdateCourseAsTutor, useIncrementViews,
  useTrackToolUsage,
  useSharedPromptsWithStats, useTrackPromptUse,
  useSearchPrompts, useImprovePrompt,
  usePlaybooks, useMyPlaybooks, useCreatePlaybook, useDeletePlaybook, useCompletePlaybook,
  useMyPathEnrollments, useEnrollInPath,
  usePathsWithAuthors, useMyPaths, useCreatePath, useDeletePath,
  useMyFavorites, useToggleFavorite,
  useSkillGap, useRecommendedPlaybooks, useRecommendedPaths,
  type AcademyCourse,
  type AcademyTool,
  type PromptPlaybook,
  type SharedPromptWithStats
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
import PremiumCertificate from '@/components/PremiumCertificate';
import { useAIRecommendations } from '@/hooks/useRecommendations';
import { useTrackActivity } from '@/hooks/useEngagement';
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

  const { data: paths = [] } = usePathsWithAuthors();
  const { data: myPaths = [] } = useMyPaths();
  const createPath = useCreatePath();
  const deletePath = useDeletePath();
  const { data: courses = [] } = useAcademyCourses();
  const { data: tools = [] } = useAcademyTools();
  const { data: progress = [] } = useCourseProgress();
  const { data: prompts = [] } = useSharedPromptsWithStats();
  const trackPromptUse = useTrackPromptUse();
  const { data: pathEnrollments = [] } = useMyPathEnrollments();
  const enrollInPath = useEnrollInPath();
  const enrolledPathIds = new Set(pathEnrollments.map((e: any) => e.path_id));
  const { data: myFavorites = [] } = useMyFavorites();
  const toggleFavoriteItem = useToggleFavorite();
  const favoritePathIds = new Set(myFavorites.filter((f) => f.item_type === 'path').map((f) => f.item_id));
  const favoritePlaybookIds = new Set(myFavorites.filter((f) => f.item_type === 'playbook').map((f) => f.item_id));
  const { data: skillGap = [] } = useSkillGap();
  const { data: recommendedPlaybooks = [] } = useRecommendedPlaybooks(4);
  const { data: recommendedPaths = [] } = useRecommendedPaths(3);
  const improvePrompt = useImprovePrompt();
  const { data: playbooks = [] } = usePlaybooks();
  const { data: myPlaybooks = [] } = useMyPlaybooks();
  const createPlaybook = useCreatePlaybook();
  const deletePlaybook = useDeletePlaybook();
  const completePlaybook = useCompletePlaybook();
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
  const trackActivity = useTrackActivity();
  const { data: aiRecs = [], isLoading: recsLoading, refetch: refetchRecs } = useAIRecommendations();

  const [activeTab, setActiveTab] = useState('courses');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [toolFilter, setToolFilter] = useState('all');
  const [courseLangFilter, setCourseLangFilter] = useState<'all' | 'en' | 'es'>('all');
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'general', skill: '', toolId: '' });
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [showExam, setShowExam] = useState(false);
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [tutorForm, setTutorForm] = useState({ bio: '', expertise: '', portfolio_url: '' });
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const updateCourse = useUpdateCourseAsTutor();
  const defaultInstructorName = user?.user_metadata?.username || user?.email?.split('@')[0] || '';
  const [courseForm, setCourseForm] = useState({
    title: '', description: '', external_url: '', thumbnail_url: '',
    duration_minutes: 30, skill_level: 'beginner', language: 'en',
    skills_learned: '', path_id: '',
    instructor_name: defaultInstructorName,
    delivery_mode: 'recorded' as 'live' | 'recorded',
    live_at: '',
  });
  const [examQuestions, setExamQuestions] = useState<Array<{
    question: string; question_es: string; options: string[]; options_es: string[]; correct_index: number;
  }>>([
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: -1 },
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: -1 },
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: -1 },
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: -1 },
    { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: -1 },
  ]);
  const [parsingPdf, setParsingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [quickStartTool, setQuickStartTool] = useState<AcademyTool | null>(null);
  const trackToolUsage = useTrackToolUsage();
  const [promptSearch, setPromptSearch] = useState('');
  const [improvedDraft, setImprovedDraft] = useState<{ original: string; improved: string; reason: string } | null>(null);
  const [openedPlaybook, setOpenedPlaybook] = useState<PromptPlaybook | null>(null);
  const [playbookForm, setPlaybookForm] = useState({ title: '', description: '', skill: '', promptIds: [] as string[] });
  const [showPlaybookCreator, setShowPlaybookCreator] = useState(false);
  const [showPathCreator, setShowPathCreator] = useState(false);
  const [pathForm, setPathForm] = useState({ title: '', description: '', icon: 'BookOpen', courseIds: [] as string[] });
  const { data: searchResults = [] } = useSearchPrompts(promptSearch);
  const visiblePrompts = promptSearch.trim().length > 0 ? searchResults : prompts;

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
              tutorName: course.instructor_name || 'GOPHORA',
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
    createPrompt.mutate(
      {
        title: newPrompt.title,
        content: newPrompt.content,
        category: newPrompt.category,
        skill: newPrompt.skill || null,
        toolId: newPrompt.toolId || null,
      },
      {
        onSuccess: () => {
          setNewPrompt({ title: '', content: '', category: 'general', skill: '', toolId: '' });
          toast.success(isEs ? '¡Prompt compartido!' : 'Prompt shared!');
        },
        onError: (err: any) => {
          toast.error(err?.message || (isEs ? 'No se pudo compartir el prompt' : 'Could not share prompt'));
        },
      }
    );
  };

  const handleCopyAndOpenPrompt = async (prompt: SharedPromptWithStats) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast.success(isEs ? 'Prompt copiado. Pegá con Ctrl+V (Cmd+V).' : 'Prompt copied. Paste with Ctrl+V (Cmd+V).');
    } catch {
      toast.error(isEs ? 'No se pudo copiar al portapapeles' : 'Could not copy to clipboard');
    }
    trackPromptUse.mutate({ promptId: prompt.id });
    if (prompt.toolUrl) {
      window.open(prompt.toolUrl, '_blank', 'noopener');
    }
  };

  const handleImproveDraft = () => {
    if (!newPrompt.content.trim() || newPrompt.content.trim().length < 10) {
      toast.error(isEs ? 'Escribí al menos 10 caracteres antes de mejorar.' : 'Write at least 10 characters before improving.');
      return;
    }
    improvePrompt.mutate(
      {
        draft: newPrompt.content,
        skill: newPrompt.skill || null,
        language: isEs ? 'es' : 'en',
      },
      {
        onSuccess: (data) => {
          setImprovedDraft({ original: newPrompt.content, improved: data.improved, reason: data.reason });
        },
        onError: (err: any) => {
          toast.error(err?.message || (isEs ? 'No se pudo mejorar el prompt' : 'Could not improve the prompt'));
        },
      }
    );
  };

  const acceptImprovedDraft = () => {
    if (improvedDraft) {
      setNewPrompt((p) => ({ ...p, content: improvedDraft.improved }));
      toast.success(isEs ? 'Reemplazado con la versión mejorada' : 'Replaced with improved version');
    }
    setImprovedDraft(null);
  };

  const handleCreatePlaybook = () => {
    if (!playbookForm.title.trim() || playbookForm.promptIds.length < 2) {
      toast.error(isEs ? 'Necesitás un título y al menos 2 prompts.' : 'You need a title and at least 2 prompts.');
      return;
    }
    createPlaybook.mutate(
      {
        title: playbookForm.title,
        description: playbookForm.description,
        skill: playbookForm.skill || null,
        prompt_ids: playbookForm.promptIds,
      },
      {
        onSuccess: () => {
          toast.success(isEs ? '¡Playbook publicado!' : 'Playbook published!');
          setPlaybookForm({ title: '', description: '', skill: '', promptIds: [] });
          setShowPlaybookCreator(false);
        },
        onError: (err: any) => {
          toast.error(err?.message || (isEs ? 'No se pudo crear el playbook' : 'Could not create playbook'));
        },
      }
    );
  };

  const handleCreatePath = () => {
    if (!pathForm.title.trim() || pathForm.courseIds.length < 2) {
      toast.error(isEs ? 'Necesitás un título y al menos 2 cursos.' : 'You need a title and at least 2 courses.');
      return;
    }
    createPath.mutate(
      {
        title: pathForm.title,
        description: pathForm.description,
        icon: pathForm.icon,
        courseIds: pathForm.courseIds,
      },
      {
        onSuccess: () => {
          toast.success(isEs ? '¡Ruta publicada!' : 'Path published!');
          setPathForm({ title: '', description: '', icon: 'BookOpen', courseIds: [] });
          setShowPathCreator(false);
        },
        onError: (err: any) => {
          toast.error(err?.message || (isEs ? 'No se pudo crear la ruta' : 'Could not create path'));
        },
      }
    );
  };

  const handleCompletePlaybook = (playbook: PromptPlaybook) => {
    completePlaybook.mutate(playbook.id, {
      onSuccess: () => {
        toast.success(isEs ? `¡Playbook completado! Gracias a ${playbook.authorName || 'el tutor'} por publicarlo.` : `Playbook completed! Thanks to ${playbook.authorName || 'the tutor'} for publishing it.`);
        setOpenedPlaybook(null);
      },
      onError: (err: any) => {
        if (err?.message?.includes('duplicate')) {
          toast.info(isEs ? 'Ya marcaste este playbook como completado.' : 'You already marked this playbook complete.');
        } else {
          toast.error(err?.message || (isEs ? 'No se pudo marcar como completado' : 'Could not mark complete'));
        }
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
        onError: (err: any) => {
          toast.error(err?.message || (isEs ? 'No se pudo enviar la solicitud' : 'Could not submit application'));
        },
      }
    );
  };

  const handleSubmitCourse = () => {
    if (!courseForm.title || !courseForm.external_url || !courseForm.path_id) return;
    const validQuestions = examQuestions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
    if (validQuestions.length < 5) {
      toast.error(isEs ? 'Debes agregar al menos 5 preguntas con sus 4 opciones llenas' : 'Add at least 5 questions with all 4 options filled');
      return;
    }
    const missingCorrect = validQuestions.findIndex(q => q.correct_index < 0 || q.correct_index > 3);
    if (missingCorrect !== -1) {
      toast.error(
        isEs
          ? `La pregunta ${missingCorrect + 1} no tiene marcada la respuesta correcta. Click en el círculo verde de la opción correcta.`
          : `Question ${missingCorrect + 1} has no correct answer marked. Click the green circle of the correct option.`
      );
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
          platform: courseForm.delivery_mode === 'live' ? 'Live' : 'External',
          instructor_name: courseForm.instructor_name?.trim() || defaultInstructorName || 'Tutor',
          delivery_mode: courseForm.delivery_mode,
          live_at: courseForm.delivery_mode === 'live' && courseForm.live_at ? courseForm.live_at : null,
        } as any,
        examQuestions: validQuestions,
      },
      {
        onSuccess: () => {
          toast.success(isEs ? '¡Curso enviado para revisión!' : 'Course submitted for review!');
          setShowCourseForm(false);
          resetCourseForm();
        },
        onError: (err: any) => {
          toast.error(err?.message || (isEs ? 'No se pudo enviar el curso' : 'Could not submit course'));
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
    trackActivity.mutate('course_view');
  };

  const resetCourseForm = () => {
    setCourseForm({ title: '', description: '', external_url: '', thumbnail_url: '', duration_minutes: 30, skill_level: 'beginner', language: 'en', skills_learned: '', path_id: '', instructor_name: defaultInstructorName, delivery_mode: 'recorded', live_at: '' });
    setExamQuestions(Array(5).fill(null).map(() => ({ question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: -1 })));
    setSelectedCategory('');
    setEditingCourseId(null);
  };

  const handleEditCourseClick = async (course: AcademyCourse) => {
    setEditingCourseId(course.id);
    setSelectedCategory(course.category || 'general');
    const liveAtLocal = course.live_at
      ? new Date(course.live_at).toISOString().slice(0, 16)
      : '';
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      external_url: course.external_url || '',
      thumbnail_url: course.thumbnail_url || '',
      duration_minutes: course.duration_minutes || 30,
      skill_level: course.skill_level || 'beginner',
      language: course.language || 'en',
      skills_learned: (course.skills_learned || []).join(', '),
      path_id: course.path_id || '',
      instructor_name: course.instructor_name || defaultInstructorName,
      delivery_mode: (course as any).delivery_mode === 'live' ? 'live' : 'recorded',
      live_at: liveAtLocal,
    });
    setShowCourseForm(true);

    const { data, error } = await supabase
      .from('course_exam_questions')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order');
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data && data.length > 0) {
      const loaded = data.map((q: any) => ({
        question: q.question || '',
        question_es: q.question_es || '',
        options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : ['', '', '', '']),
        options_es: Array.isArray(q.options_es) ? q.options_es : (typeof q.options_es === 'string' ? JSON.parse(q.options_es) : ['', '', '', '']),
        correct_index: typeof q.correct_index === 'number' ? q.correct_index : -1,
      }));
      while (loaded.length < 5) {
        loaded.push({ question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: -1 });
      }
      setExamQuestions(loaded);
    }
  };

  const handleUpdateCourse = () => {
    if (!editingCourseId) return;
    if (!courseForm.title || !courseForm.external_url || !courseForm.path_id) return;
    const validQuestions = examQuestions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
    if (validQuestions.length < 5) {
      toast.error(isEs ? 'Debes mantener al menos 5 preguntas con sus 4 opciones llenas' : 'Keep at least 5 questions with all 4 options filled');
      return;
    }
    const missingCorrect = validQuestions.findIndex(q => q.correct_index < 0 || q.correct_index > 3);
    if (missingCorrect !== -1) {
      toast.error(
        isEs
          ? `La pregunta ${missingCorrect + 1} no tiene marcada la respuesta correcta.`
          : `Question ${missingCorrect + 1} has no correct answer marked.`
      );
      return;
    }
    updateCourse.mutate(
      {
        course_id: editingCourseId,
        patch: {
          title: courseForm.title,
          description: courseForm.description,
          external_url: courseForm.external_url,
          thumbnail_url: courseForm.thumbnail_url || null,
          duration_minutes: courseForm.duration_minutes,
          skill_level: courseForm.skill_level,
          language: courseForm.language,
          skills_learned: courseForm.skills_learned.split(',').map(s => s.trim()).filter(Boolean),
          path_id: courseForm.path_id,
          instructor_name: courseForm.instructor_name?.trim() || defaultInstructorName || 'Tutor',
          delivery_mode: courseForm.delivery_mode,
          live_at: courseForm.delivery_mode === 'live' && courseForm.live_at ? courseForm.live_at : null,
        } as any,
        examQuestions: validQuestions,
      },
      {
        onSuccess: () => {
          toast.success(isEs ? '¡Curso actualizado!' : 'Course updated!');
          setShowCourseForm(false);
          resetCourseForm();
        },
        onError: (err: any) => {
          toast.error(err?.message || (isEs ? 'No se pudo actualizar el curso' : 'Could not update course'));
        },
      }
    );
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
                  <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">{isEs ? 'Capacítate para Trabajar' : 'Train to Work'}</h1>
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
              <TabsTrigger value="recommendations" className="text-xs font-heading gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {isEs ? 'Para ti' : 'For You'}
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
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs font-body text-muted-foreground leading-relaxed">
                  {isEs
                    ? <>Inscríbete en una ruta y completa todos sus cursos. Al terminar el último, <span className="font-semibold text-foreground">se emite automáticamente un certificado oficial GOPHORA</span> con QR de verificación pública y descarga en PDF.</>
                    : <>Enrol in a path and complete every course in it. Once you finish the last one, <span className="font-semibold text-foreground">an official GOPHORA certificate is issued automatically</span> with public QR verification and PDF download.</>}
                </p>
              </div>
            </div>
            {paths.map(path => {
              const pathCourses = courses.filter(c => c.path_id === path.id).filter(c => courseLangFilter === 'all' || c.language === courseLangFilter);
              const pathCompleted = pathCourses.filter(c => completedIds.has(c.id)).length;
              const pct = pathCourses.length ? (pathCompleted / pathCourses.length) * 100 : 0;
              if (pathCourses.length === 0) return null;
              const isEnrolled = enrolledPathIds.has(path.id);
              const isComplete = pct === 100;
              return (
                <Card key={path.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/5 to-transparent p-5 border-b border-border/50">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        {iconMap[path.icon] || <BookOpen className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold">{isEs ? path.title_es || path.title : path.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {isEs ? 'por ' : 'by '}<span className="font-semibold text-foreground">{path.authorName || 'GOPHORA Team'}</span>{' · '}
                          {pathCompleted}/{pathCourses.length} {isEs ? 'completados' : 'completed'} · {Math.round(pct)}%
                        </p>
                      </div>
                      <button
                        onClick={() => toggleFavoriteItem.mutate({ itemType: 'path', itemId: path.id, isFavorite: favoritePathIds.has(path.id) })}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title={favoritePathIds.has(path.id) ? (isEs ? 'Quitar de favoritos' : 'Remove from favorites') : (isEs ? 'Agregar a favoritos' : 'Add to favorites')}
                      >
                        <Heart className={`h-4 w-4 ${favoritePathIds.has(path.id) ? 'fill-destructive text-destructive' : ''}`} />
                      </button>
                      {isComplete ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> {isEs ? 'Completada · cert. emitido' : 'Completed · cert. issued'}
                        </Badge>
                      ) : isEnrolled ? (
                        <Badge variant="outline" className="text-xs">
                          {isEs ? 'Inscrito' : 'Enrolled'}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => enrollInPath.mutate(path.id, {
                            onSuccess: () => toast.success(isEs ? '¡Inscrito en la ruta!' : 'Enrolled in path!'),
                          })}
                          disabled={enrollInPath.isPending}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {isEs ? 'Inscribirme' : 'Enrol'}
                        </Button>
                      )}
                    </div>
                    <Progress value={pct} className="h-1.5 mt-3" />
                    {isComplete && (
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-body">
                        <Award className="h-3.5 w-3.5" />
                        {isEs
                          ? 'Tu certificado oficial está listo. Andá a la pestaña "Certificados" para descargarlo.'
                          : 'Your official certificate is ready. Head to the "Certificates" tab to download it.'}
                      </div>
                    )}
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
          <TabsContent value="favorites" className="mt-4 space-y-8">
            {(() => {
              const favPlaybooks = playbooks.filter((pb: any) => favoritePlaybookIds.has(pb.id));
              const favPaths = paths.filter((p: any) => favoritePathIds.has(p.id));
              const totalFavs = favoriteCourses.length + favPlaybooks.length + favPaths.length;

              if (totalFavs === 0) {
                return (
                  <div className="text-center py-16">
                    <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-heading">
                      {isEs ? 'Todavía no guardaste nada en favoritos.' : 'No favorites yet.'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      {isEs
                        ? 'Hace click en el ❤️ de cualquier curso, ruta o playbook para guardarlo. Acá vas a tener todo lo que querés volver a ver.'
                        : 'Click the ❤️ on any course, path or playbook to save it. Everything you want to revisit lives here.'}
                    </p>
                  </div>
                );
              }

              return (
                <>
                  {/* Counter pill row */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <Badge variant="secondary" className="gap-1">
                      <BookOpen className="h-3 w-3" />
                      {favoriteCourses.length} {isEs ? 'cursos' : 'courses'}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Map className="h-3 w-3" />
                      {favPaths.length} {isEs ? 'rutas' : 'paths'}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Workflow className="h-3 w-3" />
                      {favPlaybooks.length} playbooks
                    </Badge>
                  </div>

                  {/* Cursos */}
                  {favoriteCourses.length > 0 && (
                    <div>
                      <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {isEs ? 'Cursos favoritos' : 'Favorite courses'}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {favoriteCourses.map(course => (
                          <CourseVideoCard key={course.id} course={course} isEs={isEs}
                            completed={completedIds.has(course.id)} onOpen={() => setSelectedCourse(course)}
                            isFavorite onToggleFavorite={() => toggleFavorite.mutate({ courseId: course.id, isFavorite: true })} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rutas */}
                  {favPaths.length > 0 && (
                    <div>
                      <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
                        <Map className="h-4 w-4 text-primary" />
                        {isEs ? 'Rutas favoritas' : 'Favorite paths'}
                      </h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {favPaths.map((p: any) => {
                          const cnt = courses.filter(c => c.path_id === p.id).length;
                          const completed = courses.filter(c => c.path_id === p.id && completedIds.has(c.id)).length;
                          return (
                            <div key={p.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    {iconMap[p.icon] || <BookOpen className="h-4 w-4" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-heading font-semibold text-sm truncate">{isEs ? p.title_es || p.title : p.title}</p>
                                    <p className="text-[11px] text-muted-foreground">{isEs ? 'por ' : 'by '}{p.authorName || 'GOPHORA'}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => toggleFavoriteItem.mutate({ itemType: 'path', itemId: p.id, isFavorite: true })}
                                  className="text-destructive shrink-0"
                                  title={isEs ? 'Quitar de favoritos' : 'Remove from favorites'}
                                >
                                  <Heart className="h-4 w-4 fill-destructive" />
                                </button>
                              </div>
                              <div className="text-[11px] text-muted-foreground">{completed}/{cnt} {isEs ? 'cursos completados' : 'courses completed'}</div>
                              <Progress value={cnt > 0 ? (completed / cnt) * 100 : 0} className="h-1" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Playbooks */}
                  {favPlaybooks.length > 0 && (
                    <div>
                      <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-primary" />
                        {isEs ? 'Playbooks favoritos' : 'Favorite playbooks'}
                      </h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {favPlaybooks.map((pb: any) => (
                          <button
                            key={pb.id}
                            onClick={() => setOpenedPlaybook(pb)}
                            className="text-left rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 transition-colors space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                {pb.skill && <Badge variant="outline" className="text-[10px]">{pb.skill}</Badge>}
                                <Badge variant="secondary" className="text-[10px]">{pb.prompt_ids.length} {isEs ? 'pasos' : 'steps'}</Badge>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteItem.mutate({ itemType: 'playbook', itemId: pb.id, isFavorite: true });
                                }}
                                className="text-destructive shrink-0"
                                title={isEs ? 'Quitar de favoritos' : 'Remove from favorites'}
                              >
                                <Heart className="h-4 w-4 fill-destructive" />
                              </button>
                            </div>
                            <p className="font-heading font-bold text-sm">{pb.title}</p>
                            {pb.description && (
                              <p className="text-xs text-muted-foreground font-body line-clamp-2">{pb.description}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
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
          <TabsContent value="certificates" className="mt-4 space-y-6">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs font-body text-muted-foreground leading-relaxed">
                  {isEs
                    ? <>Cada certificado de GOPHORA es <span className="font-semibold text-foreground">verificable públicamente</span> con QR + URL única. Descargás un PDF premium con el sello oficial y compartís el link en LinkedIn / CV.</>
                    : <>Every GOPHORA certificate is <span className="font-semibold text-foreground">publicly verifiable</span> via QR + unique URL. Download a premium PDF with the official seal and share the link on LinkedIn / CV.</>}
                </p>
              </div>
            </div>

            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.map((cert: any) => (
                  <CertificateCard key={cert.id} certificate={cert} isEs={isEs} />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Award className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-heading">{isEs ? 'No tienes certificados aún.' : 'No certificates yet.'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEs
                      ? 'Completá una ruta o aprobá un examen para emitir tu primer certificado oficial.'
                      : 'Complete a path or pass an exam to issue your first official certificate.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-heading uppercase tracking-widest text-muted-foreground mb-3 text-center">
                    {isEs ? 'Vista previa de un certificado oficial' : 'Sample of an official certificate'}
                  </p>
                  <div className="bg-muted/30 rounded-xl p-4 flex justify-center overflow-hidden">
                    <div
                      style={{
                        transform: 'scale(0.5)',
                        transformOrigin: 'top center',
                        width: 1200,
                        height: 848 * 0.5,
                      }}
                    >
                      <PremiumCertificate
                        data={{
                          explorerName: user?.user_metadata?.username || user?.email?.split('@')[0] || 'Tu Nombre',
                          courseTitle: isEs ? 'Automatización con IA — Ruta Marketing' : 'AI Automation — Marketing Path',
                          achievementTitle: isEs ? 'Ruta de aprendizaje completada' : 'Learning path completed',
                          achievementSummary: isEs
                            ? 'Completaste todos los cursos de la ruta con honores en GOPHORA Academy.'
                            : 'You completed every course in the path with honors at GOPHORA Academy.',
                          tutorName: 'GOPHORA Academy',
                          certificateCode: 'GP-PREVIEW-DEMO-260424',
                          issuedAt: new Date().toISOString(),
                          certType: 'path',
                          verifyUrl: `${window.location.origin}/cert/GP-PREVIEW-DEMO-260424`,
                          isEs,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3 font-body italic">
                    {isEs
                      ? 'Este es un ejemplo. Tu certificado real llevará tu nombre, código único y QR de verificación pública.'
                      : 'This is a preview. Your real certificate will carry your name, unique code, and public verification QR.'}
                  </p>
                </div>
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
                    <div className="grid grid-cols-2 gap-2">
                      {(tool.quick_start || tool.quick_start_es) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setQuickStartTool(tool)}
                        >
                          <Sparkles className="h-3 w-3 mr-1" /> {isEs ? 'Quick Start' : 'Quick Start'}
                        </Button>
                      )}
                      {tool.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`text-xs ${(tool.quick_start || tool.quick_start_es) ? '' : 'col-span-2'}`}
                          asChild
                          onClick={() => trackToolUsage.mutate({ toolId: tool.id })}
                        >
                          <a href={tool.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> {isEs ? 'Aprender más' : 'Learn more'}
                          </a>
                        </Button>
                      )}
                    </div>
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
                  <Dialog open={showCourseForm} onOpenChange={open => { if (!open) { setShowCourseForm(false); resetCourseForm(); } }}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                          {editingCourseId ? <PenTool className="h-5 w-5 text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
                          {editingCourseId
                            ? (isEs ? 'Editar Curso' : 'Edit Course')
                            : (isEs ? 'Nuevo Curso' : 'New Course')}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                        <p className="text-xs font-heading font-bold text-primary flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          {isEs ? 'Antes de empezar — requisitos para publicar' : 'Before you start — publishing checklist'}
                        </p>
                        <ul className="text-[11px] text-foreground/80 space-y-1 leading-relaxed pl-1">
                          <li className="flex gap-1.5">
                            <span className="text-primary shrink-0">•</span>
                            <span>{isEs ? 'Título, link del video y ruta de aprendizaje' : 'Title, video link and learning path'} <span className="text-destructive font-bold">*</span></span>
                          </li>
                          <li className="flex gap-1.5">
                            <span className="text-primary shrink-0">•</span>
                            <span>{isEs ? 'Mínimo ' : 'Minimum '}<span className="font-bold text-primary">{isEs ? '5 preguntas' : '5 questions'}</span>{isEs ? ' de examen, cada una con sus 4 opciones llenas y la respuesta correcta marcada (círculo verde).' : ' for the exam, each with all 4 options filled and the correct answer marked (green circle).'}</span>
                          </li>
                          <li className="flex gap-1.5">
                            <span className="text-primary shrink-0">•</span>
                            <span>{isEs ? 'Tip: subí un PDF con las preguntas y la IA las extrae sola.' : 'Tip: upload a PDF with the questions and AI will extract them for you.'}</span>
                          </li>
                          <li className="flex gap-1.5">
                            <span className="text-primary shrink-0">•</span>
                            <span>{isEs ? 'El curso queda en revisión hasta que el admin lo apruebe.' : 'The course stays under review until the admin approves it.'}</span>
                          </li>
                        </ul>
                      </div>

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
                          <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                            {isEs ? 'Nombre del Tutor *' : 'Tutor Name *'}
                          </label>
                          <Input
                            value={courseForm.instructor_name}
                            onChange={e => setCourseForm(f => ({ ...f, instructor_name: e.target.value }))}
                            placeholder={isEs ? 'Aparece como el autor del curso' : 'Shown as the course author'}
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {isEs ? 'Este nombre aparece en el curso y en el certificado de los exploradores.' : 'This name shows on the course and on explorer certificates.'}
                          </p>
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

                        {/* Delivery mode (Live vs Recorded) */}
                        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
                          <p className="text-xs font-heading font-bold uppercase tracking-widest text-muted-foreground">
                            {isEs ? 'Modalidad' : 'Delivery mode'}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setCourseForm(f => ({ ...f, delivery_mode: 'recorded', live_at: '' }))}
                              className={`rounded-lg border p-3 text-left transition-colors ${courseForm.delivery_mode === 'recorded' ? 'border-blue-500/40 bg-blue-500/10' : 'border-border/50 hover:border-blue-500/30'}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Play className={`h-3.5 w-3.5 ${courseForm.delivery_mode === 'recorded' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                <span className="font-heading font-bold text-xs">{isEs ? 'GRABADA' : 'RECORDED'}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {isEs ? 'Disponible siempre. El explorer la consume cuando quiera.' : 'Always available. Explorer watches anytime.'}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCourseForm(f => ({ ...f, delivery_mode: 'live' }))}
                              className={`rounded-lg border p-3 text-left transition-colors ${courseForm.delivery_mode === 'live' ? 'border-red-500/40 bg-red-500/10' : 'border-border/50 hover:border-red-500/30'}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${courseForm.delivery_mode === 'live' ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`} />
                                <span className="font-heading font-bold text-xs">{isEs ? 'EN VIVO' : 'LIVE'}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {isEs ? 'Webinar/clase con fecha. Te aparece en el countdown.' : 'Scheduled webinar. Shows up in the countdown.'}
                              </p>
                            </button>
                          </div>
                          {courseForm.delivery_mode === 'live' && (
                            <div>
                              <label className="text-xs font-heading font-semibold text-muted-foreground mb-1 block">
                                {isEs ? 'Fecha y hora del en vivo' : 'Live session date and time'}
                              </label>
                              <Input
                                type="datetime-local"
                                value={courseForm.live_at}
                                onChange={e => setCourseForm(f => ({ ...f, live_at: e.target.value }))}
                              />
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {isEs ? 'Pegá el link de Zoom/Meet en el campo "Link externo del video" arriba.' : 'Drop the Zoom/Meet link in the "External video link" field above.'}
                              </p>
                            </div>
                          )}
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
                          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 mb-3">
                            <p className="text-[11px] text-foreground/80 leading-snug">
                              <span className="font-heading font-bold">{isEs ? '⚠️ Importante: ' : '⚠️ Important: '}</span>
                              {isEs
                                ? 'Por cada pregunta, escribí las 4 opciones y hace click en el círculo verde de la opción CORRECTA. Sin marcar la correcta, no podés enviar el curso.'
                                : 'For each question, write the 4 options and click the green circle of the CORRECT option. You cannot submit without marking the correct answer.'}
                            </p>
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
                                <p className="text-[10px] text-muted-foreground italic">
                                  {isEs ? '👇 Hace click en el círculo verde de la opción CORRECTA' : '👇 Click the green circle on the CORRECT option'}
                                </p>
                                <div className="space-y-1.5">
                                  {eq.options.map((opt, oi) => {
                                    const isCorrect = eq.correct_index === oi;
                                    return (
                                      <div key={oi} className={`flex items-center gap-2 rounded-lg border p-1.5 transition-colors ${isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-border/40 bg-background'}`}>
                                        <button
                                          type="button"
                                          onClick={() => { const u = [...examQuestions]; u[qi] = { ...u[qi], correct_index: oi }; setExamQuestions(u); }}
                                          title={isEs ? 'Marcar como respuesta correcta' : 'Mark as correct answer'}
                                          className={`shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground/40 hover:border-green-500 hover:bg-green-500/10'}`}
                                        >
                                          {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-heading font-bold text-muted-foreground">{String.fromCharCode(65 + oi)}</span>}
                                        </button>
                                        <Input value={opt} onChange={e => { const u = [...examQuestions]; const o = [...u[qi].options]; o[oi] = e.target.value; u[qi] = { ...u[qi], options: o }; setExamQuestions(u); }} placeholder={isEs ? `Opción ${String.fromCharCode(65 + oi)}` : `Option ${String.fromCharCode(65 + oi)}`} className="text-xs h-8 flex-1" />
                                        {isCorrect && (
                                          <Badge className="bg-green-500 text-white text-[10px] shrink-0">
                                            ✓ {isEs ? 'Correcta' : 'Correct'}
                                          </Badge>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                          {examQuestions.length < 20 && (
                            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setExamQuestions(prev => [...prev, { question: '', question_es: '', options: ['', '', '', ''], options_es: ['', '', '', ''], correct_index: -1 }])}>
                              + {isEs ? 'Agregar pregunta' : 'Add question'}
                            </Button>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <Button variant="outline" onClick={() => { setShowCourseForm(false); resetCourseForm(); }}>{isEs ? 'Cancelar' : 'Cancel'}</Button>
                          {editingCourseId ? (
                            <Button onClick={handleUpdateCourse} disabled={!courseForm.title || !courseForm.external_url || !courseForm.path_id || !courseForm.instructor_name?.trim() || updateCourse.isPending}>
                              {updateCourse.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenTool className="h-4 w-4 mr-2" />}
                              {isEs ? 'Guardar Cambios' : 'Save Changes'}
                            </Button>
                          ) : (
                            <Button onClick={handleSubmitCourse} disabled={!courseForm.title || !courseForm.external_url || !courseForm.path_id || !courseForm.instructor_name?.trim() || submitCourse.isPending}>
                              <Upload className="h-4 w-4 mr-2" /> {isEs ? 'Enviar para Revisión' : 'Submit for Review'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* My Paths (tutor-curated learning paths) */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" /> {isEs ? 'Mis Rutas' : 'My Paths'}
                      </h3>
                      <Button
                        size="sm"
                        onClick={() => setShowPathCreator(true)}
                        disabled={!isTutor || tutorCourses.length < 2}
                        title={
                          !isTutor
                            ? (isEs ? 'Solo tutores aprobados pueden crear rutas' : 'Only approved tutors can create paths')
                            : (tutorCourses.length < 2
                              ? (isEs ? 'Necesitás al menos 2 cursos publicados para armar una ruta' : 'You need at least 2 published courses to build a path')
                              : '')
                        }
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {isEs ? 'Crear Ruta' : 'Create Path'}
                      </Button>
                    </div>
                    {myPaths.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {isTutor
                            ? (tutorCourses.length < 2
                              ? (isEs ? 'Publicá al menos 2 cursos primero. Las rutas se arman juntando tus cursos en un orden curado, y al completarla los exploradores reciben un certificado oficial.' : 'Publish at least 2 courses first. Paths bundle them into a curated order, and explorers earn an official certificate when they finish.')
                              : (isEs ? 'Aún no creaste ninguna ruta. Hace click en "Crear Ruta" arriba.' : 'No paths yet. Click "Create Path" above.'))
                            : (isEs ? 'Convertite en tutor primero para crear rutas.' : 'Become a tutor first to create paths.')}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden divide-y divide-border/50">
                        {myPaths.map(p => {
                          const courseCount = courses.filter(c => c.path_id === p.id).length;
                          return (
                            <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-heading font-semibold text-sm truncate">{p.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-body">
                                  <Badge variant="outline" className="text-[10px]">{courseCount} {isEs ? 'cursos' : 'courses'}</Badge>
                                  {p.is_published === false && (
                                    <Badge variant="secondary" className="text-[10px]">{isEs ? 'Borrador' : 'Draft'}</Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive shrink-0"
                                onClick={() => {
                                  if (confirm(isEs ? '¿Eliminar esta ruta? Los cursos asociados quedarán sin ruta.' : 'Delete this path? Associated courses will lose their path.')) {
                                    deletePath.mutate(p.id);
                                  }
                                }}
                              >
                                {isEs ? 'Eliminar' : 'Delete'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* My Playbooks (tutor side of Idea 2) */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                        <Workflow className="h-5 w-5 text-primary" /> {isEs ? 'Mis Playbooks' : 'My Playbooks'}
                      </h3>
                      <Button
                        size="sm"
                        onClick={() => setShowPlaybookCreator(true)}
                        disabled={!isTutor}
                        title={isTutor ? '' : (isEs ? 'Solo tutores aprobados pueden crear playbooks' : 'Only approved tutors can create playbooks')}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {isEs ? 'Crear Playbook' : 'Create Playbook'}
                      </Button>
                    </div>
                    {myPlaybooks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
                        <Workflow className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {isTutor
                            ? (isEs ? 'Aún no creaste ningún playbook. Hace click en "Crear Playbook" arriba.' : 'No playbooks yet. Click "Create Playbook" above.')
                            : (isEs ? 'Convertite en tutor primero para crear playbooks.' : 'Become a tutor first to create playbooks.')}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden divide-y divide-border/50">
                        {myPlaybooks.map(pb => (
                          <div key={pb.id} className="p-4 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-heading font-semibold text-sm truncate">{pb.title}</p>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-body">
                                {pb.skill && <Badge variant="outline" className="text-[10px]">{pb.skill}</Badge>}
                                <span>{pb.prompt_ids.length} {isEs ? 'pasos' : 'steps'}</span>
                                <span>•</span>
                                <span>{pb.completion_count} {isEs ? 'completaron' : 'completed'}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive shrink-0"
                              onClick={() => {
                                if (confirm(isEs ? '¿Eliminar este playbook?' : 'Delete this playbook?')) {
                                  deletePlaybook.mutate(pb.id);
                                }
                              }}
                            >
                              {isEs ? 'Eliminar' : 'Delete'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* My Courses */}
                  {tutorCourses.length > 0 && (
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" /> {isEs ? 'Mis Cursos' : 'My Courses'}
                      </h3>
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden divide-y divide-border/50">
                        {tutorCourses.map(course => (
                          <div key={course.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => handleEditCourseClick(course)}>
                            <div className="flex items-center gap-3 min-w-0">
                              {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt="" className="h-12 w-20 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="h-12 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0"><Play className="h-5 w-5 text-muted-foreground" /></div>
                              )}
                              <div className="min-w-0">
                                <p className="font-heading font-semibold text-sm truncate group-hover:text-primary transition-colors">{course.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant={course.course_status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                                    {course.course_status === 'published' ? (isEs ? 'Publicado' : 'Published') : (isEs ? 'En revisión' : 'Under Review')}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-3 w-3" /> {course.views_count || 0}</span>
                                  {course.rating > 0 && <span className="text-[11px] text-muted-foreground flex items-center gap-0.5"><Star className="h-3 w-3 fill-primary text-primary" /> {Number(course.rating).toFixed(1)}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">{isEs ? 'Recompensa' : 'Reward'}</p>
                                <p className="font-heading font-bold text-sm text-primary">${((course.views_count || 0) * 0.01).toFixed(2)}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleEditCourseClick(course); }}
                                className="gap-1"
                              >
                                <PenTool className="h-3.5 w-3.5" />
                                {isEs ? 'Editar' : 'Edit'}
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="p-3 text-[11px] text-muted-foreground italic text-center bg-muted/20">
                          {isEs ? '💡 Hace click en cualquier curso para editarlo (incluye preguntas del examen).' : '💡 Click any course to edit it (exam questions included).'}
                        </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Share form (left column) */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" /> {isEs ? 'Compartir un Prompt' : 'Share a Prompt'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder={isEs ? 'Título' : 'Title'} value={newPrompt.title} onChange={e => setNewPrompt(p => ({ ...p, title: e.target.value }))} />
                  <div className="space-y-1.5">
                    <Textarea placeholder={isEs ? 'Contenido del prompt (usá [VARIABLES] para que otros lo personalicen)' : 'Prompt content (use [VARIABLES] so others can customise it)'} value={newPrompt.content} onChange={e => setNewPrompt(p => ({ ...p, content: e.target.value }))} rows={6} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 w-full"
                      onClick={handleImproveDraft}
                      disabled={improvePrompt.isPending || newPrompt.content.trim().length < 10}
                    >
                      {improvePrompt.isPending
                        ? <><Loader2 className="h-3 w-3 animate-spin" /> {isEs ? 'Mejorando con IA...' : 'Improving with AI...'}</>
                        : <><Sparkles className="h-3 w-3" /> {isEs ? 'Mejorar con IA' : 'Improve with AI'}</>}
                    </Button>
                  </div>
                  <div>
                    <label className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-1 block">{isEs ? 'Skill objetivo' : 'Target skill'}</label>
                    <Select value={newPrompt.skill || 'none'} onValueChange={v => setNewPrompt(p => ({ ...p, skill: v === 'none' ? '' : v }))}>
                      <SelectTrigger><SelectValue placeholder={isEs ? 'Cualquiera' : 'Any'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{isEs ? 'Cualquier skill' : 'Any skill'}</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Web Development">{isEs ? 'Desarrollo Web' : 'Web Development'}</SelectItem>
                        <SelectItem value="Design">{isEs ? 'Diseño' : 'Design'}</SelectItem>
                        <SelectItem value="Data">Data</SelectItem>
                        <SelectItem value="Research">{isEs ? 'Investigación' : 'Research'}</SelectItem>
                        <SelectItem value="Operations">{isEs ? 'Operaciones' : 'Operations'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-1 block">{isEs ? 'Herramienta' : 'Tool'}</label>
                    <Select value={newPrompt.toolId || 'none'} onValueChange={v => setNewPrompt(p => ({ ...p, toolId: v === 'none' ? '' : v }))}>
                      <SelectTrigger><SelectValue placeholder={isEs ? 'Sin herramienta específica' : 'No specific tool'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{isEs ? 'Sin herramienta específica' : 'No specific tool'}</SelectItem>
                        {tools.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Button onClick={handleSharePrompt} disabled={createPrompt.isPending || !newPrompt.title.trim() || !newPrompt.content.trim()} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" /> {isEs ? 'Compartir' : 'Share'}
                  </Button>
                </CardContent>
              </Card>

              {/* Prompt library (right 2 columns) */}
              <Card className="lg:col-span-2">
                <CardHeader className="space-y-3">
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> {isEs ? 'Biblioteca de Prompts' : 'Prompt Library'}
                    <Badge variant="secondary" className="ml-auto text-[10px]">{visiblePrompts.length}{promptSearch.trim() ? '' : ` / ${prompts.length}`}</Badge>
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={isEs ? 'Busca por problema: "necesito escribir emails de seguimiento de ventas"...' : 'Search by problem: "I need to write sales follow-up emails"...'}
                      value={promptSearch}
                      onChange={(e) => setPromptSearch(e.target.value)}
                      className="pl-9 text-sm"
                    />
                    {promptSearch && (
                      <button
                        onClick={() => setPromptSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {visiblePrompts.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {visiblePrompts.map(p => {
                        const rate = p.stats?.approval_rate;
                        const battleTested = rate !== null && rate !== undefined && (p.stats?.mission_uses || 0) >= 3;
                        return (
                          <div key={p.id} className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-2.5 hover:border-primary/30 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <p className="font-heading font-semibold text-sm">{p.title}</p>
                                  {p.is_official && (
                                    <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">GOPHORA Team</Badge>
                                  )}
                                  {battleTested && (
                                    <Badge className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                      ⚔️ {rate}% approval
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {p.skill && <Badge variant="outline" className="text-[10px]">{p.skill}</Badge>}
                                  {p.toolName && <Badge variant="outline" className="text-[10px] capitalize">{p.toolName}</Badge>}
                                  {p.category && <Badge variant="secondary" className="text-[10px] capitalize">{p.category}</Badge>}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 font-body">{p.content}</p>
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-body">
                                {(p.stats?.total_uses || 0) > 0 && (
                                  <span>{p.stats?.total_uses} {isEs ? 'usos' : 'uses'}</span>
                                )}
                                {(p.stats?.mission_uses || 0) > 0 && (
                                  <span>{p.stats?.mission_uses} {isEs ? 'en misiones' : 'in missions'}</span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                className="text-xs gap-1 bg-primary hover:bg-primary/90 text-white"
                                onClick={() => handleCopyAndOpenPrompt(p)}
                              >
                                <Copy className="h-3 w-3" />
                                {p.toolName
                                  ? (isEs ? `Copiar y abrir ${p.toolName}` : `Copy & open ${p.toolName}`)
                                  : (isEs ? 'Copiar prompt' : 'Copy prompt')}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {promptSearch.trim()
                        ? (isEs ? 'No encontramos prompts para esa búsqueda. Probá con otras palabras.' : 'No prompts found for that search. Try other words.')
                        : (isEs ? 'Sé el primero en compartir.' : 'Be the first to share.')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Playbooks (Idea 2) ── */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-primary" />
                    {isEs ? 'Playbooks' : 'Playbooks'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {isEs
                      ? 'Bundles de prompts encadenados que un tutor curó para resolver un problema completo.'
                      : 'Tutor-curated prompt bundles that solve a complete problem end-to-end.'}
                  </p>
                </div>
              </div>
              {playbooks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 p-6 text-center">
                  <Workflow className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isEs ? 'Aún no hay playbooks publicados. ¿Eres tutor? Crea uno desde la pestaña Enseñar.' : 'No playbooks yet. Are you a tutor? Create one from the Teach tab.'}
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {playbooks.map((pb) => (
                    <button
                      key={pb.id}
                      onClick={() => setOpenedPlaybook(pb)}
                      className="text-left rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {pb.skill && <Badge variant="outline" className="text-[10px]">{pb.skill}</Badge>}
                          <Badge variant="secondary" className="text-[10px]">
                            {pb.prompt_ids.length} {isEs ? 'pasos' : 'steps'}
                          </Badge>
                          {pb.myCompletion && (
                            <Badge className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                              ✓ {isEs ? 'Completado' : 'Completed'}
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteItem.mutate({ itemType: 'playbook', itemId: pb.id, isFavorite: favoritePlaybookIds.has(pb.id) });
                          }}
                          className={`shrink-0 transition-colors ${favoritePlaybookIds.has(pb.id) ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                          title={favoritePlaybookIds.has(pb.id) ? (isEs ? 'Quitar de favoritos' : 'Remove from favorites') : (isEs ? 'Agregar a favoritos' : 'Add to favorites')}
                        >
                          <Heart className={`h-4 w-4 ${favoritePlaybookIds.has(pb.id) ? 'fill-destructive' : ''}`} />
                        </button>
                      </div>
                      <h4 className="font-heading font-bold text-sm">{pb.title}</h4>
                      {pb.description && (
                        <p className="text-xs text-muted-foreground font-body line-clamp-2">{pb.description}</p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-body pt-1">
                        <span>by {pb.authorName || 'Tutor'}</span>
                        <span>{pb.completion_count} {isEs ? 'completaron' : 'completed'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── AI RECOMMENDATIONS ── */}
          <TabsContent value="recommendations" className="mt-4 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {isEs ? 'Para ti' : 'For You'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEs ? 'Skills, rutas, playbooks y cursos personalizados según tu perfil y las misiones del marketplace.' : 'Skills, paths, playbooks and courses personalised from your profile and the marketplace.'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchRecs()} disabled={recsLoading}>
                {recsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isEs ? 'Actualizar' : 'Refresh'}
              </Button>
            </div>

            {/* ── Skill gap widget ── */}
            {skillGap.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-sm">
                      {isEs ? 'Skills más demandadas que aún no tenés' : 'Most-wanted skills you still don\'t have'}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {isEs
                        ? 'Aprenderlas te abriría más misiones del marketplace al instante.'
                        : 'Learning these would unlock more open missions instantly.'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {skillGap.map((sg: any) => (
                    <div key={sg.skill} className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-heading font-semibold text-sm">{sg.skill}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        <span>
                          <span className="font-semibold text-foreground">{sg.openMissions}</span>{' '}
                          {isEs ? 'misiones abiertas' : 'open missions'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Recommended paths ── */}
            {recommendedPaths.length > 0 && (
              <div>
                <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
                  <Map className="h-4 w-4 text-primary" />
                  {isEs ? 'Rutas para empezar' : 'Paths to start'}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommendedPaths.map((p: any) => {
                    const cnt = courses.filter((c) => c.path_id === p.id).length;
                    return (
                      <div key={p.id} className="rounded-xl border border-primary/20 bg-card p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            {iconMap[p.icon] || <BookOpen className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading font-semibold text-sm truncate">{isEs ? p.title_es || p.title : p.title}</p>
                            <p className="text-[11px] text-muted-foreground">{cnt} {isEs ? 'cursos' : 'courses'}</p>
                          </div>
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground font-body line-clamp-2">
                            {isEs ? p.description_es || p.description : p.description}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1.5 text-xs"
                          onClick={() => {
                            enrollInPath.mutate(p.id, {
                              onSuccess: () => toast.success(isEs ? '¡Inscrito en la ruta!' : 'Enrolled!'),
                            });
                            setActiveTab('paths');
                          }}
                        >
                          <UserPlus className="h-3 w-3" />
                          {isEs ? 'Inscribirme y empezar' : 'Enrol and start'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Recommended playbooks ── */}
            {recommendedPlaybooks.length > 0 && (
              <div>
                <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-primary" />
                  {isEs ? 'Playbooks alineados a tu skill' : 'Playbooks matching your skill'}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommendedPlaybooks.map((pb: any) => {
                    const enrichedPb = playbooks.find((p: any) => p.id === pb.id) || pb;
                    return (
                      <button
                        key={pb.id}
                        onClick={() => setOpenedPlaybook(enrichedPb)}
                        className="text-left rounded-xl border border-primary/20 bg-card p-4 hover:border-primary/40 transition-colors space-y-2"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          {pb.skill && <Badge variant="outline" className="text-[10px]">{pb.skill}</Badge>}
                          <Badge variant="secondary" className="text-[10px]">{pb.prompt_ids.length} {isEs ? 'pasos' : 'steps'}</Badge>
                        </div>
                        <p className="font-heading font-bold text-sm">{pb.title}</p>
                        {pb.description && (
                          <p className="text-xs text-muted-foreground font-body line-clamp-2">{pb.description}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {pb.completion_count} {isEs ? 'completaron' : 'completed'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── AI-recommended courses (pre-existing) ── */}
            <div>
              <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {isEs ? 'Cursos curados por IA' : 'AI-curated courses'}
              </h3>

            {recsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                      <div className="h-3 bg-muted rounded w-full mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : aiRecs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {isEs ? 'Completa algunos cursos para recibir recomendaciones personalizadas' : 'Complete some courses to get personalized recommendations'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiRecs.map((rec, idx) => {
                  const course = courses.find(c => c.id === rec.course_id);
                  if (!course) return null;
                  return (
                    <motion.div
                      key={rec.course_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow border-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm font-heading line-clamp-2">
                              {isEs ? (course.title_es || course.title) : course.title}
                            </CardTitle>
                            <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                              {rec.relevance_score}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {isEs ? rec.reason_es : rec.reason}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div className="flex flex-wrap gap-1">
                            {(course.skills_learned || []).slice(0, 3).map(s => (
                              <Badge key={s} variant="outline" className="text-[10px] h-5">{s}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {course.views_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" /> {course.rating || 0}
                            </span>
                            <span className="capitalize">{course.skill_level}</span>
                          </div>
                          <Button
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              setSelectedCourse(course);
                              handleCourseClick(course);
                            }}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            {isEs ? 'Empezar curso' : 'Start Course'}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
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
                onAttempt={() => trackActivity.mutate('exam_taken')}
                onClose={() => { setShowExam(false); setSelectedCourse(null); }} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Improve Prompt comparison modal (Idea 3) ── */}
      <Dialog open={!!improvedDraft} onOpenChange={(open) => !open && setImprovedDraft(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {improvedDraft && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {isEs ? 'Versión mejorada por IA' : 'AI-improved version'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs font-heading font-bold uppercase tracking-widest text-primary mb-1">
                    {isEs ? 'Cambio principal' : 'Main change'}
                  </p>
                  <p className="text-sm font-body">{improvedDraft.reason}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
                    <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground">
                      {isEs ? 'Tu versión' : 'Your version'}
                    </p>
                    <pre className="text-xs whitespace-pre-wrap font-body leading-relaxed max-h-[400px] overflow-y-auto">{improvedDraft.original}</pre>
                  </div>
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-2">
                    <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      {isEs ? 'Versión mejorada' : 'Improved version'}
                    </p>
                    <pre className="text-xs whitespace-pre-wrap font-body leading-relaxed max-h-[400px] overflow-y-auto">{improvedDraft.improved}</pre>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setImprovedDraft(null)}>
                    {isEs ? 'Mantener mi versión' : 'Keep my version'}
                  </Button>
                  <Button onClick={acceptImprovedDraft}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isEs ? 'Usar versión mejorada' : 'Use improved version'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Playbook viewer modal (Idea 2 — explorer side) ── */}
      <Dialog open={!!openedPlaybook} onOpenChange={(open) => !open && setOpenedPlaybook(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {openedPlaybook && (() => {
            const orderedPrompts = openedPlaybook.prompt_ids
              .map((id) => prompts.find((p) => p.id === id))
              .filter(Boolean) as SharedPromptWithStats[];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-primary" />
                    {openedPlaybook.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-body">
                    <span>by <span className="font-semibold text-foreground">{openedPlaybook.authorName || 'Tutor'}</span></span>
                    <span>•</span>
                    <span>{openedPlaybook.completion_count} {isEs ? 'completaron' : 'completed'}</span>
                    {openedPlaybook.skill && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px]">{openedPlaybook.skill}</Badge>
                      </>
                    )}
                  </div>
                  {openedPlaybook.description && (
                    <p className="text-sm font-body text-muted-foreground">{openedPlaybook.description}</p>
                  )}
                  <div className="space-y-2">
                    {orderedPrompts.map((p, i) => (
                      <div key={p.id} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-heading font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <p className="font-heading font-semibold text-sm flex-1">{p.title}</p>
                          {p.toolName && <Badge variant="outline" className="text-[9px]">{p.toolName}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground font-body line-clamp-3 whitespace-pre-wrap">{p.content}</p>
                        <Button size="sm" variant="outline" className="text-xs gap-1 mt-1" onClick={() => handleCopyAndOpenPrompt(p)}>
                          <Copy className="h-3 w-3" />
                          {p.toolName ? (isEs ? `Copiar y abrir ${p.toolName}` : `Copy & open ${p.toolName}`) : (isEs ? 'Copiar prompt' : 'Copy prompt')}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    {openedPlaybook.myCompletion ? (
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                        <p className="text-xs font-heading font-semibold text-emerald-600 dark:text-emerald-400">
                          {isEs ? '¡Ya completaste este playbook!' : 'You already completed this playbook!'}
                        </p>
                      </div>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleCompletePlaybook(openedPlaybook)}
                        disabled={completePlaybook.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isEs ? 'Marcar playbook como completado' : 'Mark playbook as complete'}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Playbook creator modal (Idea 2 — tutor side) ── */}
      <Dialog open={showPlaybookCreator} onOpenChange={setShowPlaybookCreator}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              {isEs ? 'Crear Playbook' : 'Create Playbook'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={isEs ? 'Título (ej. "Lanzar producto en e-commerce")' : 'Title (e.g. "Launch product on e-commerce")'}
              value={playbookForm.title}
              onChange={(e) => setPlaybookForm((p) => ({ ...p, title: e.target.value }))}
            />
            <Textarea
              placeholder={isEs ? 'Descripción: ¿qué problema resuelve este playbook?' : 'Description: what problem does this playbook solve?'}
              value={playbookForm.description}
              onChange={(e) => setPlaybookForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
            />
            <Select value={playbookForm.skill || 'none'} onValueChange={(v) => setPlaybookForm((p) => ({ ...p, skill: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder={isEs ? 'Skill objetivo' : 'Target skill'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{isEs ? 'Sin skill específica' : 'No specific skill'}</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Web Development">{isEs ? 'Desarrollo Web' : 'Web Development'}</SelectItem>
                <SelectItem value="Design">{isEs ? 'Diseño' : 'Design'}</SelectItem>
                <SelectItem value="Data">Data</SelectItem>
                <SelectItem value="Research">{isEs ? 'Investigación' : 'Research'}</SelectItem>
                <SelectItem value="Operations">{isEs ? 'Operaciones' : 'Operations'}</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <p className="text-xs font-heading font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {isEs ? `Prompts incluidos (${playbookForm.promptIds.length})` : `Included prompts (${playbookForm.promptIds.length})`}
              </p>
              <p className="text-[11px] text-muted-foreground font-body mb-2">
                {isEs ? 'Hace click para agregar/quitar. El orden es el orden en que se agregaron.' : 'Click to add/remove. Order is the order they were added in.'}
              </p>
              <div className="rounded-lg border border-border/50 max-h-[260px] overflow-y-auto divide-y divide-border/50">
                {prompts
                  .filter((p) => !playbookForm.skill || p.skill === playbookForm.skill || !p.skill)
                  .map((p) => {
                    const idx = playbookForm.promptIds.indexOf(p.id);
                    const inPlaybook = idx >= 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPlaybookForm((pb) => ({
                            ...pb,
                            promptIds: inPlaybook ? pb.promptIds.filter((id) => id !== p.id) : [...pb.promptIds, p.id],
                          }));
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors ${inPlaybook ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {inPlaybook && (
                            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-heading font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-heading font-semibold text-xs truncate">{p.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {p.skill && <span className="text-[10px] text-muted-foreground">{p.skill}</span>}
                              {p.toolName && <span className="text-[10px] text-muted-foreground">• {p.toolName}</span>}
                            </div>
                          </div>
                        </div>
                        {inPlaybook ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowPlaybookCreator(false)}>{isEs ? 'Cancelar' : 'Cancel'}</Button>
              <Button onClick={handleCreatePlaybook} disabled={createPlaybook.isPending || !playbookForm.title.trim() || playbookForm.promptIds.length < 2}>
                <Upload className="h-4 w-4 mr-2" />
                {isEs ? 'Publicar Playbook' : 'Publish Playbook'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Path creator modal (tutor side) ── */}
      <Dialog open={showPathCreator} onOpenChange={setShowPathCreator}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {isEs ? 'Crear Ruta de Aprendizaje' : 'Create Learning Path'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-body text-muted-foreground leading-relaxed">
                {isEs
                  ? <>Una ruta encadena tus cursos en un orden curado. Cuando un explorer completa todos los cursos, <span className="font-semibold text-foreground">se le emite automáticamente un certificado oficial GOPHORA</span> firmado por vos.</>
                  : <>A path chains your courses in a curated order. When an explorer completes every course, <span className="font-semibold text-foreground">an official GOPHORA certificate signed by you is auto-issued.</span></>}
              </p>
            </div>
            <Input
              placeholder={isEs ? 'Título (ej. "Marketing con IA — Nivel inicial")' : 'Title (e.g. "AI Marketing — Beginner")'}
              value={pathForm.title}
              onChange={(e) => setPathForm((p) => ({ ...p, title: e.target.value }))}
            />
            <Textarea
              placeholder={isEs ? 'Descripción: ¿qué aprende el explorer al terminar la ruta?' : 'Description: what does the explorer learn after the path?'}
              value={pathForm.description}
              onChange={(e) => setPathForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
            />
            <div>
              <label className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-1 block">{isEs ? 'Icono' : 'Icon'}</label>
              <div className="grid grid-cols-8 gap-2">
                {['BookOpen', 'Brain', 'Zap', 'Code', 'Palette', 'Briefcase', 'Bot', 'Image', 'Video', 'PenTool', 'FileText', 'Search', 'GitBranch', 'Workflow', 'MessageSquare', 'Wrench'].map((iconKey) => (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setPathForm((p) => ({ ...p, icon: iconKey }))}
                    className={`h-10 rounded-lg border flex items-center justify-center transition-colors ${pathForm.icon === iconKey ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 hover:border-primary/40 text-muted-foreground'}`}
                  >
                    {iconMap[iconKey]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-heading font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {isEs ? `Cursos en la ruta (${pathForm.courseIds.length})` : `Courses in path (${pathForm.courseIds.length})`}
              </p>
              <p className="text-[11px] text-muted-foreground font-body mb-2">
                {isEs ? 'Solo podés incluir tus propios cursos publicados. Click para agregar/quitar; el orden es el orden en que los seleccionaste.' : 'Only your own published courses can be included. Click to add/remove; order is the order you selected them in.'}
              </p>
              {tutorCourses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
                  {isEs ? 'Aún no tenés cursos publicados. Crea cursos primero desde "Crear Curso".' : 'No published courses yet. Create courses first from "Create Course".'}
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 max-h-[260px] overflow-y-auto divide-y divide-border/50">
                  {tutorCourses.map((c) => {
                    const idx = pathForm.courseIds.indexOf(c.id);
                    const inPath = idx >= 0;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setPathForm((pf) => ({
                            ...pf,
                            courseIds: inPath ? pf.courseIds.filter((id) => id !== c.id) : [...pf.courseIds, c.id],
                          }));
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors ${inPath ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {inPath && (
                            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-heading font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-heading font-semibold text-xs truncate">{c.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-muted-foreground capitalize">{c.skill_level}</span>
                              <span className="text-[10px] text-muted-foreground">• {c.duration_minutes} min</span>
                              {c.path_id && c.path_id !== pathForm.title && (
                                <span className="text-[10px] text-yellow-600 dark:text-yellow-400">• {isEs ? 'ya en otra ruta' : 'already in another path'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {inPath ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowPathCreator(false)}>{isEs ? 'Cancelar' : 'Cancel'}</Button>
              <Button onClick={handleCreatePath} disabled={createPath.isPending || !pathForm.title.trim() || pathForm.courseIds.length < 2}>
                <Upload className="h-4 w-4 mr-2" />
                {isEs ? 'Publicar Ruta' : 'Publish Path'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Quick Start modal for any tool ── */}
      <Dialog open={!!quickStartTool} onOpenChange={(open) => !open && setQuickStartTool(null)}>
        <DialogContent className="max-w-lg">
          {quickStartTool && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {isEs ? 'Quick start' : 'Quick start'} — {quickStartTool.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-body whitespace-pre-line leading-relaxed">
                  {isEs
                    ? (quickStartTool.quick_start_es || quickStartTool.quick_start || '')
                    : (quickStartTool.quick_start || quickStartTool.quick_start_es || '')}
                </p>
                {quickStartTool.url && (
                  <Button
                    asChild
                    className="w-full gap-2"
                    onClick={() => trackToolUsage.mutate({ toolId: quickStartTool.id })}
                  >
                    <a href={quickStartTool.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      {isEs ? 'Abrir ' : 'Open '} {quickStartTool.name}
                    </a>
                  </Button>
                )}
              </div>
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

  // Live vs recorded badge state. A scheduled live course shows three
  // sub-states: "EN VIVO AHORA" (within ±30 min of live_at), "EN VIVO en
  // {dist}" (future), or "GRABADA" once the live window has elapsed.
  const liveBadge = (() => {
    if (course.delivery_mode !== 'live') return { kind: 'recorded' as const };
    if (!course.live_at) return { kind: 'live-soon' as const, label: isEs ? 'EN VIVO' : 'LIVE' };
    const now = Date.now();
    const at = new Date(course.live_at).getTime();
    const diffMin = (at - now) / 60_000;
    if (Math.abs(diffMin) <= 30) return { kind: 'live-now' as const, label: isEs ? 'EN VIVO AHORA' : 'LIVE NOW' };
    if (diffMin > 30) {
      const hours = Math.round(diffMin / 60);
      const days = Math.round(diffMin / 1440);
      const dist = days >= 1
        ? `${days}${isEs ? 'd' : 'd'}`
        : `${hours}${isEs ? 'h' : 'h'}`;
      return { kind: 'live-soon' as const, label: isEs ? `EN ${dist}` : `IN ${dist}` };
    }
    return { kind: 'recorded' as const };
  })();

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
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[80%]">
          {liveBadge.kind === 'live-now' && (
            <span className="bg-red-500 text-white text-[10px] font-heading font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> {liveBadge.label}
            </span>
          )}
          {liveBadge.kind === 'live-soon' && (
            <span className="bg-red-500/90 text-white text-[10px] font-heading font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {isEs ? 'EN VIVO ' : 'LIVE '}{liveBadge.label.replace(isEs ? 'EN ' : 'IN ', '· ')}
            </span>
          )}
          {liveBadge.kind === 'recorded' && (
            <span className="bg-blue-500/90 text-white text-[10px] font-heading font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Play className="h-2.5 w-2.5 fill-white" /> {isEs ? 'GRABADA' : 'RECORDED'}
            </span>
          )}
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
