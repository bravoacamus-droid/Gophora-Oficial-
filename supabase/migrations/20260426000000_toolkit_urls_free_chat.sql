-- Update academy_tools URLs to point to the free chat / consumer-facing version
-- of each tool, instead of the API/platform/docs page. Explorers tested on
-- GOPHORA were getting confused when the toolkit sent them to a paid API
-- console — they should land directly in a usable workspace.

UPDATE public.academy_tools SET url = 'https://chatgpt.com/'              WHERE name = 'OpenAI (ChatGPT API)';
UPDATE public.academy_tools SET url = 'https://claude.ai/'                WHERE name = 'Anthropic Claude';
UPDATE public.academy_tools SET url = 'https://gemini.google.com/app'     WHERE name = 'Google Gemini';
UPDATE public.academy_tools SET url = 'https://coral.cohere.com/'         WHERE name = 'Cohere';
UPDATE public.academy_tools SET url = 'https://writesonic.com/'           WHERE name = 'Writesonic';
UPDATE public.academy_tools SET url = 'https://www.copy.ai/'              WHERE name = 'Copy.ai';
UPDATE public.academy_tools SET url = 'https://clipdrop.co/stable-diffusion' WHERE name = 'Stability AI';
UPDATE public.academy_tools SET url = 'https://replicate.com/explore'     WHERE name = 'Replicate';
UPDATE public.academy_tools SET url = 'https://www.remove.bg/'            WHERE name = 'Remove.bg';
UPDATE public.academy_tools SET url = 'https://www.photoroom.com/'        WHERE name = 'Photoroom';
UPDATE public.academy_tools SET url = 'https://app.runwayml.com/'         WHERE name = 'Runway';
UPDATE public.academy_tools SET url = 'https://elevenlabs.io/app'         WHERE name = 'ElevenLabs';
UPDATE public.academy_tools SET url = 'https://www.assemblyai.com/playground' WHERE name = 'AssemblyAI';
UPDATE public.academy_tools SET url = 'https://suno.com/create'           WHERE name = 'Suno';
UPDATE public.academy_tools SET url = 'https://www.tavus.io/'             WHERE name = 'Tavus';
UPDATE public.academy_tools SET url = 'https://supabase.com/dashboard'    WHERE name = 'Supabase';
UPDATE public.academy_tools SET url = 'https://zapier.com/app/dashboard'  WHERE name = 'Zapier';
UPDATE public.academy_tools SET url = 'https://www.make.com/en/login'     WHERE name = 'Make (Integromat)';
UPDATE public.academy_tools SET url = 'https://serpapi.com/playground'    WHERE name = 'SerpAPI';
UPDATE public.academy_tools SET url = 'https://console.apify.com/'        WHERE name = 'Apify';
UPDATE public.academy_tools SET url = 'https://www.notion.so/'            WHERE name = 'Notion AI';
UPDATE public.academy_tools SET url = 'https://www.airtable.com/'         WHERE name = 'Airtable';
UPDATE public.academy_tools SET url = 'https://notebooklm.google.com/'    WHERE name = 'NotebookLM';
