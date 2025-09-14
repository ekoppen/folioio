import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Search, Eye, Plus } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  template_category?: string;
  template_data: any;
  created_at: string;
}

interface TemplateLibraryProps {
  onBack: () => void;
  onSelectTemplate: (templateData: any) => void;
}

export const TemplateLibrary = ({ onBack, onSelectTemplate }: TemplateLibraryProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Built-in templates
  const builtInTemplates = [
    {
      id: 'empty',
      name: 'Lege Pagina',
      description: 'Begin met een volledig lege pagina',
      template_category: 'basic',
      template_data: { elements: [] },
      created_at: new Date().toISOString()
    },
    {
      id: 'hero-landing',
      name: 'Hero Landing',
      description: 'Pagina met grote hero sectie en call-to-action',
      template_category: 'landing',
      template_data: {
        elements: [
          {
            id: 'hero-container',
            type: 'container',
            position: { x: 0, y: 0 },
            size: { width: 1200, height: 600 },
            style: {
              backgroundColor: '#1e40af',
              backgroundImage: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              padding: 40
            },
            content: '',
            children: [
              {
                id: 'hero-title',
                type: 'heading',
                position: { x: 100, y: 150 },
                size: { width: 800, height: 80 },
                style: {
                  color: '#ffffff',
                  fontSize: 48,
                  fontWeight: 'bold',
                  textAlign: 'center'
                },
                content: 'Welkom op onze Website'
              },
              {
                id: 'hero-subtitle',
                type: 'text',
                position: { x: 100, y: 250 },
                size: { width: 800, height: 60 },
                style: {
                  color: '#ffffff',
                  fontSize: 20,
                  textAlign: 'center'
                },
                content: 'Ontdek wat wij voor jou kunnen betekenen'
              },
              {
                id: 'hero-cta',
                type: 'button',
                position: { x: 450, y: 350 },
                size: { width: 200, height: 50 },
                style: {
                  backgroundColor: '#ffffff',
                  color: '#1e40af',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 'medium'
                },
                content: 'Meer Informatie'
              }
            ]
          }
        ]
      },
      created_at: new Date().toISOString()
    },
    {
      id: 'contact-form',
      name: 'Contact Pagina',
      description: 'Eenvoudige contact pagina met formulier',
      template_category: 'contact',
      template_data: {
        elements: [
          {
            id: 'contact-title',
            type: 'heading',
            position: { x: 50, y: 50 },
            size: { width: 600, height: 60 },
            style: {
              fontSize: 36,
              fontWeight: 'bold',
              color: '#1f2937'
            },
            content: 'Contact'
          },
          {
            id: 'contact-text',
            type: 'text',
            position: { x: 50, y: 130 },
            size: { width: 600, height: 80 },
            style: {
              fontSize: 16,
              color: '#6b7280',
              lineHeight: '1.6'
            },
            content: 'Neem contact met ons op. We horen graag van je en beantwoorden je vragen zo snel mogelijk.'
          },
          {
            id: 'contact-form',
            type: 'form',
            position: { x: 50, y: 230 },
            size: { width: 500, height: 400 },
            style: {
              backgroundColor: '#f9fafb',
              padding: 30,
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            },
            content: '',
            settings: {
              fields: [
                { name: 'naam', type: 'text', placeholder: 'Je naam', required: true },
                { name: 'email', type: 'email', placeholder: 'Je e-mailadres', required: true },
                { name: 'onderwerp', type: 'text', placeholder: 'Onderwerp', required: true },
                { name: 'bericht', type: 'textarea', placeholder: 'Je bericht', required: true }
              ],
              submitText: 'Versturen',
              action: '/contact'
            }
          }
        ]
      },
      created_at: new Date().toISOString()
    },
    {
      id: 'product-showcase',
      name: 'Product Showcase',
      description: 'Toon je product of service met afbeeldingen',
      template_category: 'product',
      template_data: {
        elements: [
          {
            id: 'product-hero',
            type: 'container',
            position: { x: 0, y: 0 },
            size: { width: 1200, height: 400 },
            style: {
              backgroundColor: '#f8fafc',
              padding: 40
            },
            content: '',
            children: [
              {
                id: 'product-title',
                type: 'heading',
                position: { x: 50, y: 50 },
                size: { width: 600, height: 80 },
                style: {
                  fontSize: 42,
                  fontWeight: 'bold',
                  color: '#1f2937'
                },
                content: 'Ons Product'
              },
              {
                id: 'product-description',
                type: 'text',
                position: { x: 50, y: 150 },
                size: { width: 600, height: 100 },
                style: {
                  fontSize: 18,
                  color: '#6b7280',
                  lineHeight: '1.6'
                },
                content: 'Ontdek ons nieuwste product dat speciaal is ontworpen om jouw behoeften te vervullen.'
              }
            ]
          },
          {
            id: 'product-image',
            type: 'image',
            position: { x: 700, y: 100 },
            size: { width: 400, height: 300 },
            style: {
              borderRadius: 12,
              objectFit: 'cover'
            },
            content: '/placeholder.svg'
          }
        ]
      },
      created_at: new Date().toISOString()
    },
    {
      id: 'fullscreen-slideshow',
      name: 'Fullscreen Slideshow',
      description: 'Slideshow over de volle breedte en hoogte van de pagina met transparante navigatie en footer',
      template_category: 'slideshow',
      template_data: {
        id: 'fullscreen-slideshow',
        name: 'Fullscreen Slideshow',
        description: 'Slideshow over de volle breedte en hoogte van de pagina met transparante navigatie en footer',
        elements: [
          {
            id: 'fullscreen-slideshow-element',
            type: 'slideshow',
            position: { x: { value: 0, unit: 'px' }, y: { value: 0, unit: 'px' } },
            size: { width: { value: 100, unit: '%' }, height: { value: 100, unit: 'vh' } },
            style: {
              backgroundColor: '#000000'
            },
            content: '',
            settings: {
              slideshowAlbum: 'home',
              autoAdvance: true,
              transitionDuration: 6000,
              transitionEffect: 'fade',
              showNavigation: true,
              showIndicators: true,
              overlay: false,
              overlayOpacity: 0
            },
            layout: { positioning: 'relative' }
          }
        ]
      },
      created_at: new Date().toISOString()
    },
    {
      id: 'mixed-content',
      name: 'Mixed Content Layout',
      description: 'Hero sectie bovenin met containers voor flexibele indeling van content',
      template_category: 'layout',
      template_data: {
        id: 'mixed-content',
        name: 'Mixed Content Layout',
        description: 'Hero sectie bovenin met containers voor flexibele indeling van content',
        elements: [
          {
            id: 'hero-container',
            type: 'container',
            position: { x: { value: 0, unit: 'px' }, y: { value: 0, unit: 'px' } },
            size: { width: { value: 100, unit: '%' }, height: { value: 60, unit: 'vh' } },
            style: {
              backgroundColor: '#1e40af',
              backgroundImage: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              padding: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            },
            content: '',
            layout: { positioning: 'relative' }
          },
          {
            id: 'content-row-1',
            type: 'container',
            position: { x: { value: 0, unit: 'px' }, y: { value: 60, unit: 'vh' } },
            size: { width: { value: 100, unit: '%' }, height: { value: 40, unit: 'vh' } },
            style: {
              backgroundColor: '#f8fafc',
              padding: 40,
              display: 'flex',
              gap: 20
            },
            content: '',
            layout: { positioning: 'relative' }
          },
          {
            id: 'content-left',
            type: 'container',
            position: { x: { value: 0, unit: 'px' }, y: { value: 0, unit: 'px' } },
            size: { width: { value: 50, unit: '%' }, height: { value: 100, unit: '%' } },
            style: {
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            },
            content: 'Content sectie links',
            layout: { positioning: 'relative' },
            parent: 'content-row-1'
          },
          {
            id: 'content-right',
            type: 'container',
            position: { x: { value: 50, unit: '%' }, y: { value: 0, unit: 'px' } },
            size: { width: { value: 50, unit: '%' }, height: { value: 100, unit: '%' } },
            style: {
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            },
            content: 'Content sectie rechts',
            layout: { positioning: 'relative' },
            parent: 'content-row-1'
          },
          {
            id: 'content-row-2',
            type: 'container',
            position: { x: { value: 0, unit: 'px' }, y: { value: 100, unit: 'vh' } },
            size: { width: { value: 100, unit: '%' }, height: { value: 40, unit: 'vh' } },
            style: {
              backgroundColor: '#f1f5f9',
              padding: 40,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 20
            },
            content: '',
            layout: { positioning: 'relative' }
          },
          {
            id: 'grid-item-1',
            type: 'container',
            position: { x: { value: 0, unit: 'px' }, y: { value: 0, unit: 'px' } },
            size: { width: { value: 50, unit: '%' }, height: { value: 50, unit: '%' } },
            style: {
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
            },
            content: 'Grid item 1',
            layout: { positioning: 'relative' },
            parent: 'content-row-2'
          },
          {
            id: 'grid-item-2',
            type: 'container',
            position: { x: { value: 50, unit: '%' }, y: { value: 0, unit: 'px' } },
            size: { width: { value: 50, unit: '%' }, height: { value: 50, unit: '%' } },
            style: {
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
            },
            content: 'Grid item 2',
            layout: { positioning: 'relative' },
            parent: 'content-row-2'
          },
          {
            id: 'grid-item-3',
            type: 'container',
            position: { x: { value: 0, unit: 'px' }, y: { value: 50, unit: '%' } },
            size: { width: { value: 50, unit: '%' }, height: { value: 50, unit: '%' } },
            style: {
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
            },
            content: 'Grid item 3',
            layout: { positioning: 'relative' },
            parent: 'content-row-2'
          },
          {
            id: 'grid-item-4',
            type: 'container',
            position: { x: { value: 50, unit: '%' }, y: { value: 50, unit: '%' } },
            size: { width: { value: 50, unit: '%' }, height: { value: 50, unit: '%' } },
            style: {
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
            },
            content: 'Grid item 4',
            layout: { positioning: 'relative' },
            parent: 'content-row-2'
          }
        ]
      },
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('page_builder_pages')
        .select('*')
        .eq('is_template', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Combine built-in templates with user templates
      // Note: Database pages don't have template_data field yet, so we'll use built-in templates only for now
      setTemplates(builtInTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback to built-in templates only
      setTemplates(builtInTemplates);
      toast({
        title: "Waarschuwing",
        description: "Kon aangepaste templates niet laden, toon alleen standaard templates.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.template_category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const getCategories = () => {
    const categories = templates.reduce((acc, template) => {
      if (template.template_category && !acc.includes(template.template_category)) {
        acc.push(template.template_category);
      }
      return acc;
    }, [] as string[]);
    return ['all', ...categories];
  };

  const getCategoryDisplayName = (category: string) => {
    const names: { [key: string]: string } = {
      'all': 'Alle',
      'basic': 'Basis',
      'landing': 'Landing',
      'contact': 'Contact',
      'product': 'Product',
      'blog': 'Blog',
      'portfolio': 'Portfolio',
      'homepage': 'Homepage',
      'media': 'Media',
      'slideshow': 'Slideshow',
      'layout': 'Layout'
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Templates laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Template Bibliotheek</h1>
            <p className="text-muted-foreground mt-1">
              Kies een template om snel te starten
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Zoek templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {getCategories().map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {getCategoryDisplayName(category)}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.template_category && (
                  <Badge variant="secondary">
                    {getCategoryDisplayName(template.template_category)}
                  </Badge>
                )}
              </div>
              {template.description && (
                <CardDescription className="line-clamp-3">
                  {template.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => onSelectTemplate(template.template_data)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Gebruiken
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement preview
                    toast({
                      title: "Preview",
                      description: "Preview functionaliteit komt binnenkort beschikbaar."
                    });
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Geen templates gevonden</h3>
            <p className="text-muted-foreground mb-6">
              Probeer je zoekopdracht aan te passen of kies een andere categorie
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}>
              Filters wissen
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};