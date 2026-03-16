import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, GraduationCap, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AcademyCourse } from '@/hooks/useAcademy';
import { useCourseExamQuestions } from '@/hooks/useAcademy';

interface ExamQuestion {
  question: string;
  question_es: string;
  options: string[];
  options_es: string[];
  correctIndex: number;
}

const PASSING_SCORE = 70;

// Fallback question banks (used when tutor hasn't uploaded questions)
const fallbackQuestions: ExamQuestion[] = [
  { question: 'What is the main benefit of AI in productivity?', question_es: '¿Cuál es el beneficio principal de la IA en productividad?', options: ['It replaces humans', 'It automates repetitive tasks', 'It makes computers slower', 'It only works for programmers'], options_es: ['Reemplaza humanos', 'Automatiza tareas repetitivas', 'Hace las computadoras más lentas', 'Solo funciona para programadores'], correctIndex: 1 },
  { question: 'What is prompt engineering?', question_es: '¿Qué es la ingeniería de prompts?', options: ['A type of software', 'Designing inputs to get better AI outputs', 'A programming language', 'Hardware design'], options_es: ['Un tipo de software', 'Diseñar entradas para obtener mejores salidas de IA', 'Un lenguaje de programación', 'Diseño de hardware'], correctIndex: 1 },
  { question: 'What does AI stand for?', question_es: '¿Qué significa IA?', options: ['Automated Internet', 'Artificial Intelligence', 'Advanced Interface', 'Analog Input'], options_es: ['Internet Automatizado', 'Inteligencia Artificial', 'Interfaz Avanzada', 'Entrada Analógica'], correctIndex: 1 },
  { question: 'What is a common use of generative AI?', question_es: '¿Cuál es un uso común de la IA generativa?', options: ['Only gaming', 'Creating text, images, and code from prompts', 'Physical manufacturing', 'Data deletion'], options_es: ['Solo juegos', 'Crear texto, imágenes y código a partir de prompts', 'Manufactura física', 'Eliminación de datos'], correctIndex: 1 },
  { question: 'What is the benefit of no-code AI tools?', question_es: '¿Cuál es el beneficio de las herramientas de IA sin código?', options: ['They are slower', 'They let non-programmers build AI solutions', 'They only work offline', 'They replace all developers'], options_es: ['Son más lentas', 'Permiten a no programadores construir soluciones de IA', 'Solo funcionan offline', 'Reemplazan a todos los desarrolladores'], correctIndex: 1 },
];

interface CourseExamProps {
  course: AcademyCourse;
  isEs: boolean;
  onPass: () => void;
  onClose: () => void;
}

