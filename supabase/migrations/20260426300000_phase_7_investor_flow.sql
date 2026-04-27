-- Phase 7: investor flow.
--
-- Companies can flag a project as open to investment, get an AI cost
-- estimate, and pick how much of the budget they want investors to
-- cover. Investors browse those projects and can submit offers; the
-- accepted offer generates a simple equity agreement PDF.
--
-- Equity ladder (fixed by product spec):
--   investor covers 50% of needed budget → 15% equity
--   investor covers 25% of needed budget → 10% equity
--   investor covers 10% of needed budget →  5% equity

------------------------------------------------------------------
-- 1) projects: investor-related columns
------------------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS open_to_investors BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS funding_percent_sought INT,            -- 0..100, % of budget asked from investors
  ADD COLUMN IF NOT EXISTS equity_offered_percent NUMERIC,         -- derived from the ladder
  ADD COLUMN IF NOT EXISTS cost_estimate NUMERIC,                  -- AI quoted cost in USD
  ADD COLUMN IF NOT EXISTS cost_justification TEXT,                -- AI rationale
  ADD COLUMN IF NOT EXISTS industry TEXT;                          -- for filtering

COMMENT ON COLUMN public.projects.open_to_investors IS 'When true, the project shows up in the Investor browse panel.';
COMMENT ON COLUMN public.projects.funding_percent_sought IS '% of budget the company wants covered by investors (10/25/50). Drives equity_offered_percent.';
COMMENT ON COLUMN public.projects.equity_offered_percent IS 'Equity offered to the investor in exchange for funding_percent_sought (5/10/15).';

-- Helper to compute equity from funding %, rounding down to the
-- nearest tier. Useful in client UI and edge functions.
CREATE OR REPLACE FUNCTION public.equity_for_funding_percent(_p INT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _p IS NULL THEN NULL
    WHEN _p >= 50 THEN 15
    WHEN _p >= 25 THEN 10
    WHEN _p >= 10 THEN 5
    ELSE 0
  END;
$$;

------------------------------------------------------------------
-- 2) investor_offers
------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investor_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  investor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd NUMERIC NOT NULL CHECK (amount_usd > 0),
  equity_percent NUMERIC NOT NULL CHECK (equity_percent >= 0 AND equity_percent <= 100),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','withdrawn','signed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  signed_pdf_url TEXT,
  signed_at TIMESTAMPTZ,
  UNIQUE (project_id, investor_user_id, status)
);

CREATE INDEX IF NOT EXISTS investor_offers_project_idx ON public.investor_offers (project_id);
CREATE INDEX IF NOT EXISTS investor_offers_investor_idx ON public.investor_offers (investor_user_id);
CREATE INDEX IF NOT EXISTS investor_offers_status_idx ON public.investor_offers (status);

ALTER TABLE public.investor_offers ENABLE ROW LEVEL SECURITY;

-- Investors can SELECT their own offers
DROP POLICY IF EXISTS "investor_sees_own_offers" ON public.investor_offers;
CREATE POLICY "investor_sees_own_offers"
  ON public.investor_offers FOR SELECT
  USING (investor_user_id = auth.uid());

-- Project owners can SELECT offers on their projects
DROP POLICY IF EXISTS "project_owner_sees_offers" ON public.investor_offers;
CREATE POLICY "project_owner_sees_offers"
  ON public.investor_offers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = investor_offers.project_id AND p.user_id = auth.uid()
  ));

-- Investor can INSERT new offers on open projects (any other auth user)
DROP POLICY IF EXISTS "investor_inserts_offer" ON public.investor_offers;
CREATE POLICY "investor_inserts_offer"
  ON public.investor_offers FOR INSERT
  WITH CHECK (
    investor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.open_to_investors = true
        AND p.user_id <> auth.uid()
    )
  );

-- Investor can UPDATE (withdraw) their own pending offer
DROP POLICY IF EXISTS "investor_updates_own_pending" ON public.investor_offers;
CREATE POLICY "investor_updates_own_pending"
  ON public.investor_offers FOR UPDATE
  USING (investor_user_id = auth.uid() AND status IN ('pending'))
  WITH CHECK (investor_user_id = auth.uid());

-- Project owner can UPDATE status to accepted/declined
DROP POLICY IF EXISTS "owner_reviews_offer" ON public.investor_offers;
CREATE POLICY "owner_reviews_offer"
  ON public.investor_offers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = investor_offers.project_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = investor_offers.project_id AND p.user_id = auth.uid()
  ));

-- Admins see / manage everything
DROP POLICY IF EXISTS "admin_all_offers" ON public.investor_offers;
CREATE POLICY "admin_all_offers"
  ON public.investor_offers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

------------------------------------------------------------------
-- 3) Notifications on offer events
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_investor_offer_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_project_owner UUID;
  v_project_title TEXT;
BEGIN
  SELECT user_id, title INTO v_project_owner, v_project_title
    FROM public.projects WHERE id = NEW.project_id;

  IF TG_OP = 'INSERT' THEN
    -- Notify project owner about new offer
    PERFORM public.notify_user(
      v_project_owner,
      'investor_offer_received',
      'New investor offer 💰',
      'Nueva oferta de inversor 💰',
      '$' || NEW.amount_usd::text || ' for ' || NEW.equity_percent::text || '% equity in ' || v_project_title,
      '$' || NEW.amount_usd::text || ' por ' || NEW.equity_percent::text || '% de equity en ' || v_project_title,
      '/company'
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      PERFORM public.notify_user(
        NEW.investor_user_id,
        'investor_offer_accepted',
        'Your offer was accepted 🤝',
        'Tu oferta fue aceptada 🤝',
        v_project_title,
        v_project_title,
        '/invest'
      );
    ELSIF NEW.status = 'declined' THEN
      PERFORM public.notify_user(
        NEW.investor_user_id,
        'investor_offer_declined',
        'Your offer was declined',
        'Tu oferta fue rechazada',
        v_project_title,
        v_project_title,
        '/invest'
      );
    ELSIF NEW.status = 'signed' THEN
      PERFORM public.notify_user(
        v_project_owner,
        'investor_agreement_signed',
        'Investor agreement signed ✍️',
        'Acuerdo de inversor firmado ✍️',
        v_project_title,
        v_project_title,
        '/company'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS investor_offer_notify_trigger ON public.investor_offers;
CREATE TRIGGER investor_offer_notify_trigger
  AFTER INSERT OR UPDATE ON public.investor_offers
  FOR EACH ROW EXECUTE FUNCTION public.tg_investor_offer_notify();

------------------------------------------------------------------
-- 4) Storage bucket for signed agreements (private)
------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('investor-agreements', 'investor-agreements', false, 5 * 1024 * 1024)
ON CONFLICT (id) DO NOTHING;

-- Investor can upload to their own folder; project owner can view; admin all
DROP POLICY IF EXISTS "investor_uploads_agreement" ON storage.objects;
CREATE POLICY "investor_uploads_agreement"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'investor-agreements'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "investor_reads_own_agreement" ON storage.objects;
CREATE POLICY "investor_reads_own_agreement"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'investor-agreements'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.investor_offers io
        JOIN public.projects p ON p.id = io.project_id
        WHERE io.signed_pdf_url LIKE '%' || name || '%'
          AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      )
    )
  );
