import React from 'react';
import { ContentElement } from '@/types/content-grid';
import { cn } from '@/lib/utils';

interface ContentGridRendererProps {
  elements: ContentElement[];
  className?: string;
}

export function ContentGridRenderer({ elements, className }: ContentGridRendererProps) {
  if (!elements || elements.length === 0) {
    return null;
  }

  // Sort elements by order
  const sortedElements = [...elements].sort((a, b) => a.order - b.order);

  return (
    <div className={cn("grid grid-cols-1 xl:grid-cols-2 gap-4", className)}>
      {sortedElements.map((element) => (
        <div
          key={element.id}
          className={cn(
            "flex flex-col",
            element.columnSpan === 'full' ? 'col-span-2' : 'col-span-1'
          )}
          style={{
            padding: element.styling?.padding
              ? `${element.styling.padding.top || 0}px ${element.styling.padding.right || 0}px ${element.styling.padding.bottom || 0}px ${element.styling.padding.left || 0}px`
              : undefined,
            margin: element.styling?.margin
              ? `${element.styling.margin.top || 0}px ${element.styling.margin.right || 0}px ${element.styling.margin.bottom || 0}px ${element.styling.margin.left || 0}px`
              : undefined,
            backgroundColor: element.styling?.backgroundColor,
            color: element.styling?.textColor,
            borderRadius: element.styling?.borderRadius ? `${element.styling.borderRadius}px` : undefined,
            border: element.styling?.border
              ? `${element.styling.border.width || 1}px ${element.styling.border.style || 'solid'} ${element.styling.border.color || '#ccc'}`
              : undefined,
          }}
        >
          {element.type === 'text' && (
            <div
              className={cn(
                "prose max-w-none",
                {
                  'text-left': element.content?.alignment === 'left',
                  'text-center': element.content?.alignment === 'center',
                  'text-right': element.content?.alignment === 'right',
                  'text-justify': element.content?.alignment === 'justify',
                },
                {
                  'text-sm': element.content?.fontSize === 'small',
                  'text-base': element.content?.fontSize === 'normal',
                  'text-lg': element.content?.fontSize === 'large',
                  'text-xl': element.content?.fontSize === 'xlarge',
                },
                {
                  'font-normal': element.content?.fontWeight === 'normal',
                  'font-medium': element.content?.fontWeight === 'medium',
                  'font-semibold': element.content?.fontWeight === 'semibold',
                  'font-bold': element.content?.fontWeight === 'bold',
                }
              )}
            >
              {element.content?.heading && (
                <h3 className="font-bold mb-2 font-title">
                  {element.content.heading}
                </h3>
              )}
              {element.content?.text && (
                <div
                  className="font-content rich-text-content"
                  dangerouslySetInnerHTML={{ __html: element.content.text }}
                />
              )}
            </div>
          )}

          {element.type === 'image' && element.content?.imageUrl && (
            <div className="flex flex-col">
              <img
                src={element.content.imageUrl}
                alt={element.content.imageAlt || ''}
                className={cn(
                  "max-w-full h-auto rounded",
                  {
                    'object-cover': element.content.imageFit === 'cover',
                    'object-contain': element.content.imageFit === 'contain',
                    'object-fill': element.content.imageFit === 'fill',
                    'object-none': element.content.imageFit === 'none',
                    'object-scale-down': element.content.imageFit === 'scale-down',
                  },
                  {
                    'mx-auto': element.content.imageAlignment === 'center',
                    'ml-auto': element.content.imageAlignment === 'right',
                    'mr-auto': element.content.imageAlignment === 'left',
                  }
                )}
              />
              {element.content.imageCaption && (
                <p className="text-sm text-muted-foreground mt-2 text-center font-content">
                  {element.content.imageCaption}
                </p>
              )}
            </div>
          )}

          {element.type === 'spacer' && (
            <div
              style={{ height: element.content?.height || 32 }}
              className="w-full"
            />
          )}
        </div>
      ))}
    </div>
  );
}