export default function CourseExam({ course, isEs, onPass, onClose }: CourseExamProps) {
  const { data: dbQuestions, isLoading } = useCourseExamQuestions(course.id);

  // Convert DB questions to exam format, or use fallback
  const questions: ExamQuestion[] = (() => {
    if (dbQuestions && dbQuestions.length >= 5) {
      return dbQuestions.map(q => ({
        question: q.question,
        question_es: q.question_es || q.question,
        options: Array.isArray(q.options) ? q.options : [],
        options_es: Array.isArray(q.options_es) && q.options_es.length > 0 ? q.options_es : (Array.isArray(q.options) ? q.options : []),
        correctIndex: q.correct_index,
      }));
    }
    // Fallback: use generic questions shuffled
    return [...fallbackQuestions].sort(() => Math.random() - 0.5).slice(0, 5);
  })();

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [passed, setPassed] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">
          {isEs ? 'Cargando examen...' : 'Loading exam...'}
        </span>
      </div>
    );
  }

  const handleAnswer = (optionIndex: number) => {
    if (showResults) return;
    // Prevent double-click from changing state unexpectedly
    if (selectedAnswers[currentQ] === optionIndex) return;
    const updated = [...selectedAnswers];
    updated[currentQ] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleSubmit = () => {
    const correct = selectedAnswers.filter((a, i) => a === questions[i].correctIndex).length;
    const score = (correct / questions.length) * 100;
    const didPass = score >= PASSING_SCORE;
    setPassed(didPass);
    setShowResults(true);
    if (didPass) {
      onPass();
    }
  };

  const handleRetry = () => {
    setSelectedAnswers(new Array(questions.length).fill(null));
    setCurrentQ(0);
    setShowResults(false);
    setPassed(false);
  };

  const correctCount = selectedAnswers.filter((a, i) => a === questions[i].correctIndex).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const allAnswered = selectedAnswers.every(a => a !== null);
  const q = questions[currentQ];

  // Show info badge about exam source
  const isTutorExam = dbQuestions && dbQuestions.length >= 5;

  if (showResults) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          {passed ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="space-y-3">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <h3 className="font-heading font-bold text-xl text-primary">
                {isEs ? '¡Aprobaste! 🎉' : 'You Passed! 🎉'}
              </h3>
              <p className="text-muted-foreground">
                {isEs ? `Puntuación: ${score}% (${correctCount}/${questions.length})` : `Score: ${score}% (${correctCount}/${questions.length})`}
              </p>
              <p className="text-sm text-muted-foreground">
                {isEs ? 'El curso se ha marcado como completado.' : 'The course has been marked as completed.'}
              </p>
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="space-y-3">
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <h3 className="font-heading font-bold text-xl text-destructive">
                {isEs ? 'No aprobaste' : 'Not Passed'}
              </h3>
              <p className="text-muted-foreground">
                {isEs ? `Puntuación: ${score}% (necesitas ${PASSING_SCORE}%)` : `Score: ${score}% (need ${PASSING_SCORE}%)`}
              </p>
              <p className="text-sm text-muted-foreground">
                {isEs ? 'Revisa el curso e inténtalo de nuevo.' : 'Review the course and try again.'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Review answers */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {questions.map((question, i) => {
            const userAnswer = selectedAnswers[i];
            const isCorrect = userAnswer === question.correctIndex;
            return (
              <div key={i} className={`rounded-lg border p-3 ${isCorrect ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <p className="text-sm font-semibold mb-1">
                  {i + 1}. {isEs ? question.question_es : question.question}
                </p>
                <p className="text-xs">
                  {isCorrect ? '✅' : '❌'} {isEs ? 'Tu respuesta: ' : 'Your answer: '}
                  {userAnswer !== null ? (isEs ? question.options_es[userAnswer] : question.options[userAnswer]) : (isEs ? 'Sin respuesta' : 'No answer')}
                </p>
                {!isCorrect && (
                  <p className="text-xs text-primary mt-1">
                    {isEs ? 'Correcta: ' : 'Correct: '}
                    {isEs ? question.options_es[question.correctIndex] : question.options[question.correctIndex]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          {!passed && (
            <Button onClick={handleRetry} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              {isEs ? 'Intentar de nuevo' : 'Try Again'}
            </Button>
          )}
          <Button onClick={onClose} className="flex-1">
            {isEs ? 'Cerrar' : 'Close'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="font-heading">
          <GraduationCap className="h-3 w-3 mr-1" />
          {isEs ? `Pregunta ${currentQ + 1} de ${questions.length}` : `Question ${currentQ + 1} of ${questions.length}`}
        </Badge>
        <div className="flex items-center gap-2">
          {isTutorExam && (
            <Badge variant="secondary" className="text-[10px]">
              {isEs ? '📝 Examen del Tutor' : '📝 Tutor Exam'}
            </Badge>
          )}
          <Badge variant="secondary">
            {isEs ? `Aprobación: ${PASSING_SCORE}%` : `Pass: ${PASSING_SCORE}%`}
          </Badge>
        </div>
      </div>

      <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">
            {isEs ? q.question_es : q.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(isEs ? q.options_es : q.options).map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`w-full text-left rounded-lg border p-3 text-sm transition-all ${
                selectedAnswers[currentQ] === i
                  ? 'border-primary bg-primary/10 text-foreground font-medium'
                  : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="font-heading font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
              {option}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {currentQ > 0 && (
          <Button variant="outline" onClick={() => setCurrentQ(currentQ - 1)}>
            {isEs ? 'Anterior' : 'Previous'}
          </Button>
        )}
        <div className="flex-1" />
        {currentQ < questions.length - 1 ? (
          <Button onClick={handleNext} disabled={selectedAnswers[currentQ] === null}>
            {isEs ? 'Siguiente' : 'Next'} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!allAnswered} className="bg-primary">
            <GraduationCap className="h-4 w-4 mr-2" />
            {isEs ? 'Enviar Examen' : 'Submit Exam'}
          </Button>
        )}
      </div>
    </div>
  );
}
