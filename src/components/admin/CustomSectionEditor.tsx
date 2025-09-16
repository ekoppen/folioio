import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ContentGridEditor } from './ContentGridEditor';
import { ContentElement, createEmptyTextElement } from '@/types/content-grid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Upload,
  X,
  Palette,
  Camera,
  Laptop,
  Monitor,
  Smartphone,
  Globe,
  Users,
  Star,
  Award,
  TrendingUp,
  Target,
  Coffee,
  Code,
  Brush
} from 'lucide-react';

interface CustomSection {
  id: string;
  name: string;
  slug: string;
  title: string;
  is_active: boolean;
  show_in_navigation: boolean;
  show_hero_button: boolean;
  menu_order: number;
  header_image_url?: string;
  content_left: string;
  content_right: any[];
  content_elements?: ContentElement[];  // New grid-based content
  button_text?: string;
  button_link?: string;
}

interface CustomSectionEditorProps {
  section: CustomSection | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (sectionData: Partial<CustomSection>) => void;
}

interface ContentRightItem {
  type: 'stat' | 'service' | 'skill' | 'button';
  label?: string;
  value?: string;
  title?: string;
  description?: string;
  icon?: string;
  button_text?: string;
  button_link?: string;
  stat_link?: string;
}

const ICON_OPTIONS = [
  'Palette', 'Camera', 'Laptop', 'Monitor', 'Smartphone',
  'Globe', 'Users', 'Star', 'Award', 'TrendingUp',
  'Target', 'Coffee', 'Code', 'Brush'
];

