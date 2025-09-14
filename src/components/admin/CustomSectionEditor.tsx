import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
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
    button_text: '',
    button_link: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (section) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {section ? 'Edit Custom Section' : 'Create Custom Section'}
          </DialogTitle>
          <DialogDescription>
            Configure your custom section with content and settings
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <div className="space-y-4">
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
                </div>

                <div>
                  <Label htmlFor="section-title">Display Title *</Label>
                  <Input
                    id="section-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Onze Diensten"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-active">Active</Label>
                    <Switch
                      id="is-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_active: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-nav">Show in Navigation</Label>
                    <Switch
                      id="show-nav"
                      checked={formData.show_in_navigation}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, show_in_navigation: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-hero">Show Hero Button</Label>
                    <Switch
                      id="show-hero"
                      checked={formData.show_hero_button}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, show_hero_button: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Header Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Header Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.header_image_url && (
                    <div className="relative">
                      <img
                        src={formData.header_image_url}
                        alt="Header"
                        className="w-full h-32 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, header_image_url: '' }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="header-upload">Upload Header Image</Label>
                    <Input
                      id="header-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Use: <code>#section-id</code> for scrolling, <code>contact</code> for contact modal, or full URLs
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Settings */}
          <div className="space-y-4">
            {/* Left Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Left Column Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.content_left}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_left: e.target.value }))}
                  placeholder="Enter the main text content for the left column..."
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* Right Content Elements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Right Column Elements</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addContentRightItem('stat')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Stat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addContentRightItem('service')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Service
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addContentRightItem('skill')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Skill
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addContentRightItem('button')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Button
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.content_right.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="capitalize">
                          {item.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContentRightItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {item.type === 'stat' && (
                          <>
                            <div>
                              <Label>Value</Label>
                              <Input
                                value={item.value || ''}
                                onChange={(e) => updateContentRightItem(index, { value: e.target.value })}
                                placeholder="e.g., 100+"
                              />
                            </div>
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={item.label || ''}
                                onChange={(e) => updateContentRightItem(index, { label: e.target.value })}
                                placeholder="e.g., Projects"
                              />
                            </div>
                            <div>
                              <Label>Click URL (optional)</Label>
                              <Input
                                value={item.stat_link || ''}
                                onChange={(e) => updateContentRightItem(index, { stat_link: e.target.value })}
                                placeholder="e.g., #portfolio, contact, https://..."
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Leave empty for no click action. Use: #section for anchors, 'contact' for contact modal, or full URLs
                              </p>
                            </div>
                          </>
                        )}

                        {item.type === 'service' && (
                          <>
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={item.title || ''}
                                onChange={(e) => updateContentRightItem(index, { title: e.target.value })}
                                placeholder="Service title"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={item.description || ''}
                                onChange={(e) => updateContentRightItem(index, { description: e.target.value })}
                                placeholder="Service description"
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label>Icon</Label>
                              <Select
                                value={item.icon}
                                onValueChange={(value) => updateContentRightItem(index, { icon: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an icon" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ICON_OPTIONS.map((icon) => (
                                    <SelectItem key={icon} value={icon}>
                                      {icon}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        {item.type === 'skill' && (
                          <div>
                            <Label>Skill Name</Label>
                            <Input
                              value={item.label || ''}
                              onChange={(e) => updateContentRightItem(index, { label: e.target.value })}
                              placeholder="e.g., Web Development"
                            />
                          </div>
                        )}

                        {item.type === 'button' && (
                          <>
                            <div>
                              <Label>Button Text</Label>
                              <Input
                                value={item.button_text || ''}
                                onChange={(e) => updateContentRightItem(index, { button_text: e.target.value })}
                                placeholder="e.g., Learn More"
                              />
                            </div>
                            <div>
                              <Label>Button Link</Label>
                              <Input
                                value={item.button_link || ''}
                                onChange={(e) => updateContentRightItem(index, { button_link: e.target.value })}
                                placeholder="e.g., #portfolio or https://example.com"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}

                  {formData.content_right.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No elements added yet. Click the buttons above to add stats, services, skills, or buttons.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {section ? 'Update Section' : 'Create Section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomSectionEditor;