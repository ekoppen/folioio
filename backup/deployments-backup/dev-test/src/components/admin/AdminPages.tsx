import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getBackendAdapter } from '@/config/backend-config';
import { Plus, Edit2, Trash2, ExternalLink, Home } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  content?: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const AdminPages = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [newPage, setNewPage] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    is_published: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Sort home page first, then others
      const sortedPages = (data || []).sort((a, b) => {
        if (a.slug === 'home') return -1;
        if (b.slug === 'home') return 1;
        return 0;
      });
      setPages(sortedPages);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load pages"
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string, isEditing: boolean = false) => {
    const slug = generateSlug(title);
    if (isEditing && editingPage) {
      setEditingPage({ ...editingPage, title, slug: editingPage.slug === 'home' ? 'home' : slug });
    } else {
      setNewPage({ ...newPage, title, slug });
    }
  };

  const handleAddPage = async () => {
    if (!newPage.title || !newPage.slug) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title and slug are required"
      });
      return;
    }

    setLoading(true);
    try {
      const backend = getBackendAdapter();
      const { error } = await backend
        .from('pages')
        .insert(newPage);

      if (error) throw error;

      setNewPage({
        title: '',
        slug: '',
        content: '',
        meta_description: '',
        is_published: false
      });
      setShowCreatePage(false);
      
      await fetchPages();
      
      toast({
        title: "Success",
        description: "Page created successfully"
      });
    } catch (error: any) {
      console.error('Error adding page:', error);
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Error",
          description: "A page with this slug already exists"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create page"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePage = async () => {
    if (!editingPage) return;

    setLoading(true);
    try {
      const backend = getBackendAdapter();
      const { error } = await backend
        .from('pages')
        .update({
          title: editingPage.title,
          slug: editingPage.slug,
          content: editingPage.content,
          meta_description: editingPage.meta_description,
          is_published: editingPage.is_published
        })
        .eq('id', editingPage.id);

      if (error) throw error;

      setEditingPage(null);
      await fetchPages();
      
      toast({
        title: "Success",
        description: "Page updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating page:', error);
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Error",
          description: "A page with this slug already exists"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update page"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (id: string, slug: string) => {
    if (slug === 'home') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot delete the Home page"
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this page?')) return;

    setLoading(true);
    try {
      const backend = getBackendAdapter();
      const { error } = await backend
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchPages();
      
      toast({
        title: "Success",
        description: "Page deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete page"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePagePublished = async (page: Page) => {
    try {
      const backend = getBackendAdapter();
      const { error } = await backend
        .from('pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);

      if (error) throw error;

      await fetchPages();
    } catch (error) {
      console.error('Error toggling page:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update page"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pagina's</h2>
          <p className="text-muted-foreground">Beheer website pagina's en home instellingen</p>
        </div>
        
        <Dialog open={showCreatePage} onOpenChange={setShowCreatePage}>
          <DialogTrigger asChild>
            <Button
              style={{ backgroundColor: 'var(--dynamic-accent)', borderColor: 'var(--dynamic-accent)' }}
              className="text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Pagina
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nieuwe Pagina Aanmaken</DialogTitle>
              <DialogDescription>
                Maak een nieuwe inhoudspagina voor je website
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page_title">Pagina Titel *</Label>
                  <Input
                    id="page_title"
                    value={newPage.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Over Mij"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page_slug">URL Slug *</Label>
                  <Input
                    id="page_slug"
                    value={newPage.slug}
                    onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                    placeholder="over-mij"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="page_meta">Meta Beschrijving</Label>
                <Textarea
                  id="page_meta"
                  value={newPage.meta_description}
                  onChange={(e) => setNewPage({ ...newPage, meta_description: e.target.value })}
                  placeholder="Korte beschrijving voor zoekmachines (160 karakters max)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page_content">Inhoud</Label>
                <Textarea
                  id="page_content"
                  value={newPage.content}
                  onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                  placeholder="Schrijf hier je pagina inhoud. Je kunt HTML tags gebruiken."
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="page_published"
                  checked={newPage.is_published}
                  onCheckedChange={(checked) => setNewPage({ ...newPage, is_published: checked })}
                />
                <Label htmlFor="page_published">Gepubliceerd</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreatePage(false)}>
                Annuleren
              </Button>
              <Button 
                onClick={handleAddPage} 
                disabled={loading}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: 'var(--dynamic-accent)', borderColor: 'var(--dynamic-accent)' }}
              >
                {loading ? 'Aanmaken...' : 'Pagina Aanmaken'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Home Pagina Instellingen
          </CardTitle>
          <CardDescription>
            Beheer de instellingen van je homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pages.find(p => p.slug === 'home') && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {pages.find(p => p.slug === 'home')?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">Homepage instellingen en inhoud</p>
                  {pages.find(p => p.slug === 'home')?.meta_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {pages.find(p => p.slug === 'home')?.meta_description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('/', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPage(pages.find(p => p.slug === 'home') || null)}
                    style={{ color: 'var(--dynamic-accent)' }}
                    className="hover:bg-accent/10"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overige Pagina's ({pages.filter(p => p.slug !== 'home').length})</CardTitle>
          <CardDescription>
            Beheer je website pagina's
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pages.filter(page => page.slug !== 'home').map((page) => (
              <div key={page.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{page.title}</h3>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                    {page.meta_description && (
                      <p className="text-sm text-muted-foreground mt-1">{page.meta_description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-sm ${page.is_published ? 'text-green-600' : 'text-gray-500'}`}>
                        {page.is_published ? 'Gepubliceerd' : 'Concept'}
                      </span>
                      <Switch
                        checked={page.is_published}
                        onCheckedChange={() => togglePagePublished(page)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {page.is_published && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/${page.slug}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPage(page)}
                      style={{ color: 'var(--dynamic-accent)' }}
                      className="hover:bg-accent/10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePage(page.id, page.slug)}
                      style={{ color: 'var(--dynamic-accent)' }}
                      className="hover:bg-accent/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {pages.filter(page => page.slug !== 'home').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen pagina's aangemaakt. Maak je eerste pagina hierboven.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Page Dialog */}
      {editingPage && (
        <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingPage.slug === 'home' && <Home className="w-5 h-5" />}
                {editingPage.slug === 'home' ? 'Home Pagina Bewerken' : 'Pagina Bewerken'}
              </DialogTitle>
              <DialogDescription>
                {editingPage.slug === 'home' 
                  ? 'Wijzig de instellingen van je homepage'
                  : 'Wijzig pagina instellingen en inhoud'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pagina Titel *</Label>
                  <Input
                    value={editingPage.title}
                    onChange={(e) => handleTitleChange(e.target.value, true)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug *</Label>
                  <Input
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    disabled={editingPage.slug === 'home'}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Meta Beschrijving</Label>
                <Textarea
                  value={editingPage.meta_description || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                  rows={2}
                  placeholder="Korte beschrijving voor zoekmachines"
                />
              </div>

              <div className="space-y-2">
                <Label>Inhoud</Label>
                <Textarea
                  value={editingPage.content || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  rows={8}
                  placeholder="Pagina inhoud - HTML tags zijn toegestaan"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingPage.is_published}
                  onCheckedChange={(checked) => setEditingPage({ ...editingPage, is_published: checked })}
                  disabled={editingPage.slug === 'home'}
                />
                <Label>
                  {editingPage.slug === 'home' ? 'Gepubliceerd (altijd actief)' : 'Gepubliceerd'}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPage(null)}>
                Annuleren
              </Button>
              <Button 
                onClick={handleUpdatePage} 
                disabled={loading}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: 'var(--dynamic-accent)', borderColor: 'var(--dynamic-accent)' }}
              >
                {loading ? 'Opslaan...' : 'Wijzigingen Opslaan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};