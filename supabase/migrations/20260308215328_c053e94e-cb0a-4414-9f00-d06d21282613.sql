
ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS title_es text,
ADD COLUMN IF NOT EXISTS description_es text;

-- Update existing missions with Spanish translations
UPDATE public.missions SET 
  title_es = 'Investigación de Mercado y Análisis de Competencia',
  description_es = 'Realizar una investigación exhaustiva del mercado y análisis de la competencia para identificar oportunidades, tendencias y posicionamiento estratégico del producto.'
WHERE title = 'Market Research & Competitor Analysis';

UPDATE public.missions SET 
  title_es = 'Estrategia UX y Flujos de Usuario',
  description_es = 'Definir la estrategia de experiencia de usuario, crear mapas de navegación y diseñar los flujos principales de interacción del usuario dentro de la aplicación.'
WHERE title = 'UX Strategy & User Flows';

UPDATE public.missions SET 
  title_es = 'Wireframing de Interfaces Principales',
  description_es = 'Crear wireframes detallados de las interfaces principales de la aplicación, incluyendo pantallas clave, componentes de navegación y estructura de contenido.'
WHERE title = 'Wireframing Main Interfaces';

UPDATE public.missions SET 
  title_es = 'Diseño UI y Prototipado',
  description_es = 'Diseñar la interfaz visual completa de la aplicación con sistema de diseño, componentes reutilizables y prototipos interactivos listos para desarrollo.'
WHERE title = 'UI Design & Prototyping';
