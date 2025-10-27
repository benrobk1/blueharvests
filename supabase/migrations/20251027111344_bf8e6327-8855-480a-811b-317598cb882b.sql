-- Create function to auto-approve consumers when consumer role is assigned
CREATE OR REPLACE FUNCTION public.auto_approve_consumer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role = 'consumer' THEN
    UPDATE public.profiles
    SET approval_status = 'approved',
        approved_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-approve consumers
CREATE TRIGGER on_consumer_role_assigned
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_consumer();