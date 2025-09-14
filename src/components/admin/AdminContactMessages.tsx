import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Mail,
  MailOpen,
  Reply,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  User,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { getBackendAdapter } from '@/config/backend-config';
import { useToast } from '@/hooks/use-toast';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface MessageStats {
  unreadCount: number;
  totalCount: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MessageStats>({ unreadCount: 0, totalCount: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filters and search
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Reply modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ContactMessage | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, [pagination.page, pagination.limit, search, filter, sortBy, sortOrder]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const backend = getBackendAdapter();

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        filter,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/email/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${backend.auth.getSession()?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages);
      setStats(data.stats);
      setPagination(data.pagination);

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Fout bij laden",
        description: "Kon berichten niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string, isRead: boolean) => {
    try {
      const backend = getBackendAdapter();
      const response = await fetch(`/api/email/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${backend.auth.getSession()?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_read: isRead })
      });

      if (!response.ok) {
        throw new Error('Failed to update message');
      }

      // Update local state
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: isRead } : msg
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        unreadCount: isRead ? prev.unreadCount - 1 : prev.unreadCount + 1
      }));

      toast({
        title: isRead ? "Gemarkeerd als gelezen" : "Gemarkeerd als ongelezen",
        description: "Status succesvol bijgewerkt.",
      });

    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Kon bericht status niet bijwerken.",
        variant: "destructive",
      });
    }
  };

  const bulkMarkAsRead = async (markAsRead: boolean) => {
    if (selectedMessages.size === 0) return;

    try {
      const backend = getBackendAdapter();
      const response = await fetch('/api/email/messages/bulk/read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${backend.auth.getSession()?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageIds: Array.from(selectedMessages),
          markAsRead
        })
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update messages');
      }

      const data = await response.json();

      // Update local state
      setMessages(prev => prev.map(msg =>
        selectedMessages.has(msg.id) ? { ...msg, is_read: markAsRead } : msg
      ));

      // Clear selection
      setSelectedMessages(new Set());

      toast({
        title: `${data.updatedCount} berichten bijgewerkt`,
        description: markAsRead ? "Berichten gemarkeerd als gelezen." : "Berichten gemarkeerd als ongelezen.",
      });

      // Refresh to get updated stats
      fetchMessages();

    } catch (error) {
      console.error('Error bulk updating messages:', error);
      toast({
        title: "Fout bij bulk update",
        description: "Kon berichten niet bijwerken.",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return;

    try {
      const backend = getBackendAdapter();
      const response = await fetch(`/api/email/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${backend.auth.getSession()?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });

      toast({
        title: "Bericht verwijderd",
        description: "Het bericht is succesvol verwijderd.",
      });

      // Refresh to get updated stats
      fetchMessages();

    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Kon bericht niet verwijderen.",
        variant: "destructive",
      });
    }
  };

  const openReplyModal = (message: ContactMessage) => {
    setReplyingTo(message);
    setReplySubject(`Re: ${message.subject}`);
    setReplyMessage('');
    setReplyModalOpen(true);
  };

  const sendReply = async () => {
    if (!replyingTo || !replySubject || !replyMessage) return;

    try {
      setSendingReply(true);
      const backend = getBackendAdapter();

      const response = await fetch(`/api/email/messages/${replyingTo.id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${backend.auth.getSession()?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: replySubject,
          message: replyMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      toast({
        title: "Antwoord verzonden",
        description: `Antwoord succesvol verzonden naar ${replyingTo.email}`,
      });

      setReplyModalOpen(false);
      setReplyingTo(null);
      setReplySubject('');
      setReplyMessage('');

      // Refresh messages to update read status
      fetchMessages();

    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Fout bij verzenden",
        description: "Kon antwoord niet verzenden.",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  const openViewModal = async (message: ContactMessage) => {
    setViewingMessage(message);
    setViewModalOpen(true);

    // Mark as read if unread
    if (!message.is_read) {
      await markAsRead(message.id, true);
    }
  };

  const toggleSelectAll = () => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(messages.map(msg => msg.id)));
    }
  };

  const toggleSelectMessage = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (text: string, length: number = 100) => {
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Berichten laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 -mx-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Contact Berichten</h2>
            <p className="text-muted-foreground">
              Beheer inkomende berichten ({stats.unreadCount} ongelezen van {stats.totalCount} totaal)
            </p>
          </div>
          <Button
            onClick={fetchMessages}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Vernieuwen
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Zoeken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Zoeken</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Naam, email, onderwerp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status Filter</label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle berichten</SelectItem>
                  <SelectItem value="unread">Ongelezen</SelectItem>
                  <SelectItem value="read">Gelezen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sorteren op</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Datum</SelectItem>
                  <SelectItem value="name">Naam</SelectItem>
                  <SelectItem value="subject">Onderwerp</SelectItem>
                  <SelectItem value="is_read">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Volgorde</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Nieuwste eerst</SelectItem>
                  <SelectItem value="asc">Oudste eerst</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedMessages.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedMessages.size} bericht(en) geselecteerd
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => bulkMarkAsRead(true)}
                  size="sm"
                  variant="outline"
                >
                  <MailOpen className="w-4 h-4 mr-2" />
                  Markeer als gelezen
                </Button>
                <Button
                  onClick={() => bulkMarkAsRead(false)}
                  size="sm"
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Markeer als ongelezen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Berichten</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedMessages.size === messages.length && messages.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Selecteer alles</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Geen berichten gevonden.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                    !message.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedMessages.has(message.id)}
                      onCheckedChange={() => toggleSelectMessage(message.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{message.name}</h3>
                          <Badge variant={message.is_read ? "secondary" : "default"}>
                            {message.is_read ? "Gelezen" : "Nieuw"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(message.created_at)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">{message.subject}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {message.email}
                          {message.phone && ` • ${message.phone}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {truncateMessage(message.message)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => openViewModal(message)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => openReplyModal(message)}
                        size="sm"
                        variant="outline"
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => markAsRead(message.id, !message.is_read)}
                        size="sm"
                        variant="outline"
                      >
                        {message.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={() => deleteMessage(message.id)}
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Pagina {pagination.page} van {pagination.totalPages}
                ({pagination.total} totaal)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!pagination.hasPrev}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Vorige
                </Button>
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasNext}
                  size="sm"
                  variant="outline"
                >
                  Volgende
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Message Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bericht Details</DialogTitle>
          </DialogHeader>
          {viewingMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Naam</label>
                  <p className="text-sm text-muted-foreground">{viewingMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{viewingMessage.email}</p>
                </div>
                {viewingMessage.phone && (
                  <div>
                    <label className="text-sm font-medium">Telefoon</label>
                    <p className="text-sm text-muted-foreground">{viewingMessage.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Datum</label>
                  <p className="text-sm text-muted-foreground">{formatDate(viewingMessage.created_at)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Onderwerp</label>
                <p className="text-sm text-muted-foreground">{viewingMessage.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Bericht</label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{viewingMessage.message}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setViewModalOpen(false);
                    openReplyModal(viewingMessage);
                  }}
                  className="flex items-center gap-2"
                >
                  <Reply className="w-4 h-4" />
                  Beantwoorden
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Antwoord verzenden</DialogTitle>
          </DialogHeader>
          {replyingTo && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Antwoorden aan: {replyingTo.name}</p>
                <p className="text-sm text-muted-foreground">{replyingTo.email}</p>
                <p className="text-sm text-muted-foreground">Oorspronkelijk onderwerp: {replyingTo.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Onderwerp</label>
                <Input
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Onderwerp van je antwoord"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Bericht</label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={8}
                  placeholder="Schrijf je antwoord..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setReplyModalOpen(false)}
                  variant="outline"
                >
                  Annuleren
                </Button>
                <Button
                  onClick={sendReply}
                  disabled={!replySubject || !replyMessage || sendingReply}
                  className="flex items-center gap-2"
                >
                  {sendingReply ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Reply className="w-4 h-4" />
                  )}
                  {sendingReply ? 'Verzenden...' : 'Antwoord verzenden'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContactMessages;