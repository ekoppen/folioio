import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getBackendAdapter } from '@/config/backend-config';
import { PageEditor } from './PageEditor';
import { TemplateLibrary } from './TemplateLibrary';
import { Plus, Edit, Trash2, Eye, Globe, FileText, Home } from 'lucide-react';

interface Page {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_template: boolean;
  is_homepage: boolean;
  template_category?: string;
  parent_page_id?: string;
  menu_order: number;
  created_at: string;
  updated_at: string;
}

export const PageManager = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [showNewPageDialog, setShowNewPageDialog] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageDescription, setNewPageDescription] = useState('');
  const [newPageIsHomepage, setNewPageIsHomepage] = useState(false);
  const [newPageParentId, setNewPageParentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('page_builder_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error loading pages:', error);
      toast({
        title: "Fout bij laden",
        description: "Kon pagina's niet laden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPage = async (pageData: {
    name: string;
    slug: string;
    description?: string;
    template_id?: string;
    is_homepage?: boolean;
    parent_page_id?: string;
  }) => {
    const backend = getBackendAdapter();
    const { data: newPage, error } = await backend
      .from('page_builder_pages')
      .insert([
        {
          name: pageData.name,
          slug: pageData.slug,
          description: pageData.description || '',
          is_homepage: pageData.is_homepage || false,
          parent_page_id: pageData.parent_page_id || null,
          menu_order: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating page:', error);
      throw error;
    }

    if (pageData.template_id) {
      // Copy elements from template
      const { data: templateElements } = await backend
        .from('page_builder_elements')
        .select('*')
        .eq('page_id', pageData.template_id);

      if (templateElements && templateElements.length > 0) {
        const elementsToInsert = templateElements.map(elem => ({
          page_id: newPage.id,
          element_id: elem.element_id,
          element_type: elem.element_type,
          position_x: elem.position_x,
          position_y: elem.position_y,
          size_width: elem.size_width,
          size_height: elem.size_height,
          content: elem.content,
          styles: elem.styles,
          responsive_styles: elem.responsive_styles,
          parent_element_id: elem.parent_element_id,
          sort_order: elem.sort_order,
        }));

        await backend
          .from('page_builder_elements')
          .insert(elementsToInsert);
      }
    }

    return newPage;
  };

  const deletePage = async (pageId: string) => {
    try {
      const backend = getBackendAdapter();
      const { error } = await backend
        .from('page_builder_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      setPages(pages.filter(p => p.id !== pageId));
      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
      }
      toast({
        title: "Pagina verwijderd",
        description: "Pagina is succesvol verwijderd."
      });
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Kon pagina niet verwijderen.",
        variant: "destructive"
      });
    }
  };

  const togglePublished = async (page: Page) => {
    try {
      const backend = getBackendAdapter();
      const { error } = await backend
        .from('page_builder_pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);

      if (error) throw error;

      setPages(pages.map(p => 
        p.id === page.id ? { ...p, is_published: !p.is_published } : p
      ));
      toast({
        title: page.is_published ? "Pagina offline" : "Pagina online",
        description: `Pagina is ${page.is_published ? 'offline gehaald' : 'gepubliceerd'}.`
      });
    } catch (error) {
      console.error('Error updating page:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Kon pagina status niet bijwerken.",
        variant: "destructive"
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCreatePage = async () => {
    if (!newPageName || !newPageSlug) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul naam en slug in.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createPage({
        name: newPageName,
        slug: newPageSlug,
        description: newPageDescription,
        is_homepage: newPageIsHomepage,
        parent_page_id: newPageParentId || undefined,
      });

      setNewPageName('');
      setNewPageSlug('');
      setNewPageDescription('');
      setNewPageIsHomepage(false);
      setNewPageParentId('');
      setShowNewPageDialog(false);
      
      toast({
        title: "Pagina aangemaakt",
        description: "Pagina is succesvol aangemaakt."
      });
      
      loadPages();
    } catch (error) {
      toast({
        title: "Fout bij aanmaken",
        description: "Kon pagina niet aanmaken.",
        variant: "destructive"
      });
    }
  };

  if (editingPageId) {
    const page = pages.find(p => p.id === editingPageId);
    if (page) {
      return (
        <PageEditor 
          pageId={editingPageId}
          onBack={() => setEditingPageId(null)}
        />
      );
    }
  }

  if (showTemplateLibrary) {
    return (
      <TemplateLibrary 
        onBack={() => setShowTemplateLibrary(false)}
        onSelectTemplate={async (templateData) => {
          setShowTemplateLibrary(false);
          
          // Create page from template immediately
          try {
            const templateName = templateData.name || 'Nieuwe Pagina van Template';
            const templateSlug = generateSlug(templateName + '-' + Date.now());
            
            const newPage = await createPage({
              name: templateName,
              slug: templateSlug,
              description: templateData.description || '',
              template_id: 'template-' + templateData.id
            });

            // Insert template elements
            if (templateData.elements && templateData.elements.length > 0) {
              const elementsToInsert = templateData.elements.map((elem: any) => ({
                page_id: newPage.id,
                element_id: elem.id,
                element_type: elem.type,
                position_x: elem.position?.x?.value || 0,
                position_y: elem.position?.y?.value || 0,
                size_width: elem.size?.width?.value || 100,
                size_height: elem.size?.height?.value || 60,
                content: elem.content || '',
                styles: JSON.stringify({
                  ...elem.style,
                  position_x_unit: elem.position?.x?.unit || '%',
                  position_y_unit: elem.position?.y?.unit || 'px',
                  size_width_unit: elem.size?.width?.unit || '%',
                  size_height_unit: elem.size?.height?.unit || 'vh',
                  layout: elem.layout || { positioning: 'relative' },
                  settings: elem.settings || {}
                }),
                responsive_styles: JSON.stringify(elem.breakpointStyles || {}),
                parent_element_id: elem.parent || null,
                sort_order: 0
              }));

              await backend
                .from('page_builder_elements')
                .insert(elementsToInsert);
            }

            toast({
              title: "Pagina aangemaakt van template",
              description: `Pagina "${templateName}" is aangemaakt en kan nu bewerkt worden.`
            });
            
            await loadPages();
            setEditingPageId(newPage.id);
          } catch (error) {
            console.error('Error creating page from template:', error);
            toast({
              title: "Fout bij aanmaken",
              description: "Kon pagina niet aanmaken van template.",
              variant: "destructive"
            });
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pagina Beheer</h1>
          <p className="text-muted-foreground mt-2">
            Beheer al je pagina's en templates. Gepubliceerde pagina's verschijnen automatisch in de navigatie.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTemplateLibrary(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </Button>
          
          <Dialog open={showNewPageDialog} onOpenChange={setShowNewPageDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Pagina
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe Pagina Aanmaken</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Naam</Label>
                  <Input
                    id="name"
                    value={newPageName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewPageName(name);
                      setNewPageSlug(generateSlug(name));
                    }}
                    placeholder="Mijn nieuwe pagina"
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    placeholder="mijn-nieuwe-pagina"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Beschrijving (optioneel)</Label>
                  <Input
                    placeholder="Page description"
                    value={newPageDescription}
                    onChange={(e) => setNewPageDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Page Type</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isHomepage"
                      checked={newPageIsHomepage}
                      onChange={(e) => setNewPageIsHomepage(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isHomepage">Set as Homepage</Label>
                  </div>
                </div>
                {!newPageIsHomepage && (
                  <div className="space-y-2">
                    <Label>Parent Page (Optional)</Label>
                    <select
                      value={newPageParentId}
                      onChange={(e) => setNewPageParentId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">No parent (top-level page)</option>
                      {pages
                        .filter(p => !p.is_homepage && !p.parent_page_id)
                        .map(page => (
                          <option key={page.id} value={page.id}>
                            {page.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewPageDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePage}>Create Page</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <Card key={page.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {page.is_homepage && <Home className="w-4 h-4" />}
                  {page.name}
                </CardTitle>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={page.is_published ? "default" : "secondary"}>
                      {page.is_published ? "Published" : "Draft"}
                    </Badge>
                    {page.is_template && (
                      <Badge variant="outline">Template</Badge>
                    )}
                    {page.is_homepage && (
                      <Badge variant="destructive">Homepage</Badge>
                    )}
                    {page.parent_page_id && (
                      <Badge variant="secondary">Child Page</Badge>
                    )}
                  </div>
                </div>
              </div>
              {page.description && (
                <CardDescription className="line-clamp-2">
                  {page.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  /{page.slug}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPageId(page.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePublished(page)}
                  >
                    {page.is_published ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePage(page.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-3">
                Bijgewerkt: {new Date(page.updated_at).toLocaleDateString('nl-NL')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Geen pagina's</h3>
            <p className="text-muted-foreground mb-6">
              Begin met het aanmaken van je eerste pagina
            </p>
            <Button onClick={() => setShowNewPageDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Eerste Pagina Aanmaken
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};