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

  // Landing
  'landing.title': { en: 'Execute Projects', es: 'Ejecuta Proyectos' },
  'landing.title2': { en: '10x Faster', es: '10x Más Rápido' },
  'landing.subtitle': { en: 'Divide projects into AI-powered micro-missions. Activate global talent. Integrate results automatically.', es: 'Divide proyectos en micro-misiones potenciadas por IA. Activa talento global. Integra resultados automáticamente.' },
  'landing.cta.company': { en: 'Start as Company', es: 'Comenzar como Empresa' },
  'landing.cta.explorer': { en: 'Join as Explorer', es: 'Unirse como Explorer' },
  'landing.stats.projects': { en: 'Projects Delivered', es: 'Proyectos Entregados' },
  'landing.stats.missions': { en: 'Missions Completed', es: 'Misiones Completadas' },
  'landing.stats.explorers': { en: 'Global Explorers', es: 'Explorers Globales' },
  'landing.stats.faster': { en: 'Faster Execution', es: 'Ejecución Más Rápida' },

  // How it works
  'how.title': { en: 'How It Works', es: 'Cómo Funciona' },
  'how.step1.title': { en: 'Create Project', es: 'Crear Proyecto' },
  'how.step1.desc': { en: 'Define your project scope, budget, and timeline.', es: 'Define el alcance, presupuesto y cronograma de tu proyecto.' },
  'how.step2.title': { en: 'AI Analyzes', es: 'IA Analiza' },
  'how.step2.desc': { en: 'Our AI divides your project into executable micro-missions.', es: 'Nuestra IA divide tu proyecto en micro-misiones ejecutables.' },
  'how.step3.title': { en: 'Talent Executes', es: 'Talento Ejecuta' },
  'how.step3.desc': { en: 'Global talent picks and completes missions in parallel.', es: 'Talento global selecciona y completa misiones en paralelo.' },
  'how.step4.title': { en: 'AI Integrates', es: 'IA Integra' },
  'how.step4.desc': { en: 'Results are automatically integrated into your final deliverable.', es: 'Los resultados se integran automáticamente en tu entregable final.' },

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
  'marketplace.subtitle': { en: 'Find and apply to missions that match your skills', es: 'Encuentra y postúlate a misiones que coincidan con tus habilidades' },
  'marketplace.apply': { en: 'Apply to Mission', es: 'Postularse a Misión' },
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
