import React, { useState, useEffect } from 'react';
import { EditableElement } from './page-editor/EditableElement';
import { PageElement, DimensionValue, Unit } from './page-editor/types';
import { getBackendAdapter } from '@/config/backend-config';

const ConfigurableFooter = () => {
  const [elements, setElements] = useState<PageElement[]>([]);
  const [siteSettings, setSiteSettings] = useState({ footer_enabled: true });

  useEffect(() => {
    const loadFooterElements = async () => {
      try {
        const backend = getBackendAdapter();
        const { data, error } = await backend
          .from('footer_elements')
          .select('*')
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
              console.warn('Error parsing footer styles:', e);
            }

            const {
              position_x_unit = 'px',
              position_y_unit = 'px', 
              size_width_unit = '%',
              size_height_unit = 'px',
              layout = { positioning: 'relative' },
              settings = {},
              ...elementStyle
            } = styles;

            // Provide default styles for footer
            const defaultStyle = {
              backgroundColor: 'transparent',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 'normal',
              textAlign: 'left' as const,
              borderRadius: 0,
              padding: 16,
            };

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
        }
      } catch (error) {
        console.error('Error loading footer elements:', error);
      }
    };

    const loadSettings = async () => {
      const backend = getBackendAdapter();
      const { data } = await backend
        .from('site_settings')
        .select('footer_enabled')
        .limit(1)
        .single();
        
      if (data) {
        setSiteSettings({ footer_enabled: data.footer_enabled ?? true });
      }
    };

    loadFooterElements();
    loadSettings();
  }, []);

  if (!siteSettings.footer_enabled) {
    return null;
  }

  // If no custom footer elements, show default footer
  if (elements.length === 0) {
    return (
      <footer className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-primary-foreground/80">
              © {new Date().getFullYear()} Portfolio. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-primary text-primary-foreground relative">
      <div className="container mx-auto px-6 py-8">
        <div className="relative">
          {elements.map((element) => (
            <EditableElement
              key={element.id}
              element={element}
              isSelected={false}
              isPreview={true}
              onSelect={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      </div>
    </footer>
  );
};

export default ConfigurableFooter;