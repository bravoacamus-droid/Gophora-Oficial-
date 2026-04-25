-- Toolkit recommendations + usage tracking + quick-start tutorials
-- (1) academy_tools: relevant_skills + quick_start columns
-- (2) tool_usage: append-only log of when an explorer interacts with a tool
-- (3) UPDATEs to populate relevant_skills and quick_start for the seeded catalogue.

ALTER TABLE public.academy_tools ADD COLUMN IF NOT EXISTS relevant_skills text[] DEFAULT '{}';
ALTER TABLE public.academy_tools ADD COLUMN IF NOT EXISTS quick_start text;
ALTER TABLE public.academy_tools ADD COLUMN IF NOT EXISTS quick_start_es text;

CREATE TABLE IF NOT EXISTS public.tool_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.academy_tools(id) ON DELETE CASCADE,
  mission_id uuid NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_usage_user_idx ON public.tool_usage (user_id);
CREATE INDEX IF NOT EXISTS tool_usage_tool_idx ON public.tool_usage (tool_id);
CREATE INDEX IF NOT EXISTS tool_usage_used_at_idx ON public.tool_usage (used_at DESC);

ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can record their own tool usage" ON public.tool_usage;
DROP POLICY IF EXISTS "Users can read their own tool usage"   ON public.tool_usage;
DROP POLICY IF EXISTS "Admins read all tool usage"            ON public.tool_usage;

CREATE POLICY "Users can record their own tool usage"
  ON public.tool_usage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own tool usage"
  ON public.tool_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all tool usage"
  ON public.tool_usage
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));


