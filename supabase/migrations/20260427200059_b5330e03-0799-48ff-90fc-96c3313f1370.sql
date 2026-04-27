
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type = ANY (ARRAY[
  'info','success','warning','error',
  'subscription','business','team',
  'order','invite','announcement',
  'join_request','join_approved','join_rejected'
]));