const CustomSectionEditor = ({ section, isOpen, onClose, onSave }: CustomSectionEditorProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    title: '',
    is_active: false,
    show_in_navigation: true,
    show_hero_button: false,
    menu_order: 0,
    header_image_url: '',
    content_left: '',
    content_right: [] as ContentRightItem[],
    content_elements: [] as ContentElement[],  // Add grid elements
    button_text: '',
    button_link: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (section) {
      // Handle backward compatibility: convert old content to grid elements if needed
      let contentElements = section.content_elements || [];
      if (contentElements.length === 0 && section.content_left) {
        const textElement = createEmptyTextElement();
        textElement.content = {
          text: section.content_left,
          alignment: 'left',
          fontSize: 'normal',
          fontWeight: 'normal'
        };
        textElement.columnSpan = 'full';
        textElement.order = 0;
        contentElements = [textElement];
      }

      setFormData({
        name: section.name,
        slug: section.slug,
        title: section.title,
        is_active: section.is_active,
        show_in_navigation: section.show_in_navigation,
        show_hero_button: section.show_hero_button,
        menu_order: section.menu_order,
        header_image_url: section.header_image_url || '',
        content_left: section.content_left,
        content_right: section.content_right || [],
        content_elements: contentElements,
        button_text: section.button_text || '',
        button_link: section.button_link || ''
      });
    } else {
      // Reset for new section
      setFormData({
        name: '',
        slug: '',
        title: '',
        is_active: false,
        show_in_navigation: true,
        show_hero_button: false,
        menu_order: 0,
        header_image_url: '',
        content_left: '',
        content_right: [],
        content_elements: [],
        button_text: '',
        button_link: ''
      });
    }
  }, [section]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const formDataForUpload = new FormData();
      formDataForUpload.append('file', file);
      formDataForUpload.append('path', `custom-sections/${Date.now()}-${file.name}`);

      const response = await fetch('/api/storage/custom-sections/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        },
        body: formDataForUpload
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.path) {
          // Construct the public URL from the uploaded path
          const publicUrl = `/api/storage/custom-sections/${result.data.path}`;
          setFormData(prev => ({
            ...prev,
            header_image_url: publicUrl
          }));
          toast({
            title: 'Success',
            description: 'Header image uploaded successfully'
          });
        } else {
          throw new Error('Invalid upload response');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload header image',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGridImageUpload = async (file: File, elementId: string): Promise<string> => {
    try {
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', file);
      formDataForUpload.append('path', `custom-sections/${Date.now()}-${elementId}-${file.name}`);

      const response = await fetch('/api/storage/custom-sections/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        },
        body: formDataForUpload
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.path) {
          const publicUrl = `/api/storage/custom-sections/${result.data.path}`;
          return publicUrl;
        } else {
          throw new Error('Invalid upload response');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading grid image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const addContentRightItem = (type: 'stat' | 'service' | 'skill' | 'button') => {
    const newItem: ContentRightItem = { type };

    switch (type) {
      case 'stat':
        newItem.label = 'Label';
        newItem.value = '100+';
        break;
      case 'service':
        newItem.title = 'Service Title';
        newItem.description = 'Service description';
        newItem.icon = 'Palette';
        break;
      case 'skill':
        newItem.label = 'Skill Name';
        break;
      case 'button':
        newItem.button_text = 'Click Here';
        newItem.button_link = '#';
        break;
    }

    setFormData(prev => ({
      ...prev,
      content_right: [...prev.content_right, newItem]
    }));
  };

  const updateContentRightItem = (index: number, updates: Partial<ContentRightItem>) => {
    setFormData(prev => ({
      ...prev,
      content_right: prev.content_right.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    }));
  };

  const removeContentRightItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      content_right: prev.content_right.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Name and title are required',
        variant: 'destructive'
      });
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {section ? 'Edit Custom Section' : 'Create Custom Section'}
          </DialogTitle>
          <DialogDescription>
            Configure your custom section with content and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="section-name">Section Name *</Label>
                  <Input
                    id="section-name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Services"
                  />
                </div>

                <div>
                  <Label htmlFor="section-slug">URL Slug</Label>
                  <Input
                    id="section-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., services"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Will be used in URL: /section/{formData.slug || 'slug'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="section-title">Display Title *</Label>
                  <Input
                    id="section-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Our Services"
                  />
                </div>

                <div>
                  <Label htmlFor="menu-order">Menu Order</Label>
                  <Input
                    id="menu-order"
                    type="number"
                    value={formData.menu_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, menu_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Display Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-active">Active</Label>
                  <Switch
                    id="is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-navigation">Show in Navigation</Label>
                  <Switch
                    id="show-navigation"
                    checked={formData.show_in_navigation}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_in_navigation: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-hero-button">Show as Hero Button</Label>
                  <Switch
                    id="show-hero-button"
                    checked={formData.show_hero_button}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_hero_button: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Header Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Header Image (Optional)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add a header image for your section
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.header_image_url && (
                  <div className="relative">
                    <img
                      src={formData.header_image_url}
                      alt="Header"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData(prev => ({ ...prev, header_image_url: '' }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Sectie</CardTitle>
              <p className="text-sm text-muted-foreground">
                Voeg tekstblokken en afbeeldingen toe in een flexibel grid systeem.
                Elementen kunnen de hele breedte of halve breedte innemen.
              </p>
            </CardHeader>
            <CardContent>
              <ContentGridEditor
                elements={formData.content_elements || []}
                onChange={(elements) => setFormData(prev => ({ ...prev, content_elements: elements }))}
                onImageUpload={handleGridImageUpload}
              />

              {/* Legacy fields (hidden when grid content is present) */}
              {(!formData.content_elements || formData.content_elements.length === 0) && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-4">
                    Legacy content veld (wordt automatisch geconverteerd naar grid elementen):
                  </p>
                  <div>
                    <Label>Text Content (Legacy)</Label>
                    <Textarea
                      value={formData.content_left}
                      onChange={(e) => setFormData(prev => ({ ...prev, content_left: e.target.value }))}
                      placeholder="Enter content..."
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Button Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Button size="sm" variant="outline" className="pointer-events-none">
                  Button
                </Button>
                Button Settings (Optional)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add a call-to-action button to your section. Leave empty to hide the button.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button-text">Button Text</Label>
                  <Input
                    id="button-text"
                    value={formData.button_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                    placeholder="e.g., Meer Info"
                  />
                </div>

                <div>
                  <Label htmlFor="button-link">Button Link</Label>
                  <Input
                    id="button-link"
                    value={formData.button_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                    placeholder="e.g., #portfolio or https://example.com"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Use: <code>#section-id</code> for scrolling, <code>contact</code> for contact modal, or full URLs
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {section ? 'Update' : 'Create'} Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomSectionEditor;