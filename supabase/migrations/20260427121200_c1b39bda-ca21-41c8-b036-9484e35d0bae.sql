-- =========================================================================
-- Surveillance Daily Logging — PR-1 (DB foundation)
-- =========================================================================

-- ---------- 1. vehicle_plate_events ----------
CREATE TABLE public.vehicle_plate_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       uuid NOT NULL,
  branch_id     uuid,
  camera_id     text,
  event_type    text NOT NULL CHECK (event_type IN ('entry','exit')),
  plate_number  text NOT NULL,
  vehicle_type  text,
  confidence    numeric,
  event_time    timestamptz NOT NULL DEFAULT now(),
  snapshot_url  text,
  event_hash    text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vpe_shop_time         ON public.vehicle_plate_events (shop_id, event_time DESC);
CREATE INDEX idx_vpe_shop_branch_time  ON public.vehicle_plate_events (shop_id, branch_id, event_time DESC);
CREATE INDEX idx_vpe_plate_time        ON public.vehicle_plate_events (plate_number, event_time DESC);

ALTER TABLE public.vehicle_plate_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY vpe_owner_all
  ON public.vehicle_plate_events FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY vpe_shop_manager_select
  ON public.vehicle_plate_events FOR SELECT TO authenticated
  USING (public.is_shop_manager(shop_id));

CREATE POLICY vpe_service_insert
  ON public.vehicle_plate_events FOR INSERT TO service_role
  WITH CHECK (true);

-- ---------- 2. face_entry_events ----------
CREATE TABLE public.face_entry_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         uuid NOT NULL,
  branch_id       uuid,
  camera_id       text,
  event_type      text NOT NULL DEFAULT 'entry' CHECK (event_type = 'entry'),
  face_track_id   text,
  person_type     text NOT NULL DEFAULT 'unknown'
                    CHECK (person_type IN ('employee','customer','unknown')),
  matched_user_id uuid,
  confidence      numeric,
  event_time      timestamptz NOT NULL DEFAULT now(),
  snapshot_url    text,
  event_hash      text NOT NULL UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fee_shop_time        ON public.face_entry_events (shop_id, event_time DESC);
CREATE INDEX idx_fee_shop_branch_time ON public.face_entry_events (shop_id, branch_id, event_time DESC);
CREATE INDEX idx_fee_user_time        ON public.face_entry_events (matched_user_id, event_time DESC);

ALTER TABLE public.face_entry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY fee_owner_all
  ON public.face_entry_events FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY fee_shop_manager_select
  ON public.face_entry_events FOR SELECT TO authenticated
  USING (public.is_shop_manager(shop_id));

CREATE POLICY fee_service_insert
  ON public.face_entry_events FOR INSERT TO service_role
  WITH CHECK (true);

