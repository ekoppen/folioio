import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Edit2, Trash2, GripVertical } from 'lucide-react';

interface SlideItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  sort_order: number;
  is_active: boolean;
}

export const AdminSlideshow = () => {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SlideItem | null>(null);
  const [newSlide, setNewSlide] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('slideshow')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load slides"
      });
    }
  };

  const handleImageUpload = async (file: File, isEditing: boolean = false) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `slide-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('slideshow-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('slideshow-images')
        .getPublicUrl(fileName);

      if (isEditing && editingSlide) {
        setEditingSlide({ ...editingSlide, image_url: publicUrl });
      } else {
        setNewSlide({ ...newSlide, image_url: publicUrl });
      }
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddSlide = async () => {
    if (!newSlide.title || !newSlide.image_url) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title and image are required"
      });
      return;
    }

    setLoading(true);
    try {
      const maxOrder = Math.max(...slides.map(s => s.sort_order), 0);
      
      const { error } = await supabase
        .from('slideshow')
        .insert({
          ...newSlide,
          sort_order: maxOrder + 1
        });

      if (error) throw error;

      setNewSlide({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        is_active: true
      });
      
      await fetchSlides();
      
      toast({
        title: "Success",
        description: "Slide added successfully"
      });
    } catch (error) {
      console.error('Error adding slide:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add slide"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlide = async () => {
    if (!editingSlide) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('slideshow')
        .update({
          title: editingSlide.title,
          description: editingSlide.description,
          image_url: editingSlide.image_url,
          link_url: editingSlide.link_url,
          is_active: editingSlide.is_active
        })
        .eq('id', editingSlide.id);

      if (error) throw error;

      setEditingSlide(null);
      await fetchSlides();
      
      toast({
        title: "Success",
        description: "Slide updated successfully"
      });
    } catch (error) {
      console.error('Error updating slide:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update slide"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('slideshow')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSlides();
      
      toast({
        title: "Success",
        description: "Slide deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete slide"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSlideActive = async (slide: SlideItem) => {
    try {
      const { error } = await supabase
        .from('slideshow')
        .update({ is_active: !slide.is_active })
        .eq('id', slide.id);

      if (error) throw error;

      await fetchSlides();
    } catch (error) {
      console.error('Error toggling slide:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update slide"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Slide</CardTitle>
          <CardDescription>
            Create a new slide for your homepage slideshow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newSlide.title}
                onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                placeholder="Slide title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_url">Link URL</Label>
              <Input
                id="link_url"
                value={newSlide.link_url}
                onChange={(e) => setNewSlide({ ...newSlide, link_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newSlide.description}
              onChange={(e) => setNewSlide({ ...newSlide, description: e.target.value })}
              placeholder="Slide description"
            />
          </div>

          <div className="space-y-2">
            <Label>Image *</Label>
            <div className="flex items-center gap-4">
              {newSlide.image_url && (
                <img 
                  src={newSlide.image_url} 
                  alt="Preview" 
                  className="w-32 h-20 object-cover rounded"
                />
              )}
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('new-slide-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              <input
                id="new-slide-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={newSlide.is_active}
              onCheckedChange={(checked) => setNewSlide({ ...newSlide, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <Button onClick={handleAddSlide} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Adding...' : 'Add Slide'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Slides ({slides.length})</CardTitle>
          <CardDescription>
            Manage your slideshow slides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {slides.map((slide) => (
              <div key={slide.id} className="border rounded-lg p-4">
                {editingSlide?.id === slide.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={editingSlide.title}
                          onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Link URL</Label>
                        <Input
                          value={editingSlide.link_url || ''}
                          onChange={(e) => setEditingSlide({ ...editingSlide, link_url: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editingSlide.description || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Image</Label>
                      <div className="flex items-center gap-4">
                        <img 
                          src={editingSlide.image_url} 
                          alt="Preview" 
                          className="w-32 h-20 object-cover rounded"
                        />
                        <Button
                          variant="outline"
                          disabled={uploading}
                          onClick={() => document.getElementById(`edit-slide-upload-${slide.id}`)?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Change Image'}
                        </Button>
                        <input
                          id={`edit-slide-upload-${slide.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], true)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingSlide.is_active}
                        onCheckedChange={(checked) => setEditingSlide({ ...editingSlide, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleUpdateSlide} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={() => setEditingSlide(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <img 
                      src={slide.image_url} 
                      alt={slide.title} 
                      className="w-24 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{slide.title}</h3>
                      {slide.description && (
                        <p className="text-sm text-muted-foreground">{slide.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-sm ${slide.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                          {slide.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={slide.is_active}
                          onCheckedChange={() => toggleSlideActive(slide)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSlide(slide)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlide(slide.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {slides.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No slides added yet. Create your first slide above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};