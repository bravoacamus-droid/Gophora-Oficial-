-- Battle-tested community prompts: schema + seed catalogue.
-- (1) academy_shared_prompts: extra columns to tie a prompt to a tool/skill
--     and mark official seeded prompts.
-- (2) prompt_usage: append-only log of every "Copy & Open" interaction.
--     mission_assignment_id is set when the explorer is using the prompt
--     inside a specific mission, so we can compute approval-rate.
-- (3) shared_prompt_stats: view that exposes total uses, copies and an
--     approval-rate percentage (only meaningful once a prompt has at least
--     3 in-mission uses) so the UI can render the public Battle-tested
--     badge without doing the join itself.
-- (4) Seed: 32 official prompts authored by GOPHORA Team across all six
--     mission skills. Re-applying the migration first deletes officials
--     and re-inserts so edits to the seed sync cleanly.

ALTER TABLE public.academy_shared_prompts
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.academy_shared_prompts
  ADD COLUMN IF NOT EXISTS tool_id uuid REFERENCES public.academy_tools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS skill text,
  ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS title_es text,
  ADD COLUMN IF NOT EXISTS content_es text;

CREATE INDEX IF NOT EXISTS academy_shared_prompts_skill_idx ON public.academy_shared_prompts (skill);
CREATE INDEX IF NOT EXISTS academy_shared_prompts_tool_idx ON public.academy_shared_prompts (tool_id);

CREATE TABLE IF NOT EXISTS public.prompt_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.academy_shared_prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_assignment_id uuid NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prompt_usage_prompt_idx ON public.prompt_usage (prompt_id);
CREATE INDEX IF NOT EXISTS prompt_usage_user_idx ON public.prompt_usage (user_id);
CREATE INDEX IF NOT EXISTS prompt_usage_assignment_idx ON public.prompt_usage (mission_assignment_id) WHERE mission_assignment_id IS NOT NULL;

ALTER TABLE public.prompt_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users record own prompt usage"            ON public.prompt_usage;
DROP POLICY IF EXISTS "Anyone authenticated can read prompt usage" ON public.prompt_usage;

CREATE POLICY "Users record own prompt usage"
  ON public.prompt_usage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone authenticated can read prompt usage"
  ON public.prompt_usage
  FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE VIEW public.shared_prompt_stats
WITH (security_invoker = true)
AS
SELECT
  sp.id AS prompt_id,
  COUNT(pu.id)::int AS total_uses,
  COUNT(pu.id) FILTER (WHERE pu.mission_assignment_id IS NULL)::int AS copy_count,
  COUNT(pu.id) FILTER (WHERE pu.mission_assignment_id IS NOT NULL)::int AS mission_uses,
  COUNT(pu.id) FILTER (
    WHERE pu.mission_assignment_id IS NOT NULL
      AND ma.status IN ('approved', 'completed', 'funds_released')
  )::int AS approved_uses,
  CASE WHEN COUNT(pu.id) FILTER (WHERE pu.mission_assignment_id IS NOT NULL) >= 3 THEN
    ROUND(100.0 * COUNT(pu.id) FILTER (
      WHERE pu.mission_assignment_id IS NOT NULL
        AND ma.status IN ('approved', 'completed', 'funds_released')
    ) / NULLIF(COUNT(pu.id) FILTER (WHERE pu.mission_assignment_id IS NOT NULL), 0))::int
  ELSE NULL END AS approval_rate
FROM public.academy_shared_prompts sp
LEFT JOIN public.prompt_usage pu ON pu.prompt_id = sp.id
LEFT JOIN public.mission_assignments ma ON ma.id = pu.mission_assignment_id
GROUP BY sp.id;

GRANT SELECT ON public.shared_prompt_stats TO authenticated;

DELETE FROM public.academy_shared_prompts WHERE is_official = true;

INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Calendario editorial 30 dias', 'Actua como Content Strategist senior. Voy a darte el contexto de mi marca y necesito un calendario editorial de 30 dias para [RED SOCIAL: Instagram/LinkedIn/X].

Marca: [NOMBRE]
Industria: [INDUSTRIA]
Tono: [CASUAL/PROFESIONAL/JUVENIL/etc]
Audiencia: [DESCRIPCION]
Objetivo: [LEADS/AWARENESS/VENTAS]

