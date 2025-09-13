import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getBackendAdapter } from '@/config/backend-config';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone, MapPin, MessageSquare, Eye, EyeOff } from 'lucide-react';

interface ContactSettings {
  contact_email: string;
  contact_phone?: string;
  contact_address?: string;
  form_enabled: boolean;
  auto_reply_enabled: boolean;
  auto_reply_subject: string;
  auto_reply_message: string;
  notification_email?: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminContact = () => {
  const [settings, setSettings] = useState<ContactSettings>({
    contact_email: 'contact@example.com',
    form_enabled: true,
    auto_reply_enabled: true,
    auto_reply_subject: 'Bedankt voor je bericht',
    auto_reply_message: 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.',
  });
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchMessages();
  }, []);

  const fetchSettings = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('contact_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          contact_address: data.contact_address,
          form_enabled: data.form_enabled,
          auto_reply_enabled: data.auto_reply_enabled,
          auto_reply_subject: data.auto_reply_subject,
          auto_reply_message: data.auto_reply_message,
          notification_email: data.notification_email,
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

  const fetchMessages = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMessages(data);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    }
  };

  const updateSettings = async () => {
    setUpdating(true);
    try {
      const backend = getBackendAdapter();
      const { error } = await backend
        .from('contact_settings')
        .upsert(settings);

      if (error) throw error;

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

  const markAsRead = async (messageId: string, isRead: boolean) => {
    try {
      const backend = getBackendAdapter();
      const { error } = await backend
        .from('contact_messages')
        .update({ is_read: isRead })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: isRead } : msg
        )
      );
    } catch (error) {
      console.error('Error updating message status:', error);
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

          <Button onClick={updateSettings} disabled={updating}>
            {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Instellingen Opslaan
          </Button>
        </CardContent>
      </Card>

      {/* Contact Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Contactberichten ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nog geen berichten ontvangen.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id} className={`${!message.is_read ? 'border-primary/50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{message.name}</h4>
                        <Badge variant={message.is_read ? "secondary" : "default"}>
                          {message.is_read ? "Gelezen" : "Nieuw"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(message.id, !message.is_read)}
                        >
                          {message.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {new Date(message.created_at).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {message.email}
                      </div>
                      {message.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {message.phone}
                        </div>
                      )}
                      {message.subject && (
                        <div className="font-medium">
                          Onderwerp: {message.subject}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContact;