import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  'landing.badge': { en: 'The Human Activation Layer', es: 'La Capa de Activación Humana' },
  'landing.hero.line1': { en: 'AI for Human', es: 'IA para la' },
  'landing.hero.line2': { en: 'Activation.', es: 'Activación Humana.' },
  'landing.hero.line3': { en: 'Not for Human Replacement.', es: 'No para el Reemplazo Humano.' },
  'landing.hero.desc': { en: 'Humanity is exploratory by nature, yet we are building a future that optimizes for execution, silently deactivating our impulse to discover, decide, and contribute.', es: 'La humanidad es exploratoria por naturaleza, pero estamos construyendo un futuro que optimiza la ejecución, desactivando silenciosamente nuestro impulso de descubrir, decidir y contribuir.' },
  'landing.hero.choice': { en: 'This is not inevitable. It is a choice.', es: 'Esto no es inevitable. Es una elección.' },
  'landing.hero.cta1': { en: 'Activate Your Human Signal', es: 'Activa Tu Señal Humana' },
  'landing.hero.cta2': { en: 'Already an Explorer', es: 'Ya soy Explorer' },

  // Landing - Silent Erosion
  'landing.erosion.badge': { en: 'The Silent Erosion', es: 'La Erosión Silenciosa' },
  'landing.erosion.title': { en: 'What We Stand to Lose', es: 'Lo Que Estamos Por Perder' },
  'landing.erosion.desc': { en: 'The greatest risk of unchecked automation is not the replacement of jobs, but the subtle erosion of essential human capabilities.', es: 'El mayor riesgo de la automatización sin control no es el reemplazo de empleos, sino la erosión sutil de las capacidades humanas esenciales.' },
  'landing.erosion.initiative.title': { en: 'Initiative', es: 'Iniciativa' },
  'landing.erosion.initiative.desc': { en: 'The impulse to create, replaced by the need to execute.', es: 'El impulso de crear, reemplazado por la necesidad de ejecutar.' },
  'landing.erosion.purpose.title': { en: 'Purpose', es: 'Propósito' },
  'landing.erosion.purpose.desc': { en: 'The drive for meaningful contribution, replaced by empty productivity.', es: 'El impulso de contribuir significativamente, reemplazado por productividad vacía.' },
  'landing.erosion.exploration.title': { en: 'Exploration', es: 'Exploración' },
  'landing.erosion.exploration.desc': { en: 'The instinct for discovery, replaced by predefined paths.', es: 'El instinto de descubrimiento, reemplazado por caminos predefinidos.' },
  'landing.erosion.decision.title': { en: 'Conscious Decision', es: 'Decisión Consciente' },
  'landing.erosion.decision.desc': { en: 'Human judgment, replaced by automated systems.', es: 'El juicio humano, reemplazado por sistemas automatizados.' },
  'landing.erosion.identity.title': { en: 'Identity', es: 'Identidad' },
  'landing.erosion.identity.desc': { en: 'Our value as explorers, reduced to replaceable resources.', es: 'Nuestro valor como exploradores, reducido a recursos reemplazables.' },
  'landing.erosion.agency.title': { en: 'Agency', es: 'Agencia' },
  'landing.erosion.agency.desc': { en: 'Ownership of outcomes, diluted until no one is accountable.', es: 'La propiedad de los resultados, diluida hasta que nadie es responsable.' },
  'landing.erosion.quote': { en: 'Without human activation, automation doesn\'t liberate time. It deactivates purpose.', es: 'Sin activación humana, la automatización no libera tiempo. Desactiva el propósito.' },

  // Landing - Counterforce
  'landing.counterforce.badge': { en: 'The Counterforce', es: 'La Contrafuerza' },
  'landing.counterforce.title': { en: 'An Infrastructure for Human Relevance', es: 'Una Infraestructura para la Relevancia Humana' },
  'landing.counterforce.desc': { en: 'GOPHORA is a Human Activation Infrastructure—a deliberate act of resistance against total, purposeless automation. We are not building another AI to compete with humans; we are building an infrastructure that preserves human relevance.', es: 'GOPHORA es una Infraestructura de Activación Humana—un acto deliberado de resistencia contra la automatización total y sin propósito. No estamos construyendo otra IA para competir con humanos; estamos construyendo una infraestructura que preserva la relevancia humana.' },
  'landing.counterforce.axioms_title': { en: 'Our Axioms of Activation', es: 'Nuestros Axiomas de Activación' },
  'landing.counterforce.axiom1': { en: 'Humanity was never meant to compete with machines. It exists to explore, learn, and contribute.', es: 'La humanidad nunca fue hecha para competir con máquinas. Existe para explorar, aprender y contribuir.' },
  'landing.counterforce.axiom2': { en: 'Automation gains meaning only when humans remain at the center.', es: 'La automatización gana sentido solo cuando los humanos permanecen en el centro.' },
  'landing.counterforce.axiom3': { en: 'Efficiency must never replace meaning.', es: 'La eficiencia nunca debe reemplazar al significado.' },

  // Landing - Visnity AI
  'landing.visnity.title': { en: 'The Human Activation Layer', es: 'La Capa de Activación Humana' },
  'landing.visnity.discovery': { en: 'Detects latent talent and invisible human signals that traditional systems miss.', es: 'Detecta talento latente y señales humanas invisibles que los sistemas tradicionales omiten.' },
  'landing.visnity.direction': { en: 'Guides activated humans toward missions that align with their unique potential.', es: 'Guía a humanos activados hacia misiones que se alinean con su potencial único.' },
  'landing.visnity.decision': { en: 'Supports informed human decisions with contextual intelligence, not automation.', es: 'Apoya decisiones humanas informadas con inteligencia contextual, no automatización.' },
  'landing.visnity.deployment': { en: 'Matches human capability with mission requirements in real time.', es: 'Conecta la capacidad humana con los requisitos de misión en tiempo real.' },
  'landing.visnity.destiny': { en: 'Tracks activation history to build a portable, meaningful reputation.', es: 'Rastrea el historial de activación para construir una reputación portátil y significativa.' },
  'landing.visnity.defense': { en: 'Protects the human signal from exploitation and algorithmic bias.', es: 'Protege la señal humana de la explotación y el sesgo algorítmico.' },

  // Landing - Comparison
  'landing.compare.title': { en: 'Automation Without Direction vs. Activation with Visnity AI', es: 'Automatización Sin Dirección vs. Activación con Visnity AI' },
  'landing.compare.col_without': { en: 'Without Direction', es: 'Sin Dirección' },
  'landing.compare.col_with': { en: 'With Visnity AI', es: 'Con Visnity AI' },
  'landing.compare.without1': { en: 'Mechanical execution', es: 'Ejecución mecánica' },
  'landing.compare.with1': { en: 'Activated initiative', es: 'Iniciativa activada' },
  'landing.compare.without2': { en: 'Empty productivity', es: 'Productividad vacía' },
  'landing.compare.with2': { en: 'Purpose and contribution', es: 'Propósito y contribución' },
  'landing.compare.without3': { en: 'Closed paths', es: 'Caminos cerrados' },
  'landing.compare.with3': { en: 'Guided exploration', es: 'Exploración guiada' },
  'landing.compare.without4': { en: 'Delegated decisions', es: 'Decisiones delegadas' },
  'landing.compare.with4': { en: 'Assisted human decision', es: 'Decisión humana asistida' },
  'landing.compare.without5': { en: 'Replaceable humans', es: 'Humanos reemplazables' },
  'landing.compare.with5': { en: 'Activated humans', es: 'Humanos activados' },
  'landing.compare.without6': { en: 'Efficiency without impact', es: 'Eficiencia sin impacto' },
  'landing.compare.with6': { en: 'Impact with meaning', es: 'Impacto con significado' },

  // Landing - Activation Economy
  'landing.activation.badge': { en: 'From Jobs to Missions', es: 'De Empleos a Misiones' },
  'landing.activation.title': { en: 'The Activation Economy', es: 'La Economía de Activación' },
  'landing.activation.desc': { en: 'GOPHORA is not a job board. It is a system of activation. We are moving beyond resumes, interviews, and gatekeepers toward an open ecosystem of contribution.', es: 'GOPHORA no es una bolsa de trabajo. Es un sistema de activación. Estamos avanzando más allá de currículos, entrevistas y filtros hacia un ecosistema abierto de contribución.' },
  'landing.activation.missions.title': { en: 'Mission-Based Activation', es: 'Activación Basada en Misiones' },
  'landing.activation.missions.desc': { en: 'Purpose-driven, time-bounded missions where human judgment is essential.', es: 'Misiones con propósito y tiempo definido donde el juicio humano es esencial.' },
  'landing.activation.instant.title': { en: 'Instant Participation', es: 'Participación Instantánea' },
  'landing.activation.instant.desc': { en: 'Real-time human signals instead of credentials. No intermediaries.', es: 'Señales humanas en tiempo real en vez de credenciales. Sin intermediarios.' },
  'landing.activation.ai.title': { en: 'Human-Signal AI', es: 'IA de Señal Humana' },
  'landing.activation.ai.desc': { en: 'Visnity AI interprets your potential to direct you toward impactful missions.', es: 'Visnity AI interpreta tu potencial para dirigirte hacia misiones de impacto.' },
  'landing.activation.reputation.title': { en: 'On-Chain Reputation', es: 'Reputación On-Chain' },
  'landing.activation.reputation.desc': { en: 'PHORA token as proof of contribution. Transparent and immutable.', es: 'Token PHORA como prueba de contribución. Transparente e inmutable.' },

  // Landing - PHORA Token
  'landing.phora.title': { en: 'PHORA is not a currency. It\'s evidence.', es: 'PHORA no es una moneda. Es evidencia.' },
  'landing.phora.subtitle': { en: 'A new economic principle for the age of automation.', es: 'Un nuevo principio económico para la era de la automatización.' },
  'landing.phora.point1': { en: 'Earned by executing real missions—not by speculation.', es: 'Ganado ejecutando misiones reales, no por especulación.' },
  'landing.phora.point2': { en: 'Measures human impact and contribution.', es: 'Mide el impacto humano y la contribución.' },
  'landing.phora.point3': { en: 'Portable, global, on-chain reputation.', es: 'Reputación portátil, global y on-chain.' },
  'landing.phora.point4': { en: 'Transparent and immutable proof of activation.', es: 'Prueba transparente e inmutable de activación.' },
  'landing.phora.quote': { en: 'PHORA is earned by being activated, not by being automated.', es: 'PHORA se gana siendo activado, no siendo automatizado.' },

  // Landing - Manifesto
  'landing.manifesto.badge': { en: 'Our Manifesto', es: 'Nuestro Manifiesto' },
  'landing.manifesto.title': { en: 'A Declaration of Presence', es: 'Una Declaración de Presencia' },
  'landing.manifesto.line1': { en: 'The future doesn\'t need more automation.', es: 'El futuro no necesita más automatización.' },
  'landing.manifesto.line2': { en: 'It needs activated humans.', es: 'Necesita humanos activados.' },
  'landing.manifesto.tagline': { en: 'Activate. Contribute. Explore.', es: 'Activa. Contribuye. Explora.' },
  'landing.manifesto.cta_text': { en: 'Join the resistance. Activate your human signal. Earn through contribution.', es: 'Únete a la resistencia. Activa tu señal humana. Gana a través de la contribución.' },

  // Landing - Stats (kept from original)
  'landing.stats.projects': { en: 'Projects Delivered', es: 'Proyectos Entregados' },
  'landing.stats.missions': { en: 'Missions Completed', es: 'Misiones Completadas' },
  'landing.stats.explorers': { en: 'Global Explorers', es: 'Explorers Globales' },
  'landing.stats.faster': { en: 'Faster Execution', es: 'Ejecución Más Rápida' },

  // How it works (kept from original)
  'how.title': { en: 'How It Works', es: 'Cómo Funciona' },
  'how.step1.title': { en: 'Create Project', es: 'Crear Proyecto' },
  'how.step1.desc': { en: 'Define your project scope, budget, and timeline.', es: 'Define el alcance, presupuesto y cronograma de tu proyecto.' },
  'how.step2.title': { en: 'AI Analyzes', es: 'IA Analiza' },
  'how.step2.desc': { en: 'Our AI divides your project into executable micro-missions.', es: 'Nuestra IA divide tu proyecto en micro-misiones ejecutables.' },
  'how.step3.title': { en: 'Talent Executes', es: 'Talento Ejecuta' },
  'how.step3.desc': { en: 'Global talent picks and completes missions in parallel.', es: 'Talento global selecciona y completa misiones en paralelo.' },
  'how.step4.title': { en: 'AI Integrates', es: 'IA Integra' },
  'how.step4.desc': { en: 'Results are automatically integrated into your final deliverable.', es: 'Los resultados se integran automáticamente en tu entregable final.' },

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
  'marketplace.title': { en: 'Mission Marketplace', es: 'Mercado de Misiones' },
  'marketplace.subtitle': { en: 'Find and activate approved missions that match your skills', es: 'Encuentra y activa misiones aprobadas que coincidan con tus habilidades' },
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
