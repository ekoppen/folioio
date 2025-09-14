import { useRef, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { EditableElement } from './EditableElement';
import { PageElement, DragItem, DimensionValue, Unit } from './types';

interface CanvasProps {
  elements: PageElement[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddElement: (type: PageElement['type'], position: { x: DimensionValue; y: DimensionValue }) => void;
  isPreview: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  isPreview,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'element',
    drop: (item: DragItem, monitor) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const position = {
        x: { value: clientOffset.x - canvasRect.left, unit: 'px' as Unit },
        y: { value: clientOffset.y - canvasRect.top, unit: 'px' as Unit }
      };

      if (item.id) {
        // Moving existing element
        onUpdateElement(item.id, { position });
      } else {
        // Adding new element
        onAddElement(item.elementType, position);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null);
    }
  }, [onSelectElement]);

  return (
    <div className="flex-1 p-4 bg-gray-100">
      <div className="w-full max-w-6xl mx-auto">
        <div
          ref={(node) => {
            canvasRef.current = node;
            drop(node);
          }}
          className={`
            relative min-h-[800px] bg-white rounded-lg shadow-sm border-2
            ${isOver ? 'border-blue-400 border-dashed' : 'border-gray-200'}
            ${isPreview ? '' : 'cursor-crosshair'}
          `}
          onClick={handleCanvasClick}
        >
          {/* Grid background for alignment help */}
          {!isPreview && (
            <div 
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />
          )}

          {/* Drop zone message */}
          {elements.length === 0 && !isPreview && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-xl mb-2">Sleep elementen hierheen</div>
                <div className="text-sm">Of klik op een element in de toolbar</div>
              </div>
            </div>
          )}

          {/* Render elements */}
          {elements.map((element) => (
            <EditableElement
              key={element.id}
              element={element}
              isSelected={selectedElement === element.id}
              isPreview={isPreview}
              onSelect={() => onSelectElement(element.id)}
              onUpdate={(updates) => onUpdateElement(element.id, updates)}
              onDelete={() => onDeleteElement(element.id)}
            />
          ))}

          {/* Selection indicator overlay */}
          {isOver && (
            <div className="absolute inset-0 bg-blue-100 bg-opacity-20 pointer-events-none rounded-lg" />
          )}
        </div>
      </div>
    </div>
  );
};