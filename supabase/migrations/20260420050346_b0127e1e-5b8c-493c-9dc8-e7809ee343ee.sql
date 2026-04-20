
CREATE TABLE public.video_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  video_name text NOT NULL,
  total_cars integer NOT NULL DEFAULT 0,
  duration_sec integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.video_scan_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.video_scans(id) ON DELETE CASCADE,
  plate text,
  timestamp_sec numeric NOT NULL DEFAULT 0,
  frame_image text,
  has_car boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_scan_detections_scan_id ON public.video_scan_detections(scan_id);

ALTER TABLE public.video_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_scan_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_scans_admin_all" ON public.video_scans
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "video_scan_detections_admin_all" ON public.video_scan_detections
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
