CREATE TABLE IF NOT EXISTS public.visitor_stats (
  id integer PRIMARY KEY DEFAULT 1,
  total_visits bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visitor_stats_singleton CHECK (id = 1)
);

INSERT INTO public.visitor_stats (id, total_visits) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.visitor_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitor_stats_select_all" ON public.visitor_stats;
CREATE POLICY "visitor_stats_select_all" ON public.visitor_stats
  FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.increment_visitor()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total bigint;
BEGIN
  UPDATE public.visitor_stats
    SET total_visits = total_visits + 1, updated_at = now()
    WHERE id = 1
    RETURNING total_visits INTO new_total;
  RETURN new_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_visitor() TO anon, authenticated;