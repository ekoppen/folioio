import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Navigation,
  MousePointer,
  Image as ImageIcon
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import CustomSectionEditor from './CustomSectionEditor';

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
  created_at: string;
  updated_at: string;
}

const AdminCustomSections = () => {
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/custom-sections/admin', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSections(data.data);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch sections');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load custom sections',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = () => {
    setEditingSection(null);
    setIsEditorOpen(true);
  };

  const handleEditSection = (section: CustomSection) => {
    setEditingSection(section);
    setIsEditorOpen(true);
  };

  const handleSaveSection = async (sectionData: Partial<CustomSection>) => {
    try {
      const url = editingSection 
        ? `/api/custom-sections/${editingSection.id}`
        : '/api/custom-sections';
      
      const method = editingSection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        },
        body: JSON.stringify(sectionData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'Success',
            description: `Section ${editingSection ? 'updated' : 'created'} successfully`
          });
          fetchSections();
          setIsEditorOpen(false);
        } else {
          throw new Error(data.error?.message || 'Operation failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingSection ? 'update' : 'create'} section`,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/custom-sections/${sectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Section deleted successfully'
        });
        fetchSections();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete section',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/custom-sections/${sectionId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSections(sections.map(section => 
            section.id === sectionId 
              ? { ...section, is_active: data.data.is_active }
              : section
          ));
          toast({
            title: 'Success',
            description: `Section ${data.data.is_active ? 'activated' : 'deactivated'}`
          });
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error toggling section:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle section status',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading custom sections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Custom Sections</h2>
          <p className="text-muted-foreground">
            Manage custom sections for your homepage
          </p>
        </div>
        <Button onClick={handleCreateSection}>
          <Plus className="w-4 h-4 mr-2" />
          Create Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground mb-4">
              No custom sections created yet
            </div>
            <Button onClick={handleCreateSection}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.id} className={`transition-opacity ${section.is_active ? '' : 'opacity-60'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          /{section.slug}
                        </Badge>
                        <Badge 
                          variant={section.is_active ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {section.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {section.show_in_navigation && (
                          <Badge variant="outline" className="text-xs">
                            <Navigation className="w-3 h-3 mr-1" />
                            Nav
                          </Badge>
                        )}
                        {section.show_hero_button && (
                          <Badge variant="outline" className="text-xs">
                            <MousePointer className="w-3 h-3 mr-1" />
                            Hero
                          </Badge>
                        )}
                        {section.header_image_url && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            Image
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`active-${section.id}`} className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id={`active-${section.id}`}
                        checked={section.is_active}
                        onCheckedChange={() => handleToggleActive(section.id)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSection(section)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Section</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the section "{section.title}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSection(section.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {section.content_left}
                </div>
                {section.content_right.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {section.content_right.length} right column element(s)
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Section Editor Modal */}
      {isEditorOpen && (
        <CustomSectionEditor
          section={editingSection}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveSection}
        />
      )}
    </div>
  );
};

export default AdminCustomSections;