Devolveme una tabla con:
- Dia | Formato (post/reel/carrusel) | Hook (<=8 palabras) | CTA | Hashtags
- Distribuye asi: 40% educativo, 30% inspiracional, 20% promocional, 10% comunidad.
- Empieza ya, sin preambulos.', 'marketing', 'Marketing', t.id, true FROM public.academy_tools t WHERE t.name = 'OpenAI (ChatGPT API)';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Email de seguimiento de venta', 'Escribi un email de seguimiento para un prospect que recibio mi propuesta hace 5 dias y no respondio.

Producto/servicio: [DESCRIBIR]
Pain point del prospect: [PAIN]
Tono: profesional pero humano, no robotico
Largo: 4-6 lineas maximo
Objetivo: que responda con si, no, o "necesito mas tiempo"

Cierra con UNA pregunta directa, no con "quedo atento". Sin emojis.', 'marketing', 'Marketing', t.id, true FROM public.academy_tools t WHERE t.name = 'OpenAI (ChatGPT API)';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Descripciones de producto e-commerce (3 versiones)', 'Genera 3 descripciones distintas para este producto:

Producto: [NOMBRE]
Caracteristicas: [LISTA]
Beneficio principal: [BENEFICIO]
Audiencia: [PERFIL]

Version 1: feature-focused (que es)
Version 2: benefit-focused (que resuelve)
Version 3: storytelling (como cambia la vida)

Cada una: <=80 palabras, primera linea bien punchy, sin cliches ("revolucionario", "el mejor del mercado", etc).', 'marketing', 'Marketing', t.id, true FROM public.academy_tools t WHERE t.name = 'Copy.ai';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Jingle/musica para anuncio de marca', 'Upbeat 30-second jingle for [BRAND], style of [REFERENCE: synthwave/lofi/reggaeton/indie pop], lyrics in [Spanish/English] mentioning "[KEY MESSAGE]". Female vocal, catchy chorus that repeats the brand name twice.', 'marketing', 'Marketing', t.id, true FROM public.academy_tools t WHERE t.name = 'Suno';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Voiceover 60s para video corto', 'Guion de voiceover de 60 segundos para video de [INSTAGRAM/TIKTOK/YOUTUBE].

Producto: [QUE VENDES]
Angulo: [PROBLEMA/SOLUCION/CASO DE USO]
Tono: [URGENTE/CONFIABLE/DIVERTIDO]

Estructura:
- Segundos 0-3: hook que detenga el scroll
- Segundos 3-25: problema + agitacion
- Segundos 25-50: solucion y prueba
- Segundos 50-60: CTA claro

Devolve solo el texto en una linea por frase, sin marcas de tiempo. Frases cortas, ritmo rapido.', 'marketing', 'Marketing', t.id, true FROM public.academy_tools t WHERE t.name = 'ElevenLabs';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Analisis de competencia + angulos diferenciadores', 'Analiza los 3 competidores principales de mi marca y devolve 5 angulos de comunicacion que ELLOS no estan explotando y yo SI podria.

Mi marca: [DESCRIPCION + URL]
Competidores: [URLS o nombres]

Para cada angulo dame:
- Insight (1 linea)
- Por que los competidores no lo usan (1 linea)
- Como lo activaria yo en mensaje (1 frase tipo headline)

Formato tabla. Sin filler.', 'marketing', 'Marketing', t.id, true FROM public.academy_tools t WHERE t.name = 'Anthropic Claude';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Boilerplate de feature en stack moderno', 'Necesito implementar [FEATURE] en [STACK: React+Vite+Supabase / Next.js+tRPC / etc].

Comportamiento esperado:
- [CASO DE USO 1]
- [CASO DE USO 2]
- [EDGE CASE]

Stack actual:
- [PEGAR package.json relevante]

Devolveme:
1. Schema de DB necesario (si aplica)
2. Cliente: estructura del componente + hook
3. Server: endpoint o RPC
4. Test cases minimos

