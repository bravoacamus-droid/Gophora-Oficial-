-- Seed academy_tools with the GOPHORA AI Toolkit catalogue.
-- Idempotent: adds a unique constraint on `name` if missing, then upserts each
-- row so re-running this migration just refreshes copy/url/icon without
-- duplicating entries. Categories used by the Toolkit tab filter:
--   general / copy / design / video / automation / data / productivity
-- Icons must match the iconMap in src/pages/AcademyDashboard.tsx
-- (Brain, Zap, Bot, PenTool, FileText, Image, Code, Palette, Video,
--  MessageSquare, GitBranch, Workflow, Search, BookOpen, Briefcase).

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_tools_name_unique') THEN
    ALTER TABLE public.academy_tools ADD CONSTRAINT academy_tools_name_unique UNIQUE (name);
  END IF;
END
$do$;

INSERT INTO public.academy_tools (name, description, description_es, category, url, icon, use_cases, use_cases_es) VALUES
  ('OpenAI (ChatGPT API)', 'Text generation, deep analysis and AI assistants — the swiss-army knife.', 'Generación de texto, análisis profundo y asistentes IA — la navaja suiza.', 'general', 'https://platform.openai.com/', 'Bot', ARRAY['Writing','Customer support','Automation'], ARRAY['Redacción','Atención al cliente','Automatización']),
  ('Anthropic Claude', 'Best for long documents, deep reasoning and nuanced analysis.', 'Ideal para documentos largos, razonamiento profundo y análisis matizado.', 'general', 'https://www.anthropic.com/api', 'Brain', ARRAY['Contracts','Reports','Research'], ARRAY['Contratos','Reportes','Investigación']),
  ('Google Gemini', 'Multimodal model (text, image, video) integrated with the Google ecosystem.', 'Modelo multimodal (texto, imagen, video) integrado con el ecosistema Google.', 'general', 'https://ai.google.dev/', 'Zap', ARRAY['Multimodal','Google Workspace','Complex tasks'], ARRAY['Multimodal','Google Workspace','Tareas complejas']),
  ('Cohere', 'Text generation plus embeddings — great for internal search engines.', 'Generación de texto y embeddings — excelente para buscadores internos.', 'copy', 'https://cohere.com/', 'PenTool', ARRAY['Embeddings','Search','Generation'], ARRAY['Embeddings','Búsqueda','Generación']),
  ('Writesonic', 'Fast marketing copy with API access for automated generation.', 'Copy de marketing rápido con API para generación automatizada.', 'copy', 'https://writesonic.com/', 'FileText', ARRAY['Marketing copy','Ads','Blog'], ARRAY['Copy marketing','Ads','Blog']),
  ('Copy.ai', 'Content in seconds for marketing, social and sales.', 'Contenido en segundos para marketing, redes y ventas.', 'copy', 'https://www.copy.ai/', 'PenTool', ARRAY['Social','Sales','Email'], ARRAY['Redes','Ventas','Email']),
  ('Stability AI', 'Stable Diffusion API — image generation for branding and social.', 'API de Stable Diffusion — generación de imágenes para branding y redes.', 'design', 'https://platform.stability.ai/', 'Image', ARRAY['Branding','Social media','Quick design'], ARRAY['Branding','Redes','Diseño rápido']),
  ('Replicate', 'Marketplace of AI models (image, audio, video) accessible via simple API.', 'Marketplace de modelos IA (imagen, audio, video) con API simple.', 'design', 'https://replicate.com/', 'Code', ARRAY['Open models','Image','Audio','Video'], ARRAY['Modelos abiertos','Imagen','Audio','Video']),
  ('Remove.bg', 'Automatic background removal — perfect for fast design jobs.', 'Quita fondos automáticamente — ideal para diseños rápidos.', 'design', 'https://www.remove.bg/api', 'Palette', ARRAY['Background removal','Product shots'], ARRAY['Quitar fondo','Producto']),
  ('Photoroom', 'Express design tool for e-commerce listings and product photos.', 'Diseño express para listados de e-commerce y fotos de producto.', 'design', 'https://www.photoroom.com/api', 'Palette', ARRAY['E-commerce','Photos','Design'], ARRAY['E-commerce','Fotos','Diseño']),
  ('Runway', 'AI video generation and editing — high-value for video missions.', 'Generación y edición de video con IA — alto valor para misiones de video.', 'video', 'https://runwayml.com/', 'Video', ARRAY['Video gen','Editing','Effects'], ARRAY['Generación','Edición','Efectos']),
  ('ElevenLabs', 'Realistic AI voice generation for voiceovers and ads.', 'Generación de voz realista para locuciones y anuncios.', 'video', 'https://elevenlabs.io/', 'MessageSquare', ARRAY['Voiceovers','Ads','Audiobooks'], ARRAY['Locución','Anuncios','Audiolibros']),
  ('AssemblyAI', 'Audio transcription — perfect for interviews, content and support.', 'Transcripción de audio — ideal para entrevistas, contenido y soporte.', 'video', 'https://www.assemblyai.com/', 'MessageSquare', ARRAY['Transcripts','Interviews','Support'], ARRAY['Transcripciones','Entrevistas','Soporte']),
  ('Suno', 'AI music generation — original soundtracks in seconds.', 'Generación musical con IA — bandas sonoras originales en segundos.', 'video', 'https://suno.com/', 'Video', ARRAY['Music','Soundtracks','Jingles'], ARRAY['Música','Bandas sonoras','Jingles']),
  ('Tavus', 'Personalized AI video at scale — perfect for outreach campaigns.', 'Video personalizado con IA a escala — ideal para campañas de outreach.', 'video', 'https://www.tavus.io/', 'Video', ARRAY['Personalized video','Sales outreach','Campaigns'], ARRAY['Video personalizado','Outreach','Campañas']),
  ('Supabase', 'Backend, Postgres database and auth — already powering GOPHORA.', 'Backend, base Postgres y autenticación — ya potencia GOPHORA.', 'automation', 'https://supabase.com/', 'GitBranch', ARRAY['Database','Auth','Backend'], ARRAY['Base de datos','Auth','Backend']),
  ('Zapier', 'No-code automation — connects thousands of apps in minutes.', 'Automatización sin código — conecta miles de apps en minutos.', 'automation', 'https://zapier.com/', 'Workflow', ARRAY['No-code','Integrations','Workflow'], ARRAY['Sin código','Integraciones','Flujo']),
  ('Make (Integromat)', 'Advanced automation flows when Zapier falls short.', 'Automatizaciones complejas cuando Zapier se queda corto.', 'automation', 'https://www.make.com/', 'Workflow', ARRAY['Advanced flows','Branching','Webhooks'], ARRAY['Flujos avanzados','Bifurcación','Webhooks']),
  ('SerpAPI', 'Pulls Google results programmatically — perfect for research missions.', 'Extrae resultados de Google programáticamente — ideal para investigación.', 'data', 'https://serpapi.com/', 'Search', ARRAY['Google scraping','SEO','Research'], ARRAY['Scraping Google','SEO','Investigación']),
  ('Apify', 'Automated web scraping at scale.', 'Scraping web automatizado a escala.', 'data', 'https://apify.com/', 'Search', ARRAY['Web scraping','Crawling','Data collection'], ARRAY['Scraping','Crawling','Recolección de datos']),
  ('Notion AI', 'Organize, write and generate content inside your knowledge base.', 'Organiza, escribe y genera contenido dentro de tu base de conocimiento.', 'productivity', 'https://www.notion.so/product/ai', 'BookOpen', ARRAY['Notes','Wiki','Writing'], ARRAY['Notas','Wiki','Redacción']),
  ('Airtable', 'Smart databases with light automation — flexible spreadsheet-meets-database.', 'Bases de datos inteligentes con automatización ligera.', 'productivity', 'https://airtable.com/', 'Briefcase', ARRAY['Database','Spreadsheet','Light automation'], ARRAY['Base de datos','Hoja de cálculo','Automatización ligera']),
  ('NotebookLM', 'Google research notebook that summarises and connects your sources with AI.', 'Cuaderno de investigación de Google que resume y conecta tus fuentes con IA.', 'productivity', 'https://notebooklm.google.com/', 'BookOpen', ARRAY['Research','Summarisation','Sources'], ARRAY['Investigación','Resumen','Fuentes'])
ON CONFLICT (name) DO UPDATE SET
  description    = EXCLUDED.description,
  description_es = EXCLUDED.description_es,
  category       = EXCLUDED.category,
  url            = EXCLUDED.url,
  icon           = EXCLUDED.icon,
  use_cases      = EXCLUDED.use_cases,
  use_cases_es   = EXCLUDED.use_cases_es;
