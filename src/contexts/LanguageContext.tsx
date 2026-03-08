import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'; // v2

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Nav
  'nav.home': { en: 'Home', es: 'Inicio' },
  'nav.dashboard': { en: 'Dashboard', es: 'Panel' },
  'nav.marketplace': { en: 'Marketplace', es: 'Mercado' },
  'nav.projects': { en: 'Projects', es: 'Proyectos' },
  'nav.admin': { en: 'Admin', es: 'Admin' },
  'nav.login': { en: 'Log In', es: 'Iniciar Sesión' },
  'nav.register': { en: 'Register', es: 'Registrarse' },
  'nav.logout': { en: 'Log Out', es: 'Cerrar Sesión' },
  'nav.about': { en: 'About', es: 'Nosotros' },
  'nav.faq': { en: 'FAQ', es: 'FAQ' },
  'nav.organizations': { en: 'Organizations', es: 'Organizaciones' },

  // Landing - Hero
  'landing.hero.title1': { en: 'Execution at the speed of', es: 'Ejecución a la velocidad de la' },
  'landing.hero.title2': { en: 'intent', es: 'intención' },
  'landing.hero.subtitle': { en: 'Turn complex projects into structured missions and get measurable outcomes in under 72 hours.', es: 'Convierte proyectos complejos en misiones estructuradas y obtén resultados medibles en menos de 72 horas.' },
  'landing.hero.tagline': { en: 'GOPHORA is the execution layer for modern companies.', es: 'GOPHORA es la capa de ejecución para empresas modernas.' },
  'landing.hero.cta_start': { en: 'Start executing', es: 'Empieza a ejecutar' },
  'landing.hero.cta_demo': { en: 'Book a demo', es: 'Agenda un demo' },

  // Landing - Execution Gap
  'landing.gap.badge': { en: 'Category Statement', es: 'Declaración de Categoría' },
  'landing.gap.title': { en: 'The execution gap', es: 'La brecha de ejecución' },
  'landing.gap.ideas': { en: 'Ideas move instantly.', es: 'Las ideas se mueven al instante.' },
  'landing.gap.execution': { en: "Execution doesn't.", es: 'La ejecución no.' },
  'landing.gap.teams': { en: 'Teams spend weeks coordinating work that should take days.', es: 'Los equipos pasan semanas coordinando trabajo que debería tomar días.' },
  'landing.gap.meetings': { en: 'Meetings multiply.', es: 'Las reuniones se multiplican.' },
  'landing.gap.freelancers': { en: 'Freelancers fragment.', es: 'Los freelancers fragmentan.' },
  'landing.gap.projects': { en: 'Projects stall.', es: 'Los proyectos se estancan.' },
  'landing.gap.not_talent': { en: "The problem isn't talent.", es: 'El problema no es el talento.' },
  'landing.gap.coordination': { en: "It's coordination.", es: 'Es la coordinación.' },

  // Landing - The Shift
  'landing.shift.badge': { en: 'The Shift', es: 'El Cambio' },
  'landing.shift.title': { en: 'Work is changing', es: 'El trabajo está cambiando' },
  'landing.shift.old_label': { en: 'The old model', es: 'El modelo antiguo' },
  'landing.shift.old_desc': { en: 'Hire more people → manage more tasks →', es: 'Contratar más personas → gestionar más tareas →' },
  'landing.shift.old_result': { en: 'move slowly.', es: 'moverse lento.' },
  'landing.shift.new_label': { en: 'The new model', es: 'El nuevo modelo' },
  'landing.shift.new_desc': { en: 'Define outcomes → activate talent →', es: 'Definir resultados → activar talento →' },
  'landing.shift.new_result': { en: 'execute instantly.', es: 'ejecutar al instante.' },
  'landing.shift.powers': { en: 'GOPHORA powers this shift.', es: 'GOPHORA impulsa este cambio.' },

  // Landing - Product
  'landing.product.badge': { en: 'Product', es: 'Producto' },
  'landing.product.title': { en: 'From project to outcome', es: 'De proyecto a resultado' },
  'landing.product.desc': { en: 'GOPHORA converts complex work into structured missions and orchestrates execution across global talent.', es: 'GOPHORA convierte trabajo complejo en misiones estructuradas y orquesta la ejecución con talento global.' },
  'landing.product.no_hiring': { en: 'No hiring.', es: 'Sin contrataciones.' },
  'landing.product.no_chaos': { en: 'No coordination chaos.', es: 'Sin caos de coordinación.' },
  'landing.product.outcome': { en: 'Just completed outcomes.', es: 'Solo resultados completados.' },

  // Landing - How it Works
  'landing.how.badge': { en: 'How It Works', es: 'Cómo Funciona' },
  'landing.how.title': { en: 'Four steps to execution', es: 'Cuatro pasos hacia la ejecución' },
  'landing.steps.1.title': { en: 'Submit the outcome', es: 'Envía el resultado esperado' },
  'landing.steps.1.desc': { en: 'Describe what needs to be done.', es: 'Describe lo que necesita hacerse.' },
  'landing.steps.2.title': { en: 'Missions are generated', es: 'Se generan las misiones' },
  'landing.steps.2.desc': { en: 'Our system decomposes projects into executable units.', es: 'Nuestro sistema descompone proyectos en unidades ejecutables.' },
  'landing.steps.3.title': { en: 'Execution begins instantly', es: 'La ejecución comienza al instante' },
  'landing.steps.3.desc': { en: 'Specialized talent completes missions with defined deliverables.', es: 'Talento especializado completa misiones con entregables definidos.' },
  'landing.steps.4.title': { en: 'Results delivered', es: 'Resultados entregados' },
  'landing.steps.4.desc': { en: 'Most projects complete in under 72 hours.', es: 'La mayoría de proyectos se completan en menos de 72 horas.' },

  // Landing - Benefits
  'landing.benefits.badge': { en: 'Product Benefits', es: 'Beneficios del Producto' },
  'landing.benefits.title': { en: 'Why companies choose GOPHORA', es: 'Por qué las empresas eligen GOPHORA' },
  'landing.benefits.speed.title': { en: 'Faster execution', es: 'Ejecución más rápida' },
  'landing.benefits.speed.desc': { en: 'Projects completed in days, not weeks.', es: 'Proyectos completados en días, no semanas.' },
  'landing.benefits.scale.title': { en: 'Scalable operations', es: 'Operaciones escalables' },
  'landing.benefits.scale.desc': { en: 'Handle more work without increasing payroll.', es: 'Maneja más trabajo sin aumentar la nómina.' },
  'landing.benefits.structure.title': { en: 'Structured delivery', es: 'Entrega estructurada' },
  'landing.benefits.structure.desc': { en: 'Clear outputs. Clear accountability.', es: 'Entregables claros. Responsabilidad clara.' },
  'landing.benefits.global.title': { en: 'Global talent activation', es: 'Activación de talento global' },
  'landing.benefits.global.desc': { en: 'Access specialized execution instantly.', es: 'Accede a ejecución especializada al instante.' },

  // Landing - Real Example
  'landing.example.badge': { en: 'Real Example', es: 'Ejemplo Real' },
  'landing.example.title': { en: 'Marketing campaign execution', es: 'Ejecución de campaña de marketing' },
  'landing.example.traditional_label': { en: 'Traditional agency workflow', es: 'Flujo de agencia tradicional' },
  'landing.example.trad1': { en: 'Recruit freelancers', es: 'Reclutar freelancers' },
  'landing.example.trad2': { en: 'Coordinate tasks', es: 'Coordinar tareas' },
  'landing.example.trad3': { en: 'Review iterations', es: 'Revisar iteraciones' },
  'landing.example.trad4': { en: 'Launch in weeks', es: 'Lanzar en semanas' },
  'landing.example.gophora_label': { en: 'Using GOPHORA', es: 'Usando GOPHORA' },
  'landing.example.gophora1': { en: 'Project decomposed into missions.', es: 'Proyecto descompuesto en misiones.' },
  'landing.example.gophora2': { en: 'Design. Copy. Ads. Analytics.', es: 'Diseño. Copy. Ads. Analytics.' },
  'landing.example.gophora3': { en: 'Completed in 72 hours.', es: 'Completado en 72 horas.' },

  // Landing - Traction
  'landing.traction.badge': { en: 'Traction', es: 'Tracción' },
  'landing.traction.title': { en: 'Execution infrastructure is already working.', es: 'La infraestructura de ejecución ya está funcionando.' },
  'landing.traction.since': { en: 'Since January 2026', es: 'Desde enero 2026' },
  'landing.traction.processed': { en: 'Services processed', es: 'Servicios procesados' },
  'landing.traction.revenue': { en: 'Revenue generated', es: 'Ingresos generados' },
  'landing.traction.projects': { en: 'Projects completed', es: 'Proyectos completados' },
  'landing.traction.agencies': { en: 'Agencies actively using GOPHORA', es: 'Agencias usando GOPHORA activamente' },

  // Landing - Why GOPHORA
  'landing.why.badge': { en: 'Why GOPHORA', es: 'Por Qué GOPHORA' },
  'landing.why.organize': { en: 'Most platforms organize work.', es: 'La mayoría de plataformas organizan trabajo.' },
  'landing.why.completes': { en: 'completes', es: 'completa' },
  'landing.why.work': { en: 'work.', es: 'el trabajo.' },
  'landing.why.difference': { en: 'That difference changes everything.', es: 'Esa diferencia lo cambia todo.' },

  // Landing - The Future
  'landing.future.badge': { en: 'The Future', es: 'El Futuro' },
  'landing.future.line1': { en: "The next generation of companies won't scale by hiring more people.", es: 'La próxima generación de empresas no escalará contratando más personas.' },
  'landing.future.line2_pre': { en: 'They will scale by', es: 'Escalarán' },
  'landing.future.line2_highlight': { en: 'activating execution.', es: 'activando la ejecución.' },
  'landing.future.line3': { en: 'GOPHORA is building the infrastructure that makes this possible.', es: 'GOPHORA está construyendo la infraestructura que lo hace posible.' },

  // Landing - Final CTA
  'landing.cta.title': { en: 'Start executing faster', es: 'Empieza a ejecutar más rápido' },
  'landing.cta.desc': { en: 'Submit your first project and experience structured execution.', es: 'Envía tu primer proyecto y experimenta la ejecución estructurada.' },
  'landing.cta.start': { en: 'Start your first mission', es: 'Inicia tu primera misión' },
  'landing.cta.demo': { en: 'Book a demo', es: 'Agenda un demo' },

  // Landing - Footer
  'landing.footer.tagline': { en: 'Execution infrastructure for the modern economy', es: 'Infraestructura de ejecución para la economía moderna' },
  'landing.footer.rights': { en: 'All rights reserved.', es: 'Todos los derechos reservados.' },

  // About page
  'about.badge': { en: 'About GOPHORA', es: 'Sobre GOPHORA' },
  'about.title': { en: 'The Human Activation Infrastructure', es: 'La Infraestructura de Activación Humana' },
  'about.desc': { en: 'We are building the counterforce to purposeless automation. An infrastructure that preserves what makes us fundamentally human: the ability to explore, decide, and contribute.', es: 'Estamos construyendo la contrafuerza a la automatización sin propósito. Una infraestructura que preserva lo que nos hace fundamentalmente humanos: la capacidad de explorar, decidir y contribuir.' },
  'about.mission.title': { en: 'Our Mission', es: 'Nuestra Misión' },
  'about.mission.desc': { en: 'To activate human potential in the age of automation, ensuring that technology amplifies rather than replaces human relevance.', es: 'Activar el potencial humano en la era de la automatización, asegurando que la tecnología amplifique en vez de reemplazar la relevancia humana.' },
  'about.vision.title': { en: 'Our Vision', es: 'Nuestra Visión' },
  'about.vision.desc': { en: 'A world where every person has the opportunity to be activated—to contribute meaningfully through purpose-driven missions.', es: 'Un mundo donde cada persona tenga la oportunidad de ser activada—de contribuir significativamente a través de misiones con propósito.' },
  'about.values.title': { en: 'Our Values', es: 'Nuestros Valores' },
  'about.values.desc': { en: 'Human-first design, transparent reputation, purposeful contribution, and resistance against deactivation.', es: 'Diseño centrado en el humano, reputación transparente, contribución con propósito y resistencia contra la desactivación.' },
  'about.community.title': { en: 'Our Community', es: 'Nuestra Comunidad' },
  'about.community.desc': { en: 'A global network of explorers, companies, and builders committed to keeping humans at the center of the future of work.', es: 'Una red global de exploradores, empresas y constructores comprometidos a mantener a los humanos en el centro del futuro del trabajo.' },
  'about.cta': { en: 'Join the Movement', es: 'Únete al Movimiento' },

  // FAQ page
  'faq.title': { en: 'Frequently Asked Questions', es: 'Preguntas Frecuentes' },
  'faq.subtitle': { en: 'Everything you need to know about GOPHORA.', es: 'Todo lo que necesitas saber sobre GOPHORA.' },
  'faq.q1': { en: 'What is GOPHORA?', es: '¿Qué es GOPHORA?' },
  'faq.a1': { en: 'GOPHORA is a Human Activation Infrastructure. We connect organizations with global talent through purpose-driven micro-missions, powered by Visnity AI. Instead of replacing humans, we activate them.', es: 'GOPHORA es una Infraestructura de Activación Humana. Conectamos organizaciones con talento global a través de micro-misiones con propósito, potenciadas por Visnity AI. En vez de reemplazar humanos, los activamos.' },
  'faq.q2': { en: 'What is an Explorer?', es: '¿Qué es un Explorer?' },
  'faq.a2': { en: 'An Explorer is anyone who contributes to missions on GOPHORA. You don\'t need credentials—just your human signal. Complete missions, earn PHORA tokens, and build your on-chain reputation.', es: 'Un Explorer es cualquier persona que contribuye a misiones en GOPHORA. No necesitas credenciales, solo tu señal humana. Completa misiones, gana tokens PHORA y construye tu reputación on-chain.' },
  'faq.q3': { en: 'What is Visnity AI?', es: '¿Qué es Visnity AI?' },
  'faq.a3': { en: 'Visnity AI is our Human Activation Layer. It detects latent talent, guides humans toward impactful missions, and protects the human signal from exploitation. It supports decisions—it doesn\'t make them.', es: 'Visnity AI es nuestra Capa de Activación Humana. Detecta talento latente, guía a humanos hacia misiones de impacto y protege la señal humana de la explotación. Apoya decisiones, no las toma.' },
  'faq.q4': { en: 'What is the PHORA token?', es: '¿Qué es el token PHORA?' },
  'faq.a4': { en: 'PHORA is not a currency—it\'s evidence. It\'s earned by executing real missions, not by speculation. It represents your human impact, contribution, and on-chain reputation.', es: 'PHORA no es una moneda, es evidencia. Se gana ejecutando misiones reales, no por especulación. Representa tu impacto humano, contribución y reputación on-chain.' },
  'faq.q5': { en: 'How do companies use GOPHORA?', es: '¿Cómo usan las empresas GOPHORA?' },
  'faq.a5': { en: 'Companies create projects, and our AI divides them into executable micro-missions. Global talent activates, executes, and delivers. Results are integrated automatically. It\'s 10x faster than traditional hiring.', es: 'Las empresas crean proyectos y nuestra IA los divide en micro-misiones ejecutables. Talento global se activa, ejecuta y entrega. Los resultados se integran automáticamente. Es 10x más rápido que la contratación tradicional.' },
  'faq.q6': { en: 'How do I earn money?', es: '¿Cómo gano dinero?' },
  'faq.a6': { en: 'Complete missions and earn rewards in USD. You can also accumulate PHORA tokens that represent your activation history and reputation on the platform.', es: 'Completa misiones y gana recompensas en USD. También acumulas tokens PHORA que representan tu historial de activación y reputación en la plataforma.' },
  'faq.q7': { en: 'Is GOPHORA free to use?', es: '¿Es gratis usar GOPHORA?' },
  'faq.a7': { en: 'Explorers join for free. Companies pay only for the missions that get executed. No subscriptions, no hidden fees—just value for impact.', es: 'Los Explorers se unen gratis. Las empresas pagan solo por las misiones ejecutadas. Sin suscripciones, sin cargos ocultos—solo valor por impacto.' },
  'faq.q8': { en: 'How is this different from Fiverr or Upwork?', es: '¿En qué se diferencia de Fiverr o Upwork?' },
  'faq.a8': { en: 'We don\'t sell freelancers. We activate humans. GOPHORA uses AI to divide complex projects into micro-missions, matches them with the right human signals, and builds transparent, portable reputation. It\'s a new economic model.', es: 'No vendemos freelancers. Activamos humanos. GOPHORA usa IA para dividir proyectos complejos en micro-misiones, los conecta con las señales humanas correctas y construye reputación transparente y portátil. Es un nuevo modelo económico.' },

  // Organizations page
  'org.badge': { en: 'For Organizations', es: 'Para Organizaciones' },
  'org.title': { en: 'Activate Global Talent for Your Projects', es: 'Activa Talento Global para Tus Proyectos' },
  'org.desc': { en: 'Launch projects, divide them into AI-powered micro-missions, and let activated explorers deliver results at unprecedented speed.', es: 'Lanza proyectos, divídelos en micro-misiones potenciadas por IA, y deja que exploradores activados entreguen resultados a velocidad sin precedentes.' },
  'org.benefit1.title': { en: '10x Faster Execution', es: 'Ejecución 10x Más Rápida' },
  'org.benefit1.desc': { en: 'AI breaks down your project into parallel micro-missions executed simultaneously by global talent.', es: 'La IA divide tu proyecto en micro-misiones paralelas ejecutadas simultáneamente por talento global.' },
  'org.benefit2.title': { en: 'Transparent Metrics', es: 'Métricas Transparentes' },
  'org.benefit2.desc': { en: 'Real-time dashboards show progress, quality, and budget usage for every mission.', es: 'Dashboards en tiempo real muestran progreso, calidad y uso de presupuesto para cada misión.' },
  'org.benefit3.title': { en: 'Quality Assurance', es: 'Aseguramiento de Calidad' },
  'org.benefit3.desc': { en: 'AI-powered review and integration ensures consistent, high-quality deliverables.', es: 'Revisión e integración potenciada por IA asegura entregables consistentes y de alta calidad.' },
  'org.benefit4.title': { en: 'Enterprise Ready', es: 'Listo para Empresas' },
  'org.benefit4.desc': { en: 'Secure infrastructure, admin controls, and payment management built for scale.', es: 'Infraestructura segura, controles administrativos y gestión de pagos construidos para escalar.' },
  'org.cta': { en: 'Launch Your First Mission', es: 'Lanza Tu Primera Misión' },

  // Auth
  'auth.login': { en: 'Log In', es: 'Iniciar Sesión' },
  'auth.register': { en: 'Create Account', es: 'Crear Cuenta' },
  'auth.email': { en: 'Email', es: 'Correo Electrónico' },
  'auth.password': { en: 'Password', es: 'Contraseña' },
  'auth.confirm_password': { en: 'Confirm Password', es: 'Confirmar Contraseña' },
  'auth.account_type': { en: 'Account Type', es: 'Tipo de Cuenta' },
  'auth.company': { en: 'Company', es: 'Empresa' },
  'auth.explorer': { en: 'Explorer', es: 'Explorer' },
  'auth.no_account': { en: "Don't have an account?", es: '¿No tienes cuenta?' },
  'auth.have_account': { en: 'Already have an account?', es: '¿Ya tienes cuenta?' },
  'auth.welcome_back': { en: 'Welcome back to', es: 'Bienvenido de nuevo a' },
  'auth.join': { en: 'Join', es: 'Únete a' },

  // Company Dashboard
  'company.title': { en: 'Company Dashboard', es: 'Panel de Empresa' },
  'company.active_projects': { en: 'Active Projects', es: 'Proyectos Activos' },
  'company.missions_progress': { en: 'Missions in Progress', es: 'Misiones en Progreso' },
  'company.completed': { en: 'Completed Missions', es: 'Misiones Completadas' },
  'company.budget': { en: 'Budget Usage', es: 'Uso de Presupuesto' },
  'company.create_project': { en: 'Create New Project', es: 'Crear Nuevo Proyecto' },

  // Explorer Dashboard
  'explorer.title': { en: 'Explorer Dashboard', es: 'Panel de Explorer' },
  'explorer.available': { en: 'Available Missions', es: 'Misiones Disponibles' },
  'explorer.in_progress': { en: 'Missions in Progress', es: 'Misiones en Progreso' },
  'explorer.completed': { en: 'Missions Completed', es: 'Misiones Completadas' },
  'explorer.earnings': { en: 'Earnings', es: 'Ganancias' },
  'explorer.level': { en: 'Explorer Level', es: 'Nivel de Explorer' },
  'explorer.browse': { en: 'Browse Missions', es: 'Explorar Misiones' },

  // Marketplace
  'marketplace.title': { en: 'Immediate Opportunity Horizon', es: 'Horizonte de Oportunidad Inmediata' },
  'marketplace.subtitle': { en: 'The following missions are filtered by Visnity AI to match your skills.', es: 'Las siguientes son misiones filtradas por Visnity AI que coinciden con tus habilidades.' },
  'marketplace.apply': { en: 'Activate Mission', es: 'Activar Misión' },
  'marketplace.skill': { en: 'Skill', es: 'Habilidad' },
  'marketplace.reward': { en: 'Reward', es: 'Recompensa' },
  'marketplace.time': { en: 'Est. Time', es: 'Tiempo Est.' },
  'marketplace.client': { en: 'Client', es: 'Cliente' },
  'marketplace.filter_skill': { en: 'Filter by Skill', es: 'Filtrar por Habilidad' },
  'marketplace.filter_reward': { en: 'Filter by Reward', es: 'Filtrar por Recompensa' },

  // Project Creation
  'project.create_title': { en: 'Create New Project', es: 'Crear Nuevo Proyecto' },
  'project.title': { en: 'Project Title', es: 'Título del Proyecto' },
  'project.description': { en: 'Project Description', es: 'Descripción del Proyecto' },
  'project.category': { en: 'Category', es: 'Categoría' },
  'project.deadline': { en: 'Deadline', es: 'Fecha Límite' },
  'project.budget': { en: 'Budget (USD)', es: 'Presupuesto (USD)' },
  'project.priority': { en: 'Priority', es: 'Prioridad' },
  'project.files': { en: 'File Upload', es: 'Subir Archivos' },
  'project.analyze': { en: 'Analyze Project with AI', es: 'Analizar Proyecto con IA' },

  // Admin
  'admin.title': { en: 'Admin Panel', es: 'Panel de Administración' },
  'admin.users': { en: 'Users', es: 'Usuarios' },
  'admin.companies': { en: 'Companies', es: 'Empresas' },
  'admin.projects': { en: 'Projects', es: 'Proyectos' },
  'admin.missions': { en: 'Missions', es: 'Misiones' },
  'admin.revenue': { en: 'Revenue Metrics', es: 'Métricas de Ingresos' },

  // Common
  'common.all': { en: 'All', es: 'Todos' },
  'common.search': { en: 'Search...', es: 'Buscar...' },
  'common.status': { en: 'Status', es: 'Estado' },
  'common.actions': { en: 'Actions', es: 'Acciones' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('gophora-lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('gophora-lang', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
