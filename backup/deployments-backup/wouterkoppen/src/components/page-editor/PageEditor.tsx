import { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ElementToolbar } from './ElementToolbar';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { PageElement, DimensionValue, Unit } from './types';
import { Button } from '@/components/ui/button';
import { Save, Eye, Undo, Redo, Settings, ArrowLeft, Smartphone, Tablet, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface PageEditorProps {
  pageId?: string;
  onBack?: () => void;
}

export const PageEditor = ({ pageId, onBack }: PageEditorProps = {}) => {
  const [elements, setElements] = useState<PageElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [history, setHistory] = useState<PageElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isPreview, setIsPreview] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [pageTitle, setPageTitle] = useState('Nieuwe Pagina');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load existing elements when pageId changes
  useEffect(() => {
    const loadElements = async () => {
      if (!pageId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('page_builder_elements')
          .select('*')
          .eq('page_id', pageId)
          .order('sort_order');

        if (error) throw error;

        if (data) {
          const loadedElements: PageElement[] = data.map(dbElement => {
            let styles: any = {};
            let breakpointStyles = {};
            
            try {
              styles = JSON.parse(dbElement.styles as string || '{}');
              breakpointStyles = JSON.parse(dbElement.responsive_styles as string || '{}');
            } catch (e) {
              console.warn('Error parsing styles:', e);
            }

            const {
              position_x_unit = 'px',
              position_y_unit = 'px', 
              size_width_unit = '%',
              size_height_unit = 'vh',
              layout = { positioning: 'relative' },
              settings = {},
              ...elementStyle
            } = styles;

            // Provide default styles if empty
            const defaultStyle = {
              backgroundColor: 'transparent',
              color: '#000000',
              fontSize: 16,
              fontWeight: 'normal',
              textAlign: 'left' as const,
              borderRadius: 0,
              padding: 0,
            };

            // Merge default style with any existing styles
            const mergedStyle = { ...defaultStyle, ...elementStyle };

            return {
              id: dbElement.element_id,
              type: dbElement.element_type as PageElement['type'],
              position: {
                x: { value: Number(dbElement.position_x), unit: position_x_unit as Unit },
                y: { value: Number(dbElement.position_y), unit: position_y_unit as Unit }
              },
              size: {
                width: { value: Number(dbElement.size_width), unit: size_width_unit as Unit },
                height: { value: Number(dbElement.size_height), unit: size_height_unit as Unit }
              },
              layout,
              style: mergedStyle,
              content: dbElement.content || '',
              parent: dbElement.parent_element_id || undefined,
              breakpointStyles,
              settings
            };
          });

          setElements(loadedElements);
          setHistory([loadedElements]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error loading elements:', error);
        toast({
          title: "Fout bij laden",
          description: "Kon bestaande elementen niet laden.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadElements();
  }, [pageId, toast]);

  const addToHistory = useCallback((newElements: PageElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const addElement = useCallback((type: PageElement['type'], position: { x: DimensionValue; y: DimensionValue }) => {
    const newElement: PageElement = {
      id: uuidv4(),
      type,
      position,
      size: { 
        width: { value: getDefaultWidth(type), unit: 'px' }, 
        height: { value: getDefaultHeight(type), unit: 'px' }
      },
      layout: { positioning: 'absolute' },
      style: {
        backgroundColor: type === 'button' ? '#3b82f6' : type === 'container' ? '#f3f4f6' : 'transparent',
        color: type === 'button' ? '#ffffff' : '#000000',
        fontSize: type === 'heading' ? 24 : 16,
        fontWeight: type === 'heading' ? 'bold' : 'normal',
        textAlign: 'left',
        borderRadius: type === 'button' ? 6 : 0,
        padding: type === 'text' || type === 'button' ? 8 : type === 'container' ? 16 : 0,
      },
      content: getDefaultContent(type),
      children: type === 'container' ? [] : undefined,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    addToHistory(newElements);
    setSelectedElement(newElement.id);
  }, [elements, addToHistory]);

  const updateElement = useCallback((id: string, updates: Partial<PageElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    addToHistory(newElements);
  }, [elements, addToHistory]);

  const deleteElement = useCallback((id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    addToHistory(newElements);
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  }, [elements, selectedElement, addToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const savePage = useCallback(async () => {
    if (!pageId) {
      toast({
        title: "Fout",
        description: "Geen pagina ID gevonden.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First, delete existing elements for this page
      await supabase
        .from('page_builder_elements')
        .delete()
        .eq('page_id', pageId);

      // Then insert new elements
      const elementsToSave = elements.map(element => ({
        page_id: pageId,
        element_id: element.id,
        element_type: element.type,
        position_x: element.position.x.value,
        position_y: element.position.y.value,
        size_width: element.size.width.value,
        size_height: element.size.height.value,
        content: element.content,
        styles: JSON.stringify({
          ...element.style,
          position_x_unit: element.position.x.unit,
          position_y_unit: element.position.y.unit,
          size_width_unit: element.size.width.unit,
          size_height_unit: element.size.height.unit,
          layout: element.layout
        }),
        responsive_styles: JSON.stringify(element.breakpointStyles || {}),
        parent_element_id: element.parent || null,
        sort_order: 0
      }));

      if (elementsToSave.length > 0) {
        const { error } = await supabase
          .from('page_builder_elements')
          .insert(elementsToSave);

        if (error) throw error;
      }

      toast({
        title: "Pagina opgeslagen",
        description: "Je pagina is succesvol opgeslagen."
      });
    } catch (error) {
      console.error('Error saving page:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Kon pagina niet opslaan.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [pageId, elements, toast]);

  const getDefaultWidth = (type: PageElement['type']): number => {
    switch (type) {
      case 'text': return 200;
      case 'heading': return 300;
      case 'button': return 120;
      case 'image': return 300;
      case 'video': return 400;
      case 'form': return 350;
      case 'map': return 400;
      case 'social': return 200;
      case 'divider': return 300;
      case 'spacer': return 100;
      case 'icon': return 50;
      case 'container': return 400;
      default: return 300;
    }
  };

  const getDefaultHeight = (type: PageElement['type']): number => {
    switch (type) {
      case 'text': return 40;
      case 'heading': return 60;
      case 'button': return 40;
      case 'image': return 200;
      case 'video': return 300;
      case 'form': return 400;
      case 'map': return 300;
      case 'social': return 60;
      case 'divider': return 2;
      case 'spacer': return 50;
      case 'icon': return 50;
      case 'container': return 200;
      default: return 200;
    }
  };
  const getDefaultContent = (type: PageElement['type']): string => {
    switch (type) {
      case 'text': return 'Tekst bewerken...';
      case 'heading': return 'Nieuwe Kop';
      case 'button': return 'Klik hier';
      case 'video': return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      case 'form': return '';
      case 'map': return '';
      case 'social': return '';
      case 'divider': return '';
      case 'spacer': return '';
      case 'icon': return 'star';
      case 'image': return '';
      case 'container': return '';
      default: return '';
    }
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
          )}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Pagina Editor</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Responsive Breakpoint Switcher */}
            {!isPreview && (
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  size="sm"
                  variant={currentBreakpoint === 'desktop' ? 'default' : 'ghost'}
                  onClick={() => setCurrentBreakpoint('desktop')}
                  className="h-8 w-8 p-0"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={currentBreakpoint === 'tablet' ? 'default' : 'ghost'}
                  onClick={() => setCurrentBreakpoint('tablet')}
                  className="h-8 w-8 p-0"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={currentBreakpoint === 'mobile' ? 'default' : 'ghost'}
                  onClick={() => setCurrentBreakpoint('mobile')}
                  className="h-8 w-8 p-0"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <Button
              variant={isPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreview ? 'Editor' : 'Preview'}
            </Button>
            <Button onClick={savePage} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Sidebar - Elements Toolbar */}
          {!isPreview && (
            <div className="w-64 bg-white border-r border-gray-200">
              <ElementToolbar onAddElement={addElement} />
            </div>
          )}

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col">
            <Canvas
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onUpdateElement={updateElement}
              onDeleteElement={deleteElement}
              onAddElement={addElement}
              isPreview={isPreview}
            />
          </div>

          {/* Right Sidebar - Properties Panel */}
          {!isPreview && selectedElementData && (
            <div className="w-80 bg-white border-l border-gray-200">
              <PropertiesPanel
                element={selectedElementData}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
              />
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};