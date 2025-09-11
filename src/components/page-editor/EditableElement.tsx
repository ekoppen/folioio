import { useState, useRef, useCallback, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { ResizableBox } from 'react-resizable';
import { PageElement, DimensionValue, Unit } from './types';
import { Button } from '@/components/ui/button';
import { X, Move, RotateCcw } from 'lucide-react';
import { SlideshowElement } from './elements/SlideshowElement';
import { HeroElement } from './elements/HeroElement';
import { PortfolioGalleryElement } from './elements/PortfolioGalleryElement';
import 'react-resizable/css/styles.css';

interface EditableElementProps {
  element: PageElement;
  isSelected: boolean;
  isPreview: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PageElement>) => void;
  onDelete: () => void;
}

export const EditableElement: React.FC<EditableElementProps> = ({
  element,
  isSelected,
  isPreview,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Always call the drag hook, but only use it when not in preview mode
  const dragResult = useDrag({
    type: 'element',
    item: { type: 'element', elementType: element.type, id: element.id },
    collect: (monitor) => ({
      dragState: monitor.isDragging(),
    }),
    canDrag: !isPreview, // Disable dragging in preview mode
  });

  const [{ dragState }, drag, preview] = dragResult;

  useEffect(() => {
    if (!isPreview) {
      setIsDragging(dragState);
    }
  }, [dragState, isPreview]);

  const handleDoubleClick = useCallback(() => {
    if (!isPreview && (element.type === 'text' || element.type === 'heading' || element.type === 'button')) {
      setIsEditing(true);
    }
  }, [isPreview, element.type]);

  const handleContentChange = useCallback((newContent: string) => {
    onUpdate({ content: newContent });
  }, [onUpdate]);

  const handleContentBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, []);

  const handleResize = useCallback((e: any, { size }: { size: { width: number; height: number } }) => {
    // Keep the current unit when resizing
    onUpdate({ 
      size: { 
        width: { value: Math.max(size.width, 20), unit: element.size.width.unit },
        height: { value: Math.max(size.height, 20), unit: element.size.height.unit }
      } 
    });
  }, [onUpdate, element.size.width.unit, element.size.height.unit]);

  const handlePositionChange = useCallback((newPosition: { x: number; y: number }) => {
    // Keep the current units when moving
    onUpdate({ 
      position: {
        x: { value: newPosition.x, unit: element.position.x.unit },
        y: { value: newPosition.y, unit: element.position.y.unit }
      }
    });
  }, [onUpdate, element.position.x.unit, element.position.y.unit]);

  // Helper function to convert dimension values to CSS values
  const dimensionToCss = useCallback((dimension: DimensionValue, parentSize?: number): string => {
    if (dimension.unit === '%' && parentSize) {
      // For percentage units in absolute positioning, convert to pixels for ResizableBox
      return `${(dimension.value * parentSize) / 100}px`;
    }
    return `${dimension.value}${dimension.unit}`;
  }, []);

  // Helper function to get numeric value for ResizableBox (which expects pixels)
  const dimensionToPixels = useCallback((dimension: DimensionValue, parentSize?: number): number => {
    switch (dimension.unit) {
      case '%':
        return parentSize ? (dimension.value * parentSize) / 100 : dimension.value;
      case 'vw':
        return (dimension.value * window.innerWidth) / 100;
      case 'vh':
        return (dimension.value * window.innerHeight) / 100;
      case 'em':
        return dimension.value * 16; // Approximate em size
      case 'rem':
        return dimension.value * 16; // Approximate rem size
      default:
        return dimension.value;
    }
  }, []);

  const getElementStyle = (): React.CSSProperties => {
    const { style, layout } = element;
    const baseStyle: React.CSSProperties = {
      backgroundColor: style.backgroundColor,
      color: style.color,
      fontSize: `${style.fontSize}px`,
      fontWeight: style.fontWeight,
      textAlign: style.textAlign,
      borderRadius: `${style.borderRadius}px`,
      border: style.border,
      padding: `${style.padding}px`,
      margin: `${style.margin}px`,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      cursor: isPreview ? (element.type === 'button' ? 'pointer' : 'default') : 'move',
    };

    // Apply layout-specific styles
    if (layout?.positioning === 'flex' || layout?.positioning === 'relative') {
      const alignment = layout.alignment || { horizontal: 'left', vertical: 'top' };
      
      baseStyle.display = 'flex';
      
      // Horizontal alignment
      switch (alignment.horizontal) {
        case 'left':
          baseStyle.justifyContent = 'flex-start';
          break;
        case 'center':
          baseStyle.justifyContent = 'center';
          break;
        case 'right':
          baseStyle.justifyContent = 'flex-end';
          break;
        case 'stretch':
          baseStyle.justifyContent = 'stretch';
          break;
      }
      
      // Vertical alignment
      switch (alignment.vertical) {
        case 'top':
          baseStyle.alignItems = 'flex-start';
          break;
        case 'center':
          baseStyle.alignItems = 'center';
          break;
        case 'bottom':
          baseStyle.alignItems = 'flex-end';
          break;
        case 'stretch':
          baseStyle.alignItems = 'stretch';
          break;
      }
    } else {
      // Default flex behavior for absolute positioning
      baseStyle.display = 'flex';
      baseStyle.alignItems = element.type === 'container' ? 'flex-start' : 'center';
      baseStyle.justifyContent = element.type === 'container' ? 'flex-start' : 
        style.textAlign === 'center' ? 'center' : 
        style.textAlign === 'right' ? 'flex-end' : 'flex-start';
    }

    return baseStyle;
  };

  // Get container style for positioning and sizing
  const getContainerStyle = (): React.CSSProperties => {
    const { layout } = element;
    
    if (layout?.positioning === 'relative' || layout?.positioning === 'flex') {
      return {
        position: 'relative',
        width: dimensionToCss(element.size.width),
        height: dimensionToCss(element.size.height),
        zIndex: isSelected ? 1000 : 1,
      };
    }

    // Absolute positioning (default)
    return {
      position: 'absolute',
      left: dimensionToCss(element.position.x),
      top: dimensionToCss(element.position.y),
      width: dimensionToCss(element.size.width),
      height: dimensionToCss(element.size.height),
      zIndex: isSelected ? 1000 : 1,
    };
  };

  const renderContent = () => {
    const commonProps = {
      style: {
        background: 'transparent',
        border: 'none',
        outline: 'none',
        width: '100%',
        height: '100%',
        resize: 'none' as const,
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        color: 'inherit',
        textAlign: element.style.textAlign,
      },
    };

    if (isEditing && !isPreview) {
      switch (element.type) {
        case 'text':
        case 'button':
      return (
        <textarea
          value={element.content}
          onChange={(e) => handleContentChange(e.target.value)}
          onBlur={handleContentBlur}
          onKeyDown={handleKeyPress}
          autoFocus
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%',
            height: '100%',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            textAlign: element.style.textAlign,
          }}
        />
      );
        case 'heading':
      return (
        <input
          type="text"
          value={element.content}
          onChange={(e) => handleContentChange(e.target.value)}
          onBlur={handleContentBlur}
          onKeyDown={handleKeyPress}
          autoFocus
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%',
            height: '100%',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            textAlign: element.style.textAlign,
          }}
        />
      );
        default:
          return <div style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', height: '100%' }}>{element.content}</div>;
      }
    }

    switch (element.type) {
      case 'text':
      case 'button':
        return <div>{element.content}</div>;
      case 'heading':
        const HeadingTag = 'h2'; // Could be dynamic based on heading level
        return <HeadingTag style={{ margin: 0 }}>{element.content}</HeadingTag>;
      case 'image':
        return element.content ? (
          <img src={element.content} alt="Element" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
            Geen afbeelding
          </div>
        );
      case 'container':
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            minHeight: '60px',
            border: isPreview ? 'none' : '2px dashed #cbd5e1',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: element.style.backgroundColor || (isPreview ? 'transparent' : '#f8fafc')
          }}>
            {isPreview ? (element.content || '') : (element.content || 'Container - sleep elementen hier')}
          </div>
        );
      case 'slideshow':
        return <SlideshowElement settings={element.settings} />;
      case 'hero':
        return <HeroElement settings={element.settings} />;
      case 'portfolio-gallery':
        return <PortfolioGalleryElement settings={element.settings} />;
      default:
        return <div>{element.content}</div>;
    }
  };

  if (isPreview) {
    return (
      <div style={getContainerStyle()}>
        <div style={getElementStyle()} onClick={element.type === 'button' ? () => {} : undefined}>
          {renderContent()}
        </div>
      </div>
    );
  }

  // For relative/flex positioned elements, render differently
  if (element.layout?.positioning === 'relative' || element.layout?.positioning === 'flex') {
    return (
      <div style={getContainerStyle()}>
        <div
          ref={isPreview ? contentRef : (node) => {
            if (node) {
              preview(node);
              contentRef.current = node;
            }
          }}
          className={`
            relative w-full h-full group
            ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
            ${isDragging ? 'opacity-50' : 'opacity-100'}
          `}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onDoubleClick={handleDoubleClick}
        >
          <div style={getElementStyle()}>
            {renderContent()}
          </div>

          {/* Selection Controls */}
          {isSelected && (
            <>
              {/* Info Handle */}
              <div className="absolute -top-6 left-0 bg-green-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
                <Move className="w-3 h-3" />
                {element.type} (relatief)
              </div>

              {/* Delete Button */}
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-6 -right-0 w-6 h-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <X className="w-3 h-3" />
              </Button>

              {/* Alignment guides */}
              <div className="absolute -inset-px border border-green-500 pointer-events-none" />
            </>
          )}
        </div>
      </div>
    );
  }

  // Absolute positioned elements (default behavior)
  const pixelWidth = dimensionToPixels(element.size.width);
  const pixelHeight = dimensionToPixels(element.size.height);
  const pixelX = dimensionToPixels(element.position.x);
  const pixelY = dimensionToPixels(element.position.y);

  return (
    <div
      style={{
        position: 'absolute',
        left: pixelX,
        top: pixelY,
        zIndex: isSelected ? 1000 : 1,
      }}
    >
      <ResizableBox
        width={pixelWidth}
        height={pixelHeight}
        onResize={handleResize}
        minConstraints={[20, 20]}
        handle={
          isSelected ? (
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-se-resize" />
          ) : undefined
        }
        resizeHandles={isSelected ? ['se'] : []}
      >
        <div
          ref={isPreview ? contentRef : (node) => {
            if (node) {
              preview(node);
              contentRef.current = node;
            }
          }}
          className={`
            relative w-full h-full group
            ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
            ${isDragging ? 'opacity-50' : 'opacity-100'}
          `}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onDoubleClick={handleDoubleClick}
        >
          <div style={getElementStyle()}>
            {renderContent()}
          </div>

          {/* Selection Controls */}
          {isSelected && (
            <>
              {/* Drag Handle */}
              <div
                ref={isPreview ? undefined : drag}
                className="absolute -top-6 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded cursor-move flex items-center gap-1"
              >
                <Move className="w-3 h-3" />
                {element.type}
              </div>

              {/* Delete Button */}
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-6 -right-0 w-6 h-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <X className="w-3 h-3" />
              </Button>

              {/* Alignment guides */}
              <div className="absolute -inset-px border border-blue-500 pointer-events-none" />
            </>
          )}
        </div>
      </ResizableBox>
    </div>
  );
};