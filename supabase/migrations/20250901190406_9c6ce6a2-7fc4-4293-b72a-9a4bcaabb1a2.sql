-- Create contact settings table
CREATE TABLE public.contact_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_email TEXT NOT NULL DEFAULT 'contact@example.com',
  contact_phone TEXT,
  contact_address TEXT,
  form_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_reply_subject TEXT NOT NULL DEFAULT 'Bedankt voor je bericht',
  auto_reply_message TEXT NOT NULL DEFAULT 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.',
  notification_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_settings
CREATE POLICY "Anyone can view contact settings" 
ON public.contact_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage contact settings" 
ON public.contact_settings 
FOR ALL 
USING (is_authenticated_user());

-- Create policies for contact_messages
CREATE POLICY "Anyone can insert contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view all messages" 
ON public.contact_messages 
FOR SELECT 
USING (is_authenticated_user());

CREATE POLICY "Authenticated users can update messages" 
ON public.contact_messages 
FOR UPDATE 
USING (is_authenticated_user());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contact_settings_updated_at
BEFORE UPDATE ON public.contact_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contact settings
INSERT INTO public.contact_settings (contact_email, form_enabled, auto_reply_enabled) 
VALUES ('contact@example.com', true, true);