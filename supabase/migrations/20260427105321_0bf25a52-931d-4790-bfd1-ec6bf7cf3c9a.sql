
REVOKE EXECUTE ON FUNCTION public.log_owner_action(text, text, text, jsonb, jsonb, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_broadcast(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_set_shop_suspension(uuid, boolean, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.log_owner_action(text, text, text, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_broadcast(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_set_shop_suspension(uuid, boolean, text) TO authenticated;
