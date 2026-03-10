import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, GraduationCap, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AcademyCourse } from '@/hooks/useAcademy';

interface ExamQuestion {
  question: string;
  question_es: string;
  options: string[];
  options_es: string[];
  correctIndex: number;
}

const PASSING_SCORE = 70;

// Question banks by category
const questionBanks: Record<string, ExamQuestion[]> = {
  'Prompt Engineering': [
    { question: 'What is "chain-of-thought" prompting?', question_es: '¿Qué es el prompting "cadena de pensamiento"?', options: ['A type of chatbot', 'Breaking down reasoning into steps for the AI', 'Connecting multiple AI models', 'A programming language'], options_es: ['Un tipo de chatbot', 'Descomponer el razonamiento en pasos para la IA', 'Conectar múltiples modelos de IA', 'Un lenguaje de programación'], correctIndex: 1 },
    { question: 'What is the main benefit of few-shot prompting?', question_es: '¿Cuál es el beneficio principal del prompting few-shot?', options: ['It uses less tokens', 'It provides examples to guide AI output format', 'It makes AI faster', 'It reduces costs'], options_es: ['Usa menos tokens', 'Proporciona ejemplos para guiar el formato de salida de la IA', 'Hace que la IA sea más rápida', 'Reduce costos'], correctIndex: 1 },
    { question: 'What should you include in an effective prompt?', question_es: '¿Qué debes incluir en un prompt efectivo?', options: ['Only the question', 'Context, role, and expected output format', 'As many words as possible', 'Technical jargon only'], options_es: ['Solo la pregunta', 'Contexto, rol y formato de salida esperado', 'La mayor cantidad de palabras posible', 'Solo jerga técnica'], correctIndex: 1 },
    { question: 'What is "zero-shot" prompting?', question_es: '¿Qué es el prompting "zero-shot"?', options: ['Prompting without any examples', 'Prompting with zero errors', 'A failed prompt', 'Prompting with images'], options_es: ['Prompting sin ningún ejemplo', 'Prompting con cero errores', 'Un prompt fallido', 'Prompting con imágenes'], correctIndex: 0 },
    { question: 'What is prompt iteration?', question_es: '¿Qué es la iteración de prompts?', options: ['Deleting prompts', 'Refining prompts based on outputs to improve results', 'Writing the same prompt twice', 'Using prompts in loops'], options_es: ['Eliminar prompts', 'Refinar prompts basándose en las salidas para mejorar resultados', 'Escribir el mismo prompt dos veces', 'Usar prompts en bucles'], correctIndex: 1 },
  ],
  'AI Development': [
    { question: 'What is a Large Language Model (LLM)?', question_es: '¿Qué es un Modelo de Lenguaje Grande (LLM)?', options: ['A big computer', 'An AI trained on massive text data to understand and generate language', 'A database system', 'A web framework'], options_es: ['Una computadora grande', 'Una IA entrenada con datos de texto masivos para entender y generar lenguaje', 'Un sistema de base de datos', 'Un framework web'], correctIndex: 1 },
    { question: 'What is the purpose of fine-tuning an AI model?', question_es: '¿Cuál es el propósito de hacer fine-tuning a un modelo de IA?', options: ['To make it smaller', 'To adapt it for specific tasks or domains', 'To delete training data', 'To make it faster'], options_es: ['Hacerlo más pequeño', 'Adaptarlo para tareas o dominios específicos', 'Eliminar datos de entrenamiento', 'Hacerlo más rápido'], correctIndex: 1 },
    { question: 'What is an API in the context of AI?', question_es: '¿Qué es una API en el contexto de la IA?', options: ['A programming language', 'An interface to interact with AI models programmatically', 'A type of AI model', 'A training dataset'], options_es: ['Un lenguaje de programación', 'Una interfaz para interactuar con modelos de IA programáticamente', 'Un tipo de modelo de IA', 'Un dataset de entrenamiento'], correctIndex: 1 },
    { question: 'What is RAG (Retrieval-Augmented Generation)?', question_es: '¿Qué es RAG (Generación Aumentada por Recuperación)?', options: ['A type of GPU', 'Combining search/retrieval with AI generation for accurate outputs', 'A programming framework', 'A data format'], options_es: ['Un tipo de GPU', 'Combinar búsqueda/recuperación con generación de IA para resultados precisos', 'Un framework de programación', 'Un formato de datos'], correctIndex: 1 },
    { question: 'What is Python used for in AI development?', question_es: '¿Para qué se usa Python en desarrollo de IA?', options: ['Only web design', 'Building, training, and deploying AI models and scripts', 'Only mobile apps', 'Only game development'], options_es: ['Solo diseño web', 'Construir, entrenar y desplegar modelos y scripts de IA', 'Solo apps móviles', 'Solo desarrollo de juegos'], correctIndex: 1 },
  ],
  'AI Content Creation': [
    { question: 'What is generative AI primarily used for in content creation?', question_es: '¿Para qué se usa principalmente la IA generativa en creación de contenido?', options: ['Deleting content', 'Creating new text, images, or media from prompts', 'Only organizing files', 'Hardware maintenance'], options_es: ['Eliminar contenido', 'Crear nuevo texto, imágenes o medios a partir de prompts', 'Solo organizar archivos', 'Mantenimiento de hardware'], correctIndex: 1 },
    { question: 'What is text-to-image generation?', question_es: '¿Qué es la generación de texto a imagen?', options: ['Converting images to text', 'Creating images from text descriptions using AI', 'Scanning text documents', 'Printing text'], options_es: ['Convertir imágenes a texto', 'Crear imágenes a partir de descripciones de texto usando IA', 'Escanear documentos de texto', 'Imprimir texto'], correctIndex: 1 },
    { question: 'What tool is known for AI image generation?', question_es: '¿Qué herramienta es conocida por la generación de imágenes con IA?', options: ['Microsoft Word', 'DALL-E', 'Excel', 'PowerPoint'], options_es: ['Microsoft Word', 'DALL-E', 'Excel', 'PowerPoint'], correctIndex: 1 },
    { question: 'What is "inpainting" in AI image editing?', question_es: '¿Qué es el "inpainting" en la edición de imágenes con IA?', options: ['Painting the entire image', 'Editing or filling specific parts of an image using AI', 'Deleting an image', 'Compressing an image'], options_es: ['Pintar toda la imagen', 'Editar o rellenar partes específicas de una imagen usando IA', 'Eliminar una imagen', 'Comprimir una imagen'], correctIndex: 1 },
    { question: 'How can AI speed up visual content creation?', question_es: '¿Cómo puede la IA acelerar la creación de contenido visual?', options: ['By manually drawing everything', 'By generating drafts and variations instantly from prompts', 'By slowing down the process', 'It cannot help with visuals'], options_es: ['Dibujando todo manualmente', 'Generando borradores y variaciones instantáneamente a partir de prompts', 'Haciendo más lento el proceso', 'No puede ayudar con visuales'], correctIndex: 1 },
  ],
  'AI Tools for Productivity': [
    { question: 'How can AI assistants improve daily productivity?', question_es: '¿Cómo pueden los asistentes de IA mejorar la productividad diaria?', options: ['By replacing all human workers', 'By automating repetitive tasks, drafting content, and organizing information', 'By making computers slower', 'They cannot improve productivity'], options_es: ['Reemplazando a todos los trabajadores humanos', 'Automatizando tareas repetitivas, redactando contenido y organizando información', 'Haciendo las computadoras más lentas', 'No pueden mejorar la productividad'], correctIndex: 1 },
    { question: 'What is context management in AI assistants?', question_es: '¿Qué es la gestión de contexto en asistentes de IA?', options: ['Deleting all conversations', 'Providing relevant background information so the AI gives better responses', 'Using only one word prompts', 'Ignoring previous messages'], options_es: ['Eliminar todas las conversaciones', 'Proporcionar información de contexto relevante para que la IA dé mejores respuestas', 'Usar prompts de una sola palabra', 'Ignorar mensajes anteriores'], correctIndex: 1 },
    { question: 'What is a practical use of AI in research?', question_es: '¿Cuál es un uso práctico de la IA en investigación?', options: ['It cannot help with research', 'Summarizing articles, finding patterns, and generating insights', 'Only printing documents', 'Only sending emails'], options_es: ['No puede ayudar con la investigación', 'Resumir artículos, encontrar patrones y generar insights', 'Solo imprimir documentos', 'Solo enviar emails'], correctIndex: 1 },
    { question: 'What is AI-assisted writing?', question_es: '¿Qué es la escritura asistida por IA?', options: ['AI writes everything without human input', 'Using AI to help draft, edit, and improve written content', 'Typing faster on a keyboard', 'Reading books about AI'], options_es: ['La IA escribe todo sin intervención humana', 'Usar IA para ayudar a redactar, editar y mejorar contenido escrito', 'Escribir más rápido en un teclado', 'Leer libros sobre IA'], correctIndex: 1 },
    { question: 'Why is AI considered a productivity multiplier?', question_es: '¿Por qué se considera la IA un multiplicador de productividad?', options: ['It does all the work', 'It helps complete tasks faster while maintaining quality', 'It only works for programmers', 'It slows down work'], options_es: ['Hace todo el trabajo', 'Ayuda a completar tareas más rápido manteniendo la calidad', 'Solo funciona para programadores', 'Hace más lento el trabajo'], correctIndex: 1 },
  ],
  'AI Automation': [
    { question: 'What is workflow automation with AI?', question_es: '¿Qué es la automatización de flujos de trabajo con IA?', options: ['Manual data entry', 'Using AI to automatically execute sequences of tasks', 'Deleting all workflows', 'Only creating documents'], options_es: ['Entrada manual de datos', 'Usar IA para ejecutar automáticamente secuencias de tareas', 'Eliminar todos los flujos de trabajo', 'Solo crear documentos'], correctIndex: 1 },
    { question: 'What is a no-code AI tool?', question_es: '¿Qué es una herramienta de IA sin código?', options: ['A tool that does not work', 'A platform that allows building AI solutions without programming', 'A broken application', 'A text editor'], options_es: ['Una herramienta que no funciona', 'Una plataforma que permite construir soluciones de IA sin programar', 'Una aplicación rota', 'Un editor de texto'], correctIndex: 1 },
    { question: 'What is n8n used for?', question_es: '¿Para qué se usa n8n?', options: ['Photo editing', 'Building automated workflows and integrations', 'Playing games', 'Writing novels'], options_es: ['Edición de fotos', 'Construir flujos de trabajo automatizados e integraciones', 'Jugar videojuegos', 'Escribir novelas'], correctIndex: 1 },
    { question: 'What is an AI agent?', question_es: '¿Qué es un agente de IA?', options: ['A human who uses AI', 'An autonomous AI system that can plan and execute tasks', 'A type of computer', 'An email service'], options_es: ['Un humano que usa IA', 'Un sistema de IA autónomo que puede planificar y ejecutar tareas', 'Un tipo de computadora', 'Un servicio de email'], correctIndex: 1 },
    { question: 'How does AI automation benefit freelancers?', question_es: '¿Cómo beneficia la automatización con IA a los freelancers?', options: ['It does not benefit them', 'Automates repetitive tasks so they can focus on high-value work', 'It replaces freelancers', 'Only helps large companies'], options_es: ['No los beneficia', 'Automatiza tareas repetitivas para que puedan enfocarse en trabajo de alto valor', 'Reemplaza a los freelancers', 'Solo ayuda a grandes empresas'], correctIndex: 1 },
  ],
  'AI for Marketing/Operations': [
    { question: 'How can AI help in marketing?', question_es: '¿Cómo puede la IA ayudar en marketing?', options: ['It cannot help', 'By generating content, analyzing trends, and personalizing campaigns', 'Only by sending spam', 'Only by designing logos'], options_es: ['No puede ayudar', 'Generando contenido, analizando tendencias y personalizando campañas', 'Solo enviando spam', 'Solo diseñando logos'], correctIndex: 1 },
    { question: 'What is AI-powered analytics?', question_es: '¿Qué es la analítica impulsada por IA?', options: ['Counting numbers manually', 'Using AI to find patterns and insights in business data', 'A type of social media', 'A spreadsheet tool'], options_es: ['Contar números manualmente', 'Usar IA para encontrar patrones e insights en datos de negocio', 'Un tipo de red social', 'Una herramienta de hojas de cálculo'], correctIndex: 1 },
    { question: 'What is a practical AI use case in operations?', question_es: '¿Cuál es un caso de uso práctico de la IA en operaciones?', options: ['Making coffee', 'Automating document processing, scheduling, and reporting', 'Only gaming', 'Physical labor'], options_es: ['Hacer café', 'Automatizar procesamiento de documentos, programación y reportes', 'Solo juegos', 'Trabajo físico'], correctIndex: 1 },
    { question: 'How can AI improve customer service?', question_es: '¿Cómo puede la IA mejorar el servicio al cliente?', options: ['By ignoring customers', 'By providing instant responses and routing queries efficiently', 'By making services slower', 'It cannot help'], options_es: ['Ignorando a los clientes', 'Proporcionando respuestas instantáneas y enrutando consultas eficientemente', 'Haciendo los servicios más lentos', 'No puede ayudar'], correctIndex: 1 },
    { question: 'What role does AI play in project planning?', question_es: '¿Qué rol juega la IA en la planificación de proyectos?', options: ['No role', 'Helping estimate timelines, identify risks, and allocate resources', 'Only creating calendars', 'Replacing project managers completely'], options_es: ['Ningún rol', 'Ayudando a estimar tiempos, identificar riesgos y asignar recursos', 'Solo creando calendarios', 'Reemplazando a los project managers completamente'], correctIndex: 1 },
  ],
  'Claude Code': [
    { question: 'What is Claude Code primarily used for?', question_es: '¿Para qué se usa principalmente Claude Code?', options: ['Photo editing', 'AI-assisted coding, debugging, and workflow automation', 'Playing music', 'Social media'], options_es: ['Edición de fotos', 'Codificación asistida por IA, depuración y automatización de flujos de trabajo', 'Reproducir música', 'Redes sociales'], correctIndex: 1 },
    { question: 'What advantage does Claude Code offer developers?', question_es: '¿Qué ventaja ofrece Claude Code a los desarrolladores?', options: ['No advantage', 'Faster code generation and debugging with AI assistance', 'Only spell checking', 'Hardware optimization'], options_es: ['Ninguna ventaja', 'Generación y depuración de código más rápida con asistencia de IA', 'Solo corrección ortográfica', 'Optimización de hardware'], correctIndex: 1 },
    { question: 'What can you do with Claude for file handling?', question_es: '¿Qué puedes hacer con Claude para manejo de archivos?', options: ['Nothing', 'Read, analyze, and transform files using AI commands', 'Only delete files', 'Only rename files'], options_es: ['Nada', 'Leer, analizar y transformar archivos usando comandos de IA', 'Solo eliminar archivos', 'Solo renombrar archivos'], correctIndex: 1 },
    { question: 'How does AI-assisted debugging work?', question_es: '¿Cómo funciona la depuración asistida por IA?', options: ['AI ignores bugs', 'AI analyzes code, identifies errors, and suggests fixes', 'AI deletes all code', 'AI creates new bugs'], options_es: ['La IA ignora los bugs', 'La IA analiza el código, identifica errores y sugiere correcciones', 'La IA elimina todo el código', 'La IA crea nuevos bugs'], correctIndex: 1 },
    { question: 'What is "vibe coding"?', question_es: '¿Qué es "vibe coding"?', options: ['Coding while listening to music', 'Describing what you want in natural language and AI generates code', 'A type of dance', 'A programming language'], options_es: ['Codificar mientras escuchas música', 'Describir lo que quieres en lenguaje natural y la IA genera código', 'Un tipo de baile', 'Un lenguaje de programación'], correctIndex: 1 },
  ],
  'AI Agents': [
    { question: 'What defines an AI agent?', question_es: '¿Qué define a un agente de IA?', options: ['A simple chatbot', 'An autonomous system that can plan, reason, and execute multi-step tasks', 'A search engine', 'A type of database'], options_es: ['Un chatbot simple', 'Un sistema autónomo que puede planificar, razonar y ejecutar tareas multi-paso', 'Un motor de búsqueda', 'Un tipo de base de datos'], correctIndex: 1 },
    { question: 'What is a multi-agent system?', question_es: '¿Qué es un sistema multi-agente?', options: ['One AI model', 'Multiple AI agents working together to solve complex tasks', 'A group of humans', 'A type of hardware'], options_es: ['Un modelo de IA', 'Múltiples agentes de IA trabajando juntos para resolver tareas complejas', 'Un grupo de humanos', 'Un tipo de hardware'], correctIndex: 1 },
    { question: 'What is tool integration in AI agents?', question_es: '¿Qué es la integración de herramientas en agentes de IA?', options: ['Physical tools', 'Giving AI agents access to external APIs and services', 'Breaking tools', 'Only using one tool'], options_es: ['Herramientas físicas', 'Dar a los agentes de IA acceso a APIs y servicios externos', 'Romper herramientas', 'Usar solo una herramienta'], correctIndex: 1 },
    { question: 'How can AI agents help freelancers?', question_es: '¿Cómo pueden los agentes de IA ayudar a los freelancers?', options: ['They cannot help', 'By automating research, outreach, and project management tasks', 'Only by sending invoices', 'By replacing them'], options_es: ['No pueden ayudar', 'Automatizando investigación, alcance y tareas de gestión de proyectos', 'Solo enviando facturas', 'Reemplazándolos'], correctIndex: 1 },
    { question: 'What platform is popular for building AI agents without code?', question_es: '¿Qué plataforma es popular para construir agentes de IA sin código?', options: ['Microsoft Paint', 'n8n', 'Notepad', 'Calculator'], options_es: ['Microsoft Paint', 'n8n', 'Bloc de notas', 'Calculadora'], correctIndex: 1 },
  ],
  'No-code / Vibe Coding': [
    { question: 'What is no-code AI development?', question_es: '¿Qué es el desarrollo de IA sin código?', options: ['Not using computers', 'Building AI solutions using visual interfaces without programming', 'Deleting code', 'Only reading documentation'], options_es: ['No usar computadoras', 'Construir soluciones de IA usando interfaces visuales sin programar', 'Eliminar código', 'Solo leer documentación'], correctIndex: 1 },
    { question: 'Who benefits most from no-code AI tools?', question_es: '¿Quién se beneficia más de las herramientas de IA sin código?', options: ['Nobody', 'Non-technical professionals who want to leverage AI', 'Only expert programmers', 'Only scientists'], options_es: ['Nadie', 'Profesionales no técnicos que quieren aprovechar la IA', 'Solo programadores expertos', 'Solo científicos'], correctIndex: 1 },
    { question: 'What can you build with no-code AI platforms?', question_es: '¿Qué puedes construir con plataformas de IA sin código?', options: ['Nothing useful', 'Chatbots, automations, data pipelines, and ML models', 'Only text files', 'Only spreadsheets'], options_es: ['Nada útil', 'Chatbots, automatizaciones, pipelines de datos y modelos ML', 'Solo archivos de texto', 'Solo hojas de cálculo'], correctIndex: 1 },
    { question: 'What is AWS SageMaker Canvas?', question_es: '¿Qué es AWS SageMaker Canvas?', options: ['A painting app', 'A no-code ML platform for building models visually', 'A video game', 'An email service'], options_es: ['Una app de pintura', 'Una plataforma ML sin código para construir modelos visualmente', 'Un videojuego', 'Un servicio de email'], correctIndex: 1 },
    { question: 'What is drag-and-drop automation?', question_es: '¿Qué es la automatización de arrastrar y soltar?', options: ['Moving physical objects', 'Building workflows by visually connecting components', 'A type of animation', 'Organizing desktop icons'], options_es: ['Mover objetos físicos', 'Construir flujos de trabajo conectando visualmente componentes', 'Un tipo de animación', 'Organizar íconos del escritorio'], correctIndex: 1 },
  ],
  'Image Generation': [
    { question: 'What is AI image generation?', question_es: '¿Qué es la generación de imágenes con IA?', options: ['Taking photos', 'Creating visual content from text descriptions using AI models', 'Scanning images', 'Printing photos'], options_es: ['Tomar fotos', 'Crear contenido visual a partir de descripciones de texto usando modelos de IA', 'Escanear imágenes', 'Imprimir fotos'], correctIndex: 1 },
    { question: 'What is Stable Diffusion?', question_es: '¿Qué es Stable Diffusion?', options: ['A chemistry process', 'An open-source AI model for generating images from text', 'A type of camera', 'A photo filter'], options_es: ['Un proceso químico', 'Un modelo de IA de código abierto para generar imágenes a partir de texto', 'Un tipo de cámara', 'Un filtro de fotos'], correctIndex: 1 },
    { question: 'What is a "negative prompt" in image generation?', question_es: '¿Qué es un "prompt negativo" en generación de imágenes?', options: ['A bad prompt', 'Instructions telling the AI what NOT to include in the image', 'A deleted prompt', 'An error message'], options_es: ['Un prompt malo', 'Instrucciones diciéndole a la IA qué NO incluir en la imagen', 'Un prompt eliminado', 'Un mensaje de error'], correctIndex: 1 },
    { question: 'How does AI art help freelancers?', question_es: '¿Cómo ayuda el arte IA a los freelancers?', options: ['It does not help', 'Generates quick visual concepts and reduces design time', 'Only for personal use', 'It replaces creativity'], options_es: ['No ayuda', 'Genera conceptos visuales rápidos y reduce el tiempo de diseño', 'Solo para uso personal', 'Reemplaza la creatividad'], correctIndex: 1 },
    { question: 'What is "style transfer" in AI images?', question_es: '¿Qué es la "transferencia de estilo" en imágenes IA?', options: ['Copying files', 'Applying the visual style of one image to another', 'Changing image size', 'Rotating an image'], options_es: ['Copiar archivos', 'Aplicar el estilo visual de una imagen a otra', 'Cambiar el tamaño de la imagen', 'Rotar una imagen'], correctIndex: 1 },
  ],
  'Video Generation with AI': [
    { question: 'What is AI video generation?', question_es: '¿Qué es la generación de video con IA?', options: ['Recording with a camera', 'Creating video content using AI from text or image prompts', 'Editing manually', 'Only playing videos'], options_es: ['Grabar con una cámara', 'Crear contenido de video usando IA a partir de prompts de texto o imágenes', 'Editar manualmente', 'Solo reproducir videos'], correctIndex: 1 },
    { question: 'What is denoising in AI image/video processing?', question_es: '¿Qué es el denoising en procesamiento de imagen/video con IA?', options: ['Making noise louder', 'Removing visual noise to produce cleaner outputs', 'Adding special effects', 'Compressing files'], options_es: ['Hacer el ruido más fuerte', 'Eliminar ruido visual para producir resultados más limpios', 'Agregar efectos especiales', 'Comprimir archivos'], correctIndex: 1 },
    { question: 'How can AI video tools help content creators?', question_es: '¿Cómo pueden las herramientas de video IA ayudar a los creadores de contenido?', options: ['They slow down production', 'Generate b-roll, transitions, and effects rapidly', 'Only delete videos', 'They cannot help'], options_es: ['Hacen más lenta la producción', 'Generan b-roll, transiciones y efectos rápidamente', 'Solo eliminan videos', 'No pueden ayudar'], correctIndex: 1 },
    { question: 'What is frame interpolation in AI video?', question_es: '¿Qué es la interpolación de cuadros en video con IA?', options: ['Deleting frames', 'AI generating intermediate frames for smoother video', 'Counting frames', 'Freezing video'], options_es: ['Eliminar cuadros', 'IA generando cuadros intermedios para video más fluido', 'Contar cuadros', 'Congelar video'], correctIndex: 1 },
    { question: 'What is a key benefit of AI in video production?', question_es: '¿Cuál es un beneficio clave de la IA en producción de video?', options: ['Higher costs', 'Dramatically reducing production time and costs', 'Lower quality', 'More manual work'], options_es: ['Costos más altos', 'Reducir drásticamente el tiempo y costos de producción', 'Menor calidad', 'Más trabajo manual'], correctIndex: 1 },
  ],
  'Workflow Automation': [
    { question: 'What is LangChain used for?', question_es: '¿Para qué se usa LangChain?', options: ['A blockchain network', 'Building applications that chain LLM calls with tools and data', 'A messaging app', 'A type of cryptocurrency'], options_es: ['Una red blockchain', 'Construir aplicaciones que encadenan llamadas de LLM con herramientas y datos', 'Una app de mensajería', 'Un tipo de criptomoneda'], correctIndex: 1 },
    { question: 'What is an automation pipeline?', question_es: '¿Qué es un pipeline de automatización?', options: ['A physical pipe', 'A sequence of automated steps that process data end-to-end', 'A type of database', 'An email chain'], options_es: ['Un tubo físico', 'Una secuencia de pasos automatizados que procesan datos de extremo a extremo', 'Un tipo de base de datos', 'Una cadena de emails'], correctIndex: 1 },
    { question: 'How does RAG improve automation?', question_es: '¿Cómo mejora RAG la automatización?', options: ['It does not', 'By giving AI access to specific knowledge bases for accurate outputs', 'By making things slower', 'By using more memory'], options_es: ['No lo hace', 'Dándole a la IA acceso a bases de conocimiento específicas para resultados precisos', 'Haciendo las cosas más lentas', 'Usando más memoria'], correctIndex: 1 },
    { question: 'What is the benefit of API integration in automation?', question_es: '¿Cuál es el beneficio de la integración de APIs en automatización?', options: ['No benefit', 'Connecting different services to create seamless automated workflows', 'Only for developers', 'It breaks systems'], options_es: ['Ningún beneficio', 'Conectar diferentes servicios para crear flujos de trabajo automatizados sin interrupciones', 'Solo para desarrolladores', 'Rompe los sistemas'], correctIndex: 1 },
    { question: 'What makes a good automation candidate task?', question_es: '¿Qué hace que una tarea sea buena candidata para automatización?', options: ['Creative tasks only', 'Repetitive, rule-based tasks with clear inputs and outputs', 'One-time tasks', 'Tasks requiring physical presence'], options_es: ['Solo tareas creativas', 'Tareas repetitivas, basadas en reglas con entradas y salidas claras', 'Tareas de una sola vez', 'Tareas que requieren presencia física'], correctIndex: 1 },
  ],
};

function getQuestionsForCourse(course: AcademyCourse): ExamQuestion[] {
  const category = course.category || 'general';
  // Try exact match first, then partial
  let questions = questionBanks[category];
  if (!questions) {
    const key = Object.keys(questionBanks).find(k => 
      category.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(category.toLowerCase())
    );
    questions = key ? questionBanks[key] : questionBanks['AI Tools for Productivity'];
  }
  // Pick 5 random questions (or all if < 5)
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

interface CourseExamProps {
  course: AcademyCourse;
  isEs: boolean;
  onPass: () => void;
  onClose: () => void;
}

export default function CourseExam({ course, isEs, onPass, onClose }: CourseExamProps) {
  const [questions] = useState(() => getQuestionsForCourse(course));
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [passed, setPassed] = useState(false);

  const handleAnswer = (optionIndex: number) => {
    if (showResults) return;
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
        <Badge variant="secondary">
          {isEs ? `Aprobación: ${PASSING_SCORE}%` : `Pass: ${PASSING_SCORE}%`}
        </Badge>
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