Codigo en TypeScript estricto, sin any. Comentarios solo para "porques" no obvios.', 'coding', 'Web Development', t.id, true FROM public.academy_tools t WHERE t.name = 'OpenAI (ChatGPT API)';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Refactor de funcion + tests con vitest', 'Voy a pegarte una funcion JS/TS que necesita refactor. Quiero que:

1. Listes los 3 problemas mas graves del codigo actual
2. Devuelvas la version refactorizada
3. Agregues tests con vitest cubriendo los casos edge
4. Expliques en 2 frases que cambio y por que

Codigo:
[PEGAR CODIGO]', 'coding', 'Web Development', t.id, true FROM public.academy_tools t WHERE t.name = 'Anthropic Claude';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Schema SQL + RLS para una feature', 'Disena el schema Postgres + RLS policies para esta feature:

Feature: [DESCRIPCION]
Reglas de acceso:
- [ROL 1]: puede [ACCIONES]
- [ROL 2]: puede [ACCIONES]

Devolve:
1. CREATE TABLE statements (con FKs y constraints)
2. CREATE INDEX para queries previstas
3. CREATE POLICY para INSERT, SELECT, UPDATE, DELETE
4. Una query de ejemplo usando .from().select() de supabase-js que demuestre el caso happy path

Escribilo todo como migration lista para correr.', 'coding', 'Web Development', t.id, true FROM public.academy_tools t WHERE t.name = 'Anthropic Claude';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Diagnosticar bug a partir del stack trace', 'Tengo este error y no se que lo causa. Diagnostica la causa raiz, no parches superficiales.

Stack: [STACK]
Accion del usuario que lo dispara: [ACCION]
Error completo:
[ERROR + STACK TRACE]

Codigo relevante:
[CODE SNIPPET]

Devolve:
1. Causa raiz en 1-2 frases
2. Por que el error aparece JUSTO en este punto
3. Fix concreto (no "intenta esto")
4. Como verificar que el fix realmente funciono', 'coding', 'Web Development', t.id, true FROM public.academy_tools t WHERE t.name = 'OpenAI (ChatGPT API)';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Generar imagen via API de Replicate (Flux)', 'Run flux-1.1-pro on Replicate with this prompt:

"[DESCRIBE THE IMAGE: subject, lighting, style, composition]"

Settings:
- aspect_ratio: 16:9 (or 1:1 / 9:16)
- output_format: webp
- safety_tolerance: 5
- prompt_upsampling: true

Need code in TypeScript/JS to call /v1/predictions, poll until succeeded, return the output URL.', 'coding', 'Web Development', t.id, true FROM public.academy_tools t WHERE t.name = 'Replicate';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Edge Function de Supabase con AI tool calling', 'Escribi una Supabase Edge Function en Deno/TypeScript que:

1. Recibe [INPUT]
2. Llama a [GROQ/OPENAI/ANTHROPIC] con tool calling estricto
3. Valida la respuesta contra schema [DESCRIBIR]
4. Devuelve [OUTPUT] en JSON

Sigue el patron: serve(async (req) => ...), corsHeaders, autenticacion via getUser(). Si no autenticado, 401.

Si la AI no usa el tool, devolve 500 con error claro. No inventes fallbacks.', 'coding', 'Web Development', t.id, true FROM public.academy_tools t WHERE t.name = 'Supabase';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Hero shot cinematografico para landing', 'Cinematic photo, [SUBJECT] in [CONTEXT], soft golden-hour lighting from the [LEFT/RIGHT], shallow depth of field, 35mm film grain, [COLOR PALETTE: warm earthy / cool tech / vibrant] mood, --ar 16:9 --v 6 --style raw

Negative: text, watermark, logo, low resolution, deformed, cartoon, oversaturated.', 'creative', 'Design', t.id, true FROM public.academy_tools t WHERE t.name = 'Stability AI';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Foto de producto fondo limpio', 'Studio product shot of [PRODUCT], floating slightly above a [SURFACE: matte concrete / wood / pastel paper], even softbox lighting from above, no shadows on background, hyper-detailed, commercial advertising quality, 4K.

Despues de generar: pasala por Remove.bg API para PNG con fondo transparente listo para layout.', 'creative', 'Design', t.id, true FROM public.academy_tools t WHERE t.name = 'Stability AI';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Carrusel Instagram 10 slides', 'Generate 10 image prompts for an Instagram carousel about [TOPIC].