-- ---------- 3. vehicle_sessions ----------
CREATE TABLE public.vehicle_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       uuid NOT NULL,
  branch_id     uuid,
  plate_number  text NOT NULL,
  entry_time    timestamptz NOT NULL,
  exit_time     timestamptz,
  stay_minutes  integer GENERATED ALWAYS AS (
                  CASE
                    WHEN exit_time IS NOT NULL
                      THEN GREATEST(0, (EXTRACT(EPOCH FROM (exit_time - entry_time)))::int / 60)
                    ELSE NULL
                  END
                ) STORED,
  status        text NOT NULL DEFAULT 'inside' CHECK (status IN ('inside','exited')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uniq_vs_open_session
  ON public.vehicle_sessions (shop_id, plate_number)
  WHERE status = 'inside';

CREATE INDEX idx_vs_shop_entry  ON public.vehicle_sessions (shop_id, entry_time DESC);
CREATE INDEX idx_vs_shop_status ON public.vehicle_sessions (shop_id, status);

CREATE TRIGGER trg_vehicle_sessions_updated_at
  BEFORE UPDATE ON public.vehicle_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.vehicle_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY vs_owner_all
  ON public.vehicle_sessions FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY vs_shop_manager_select
  ON public.vehicle_sessions FOR SELECT TO authenticated
  USING (public.is_shop_manager(shop_id));

-- (Sessions are written by the trigger below, which runs SECURITY DEFINER —
--  so it bypasses RLS. No INSERT policy needed for any role.)

-- ---------- 4. Auto-session trigger from plate events ----------
CREATE OR REPLACE FUNCTION public.upsert_vehicle_session_from_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open_id uuid;
BEGIN
  IF NEW.event_type = 'entry' THEN
    SELECT id INTO v_open_id
      FROM public.vehicle_sessions
     WHERE shop_id = NEW.shop_id
       AND plate_number = NEW.plate_number
       AND status = 'inside'
     LIMIT 1;

    IF v_open_id IS NULL THEN
      INSERT INTO public.vehicle_sessions (shop_id, branch_id, plate_number, entry_time, status)
      VALUES (NEW.shop_id, NEW.branch_id, NEW.plate_number, NEW.event_time, 'inside');
    END IF;

  ELSIF NEW.event_type = 'exit' THEN
    SELECT id INTO v_open_id
      FROM public.vehicle_sessions
     WHERE shop_id = NEW.shop_id
       AND plate_number = NEW.plate_number
       AND status = 'inside'
     ORDER BY entry_time DESC
     LIMIT 1;

    IF v_open_id IS NOT NULL THEN
      UPDATE public.vehicle_sessions
         SET exit_time = NEW.event_time,
             status    = 'exited',
             updated_at = now()
       WHERE id = v_open_id;
    ELSE
      -- Audit completeness: record the exit even with no prior entry.
      INSERT INTO public.vehicle_sessions
        (shop_id, branch_id, plate_number, entry_time, exit_time, status)
      VALUES
        (NEW.shop_id, NEW.branch_id, NEW.plate_number, NEW.event_time, NEW.event_time, 'exited');
    END IF;
  END IF;

  RETURN NEW;
END
$$;

CREATE TRIGGER trg_vpe_upsert_session
  AFTER INSERT ON public.vehicle_plate_events
  FOR EACH ROW EXECUTE FUNCTION public.upsert_vehicle_session_from_event();

-- ---------- 5. Daily views (security_invoker so RLS of base tables applies) ----------
CREATE OR REPLACE VIEW public.v_daily_vehicle_logs
WITH (security_invoker = on) AS
WITH ev AS (
  SELECT
    (date_trunc('day', event_time))::date AS date,
    shop_id,
    branch_id,
    COUNT(*) FILTER (WHERE event_type = 'entry') AS total_entries,
    COUNT(*) FILTER (WHERE event_type = 'exit')  AS total_exits
  FROM public.vehicle_plate_events
  GROUP BY 1, 2, 3
),
inside AS (
  SELECT shop_id, branch_id, COUNT(*) AS currently_inside
  FROM public.vehicle_sessions
  WHERE status = 'inside'
  GROUP BY shop_id, branch_id
)
SELECT
  ev.date,
  ev.shop_id,
  ev.branch_id,
  ev.total_entries,
  ev.total_exits,
  COALESCE(i.currently_inside, 0) AS currently_inside
FROM ev
LEFT JOIN inside i
  ON i.shop_id = ev.shop_id
 AND ((i.branch_id IS NULL AND ev.branch_id IS NULL) OR i.branch_id = ev.branch_id);

CREATE OR REPLACE VIEW public.v_daily_face_logs
WITH (security_invoker = on) AS
SELECT
  (date_trunc('day', event_time))::date AS date,
  shop_id,
  branch_id,
  COUNT(*)                                          AS total_faces,
  COUNT(*) FILTER (WHERE person_type = 'employee')  AS employees_detected,
  COUNT(*) FILTER (WHERE person_type = 'unknown')   AS unknown_detected
FROM public.face_entry_events
GROUP BY 1, 2, 3;

-- ---------- 6. Extend log_export_action whitelist with surveillance types ----------
CREATE OR REPLACE FUNCTION public.log_export_action(_shop_id uuid, _export_type text, _row_count integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_owner()
    OR (_shop_id IS NOT NULL AND public.is_shop_manager(_shop_id))
  ) THEN
    RAISE EXCEPTION 'Not allowed to export for this shop';
  END IF;

  IF _export_type NOT IN (
    'services','employees','work_entries','shops','audit_logs','subscriptions',
    'vehicle_events','face_events','vehicle_sessions'
  ) THEN
    RAISE EXCEPTION 'Invalid export type';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    actor_user_id, actor_email, action, target_type, target_id, metadata
  )
  VALUES (
    auth.uid(), v_email, 'export.csv', _export_type, COALESCE(_shop_id::text, 'all'),
    jsonb_build_object('rows', COALESCE(_row_count, 0), 'shop_id', _shop_id)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END
$function$;

-- ---------- 7. Retention helper (cron registered in PR-3) ----------
CREATE OR REPLACE FUNCTION public.purge_surveillance_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vpe_deleted int;
  v_fee_deleted int;
  v_vpe_blanked int;
  v_fee_blanked int;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner can purge surveillance data';
  END IF;

  DELETE FROM public.vehicle_plate_events WHERE event_time < now() - interval '12 months';
  GET DIAGNOSTICS v_vpe_deleted = ROW_COUNT;

  DELETE FROM public.face_entry_events WHERE event_time < now() - interval '12 months';
  GET DIAGNOSTICS v_fee_deleted = ROW_COUNT;

  UPDATE public.vehicle_plate_events
     SET snapshot_url = NULL
   WHERE snapshot_url IS NOT NULL
     AND event_time < now() - interval '30 days';
  GET DIAGNOSTICS v_vpe_blanked = ROW_COUNT;

  UPDATE public.face_entry_events
     SET snapshot_url = NULL
   WHERE snapshot_url IS NOT NULL
     AND event_time < now() - interval '30 days';
  GET DIAGNOSTICS v_fee_blanked = ROW_COUNT;

  RETURN jsonb_build_object(
    'vehicle_events_deleted',  v_vpe_deleted,
    'face_events_deleted',     v_fee_deleted,
    'vehicle_snapshots_cleared', v_vpe_blanked,
    'face_snapshots_cleared',    v_fee_blanked
  );
END
$$;

REVOKE ALL ON FUNCTION public.purge_surveillance_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_surveillance_data() TO authenticated;