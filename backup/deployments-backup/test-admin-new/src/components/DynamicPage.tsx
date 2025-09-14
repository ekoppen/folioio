import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getBackendAdapter } from '@/config/backend-config';
import Navigation from '@/components/Navigation';
import SimplifiedFooter from '@/components/SimplifiedFooter';
import { PageElement } from '@/components/page-editor/types';
import { EditableElement } from '@/components/page-editor/EditableElement';
import NotFound from '@/pages/NotFound';

interface Page {
  id: string;
  name: string;
  slug: string;
  is_homepage: boolean;
  is_published: boolean;
}

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [elements, setElements] = useState<PageElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      
      try {
        // Load page by slug or homepage
        const backend = getBackendAdapter();
        const query = backend
          .from('page_builder_pages')
          .select('*')
          .eq('is_published', true);
          
        if (slug) {
          query.eq('slug', slug);
        } else {
          query.eq('is_homepage', true);
        }
        
        const { data: pageData, error: pageError } = await query.maybeSingle();
        
        if (pageError) {
          console.error('Error loading page:', pageError);
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        // If no homepage is configured and we're on root path, show original Index page
        if (!pageData && !slug) {
          // Import and render the original Index page
          window.location.href = '/original-home';
          return;
        }
        
        // If no page found for a specific slug, show 404
        if (!pageData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        setPage(pageData);
        
        // Load page elements
        const { data: elementsData } = await backend
          .from('page_builder_elements')
          .select('*')
          .eq('page_id', pageData.id)
          .order('sort_order');
          
         if (elementsData) {
           const convertedElements: PageElement[] = elementsData.map(elem => {
             // Special handling for homepage elements - they should use relative positioning
             const isHomepageElement = ['hero', 'slideshow', 'portfolio-gallery', 'about'].includes(elem.element_type);
             
             // Parse styles safely
             let styles = {};
             let breakpointStyles = {};
             
             try {
               styles = typeof elem.styles === 'string' ? JSON.parse(elem.styles) : (elem.styles || {});
               breakpointStyles = typeof elem.responsive_styles === 'string' ? JSON.parse(elem.responsive_styles) : (elem.responsive_styles || {});
             } catch (e) {
               console.warn('Error parsing element styles:', e);  
             }
             
             return {
               id: elem.element_id,
               type: elem.element_type as PageElement['type'],
               position: {
                 x: { value: Number(elem.position_x), unit: isHomepageElement ? '%' as const : 'px' as const },
                 y: { value: Number(elem.position_y), unit: isHomepageElement ? '%' as const : 'px' as const }
               },
               size: {
                 width: { value: Number(elem.size_width), unit: isHomepageElement ? '%' as const : 'px' as const },
                 height: { value: Number(elem.size_height), unit: isHomepageElement ? 'vh' as const : 'px' as const }
               },
               layout: isHomepageElement ? { positioning: 'relative' as const } : undefined,
               style: styles,
               content: elem.content || '',
               parent: elem.parent_element_id || undefined,
               children: [],
               breakpointStyles: breakpointStyles
             };
           });
          
          setElements(convertedElements);
        }
        
      } catch (error) {
        console.error('Error loading page:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (notFound || !page) {
    return <NotFound />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen">
        <Navigation />
        
        {/* Render page elements */}
        <main className="relative flex flex-col">
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
        </main>
        
        <SimplifiedFooter />
      </div>
    </DndProvider>
  );
};

export default DynamicPage;