Style guide:
- Color palette: [HEX1, HEX2, HEX3]
- Typography vibe: [BOLD SANS / EDITORIAL / HANDWRITTEN]
- Aspect ratio: 1:1 (1080x1080)

For each slide give me:
- Slide number + role (hook / problem / solution / proof / CTA / etc)
- Image prompt for Stable Diffusion
- Headline overlay text (<=6 words)
- Body overlay text (<=14 words)', 'creative', 'Design', t.id, true FROM public.academy_tools t WHERE t.name = 'Stability AI';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Conceptos de logo en 4 estilos', 'Logo design for [BRAND NAME], industry [INDUSTRY]. Create 4 variations:

1. Wordmark only (typography-focused)
2. Combination mark (icon + text)
3. Abstract symbol
4. Letterform monogram

Style: [MINIMAL / GEOMETRIC / ORGANIC / RETRO]. Vector look, clean lines, scalable. Black on white, then suggest 2-color palettes that work.

Output format: square 1024x1024 each.', 'creative', 'Design', t.id, true FROM public.academy_tools t WHERE t.name = 'Stability AI';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Wireframe de flujo UX (descripcion + imagen)', 'Describi frame por frame el flujo de [FEATURE: signup / checkout / dashboard] para una app movil iOS.

Para cada pantalla:
- Nombre + proposito
- Layout (top->bottom): que hay en cada zona
- Elementos interactivos (botones, inputs) con sus labels exactos
- Accion que dispara el siguiente frame

Devolve en formato markdown numerado. Lo paso a Figma o uso Stability con prompt como "iOS app wireframe of [SCREEN], minimal black on white, 9:16".', 'creative', 'Design', t.id, true FROM public.academy_tools t WHERE t.name = 'Anthropic Claude';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Investigacion de mercado via Google Search', 'Necesito relevar el mercado de [PRODUCTO/SERVICIO] en [PAIS/CIUDAD].

Querys de Google a correr en SerpAPI:
1. "[PRODUCTO] precios [PAIS]"
2. "[PRODUCTO] reviews"
3. "alternativas a [COMPETIDOR PRINCIPAL]"
4. "[NICHE] estadisticas 2026"

Para cada query devolve:
- Top 10 resultados organicos (URL + titulo + snippet)
- Featured snippets
- Related questions

Despues agrupa insights en una tabla: precio promedio, marcas dominantes, gaps detectados, oportunidades.', 'general', 'Data', t.id, true FROM public.academy_tools t WHERE t.name = 'SerpAPI';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Scraping de leads de LinkedIn', 'Use the Apify Actor "linkedin-profile-scraper" with these inputs:

- Search URL: [PEGAR URL DE BUSQUEDA LINKEDIN con filtros aplicados]
- Max results: [50/100/500]
- Include: name, headline, current company, location, profile URL

Schedule it to run [ONCE / DAILY / WEEKLY] and push results to:
- Airtable base [BASE_ID] table "Leads"

After scraping, dedupe by profile URL and tag each row with source = "[CAMPAIGN NAME]".', 'general', 'Data', t.id, true FROM public.academy_tools t WHERE t.name = 'Apify';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Limpiar CSV/Excel desordenado', 'Voy a pegarte un CSV con errores: columnas mal alineadas, duplicados, formatos mixtos.

Necesito:
1. Lista de los 5 problemas mas graves del archivo (con ejemplos de filas concretas)
2. CSV limpio (mismo schema, datos normalizados)
3. Cuantas filas tuviste que descartar y por que

CSV:
[PEGAR CSV]', 'general', 'Data', t.id, true FROM public.academy_tools t WHERE t.name = 'OpenAI (ChatGPT API)';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Dashboard de KPIs en Airtable', 'Disena un base de Airtable para trackear KPIs de [NEGOCIO/AREA].

KPIs principales: [LISTA]
Frecuencia: [DIARIA/SEMANAL/MENSUAL]
Quien carga la data: [PERSONAS/AUTOMATIZACION]

