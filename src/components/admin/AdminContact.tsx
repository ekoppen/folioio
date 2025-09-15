import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBackendAdapter } from '@/config/backend-config';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Settings, Inbox, Mail, Save } from 'lucide-react';
import AdminContactMessages from './AdminContactMessages';

interface ContactSettings {
  contact_email: string;
  contact_phone?: string;
  contact_address?: string;
  form_enabled: boolean;
  auto_reply_enabled: boolean;
  auto_reply_subject: string;
  auto_reply_message: string;
  notification_email?: string;
  site_url?: string;
  // Email service settings
  email_service_type?: 'gmail' | 'resend';
  gmail_user?: string;
  gmail_app_password?: string;
  resend_api_key?: string;
}


const AdminContact = () => {
  const [settings, setSettings] = useState<ContactSettings>({
    contact_email: 'contact@example.com',
    form_enabled: true,
    auto_reply_enabled: true,
    auto_reply_subject: 'Bedankt voor je bericht',
    auto_reply_message: 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.',
    site_url: 'http://localhost:8080',
    email_service_type: 'gmail',
    gmail_user: '',
    gmail_app_password: '',
    resend_api_key: ''
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchUnreadCount();
  }, []);

  const fetchSettings = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('site_settings')
        .select('contact_email, contact_phone, contact_address, form_enabled, auto_reply_enabled, auto_reply_subject, auto_reply_message, notification_email, site_url, email_service_type, gmail_user, gmail_app_password, resend_api_key')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          contact_email: data.contact_email || 'contact@example.com',
          contact_phone: data.contact_phone || '',
          contact_address: data.contact_address || '',
          form_enabled: data.form_enabled ?? true,
          auto_reply_enabled: data.auto_reply_enabled ?? true,
          auto_reply_subject: data.auto_reply_subject || 'Bedankt voor je bericht',
          auto_reply_message: data.auto_reply_message || 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.',
          notification_email: data.notification_email || '',
          site_url: data.site_url || 'http://localhost:8080',
          // Email service settings
          email_service_type: data.email_service_type || 'gmail',
          gmail_user: data.gmail_user || '',
          gmail_app_password: data.gmail_app_password || '',
          resend_api_key: data.resend_api_key || ''
        });
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
      toast({
        title: "Fout",
        description: "Kon contactinstellingen niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      // Fetch unread count for tab badge
      const response = await fetch('/api/email/messages?limit=1&filter=unread', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.stats?.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const updateSettings = async () => {
    setUpdating(true);
    try {
      const backend = getBackendAdapter();
      
      // First check if settings exist
      const { data: existing } = await backend
        .from('site_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing settings
        const { error } = await backend
          .from('site_settings')
          .update({
            contact_email: settings.contact_email,
            contact_phone: settings.contact_phone,
            contact_address: settings.contact_address,
            form_enabled: settings.form_enabled,
            auto_reply_enabled: settings.auto_reply_enabled,
            auto_reply_subject: settings.auto_reply_subject,
            auto_reply_message: settings.auto_reply_message,
            notification_email: settings.notification_email,
            site_url: settings.site_url,
            // Email service settings
            email_service_type: settings.email_service_type,
            gmail_user: settings.gmail_user,
            gmail_app_password: settings.gmail_app_password,
            resend_api_key: settings.resend_api_key,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await backend
          .from('site_settings')
          .insert({
            contact_email: settings.contact_email,
            contact_phone: settings.contact_phone,
            contact_address: settings.contact_address,
            form_enabled: settings.form_enabled,
            auto_reply_enabled: settings.auto_reply_enabled,
            auto_reply_subject: settings.auto_reply_subject,
            auto_reply_message: settings.auto_reply_message,
            notification_email: settings.notification_email,
            site_url: settings.site_url,
            // Email service settings
            email_service_type: settings.email_service_type,
            gmail_user: settings.gmail_user,
            gmail_app_password: settings.gmail_app_password,
            resend_api_key: settings.resend_api_key
          });

        if (error) throw error;
      }

      toast({
        title: "Opgeslagen",
        description: "Contactinstellingen zijn bijgewerkt.",
      });
    } catch (error) {
      console.error('Error updating contact settings:', error);
      toast({
        title: "Fout",
        description: "Kon instellingen niet opslaan.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const sendTestEmail = async () => {
    setTesting(true);
    try {
      // First save current settings to ensure they're applied
      await updateSettings();
      
      // Send test email via contact form endpoint
      const response = await fetch('/api/email/send-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Email Test',
          email: settings.notification_email || settings.contact_email,
          subject: 'Email Configuration Test',
          message: `This is a test email to verify your email configuration is working correctly.

Email Service: ${settings.email_service_type || 'gmail'}
Contact Email: ${settings.contact_email}
Notification Email: ${settings.notification_email || 'Not set'}

If you receive this email, your email service is configured properly!

Sent from your portfolio admin panel.`
        })
      });

      if (response.ok) {
        toast({
          title: "Test email verzonden! ✅",
          description: `Controleer je inbox: ${settings.notification_email || settings.contact_email}`,
        });
      } else {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Test email mislukt ❌",
        description: "Controleer je email instellingen en probeer opnieuw.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contact Beheer</h2>
          <p className="text-muted-foreground">
            Beheer contact instellingen en berichten
          </p>
        </div>
        <Button
          onClick={updateSettings}
          disabled={updating}
          className="flex items-center gap-2"
          style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
        >
          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {updating ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            Berichten
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Instellingen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          {/* Contact Settings */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contactinstellingen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact E-mail *</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification_email">Notificatie E-mail</Label>
              <Input
                id="notification_email"
                type="email"
                placeholder="E-mail voor nieuwe berichten"
                value={settings.notification_email || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, notification_email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_url">Website URL</Label>
              <Input
                id="site_url"
                type="url"
                placeholder="https://jouwdomein.nl"
                value={settings.site_url || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, site_url: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Deze URL wordt gebruikt in e-mail links naar de admin sectie
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefoonnummer</Label>
              <Input
                id="contact_phone"
                value={settings.contact_phone || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_address">Adres</Label>
              <Input
                id="contact_address"
                value={settings.contact_address || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, contact_address: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* Email Service Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Email Service Configuratie</h4>
            
            <div className="space-y-2">
              <Label htmlFor="email_service_type">Email Service</Label>
              <Select
                value={settings.email_service_type || 'gmail'}
                onValueChange={(value: 'gmail' | 'resend') => 
                  setSettings(prev => ({ ...prev, email_service_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer email service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail SMTP (Aanbevolen)</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.email_service_type === 'gmail' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <h5 className="font-medium">Gmail SMTP Configuratie</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gmail_user">Gmail Email *</Label>
                    <Input
                      id="gmail_user"
                      type="email"
                      value={settings.gmail_user || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, gmail_user: e.target.value }))}
                      placeholder="jouw.email@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gmail_app_password">Gmail App Password *</Label>
                    <Input
                      id="gmail_app_password"
                      type="password"
                      value={settings.gmail_app_password || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, gmail_app_password: e.target.value }))}
                      placeholder="abcd efgh ijkl mnop"
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-md">
                  <strong>Gmail App Password Setup:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Ga naar <strong>Google Account Security</strong></li>
                    <li>Activeer <strong>2-Step Verification</strong></li>
                    <li>Zoek naar <strong>"App passwords"</strong></li>
                    <li>Maak een nieuw app password voor "Mail"</li>
                    <li>Kopieer het 16-karakter password hierboven</li>
                  </ol>
                </div>
              </div>
            )}

            {settings.email_service_type === 'resend' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <h5 className="font-medium">Resend Configuratie</h5>
                <div className="space-y-2">
                  <Label htmlFor="resend_api_key">Resend API Key *</Label>
                  <Input
                    id="resend_api_key"
                    type="password"
                    value={settings.resend_api_key || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, resend_api_key: e.target.value }))}
                    placeholder="re_..."
                  />
                </div>
                <div className="text-sm text-muted-foreground p-3 bg-yellow-50 rounded-md">
                  <strong>Waarschuwing:</strong> Voor Resend moet je DNS records van je domein aanpassen. 
                  Gmail SMTP is eenvoudiger te configureren zonder DNS wijzigingen.
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="form_enabled">Contactformulier inschakelen</Label>
                <p className="text-sm text-muted-foreground">Sta toe dat bezoekers berichten kunnen versturen</p>
              </div>
              <Switch
                id="form_enabled"
                checked={settings.form_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, form_enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_reply_enabled">Automatisch antwoord</Label>
                <p className="text-sm text-muted-foreground">Verstuur automatisch een bevestigingsmail</p>
              </div>
              <Switch
                id="auto_reply_enabled"
                checked={settings.auto_reply_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_reply_enabled: checked }))}
              />
            </div>
          </div>

          {settings.auto_reply_enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auto_reply_subject">Onderwerp automatisch antwoord</Label>
                <Input
                  id="auto_reply_subject"
                  value={settings.auto_reply_subject}
                  onChange={(e) => setSettings(prev => ({ ...prev, auto_reply_subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto_reply_message">Bericht automatisch antwoord</Label>
                <Textarea
                  id="auto_reply_message"
                  rows={4}
                  value={settings.auto_reply_message}
                  onChange={(e) => setSettings(prev => ({ ...prev, auto_reply_message: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="flex justify-start">
            <Button 
              variant="outline" 
              onClick={sendTestEmail} 
              disabled={testing || !settings.email_service_type || 
                       (settings.email_service_type === 'gmail' && (!settings.gmail_user || !settings.gmail_app_password)) ||
                       (settings.email_service_type === 'resend' && !settings.resend_api_key)}
            >
              {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!testing && <Send className="w-4 h-4 mr-2" />}
              Test Email
            </Button>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="messages">
          <AdminContactMessages />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContact;