import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Trash2, AlignLeft, AlignCenter, AlignRight, Palette, Move, AlignHorizontalDistributeStart, AlignVerticalDistributeStart, Maximize, Play, Settings } from 'lucide-react';
import { PageElement, DimensionValue, Unit, ElementAlignment } from './types';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PropertiesPanelProps {
  element: PageElement;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  onUpdateElement,
  onDeleteElement,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [albums, setAlbums] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  useEffect(() => {
    if (element.type === 'slideshow') {
      fetchAlbums();
    }
  }, [element.type]);

  const fetchAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('id, name, slug')
        .eq('is_visible', true)
        .order('name');

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const updateStyle = (styleUpdates: Partial<PageElement['style']>) => {
    onUpdateElement(element.id, {
      style: { ...element.style, ...styleUpdates }
    });
  };

  const updatePosition = (axis: 'x' | 'y', value: number, unit: Unit) => {
    const newDimension: DimensionValue = { value, unit };
    onUpdateElement(element.id, {
      position: {
        ...element.position,
        [axis]: newDimension,
      }
    });
  };

  const updateSize = (dimension: 'width' | 'height', value: number, unit: Unit) => {
    const newDimension: DimensionValue = { value, unit };
    onUpdateElement(element.id, {
      size: {
        ...element.size,
        [dimension]: newDimension,
      }
    });
  };

  const updateLayout = (layoutUpdates: Partial<PageElement['layout']>) => {
    onUpdateElement(element.id, {
      layout: { ...element.layout, ...layoutUpdates }
    });
  };

  const updateAlignment = (alignmentUpdates: Partial<ElementAlignment>) => {
    const currentLayout = element.layout || { positioning: 'absolute' };
    const currentAlignment = currentLayout.alignment || { horizontal: 'left', vertical: 'top' };
    
    onUpdateElement(element.id, {
      layout: {
        ...currentLayout,
        alignment: { ...currentAlignment, ...alignmentUpdates }
      }
    });
  };

  const updateContent = (content: string) => {
    onUpdateElement(element.id, { content });
  };

  const updateSettings = (settingsUpdates: Partial<PageElement['settings']>) => {
    onUpdateElement(element.id, {
      settings: { ...element.settings, ...settingsUpdates }
    });
  };

  const presetColors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', 
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
  ];

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Element Info */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteElement(element.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            ID: {element.id.slice(0, 8)}...
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {(element.type === 'text' || element.type === 'heading' || element.type === 'button') && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Inhoud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Tekst</Label>
              {element.type === 'text' ? (
                <Textarea
                  value={element.content}
                  onChange={(e) => updateContent(e.target.value)}
                  placeholder="Voer tekst in..."
                  rows={3}
                />
              ) : (
                <Input
                  value={element.content}
                  onChange={(e) => updateContent(e.target.value)}
                  placeholder="Voer tekst in..."
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Content */}
      {element.type === 'image' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Afbeelding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Afbeelding URL</Label>
              <Input
                value={element.content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layout & Alignment */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Move className="w-4 h-4" />
            Layout & Uitlijning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Layout Mode */}
          <div>
            <Label>Layout modus</Label>
            <Select
              value={element.layout?.positioning || 'absolute'}
              onValueChange={(value: 'absolute' | 'relative' | 'flex') => 
                updateLayout({ positioning: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="absolute">Absolute</SelectItem>
                <SelectItem value="relative">Relatief</SelectItem>
                <SelectItem value="flex">Flex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alignment Controls (for flex/relative) */}
          {element.layout?.positioning !== 'absolute' && (
            <div className="space-y-3">
              <div>
                <Label>Horizontale uitlijning</Label>
                <div className="flex gap-1 mt-1">
                  {[
                    { value: 'left', icon: AlignLeft, label: 'Links' },
                    { value: 'center', icon: AlignCenter, label: 'Midden' },
                    { value: 'right', icon: AlignRight, label: 'Rechts' },
                    { value: 'stretch', icon: Maximize, label: 'Stretch' },
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={element.layout?.alignment?.horizontal === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAlignment({ horizontal: value as any })}
                      title={label}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Verticale uitlijning</Label>
                <div className="flex gap-1 mt-1">
                  {[
                    { value: 'top', icon: AlignHorizontalDistributeStart, label: 'Boven' },
                    { value: 'center', icon: AlignCenter, label: 'Midden' },
                    { value: 'bottom', icon: AlignHorizontalDistributeStart, label: 'Onder' },
                    { value: 'stretch', icon: AlignVerticalDistributeStart, label: 'Stretch' },
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={element.layout?.alignment?.vertical === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAlignment({ vertical: value as any })}
                      title={label}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Position & Size */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Positie & Grootte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>X Positie</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={element.position.x.value}
                  onChange={(e) => updatePosition('x', parseFloat(e.target.value) || 0, element.position.x.unit)}
                  className="flex-1"
                />
                <Select
                  value={element.position.x.unit}
                  onValueChange={(unit: Unit) => updatePosition('x', element.position.x.value, unit)}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="px">px</SelectItem>
                    <SelectItem value="%">%</SelectItem>
                    <SelectItem value="vw">vw</SelectItem>
                    <SelectItem value="em">em</SelectItem>
                    <SelectItem value="rem">rem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Y Positie</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={element.position.y.value}
                  onChange={(e) => updatePosition('y', parseFloat(e.target.value) || 0, element.position.y.unit)}
                  className="flex-1"
                />
                <Select
                  value={element.position.y.unit}
                  onValueChange={(unit: Unit) => updatePosition('y', element.position.y.value, unit)}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="px">px</SelectItem>
                    <SelectItem value="%">%</SelectItem>
                    <SelectItem value="vh">vh</SelectItem>
                    <SelectItem value="em">em</SelectItem>
                    <SelectItem value="rem">rem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Breedte</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={element.size.width.value}
                  onChange={(e) => updateSize('width', parseFloat(e.target.value) || 20, element.size.width.unit)}
                  className="flex-1"
                />
                <Select
                  value={element.size.width.unit}
                  onValueChange={(unit: Unit) => updateSize('width', element.size.width.value, unit)}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="px">px</SelectItem>
                    <SelectItem value="%">%</SelectItem>
                    <SelectItem value="vw">vw</SelectItem>
                    <SelectItem value="em">em</SelectItem>
                    <SelectItem value="rem">rem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Hoogte</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={element.size.height.value}
                  onChange={(e) => updateSize('height', parseFloat(e.target.value) || 20, element.size.height.unit)}
                  className="flex-1"
                />
                <Select
                  value={element.size.height.unit}
                  onValueChange={(unit: Unit) => updateSize('height', element.size.height.value, unit)}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="px">px</SelectItem>
                    <SelectItem value="%">%</SelectItem>
                    <SelectItem value="vh">vh</SelectItem>
                    <SelectItem value="em">em</SelectItem>
                    <SelectItem value="rem">rem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quick Size Presets */}
          <div>
            <Label>Snelle afmetingen</Label>
            <div className="flex gap-1 mt-1 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateSize('width', 100, '%');
                }}
              >
                100% Breed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateSize('width', 80, '%');
                }}
              >
                80% Breed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateSize('width', 50, '%');
                }}
              >
                50% Breed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateSize('height', 100, 'vh');
                }}
              >
                Volledig scherm hoogte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography & Alignment */}
      {(element.type === 'text' || element.type === 'heading' || element.type === 'button') && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Typografie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Lettergrootte</Label>
                <Input
                  type="number"
                  value={element.style.fontSize}
                  onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) || 16 })}
                />
              </div>
              <div>
                <Label>Dikte</Label>
                <Select
                  value={element.style.fontWeight}
                  onValueChange={(value) => updateStyle({ fontWeight: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Uitlijning</Label>
              <div className="flex gap-1 mt-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={element.style.textAlign === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateStyle({ textAlign: value as any })}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Colors & Style */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Kleuren & Stijl
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Tekst kleur</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={element.style.color || '#000000'}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="w-12 h-8 p-0"
              />
              <Input
                value={element.style.color || '#000000'}
                onChange={(e) => updateStyle({ color: e.target.value })}
                placeholder="#000000"
              />
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400"
                  style={{ backgroundColor: color }}
                  onClick={() => updateStyle({ color })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Achtergrond kleur</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={element.style.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="w-12 h-8 p-0"
              />
              <Input
                value={element.style.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                placeholder="#ffffff"
              />
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400"
                  style={{ backgroundColor: color }}
                  onClick={() => updateStyle({ backgroundColor: color })}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Border radius</Label>
              <Input
                type="number"
                value={element.style.borderRadius || 0}
                onChange={(e) => updateStyle({ borderRadius: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Padding</Label>
              <Input
                type="number"
                value={element.style.padding || 0}
                onChange={(e) => updateStyle({ padding: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slideshow Settings */}
      {element.type === 'slideshow' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="w-4 h-4" />
              Slideshow Instellingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Album</Label>
              <Select
                value={element.settings?.slideshowAlbum || 'home'}
                onValueChange={(value) => updateSettings({ slideshowAlbum: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home Album</SelectItem>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.slug}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Auto doorschakelen</Label>
              <Switch
                checked={element.settings?.autoAdvance ?? true}
                onCheckedChange={(checked) => updateSettings({ autoAdvance: checked })}
              />
            </div>

            <div>
              <Label>Transitie tijd (ms)</Label>
              <div className="space-y-2">
                <Slider
                  value={[element.settings?.transitionDuration || 6000]}
                  onValueChange={([value]) => updateSettings({ transitionDuration: value })}
                  min={1000}
                  max={15000}
                  step={500}
                />
                <div className="text-sm text-muted-foreground">
                  {element.settings?.transitionDuration || 6000}ms
                </div>
              </div>
            </div>

            <div>
              <Label>Transitie effect</Label>
              <Select
                value={element.settings?.transitionEffect || 'fade'}
                onValueChange={(value: 'fade' | 'slide' | 'scale') => updateSettings({ transitionEffect: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Vervagen</SelectItem>
                  <SelectItem value="slide">Schuiven</SelectItem>
                  <SelectItem value="scale">Schalen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Navigatie knoppen</Label>
              <Switch
                checked={element.settings?.showNavigation ?? true}
                onCheckedChange={(checked) => updateSettings({ showNavigation: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Indicatoren</Label>
              <Switch
                checked={element.settings?.showIndicators ?? true}
                onCheckedChange={(checked) => updateSettings({ showIndicators: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Overlay</Label>
              <Switch
                checked={element.settings?.overlay ?? true}
                onCheckedChange={(checked) => updateSettings({ overlay: checked })}
              />
            </div>

            {element.settings?.overlay !== false && (
              <div>
                <Label>Overlay transparantie (%)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[element.settings?.overlayOpacity || 40]}
                    onValueChange={([value]) => updateSettings({ overlayOpacity: value })}
                    min={0}
                    max={80}
                    step={5}
                  />
                  <div className="text-sm text-muted-foreground">
                    {element.settings?.overlayOpacity || 40}%
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hero Settings */}
      {element.type === 'hero' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Hero Instellingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Site titel (optioneel)</Label>
              <Input
                value={element.settings?.siteTitle || ''}
                onChange={(e) => updateSettings({ siteTitle: e.target.value })}
                placeholder="Laat leeg voor site instellingen"
              />
            </div>

            <div>
              <Label>Site tagline (optioneel)</Label>
              <Input
                value={element.settings?.siteTagline || ''}
                onChange={(e) => updateSettings({ siteTagline: e.target.value })}
                placeholder="Laat leeg voor site instellingen"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Knoppen tonen</Label>
              <Switch
                checked={element.settings?.showButtons ?? true}
                onCheckedChange={(checked) => updateSettings({ showButtons: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Gallery Settings */}
      {element.type === 'portfolio-gallery' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Portfolio Instellingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Alle categorieën tonen</Label>
              <Switch
                checked={element.settings?.showAllCategories ?? true}
                onCheckedChange={(checked) => updateSettings({ showAllCategories: checked })}
              />
            </div>

            <div>
              <Label>Grid kolommen</Label>
              <Select
                value={(element.settings?.gridColumns || 3).toString()}
                onValueChange={(value) => updateSettings({ gridColumns: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 kolom</SelectItem>
                  <SelectItem value="2">2 kolommen</SelectItem>
                  <SelectItem value="3">3 kolommen</SelectItem>
                  <SelectItem value="4">4 kolommen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};