import { useState } from 'react';
import {
  ContentElement,
  ContentElementType,
  GridColumnSpan,
  createEmptyTextElement,
  createEmptyImageElement,
  createSpacerElement
} from '@/types/content-grid';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Type,
  Image as ImageIcon,
  Maximize2,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentGridEditorProps {
  elements: ContentElement[];
  onChange: (elements: ContentElement[]) => void;
  onImageUpload?: (file: File, elementId: string) => Promise<string>;
  className?: string;
}

export function ContentGridEditor({
  elements,
  onChange,
  onImageUpload,
  className
}: ContentGridEditorProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());

  const addElement = (type: ContentElementType) => {
    let newElement: ContentElement;

    switch (type) {
      case 'text':
        newElement = createEmptyTextElement();
        break;
      case 'image':
        newElement = createEmptyImageElement();
        break;
      case 'spacer':
        newElement = createSpacerElement();
        break;
      default:
        return;
    }

    newElement.order = elements.length;
    onChange([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<ContentElement>) => {
    onChange(
      elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
    );
  };

  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    // Reorder remaining elements
    newElements.forEach((el, index) => {
      el.order = index;
    });
    onChange(newElements);
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const moveElement = (id: string, direction: 'up' | 'down') => {
    const index = elements.findIndex(el => el.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === elements.length - 1)
    ) {
      return;
    }

    const newElements = [...elements];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap orders
    const tempOrder = newElements[index].order;
    newElements[index].order = newElements[swapIndex].order;
    newElements[swapIndex].order = tempOrder;

    // Swap positions
    [newElements[index], newElements[swapIndex]] = [newElements[swapIndex], newElements[index]];

    onChange(newElements);
  };

  const handleImageUpload = async (file: File, elementId: string) => {
    if (!onImageUpload) return;

    setUploadingImages(prev => new Set(prev).add(elementId));
    try {
      const imageUrl = await onImageUpload(file, elementId);
      updateElement(elementId, {
        content: {
          ...elements.find(el => el.id === elementId)?.content,
          imageUrl
        }
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploadingImages(prev => {
        const next = new Set(prev);
        next.delete(elementId);
        return next;
      });
    }
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Add Element Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addElement('text')}
        >
          <Type className="h-4 w-4 mr-2" />
          Tekst toevoegen
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addElement('image')}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Afbeelding toevoegen
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addElement('spacer')}
        >
          <Square className="h-4 w-4 mr-2" />
          Ruimte toevoegen
        </Button>
      </div>

      {/* Grid Preview */}
      <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
        {elements.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-400">
            Klik op een knop hierboven om content toe te voegen
          </div>
        ) : (
          elements.sort((a, b) => a.order - b.order).map((element) => (
            <div
              key={element.id}
              className={cn(
                "relative group cursor-pointer transition-all",
                element.columnSpan === 'full' ? 'col-span-2' : 'col-span-1',
                selectedElementId === element.id && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedElementId(element.id)}
            >
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveElement(element.id, 'up');
                  }}
                  disabled={element.order === 0}
                >
                  <MoveUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveElement(element.id, 'down');
                  }}
                  disabled={element.order === elements.length - 1}
                >
                  <MoveDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <Card className="h-full">
                <CardContent className="p-4">
                  {element.type === 'text' && (
                    <div
                      className={cn("min-h-[100px]", {
                        'text-left': element.content?.alignment === 'left',
                        'text-center': element.content?.alignment === 'center',
                        'text-right': element.content?.alignment === 'right',
                        'text-justify': element.content?.alignment === 'justify',
                      })}
                    >
                      {element.content?.heading && (
                        <h3 className="font-bold mb-2">{element.content.heading}</h3>
                      )}
                      <p className="text-gray-600">
                        {element.content?.text || <span className="italic">Klik om tekst toe te voegen</span>}
                      </p>
                    </div>
                  )}

                  {element.type === 'image' && (
                    <div className="min-h-[100px] flex items-center justify-center">
                      {element.content?.imageUrl ? (
                        <img
                          src={element.content.imageUrl}
                          alt={element.content.imageAlt || ''}
                          className="max-w-full h-auto"
                        />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">Klik om afbeelding toe te voegen</span>
                        </div>
                      )}
                    </div>
                  )}

                  {element.type === 'spacer' && (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400"
                      style={{ height: element.content?.height || 32 }}
                    >
                      <span className="text-xs">Ruimte ({element.content?.height || 32}px)</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Element Editor */}
      {selectedElement && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">
              Element bewerken: {
                selectedElement.type === 'text' ? 'Tekst' :
                selectedElement.type === 'image' ? 'Afbeelding' :
                'Ruimte'
              }
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Column Span */}
            <div>
              <Label>Breedte</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={selectedElement.columnSpan === 'half' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElement(selectedElement.id, { columnSpan: 'half' })}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Halve breedte
                </Button>
                <Button
                  type="button"
                  variant={selectedElement.columnSpan === 'full' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElement(selectedElement.id, { columnSpan: 'full' })}
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Volle breedte
                </Button>
              </div>
            </div>

            {/* Text Element Controls */}
            {selectedElement.type === 'text' && (
              <>
                <div>
                  <Label htmlFor="heading">Koptekst (optioneel)</Label>
                  <Input
                    id="heading"
                    value={selectedElement.content?.heading || ''}
                    onChange={(e) => updateElement(selectedElement.id, {
                      content: {
                        ...selectedElement.content,
                        heading: e.target.value
                      }
                    })}
                    placeholder="Voer een koptekst in..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="text">Tekst</Label>
                  <Textarea
                    id="text"
                    value={selectedElement.content?.text || ''}
                    onChange={(e) => updateElement(selectedElement.id, {
                      content: {
                        ...selectedElement.content,
                        text: e.target.value
                      }
                    })}
                    placeholder="Voer je tekst in..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Uitlijning</Label>
                  <div className="flex gap-2 mt-2">
                    {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                      <Button
                        key={align}
                        type="button"
                        variant={selectedElement.content?.alignment === align ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => updateElement(selectedElement.id, {
                          content: {
                            ...selectedElement.content,
                            alignment: align
                          }
                        })}
                      >
                        {align === 'left' && <AlignLeft className="h-4 w-4" />}
                        {align === 'center' && <AlignCenter className="h-4 w-4" />}
                        {align === 'right' && <AlignRight className="h-4 w-4" />}
                        {align === 'justify' && <AlignJustify className="h-4 w-4" />}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fontSize">Tekstgrootte</Label>
                    <Select
                      value={selectedElement.content?.fontSize || 'normal'}
                      onValueChange={(value: any) => updateElement(selectedElement.id, {
                        content: {
                          ...selectedElement.content,
                          fontSize: value
                        }
                      })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Klein</SelectItem>
                        <SelectItem value="normal">Normaal</SelectItem>
                        <SelectItem value="large">Groot</SelectItem>
                        <SelectItem value="xlarge">Extra groot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fontWeight">Tekstdikte</Label>
                    <Select
                      value={selectedElement.content?.fontWeight || 'normal'}
                      onValueChange={(value: any) => updateElement(selectedElement.id, {
                        content: {
                          ...selectedElement.content,
                          fontWeight: value
                        }
                      })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normaal</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="semibold">Semi-vetgedrukt</SelectItem>
                        <SelectItem value="bold">Vetgedrukt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Image Element Controls */}
            {selectedElement.type === 'image' && (
              <>
                <div>
                  <Label htmlFor="image">Afbeelding</Label>
                  <div className="mt-2 space-y-2">
                    {selectedElement.content?.imageUrl && (
                      <img
                        src={selectedElement.content.imageUrl}
                        alt={selectedElement.content.imageAlt || ''}
                        className="w-full h-40 object-cover rounded"
                      />
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, selectedElement.id);
                          }
                        }}
                        disabled={uploadingImages.has(selectedElement.id)}
                        className="flex-1"
                      />
                      {uploadingImages.has(selectedElement.id) && (
                        <span className="text-sm text-gray-500">Uploaden...</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="imageAlt">Alt tekst</Label>
                  <Input
                    id="imageAlt"
                    value={selectedElement.content?.imageAlt || ''}
                    onChange={(e) => updateElement(selectedElement.id, {
                      content: {
                        ...selectedElement.content,
                        imageAlt: e.target.value
                      }
                    })}
                    placeholder="Beschrijving van de afbeelding..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="imageCaption">Bijschrift (optioneel)</Label>
                  <Input
                    id="imageCaption"
                    value={selectedElement.content?.imageCaption || ''}
                    onChange={(e) => updateElement(selectedElement.id, {
                      content: {
                        ...selectedElement.content,
                        imageCaption: e.target.value
                      }
                    })}
                    placeholder="Bijschrift bij de afbeelding..."
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imageFit">Weergave</Label>
                    <Select
                      value={selectedElement.content?.imageFit || 'cover'}
                      onValueChange={(value: any) => updateElement(selectedElement.id, {
                        content: {
                          ...selectedElement.content,
                          imageFit: value
                        }
                      })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Vullend</SelectItem>
                        <SelectItem value="contain">Passend</SelectItem>
                        <SelectItem value="fill">Uitrekken</SelectItem>
                        <SelectItem value="none">Origineel</SelectItem>
                        <SelectItem value="scale-down">Verkleinen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="imageAlignment">Uitlijning</Label>
                    <Select
                      value={selectedElement.content?.imageAlignment || 'center'}
                      onValueChange={(value: any) => updateElement(selectedElement.id, {
                        content: {
                          ...selectedElement.content,
                          imageAlignment: value
                        }
                      })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Links</SelectItem>
                        <SelectItem value="center">Midden</SelectItem>
                        <SelectItem value="right">Rechts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Spacer Element Controls */}
            {selectedElement.type === 'spacer' && (
              <div>
                <Label htmlFor="height">Hoogte (pixels)</Label>
                <Input
                  id="height"
                  type="number"
                  value={selectedElement.content?.height || 32}
                  onChange={(e) => updateElement(selectedElement.id, {
                    content: {
                      ...selectedElement.content,
                      height: parseInt(e.target.value) || 32
                    }
                  })}
                  min="0"
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}