Devolve:
- Schema de tablas (Tables) con sus campos (Fields) y tipos
- 3 Views utiles (filtradas/agrupadas) con su logica
- 1 Automation propuesta (ej. "si KPI X cae 20%, mandar email a Y")
- Formula de Airtable para calcular [FORMULA: tendencia, % cambio, etc]', 'general', 'Data', t.id, true FROM public.academy_tools t WHERE t.name = 'Airtable';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Analisis estadistico basico', 'Voy a pegarte una tabla y necesito analisis basico:

Datos:
[PEGAR TABLA]

Devolve:
1. Estadisticos descriptivos (media, mediana, std, min, max) por columna numerica
2. Outliers detectados (z-score > 2.5)
3. Correlaciones notables entre columnas (>0.5 o <-0.5)
4. 3 hallazgos accionables que harias con esto

Mostra los calculos en una tabla, no en texto corrido.', 'general', 'Data', t.id, true FROM public.academy_tools t WHERE t.name = 'OpenAI (ChatGPT API)';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Resumen ejecutivo de PDF largo', 'Pegate este PDF de [N] paginas y devolveme:

1. TL;DR en 5 vinetas (<=14 palabras cada una)
2. 3 hallazgos sorpresivos o contraintuitivos del documento
3. 5 quotes textuales mas importantes (con numero de pagina)
4. Lista de tareas accionables si yo fuera [ROL: founder/marketer/dev/analista]
5. Que falta o que dudas dejo el documento

Se critico. Si el documento contradice partes propias o tiene gaps logicos, marcalo.

[PEGAR TEXTO O ATTACH]', 'general', 'Research', t.id, true FROM public.academy_tools t WHERE t.name = 'Anthropic Claude';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Comparar 5 fuentes sobre un tema', 'Subi 5 fuentes (PDFs, links, papers) sobre [TEMA] y necesito:

1. Tabla comparando que dice cada fuente sobre [PREGUNTAS CLAVE]
2. Puntos de acuerdo entre todas
3. Contradicciones explicitas (con citas)
4. Que fuente es la mas confiable y por que (autor/recencia/metodologia)
5. Sintesis final en 1 parrafo

Despues pedi el "Audio Overview" para escuchar mientras trabajas.', 'general', 'Research', t.id, true FROM public.academy_tools t WHERE t.name = 'NotebookLM';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Estado del arte / literature review', 'Hace un review del estado del arte sobre [TEMA].

Acotar la busqueda a:
- Ultimos [N] anos
- Idiomas: [ES/EN]
- Fuentes: [PAPERS / NEWS / BLOG TECNICOS]

Devolve:
1. Las 5-7 publicaciones mas relevantes (autor, ano, titulo, link)
2. Las 3 corrientes/escuelas principales en debate
3. Consenso establecido vs zonas de discusion activa
4. Que pregunta NO esta resuelta y seria un buen angulo de investigacion nueva

Sin inventar referencias. Si no estas seguro, dilo.', 'general', 'Research', t.id, true FROM public.academy_tools t WHERE t.name = 'Anthropic Claude';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Insights de entrevista cualitativa', 'Te paso la transcripcion de una entrevista de [DURACION] con [PERFIL DEL ENTREVISTADO].

Necesito:
1. 5 quotes textuales que mejor capturan su perspectiva
2. 3 jobs-to-be-done implicitos (que intenta resolver, no que pide)
3. 2 pain points especificos con evidencia textual
4. 1 oportunidad de producto que se desprende
5. Lo que el entrevistado no dijo pero esta implicito

Si decis algo que no esta en la transcripcion, marcalo como [INFERENCIA]. No inventes data.

[PEGAR TRANSCRIPCION]', 'general', 'Research', t.id, true FROM public.academy_tools t WHERE t.name = 'Anthropic Claude';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Buscador semantico sobre tu propia data', 'Tengo [N] documentos (FAQs, tickets de soporte, documentacion interna) y quiero un buscador semantico.

Pasos con Cohere:
1. Generar embeddings con /embed (model: embed-multilingual-v3.0, input_type: search_document)
2. Guardar en Postgres con pgvector (columna vector(1024))
3. Para cada query del usuario, embedding con input_type: search_query
4. Cosine similarity: SELECT ... ORDER BY embedding <=> query_embedding LIMIT 5
5. Pasar los top 5 a Claude con prompt: "Responde usando SOLO estas fuentes:..."