-- Populate relevant_skills + quick_start for each seeded tool
UPDATE public.academy_tools SET relevant_skills = ARRAY['Marketing', 'Web Development', 'Research', 'Operations']::text[], quick_start = '1) Sign up at platform.openai.com 2) Generate an API key in Settings -> API keys 3) Test in the Playground, then call /chat/completions. Recommended model: gpt-4o-mini.', quick_start_es = '1) Crea cuenta en platform.openai.com 2) Genera tu API key en Settings -> API keys 3) Prueba el Playground, luego llama a /chat/completions. Modelo sugerido: gpt-4o-mini.' WHERE name = 'OpenAI (ChatGPT API)';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Research', 'Web Development', 'Operations']::text[], quick_start = '1) Sign up at console.anthropic.com 2) Get your API key under Settings -> API keys 3) POST to /v1/messages with claude-sonnet-4-5. Up to 200K tokens of context.', quick_start_es = '1) Registrate en console.anthropic.com 2) Obten tu API key en Settings -> API keys 3) POST a /v1/messages con claude-sonnet-4-5. Hasta 200K tokens de contexto.' WHERE name = 'Anthropic Claude';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Research', 'Marketing', 'Web Development', 'Design']::text[], quick_start = '1) Open ai.google.dev and click ''Get API key'' 2) Test in Google AI Studio 3) Call generativelanguage.googleapis.com with gemini-1.5-pro. Multimodal in one call.', quick_start_es = '1) Abre ai.google.dev y click en ''Get API key'' 2) Prueba en Google AI Studio 3) Llama a generativelanguage.googleapis.com con gemini-1.5-pro. Multimodal en una llamada.' WHERE name = 'Google Gemini';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Web Development', 'Research']::text[], quick_start = '1) Sign up at cohere.com 2) Grab the API key from your dashboard 3) Use /generate for text or /embed for embeddings. Perfect for internal search or RAG systems.', quick_start_es = '1) Registrate en cohere.com 2) Toma tu API key del dashboard 3) Usa /generate para texto o /embed para embeddings. Ideal para buscadores internos o RAG.' WHERE name = 'Cohere';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Marketing']::text[], quick_start = '1) Create account at writesonic.com 2) Use the dashboard for one-off copy or request API access for automation 3) Best for ads, blog intros, product descriptions.', quick_start_es = '1) Crea cuenta en writesonic.com 2) Usa el dashboard para copy rapido o pide acceso a la API para automatizar 3) Ideal para ads, intros de blog, descripciones de producto.' WHERE name = 'Writesonic';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Marketing']::text[], quick_start = '1) Sign up at copy.ai 2) Pick a template (social, email, ads) 3) Generate variants in seconds. Free tier covers most one-off needs.', quick_start_es = '1) Registrate en copy.ai 2) Elige un template (social, email, ads) 3) Genera variantes en segundos. El plan gratis cubre la mayoria de los casos.' WHERE name = 'Copy.ai';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Design', 'Marketing']::text[], quick_start = '1) Get API key at platform.stability.ai 2) Try /v2beta/stable-image/generate/sd3 3) Use prompts like ''cinematic photo of...'' for branding shots.', quick_start_es = '1) Obten tu API key en platform.stability.ai 2) Prueba /v2beta/stable-image/generate/sd3 3) Usa prompts tipo ''cinematic photo of...'' para shots de branding.' WHERE name = 'Stability AI';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Design', 'Web Development']::text[], quick_start = '1) Sign in at replicate.com 2) Browse the model library (Flux, Whisper, MusicGen, etc.) 3) Each model has copy-paste code in Python/JS. Pay-per-second.', quick_start_es = '1) Inicia sesion en replicate.com 2) Explora la libreria de modelos (Flux, Whisper, MusicGen, etc.) 3) Cada modelo tiene codigo copy-paste en Python/JS. Pago por segundo.' WHERE name = 'Replicate';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Design', 'Marketing']::text[], quick_start = '1) Get API key at remove.bg/api 2) POST your image to /v1.0/removebg 3) Receive PNG with transparent background. 50 free credits per month.', quick_start_es = '1) Obten tu API key en remove.bg/api 2) POST tu imagen a /v1.0/removebg 3) Recibe PNG con fondo transparente. 50 creditos gratis al mes.' WHERE name = 'Remove.bg';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Design', 'Marketing']::text[], quick_start = '1) Sign up at photoroom.com 2) Try the templates for product shots 3) For batch processing, request API access. Perfect for e-commerce listings.', quick_start_es = '1) Registrate en photoroom.com 2) Prueba los templates para fotos de producto 3) Para procesar en lote pedi acceso a la API. Perfecto para listados de e-commerce.' WHERE name = 'Photoroom';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Design', 'Marketing']::text[], quick_start = '1) Open app.runwayml.com 2) Pick a tool: Gen-3 (text to video), Image to video, or in-painting 3) Export MP4 up to 4K. Credit-based pricing.', quick_start_es = '1) Abre app.runwayml.com 2) Elige una herramienta: Gen-3 (texto a video), Imagen a video, o inpainting 3) Exporta MP4 hasta 4K. Pricing por creditos.' WHERE name = 'Runway';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Marketing']::text[], quick_start = '1) Sign up at elevenlabs.io 2) Pick or clone a voice 3) Generate audio via dashboard or POST text to /v1/text-to-speech/{voice_id}. Free tier: 10K chars/month.', quick_start_es = '1) Registrate en elevenlabs.io 2) Elige o clona una voz 3) Genera audio en el dashboard o POST texto a /v1/text-to-speech/{voice_id}. Plan gratis: 10K caracteres/mes.' WHERE name = 'ElevenLabs';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Research', 'Operations']::text[], quick_start = '1) Get API key at assemblyai.com 2) POST audio file URL to /v2/transcript 3) Poll the transcript_id until complete. Speaker detection and translation included.', quick_start_es = '1) Obten tu API key en assemblyai.com 2) POST URL del audio a /v2/transcript 3) Hace polling al transcript_id hasta que termine. Incluye deteccion de hablantes y traduccion.' WHERE name = 'AssemblyAI';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Marketing']::text[], quick_start = '1) Sign up at suno.com 2) Type a prompt like ''upbeat 30s jingle for tech startup'' 3) Download MP3. Perfect for ads, intros, jingles.', quick_start_es = '1) Registrate en suno.com 2) Escribi un prompt tipo ''upbeat 30s jingle for tech startup'' 3) Descarga el MP3. Ideal para ads, intros, jingles.' WHERE name = 'Suno';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Marketing', 'Operations']::text[], quick_start = '1) Sign up at tavus.io 2) Record a 2-minute training video of yourself 3) Use the API to generate personalized videos with names/data per recipient.', quick_start_es = '1) Registrate en tavus.io 2) Graba un video de 2 minutos entrenando tu modelo 3) Usa la API para generar videos personalizados con nombre/data por destinatario.' WHERE name = 'Tavus';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Web Development']::text[], quick_start = '1) Already powering GOPHORA — connect via the existing supabase client 2) Use auth.signInWithPassword and .from(''table'').select() patterns 3) Edge Functions for any custom logic.', quick_start_es = '1) Ya potencia GOPHORA — conecta usando el cliente supabase existente 2) Usa los patrones auth.signInWithPassword y .from(''tabla'').select() 3) Edge Functions para logica custom.' WHERE name = 'Supabase';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Operations', 'Marketing']::text[], quick_start = '1) Sign in at zapier.com 2) Pick a Trigger app (e.g. Gmail) and an Action app (e.g. Notion) 3) Map the fields. Free tier: 100 tasks/month.', quick_start_es = '1) Inicia sesion en zapier.com 2) Elige una app Trigger (ej. Gmail) y una app Action (ej. Notion) 3) Mapea los campos. Plan gratis: 100 tareas al mes.' WHERE name = 'Zapier';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Operations']::text[], quick_start = '1) Sign up at make.com 2) Build scenarios with branches, filters and aggregators 3) More flexible than Zapier for complex flows. Free tier: 1000 ops/month.', quick_start_es = '1) Registrate en make.com 2) Arma escenarios con bifurcaciones, filtros y agregadores 3) Mas flexible que Zapier para flujos complejos. Plan gratis: 1000 operaciones al mes.' WHERE name = 'Make (Integromat)';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Data', 'Research']::text[], quick_start = '1) Get API key at serpapi.com 2) Hit /search?q=<query>&engine=google 3) Returns parsed Google results as JSON. 100 free searches per month.', quick_start_es = '1) Obten tu API key en serpapi.com 2) Llama /search?q=<query>&engine=google 3) Devuelve los resultados de Google parseados como JSON. 100 busquedas gratis al mes.' WHERE name = 'SerpAPI';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Data', 'Research']::text[], quick_start = '1) Open apify.com 2) Pick a pre-built Actor (Twitter, LinkedIn, Amazon scrapers) 3) Run it via API or schedule. Pay per compute unit.', quick_start_es = '1) Abre apify.com 2) Elige un Actor pre-armado (scrapers de Twitter, LinkedIn, Amazon) 3) Ejecuta via API o programa. Pago por unidad de computo.' WHERE name = 'Apify';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Research', 'Operations']::text[], quick_start = '1) Activate Notion AI on any page (Cmd+J or Space) 2) Use slash commands: /summarize, /translate, /brainstorm 3) Best inside an existing Notion workspace.', quick_start_es = '1) Activa Notion AI en cualquier pagina (Cmd+J o Espacio) 2) Usa los slash commands: /summarize, /translate, /brainstorm 3) Lo mejor dentro de un workspace Notion existente.' WHERE name = 'Notion AI';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Operations', 'Data']::text[], quick_start = '1) Sign up at airtable.com 2) Create a base with views (grid, kanban, calendar) 3) Use the REST API at api.airtable.com/v0/{base}/{table} for automation.', quick_start_es = '1) Registrate en airtable.com 2) Crea una base con vistas (grid, kanban, calendario) 3) Usa la API REST en api.airtable.com/v0/{base}/{tabla} para automatizar.' WHERE name = 'Airtable';
UPDATE public.academy_tools SET relevant_skills = ARRAY['Research']::text[], quick_start = '1) Open notebooklm.google.com 2) Upload up to 50 sources (PDFs, links, docs) 3) Ask questions, generate audio overviews, get summaries. Citations inline.', quick_start_es = '1) Abre notebooklm.google.com 2) Sube hasta 50 fuentes (PDFs, links, docs) 3) Hace preguntas, genera audio overviews, obtene resumenes. Las fuentes se citan inline.' WHERE name = 'NotebookLM';
