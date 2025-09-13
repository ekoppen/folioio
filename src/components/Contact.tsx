import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getBackendAdapter } from '@/config/backend-config';
import { useToast } from '@/hooks/use-toast';
import { useAccentColor } from '@/hooks/useAccentColor';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader2, Mail, Phone, MapPin, Send } from 'lucide-react';

interface ContactSettings {
  contact_email: string;
  contact_phone?: string;
  contact_address?: string;
  form_enabled: boolean;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  useAccentColor(); // Initialize dynamic accent color

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('site_settings')
        .select('contact_email, contact_phone, contact_address, form_enabled')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ContactFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: t('contact.error', 'Fout'),
        description: t('contact.fill_required', 'Vul alle verplichte velden in.'),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const backend = getBackendAdapter();
      
      // Use local backend email endpoint instead of Supabase Edge Function
      const apiUrl = backend.getConfig().apiUrl;
      const response = await fetch(`${apiUrl}/email/send-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          subject: formData.subject || undefined,
          message: formData.message,
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      toast({
        title: t('contact.message_sent', 'Bericht verzonden!'),
        description: t('contact.thank_you', 'Bedankt voor je bericht. We nemen zo snel mogelijk contact met je op.'),
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('contact.error', 'Fout'),
        description: t('contact.try_again', 'Er ging iets mis bij het versturen van je bericht. Probeer het opnieuw.'),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section id="contact" className="section-padding bg-muted/30 snap-section">
        <div className="container mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (!settings?.form_enabled) {
    return null;
  }

  return (
    <section id="contact" className="section-padding bg-muted/30 snap-section">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-title">
            {t('contact.take', 'Neem')}{' '}
            <span style={{ color: 'hsl(var(--dynamic-accent))' }}>
              {t('contact.contact', 'Contact')}
            </span>{' '}
            {t('contact.up', 'Op')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-content">
            {t('contact.subtitle', 'Heb je een vraag of wil je samenwerken? Ik hoor graag van je!')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Information */}
          <div className="animate-slide-in-left">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-6 font-title">{t('contact.contact_info', 'Contactgegevens')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg" style={{ color: 'hsl(var(--dynamic-accent))', backgroundColor: 'hsl(var(--dynamic-accent) / 0.1)' }}>
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium">{t('contact.email', 'E-mail')}</p>
                      <a href={`mailto:${settings.contact_email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                        {settings.contact_email}
                      </a>
                    </div>
                  </div>
                  
                  {settings.contact_phone && (
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg" style={{ color: 'hsl(var(--dynamic-accent))', backgroundColor: 'hsl(var(--dynamic-accent) / 0.1)' }}>
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium">{t('contact.phone', 'Telefoon')}</p>
                        <a href={`tel:${settings.contact_phone}`} className="text-muted-foreground hover:text-foreground transition-colors">
                          {settings.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {settings.contact_address && (
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg" style={{ color: 'hsl(var(--dynamic-accent))', backgroundColor: 'hsl(var(--dynamic-accent) / 0.1)' }}>
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium">{t('contact.address', 'Adres')}</p>
                        <p className="text-muted-foreground">{settings.contact_address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="animate-slide-in-right">
            <Card className="border-portfolio-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" style={{ color: 'hsl(var(--dynamic-accent))' }} />
                  {t('contact.send_message_title', 'Stuur een bericht')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('contact.name', 'Naam')} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('contact.email', 'E-mail')} *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('contact.phone', 'Telefoon')}</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={handleInputChange('phone')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('contact.subject', 'Onderwerp')}</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={handleInputChange('subject')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.message', 'Bericht')} *</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange('message')}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="w-full"
                    style={{ 
                      backgroundColor: 'hsl(var(--dynamic-accent))', 
                      color: 'white',
                      borderColor: 'hsl(var(--dynamic-accent))'
                    }}
                  >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {submitting ? t('contact.sending', 'Verzenden...') : t('contact.send_message', 'Bericht Versturen')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;