Devolveme el script de seed inicial + endpoint /search con autenticacion.', 'general', 'Research', t.id, true FROM public.academy_tools t WHERE t.name = 'Cohere';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Buyer personas detalladas (4 arquetipos)', 'A partir de esta info del negocio, genera 4 buyer personas detalladas.

Negocio: [DESCRIPCION]
Producto/servicio: [DETALLE]
Mercado: [GEO + INDUSTRIA + TAMANO]

Para cada persona:
- Nombre + foto-arquetipo + edad + cargo + ingresos
- Dia en su vida (3 momentos)
- Job-to-be-done (que contrata a tu producto a hacer)
- Que consume (medios, redes, eventos, autores)
- Anti-objeciones mas comunes
- Mensaje exacto que la convenceria (1 headline + 1 subline)

Diferencia las 4 por motivacion, no por demografia. Una buyer persona "cuarentona" no significa nada util.', 'general', 'Research', t.id, true FROM public.academy_tools t WHERE t.name = 'Anthropic Claude';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Workflow Zapier: form -> CRM -> email', 'Configura un Zap con estos pasos:

Trigger: [FORM TOOL: Typeform/Tally/Google Forms] - new submission
Filter: only if "intent" field equals "interested" or "demo"
Step 1: Create or update record in [CRM: Hubspot/Pipedrive/Notion] with form data
Step 2: Send Slack message to #sales channel with submission summary
Step 3: Send personalized email via [Gmail/SendGrid] with template "[TEMPLATE NAME]"
Step 4: Add to Mailchimp list "[LIST]" with tag "[CAMPAIGN]"

Pegale al Zap test con un submission real antes de activar. Si algun step falla, configura retry exponencial.', 'automation', 'Operations', t.id, true FROM public.academy_tools t WHERE t.name = 'Zapier';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Make scenario: monitoreo + alertas', 'Build a Make scenario that:

1. Trigger: HTTP Webhook every [INTERVAL]
2. HTTP module: GET [API ENDPOINT] (your monitoring data)
3. JSON parse the response
4. Iterator: for each item check if [METRIC] crosses [THRESHOLD]
5. Filter: only items where condition is true
6. Aggregator: bundle all alerts in one message
7. Slack/Discord/Email module: send the bundle

Add error handler that posts to a dead-letter Slack channel if any step fails. Use the "Use data store" module to dedupe alerts so you don''t spam if a metric stays out for hours.', 'automation', 'Operations', t.id, true FROM public.academy_tools t WHERE t.name = 'Make (Integromat)';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'SOP automatizado en Notion', 'Genera un Standard Operating Procedure para [PROCESO: onboarding cliente / cierre de mes / publicacion contenido / etc].

Estructura del SOP:
- Owner (rol responsable)
- Trigger (que inicia el proceso)
- Pasos numerados (cada uno: accion + input requerido + tool + output)
- Definition of Done (como se que termino bien)
- Escalacion (que hago si algo falla en step X)
- Frecuencia + tiempo estimado
- Metricas de exito

Una vez generado, sugeri que pasos podrian automatizarse con Zapier/Make y cuales necesitan juicio humano.', 'automation', 'Operations', t.id, true FROM public.academy_tools t WHERE t.name = 'Notion AI';
INSERT INTO public.academy_shared_prompts (user_id, title, content, category, skill, tool_id, is_official) SELECT NULL, 'Reuniones cortas: agenda + minute', 'Voy a tener una reunion de [DURACION] sobre [TEMA] con [PARTICIPANTES y roles].

Antes:
1. Agenda con timeboxes (cada item: tiempo, owner, decision esperada)
2. 5 preguntas que cada participante deberia traer respondidas
3. Pre-read minimo (que docs deben leer antes)

Despues de pasarte el audio/transcripcion:
1. Decisiones tomadas (con quien las propuso)
2. Action items (assignee + deadline)
3. Temas pateados a proxima reunion
4. Discusiones que NO llegaron a decision y por que

Tono: ejecutivo, directo, sin filler.', 'automation', 'Operations', t.id, true FROM public.academy_tools t WHERE t.name = 'OpenAI (ChatGPT API)';