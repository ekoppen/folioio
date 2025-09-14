import { useDrag } from 'react-dnd';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Type, Image, Square, MousePointer, Video, FileText, Map, Share2, Minus, Space, Star } from 'lucide-react';
import { PageElement, DimensionValue } from './types';

interface ElementButtonProps {
  type: PageElement['type'];
  icon: React.ReactNode;
  label: string;
  description: string;
  onAddElement: (type: PageElement['type'], position: { x: DimensionValue; y: DimensionValue }) => void;
}

const ElementButton: React.FC<ElementButtonProps> = ({ type, icon, label, description, onAddElement }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'element',
    item: { elementType: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`
        p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:bg-blue-50 transition-colors
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
      onClick={() => onAddElement(type, { 
        x: { value: 100, unit: 'px' }, 
        y: { value: 100, unit: 'px' }
      })}
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-600">{icon}</div>
        <div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
    </div>
  );
};

interface ElementToolbarProps {
  onAddElement: (type: PageElement['type'], position: { x: DimensionValue; y: DimensionValue }) => void;
}

export const ElementToolbar: React.FC<ElementToolbarProps> = ({ onAddElement }) => {
  const elementTypes = [
    // Basic Elements
    {
      type: 'heading' as const,
      icon: <Type className="w-5 h-5" />,
      label: 'Koptekst',
      description: 'H1, H2, H3 koppen',
      category: 'basic'
    },
    {
      type: 'text' as const,
      icon: <Type className="w-5 h-5" />,
      label: 'Tekst',
      description: 'Paragraaf tekst',
      category: 'basic'
    },
    {
      type: 'button' as const,
      icon: <MousePointer className="w-5 h-5" />,
      label: 'Knop',
      description: 'Klikbare knop',
      category: 'basic'
    },
    {
      type: 'image' as const,
      icon: <Image className="w-5 h-5" />,
      label: 'Afbeelding',
      description: 'Foto of illustratie',
      category: 'basic'
    },
    {
      type: 'video' as const,
      icon: <Video className="w-5 h-5" />,
      label: 'Video',
      description: 'Video embed',
      category: 'media'
    },
    {
      type: 'container' as const,
      icon: <Square className="w-5 h-5" />,
      label: 'Container',
      description: 'Layout container',
      category: 'layout'
    },
    // Interactive Elements
    {
      type: 'form' as const,
      icon: <FileText className="w-5 h-5" />,
      label: 'Formulier',
      description: 'Contact formulier',
      category: 'interactive'
    },
    {
      type: 'map' as const,
      icon: <Map className="w-5 h-5" />,
      label: 'Kaart',
      description: 'Google Maps',
      category: 'interactive'
    },
    {
      type: 'social' as const,
      icon: <Share2 className="w-5 h-5" />,
      label: 'Social',
      description: 'Social media knoppen',
      category: 'interactive'
    },
    // Layout Elements
    {
      type: 'divider' as const,
      icon: <Minus className="w-5 h-5" />,
      label: 'Scheiding',
      description: 'Horizontale lijn',
      category: 'layout'
    },
    {
      type: 'spacer' as const,
      icon: <Space className="w-5 h-5" />,
      label: 'Ruimte',
      description: 'Lege ruimte',
      category: 'layout'
    },
    {
      type: 'icon' as const,
      icon: <Star className="w-5 h-5" />,
      label: 'Pictogram',
      description: 'Icon weergave',
      category: 'design'
    },
  ];

  const categories = {
    basic: 'Basis Elementen',
    media: 'Media',
    interactive: 'Interactief',
    layout: 'Layout',
    design: 'Design'
  };

  const groupedElements = elementTypes.reduce((acc, element) => {
    if (!acc[element.category]) {
      acc[element.category] = [];
    }
    acc[element.category].push(element);
    return acc;
  }, {} as Record<string, typeof elementTypes>);

  return (
    <div className="p-4 h-full overflow-y-auto">
      {Object.entries(groupedElements).map(([category, elements]) => (
        <Card key={category} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {categories[category as keyof typeof categories]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {elements.map((element) => (
              <ElementButton
                key={element.type}
                type={element.type}
                icon={element.icon}
                label={element.label}
                description={element.description}
                onAddElement={onAddElement}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">💡 Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Sleep elementen naar het canvas</p>
            <p>• Dubbelklik om snel toe te voegen</p>
            <p>• Gebruik het eigenschappen paneel</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};