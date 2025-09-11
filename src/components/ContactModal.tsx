import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export const ContactModal = ({ open, onOpenChange }: ContactModalProps) => {
  const { t } = useTranslation();
  const [contactSettings, setContactSettings] = useState({
    contact_email: 'contact@example.com',
    contact_phone: '+31 6 1234 5678',
    contact_address: 'Nederland'
  });
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadContactSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('contact_email, contact_phone, contact_address')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          setContactSettings({
            contact_email: data.contact_email || 'contact@example.com',
            contact_phone: data.contact_phone || '+31 6 1234 5678',
            contact_address: data.contact_address || 'Nederland'
          });
        }
      } catch (error) {
        console.error('Error loading contact settings:', error);
      }
    };
    
    loadContactSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        variant: "destructive",
        title: t('contact.required_fields', 'Vereiste velden'),
        description: t('contact.fill_required', 'Vul alle vereiste velden in.')
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save to database
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject || null,
          message: formData.message
        });

      if (error) throw error;

      toast({
        title: t('contact.message_sent', 'Bericht verzonden!'),
        description: t('contact.thank_you', 'Bedankt voor je bericht. We nemen zo spoedig mogelijk contact met je op.')
      });

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: t('contact.error', 'Er is iets misgegaan'),
        description: t('contact.try_again', 'Het bericht kon niet worden verzonden. Probeer het later opnieuw.')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-title flex items-center gap-2">
            <Mail className="w-6 h-6" style={{ color: 'hsl(var(--dynamic-accent))' }} />
            {t('contact.title', 'Neem Contact Op')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-content">
            {t('contact.subtitle', 'Heb je een vraag of wil je samenwerken? Stuur me een bericht!')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-content">
                {t('contact.name', 'Naam')} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('contact.name_placeholder', 'Je naam')}
                required
                className="font-content"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-content">
                {t('contact.email', 'E-mail')} *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('contact.email_placeholder', 'je@email.com')}
                required
                className="font-content"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-content">
                {t('contact.phone', 'Telefoon')}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('contact.phone_placeholder', '06 12 34 56 78')}
                className="font-content"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="font-content">
                {t('contact.subject', 'Onderwerp')}
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder={t('contact.subject_placeholder', 'Onderwerp van je bericht')}
                className="font-content"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="font-content">
              {t('contact.message', 'Bericht')} *
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={t('contact.message_placeholder', 'Vertel me over je project of vraag...')}
              rows={5}
              required
              className="font-content resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-content"
            >
              {t('contact.cancel', 'Annuleren')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 font-content text-white"
              style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
            >
              {isSubmitting ? (
                t('contact.sending', 'Verzenden...')
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('contact.send_message', 'Bericht Verzenden')}
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="border-t pt-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" style={{ color: 'hsl(var(--dynamic-accent))' }} />
              <span className="font-content">{contactSettings.contact_email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" style={{ color: 'hsl(var(--dynamic-accent))' }} />
              <span className="font-content">{contactSettings.contact_phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" style={{ color: 'hsl(var(--dynamic-accent))' }} />
              <span className="font-content">{contactSettings.contact_address}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};