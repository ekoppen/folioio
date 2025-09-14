import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccentColor } from '@/hooks/useAccentColor';
import { useImageBrightness } from '@/hooks/useImageBrightness';
import { useTranslation } from '@/hooks/useTranslation';
import { User, LogIn, LogOut, Settings, ChevronDown, Menu, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactModal } from '@/components/ContactModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getBackendAdapter } from '@/config/backend-config';

interface NavigationPage {
  id: string;
  name: string;
  slug: string;
  parent_page_id: string | null;
  menu_order: number;
  children?: NavigationPage[];
}

interface SiteSettings {
  site_title: string;
  site_tagline?: string;
  show_site_title: boolean;
  header_transparent: boolean;
  header_blur: boolean;
  header_background_opacity: number;
  logo_url?: string;
  logo_height?: number;
  logo_position?: 'left' | 'center' | 'right';
  logo_margin_top?: number;
  logo_margin_left?: number;
  logo_shadow?: boolean;
  nav_title_visible?: boolean;
  nav_tagline_visible?: boolean;
  nav_title_font_family?: string;
  nav_title_font_url?: string;
  nav_tagline_font_family?: string;
  nav_tagline_font_url?: string;
  nav_title_font_size?: number;
  nav_tagline_font_size?: number;
  nav_title_color?: string;
  nav_tagline_color?: string;
  nav_title_margin_top?: number;
  nav_title_margin_left?: number;
  nav_tagline_margin_top?: number;
  nav_tagline_margin_left?: number;
  nav_text_shadow?: boolean;
}

const Navigation = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [pages, setPages] = useState<NavigationPage[]>([]);
  const [customSections, setCustomSections] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_title: 'Portfolio',
    show_site_title: true,
    header_transparent: true,
    header_blur: true,
    header_background_opacity: 0.8,
    logo_position: 'left',
    logo_margin_top: 0,
    logo_margin_left: 0,
    logo_shadow: false
  });
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const isBackgroundLight = useImageBrightness();
  
  useAccentColor(); // Initialize dynamic accent color

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load custom fonts for navigation title/tagline
  useEffect(() => {
    const loadFont = (fontFamily: string, fontUrl?: string) => {
      if (!fontUrl) return;

      // Check if font is already loaded
      const existingStyle = document.querySelector(`[data-font-family="${fontFamily}"]`);
      if (existingStyle) return;

      // Load custom font
      const style = document.createElement('style');
      style.setAttribute('data-font-family', fontFamily);
      style.textContent = `
        @font-face {
          font-family: '${fontFamily}';
          src: url('${fontUrl}') format('woff2'),
               url('${fontUrl}') format('woff'),
               url('${fontUrl}') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
    };

    if (siteSettings.nav_title_font_url && siteSettings.nav_title_font_family) {
      loadFont(siteSettings.nav_title_font_family, siteSettings.nav_title_font_url);
    }
    
    if (siteSettings.nav_tagline_font_url && siteSettings.nav_tagline_font_family) {
      loadFont(siteSettings.nav_tagline_font_family, siteSettings.nav_tagline_font_url);
    }
  }, [siteSettings.nav_title_font_family, siteSettings.nav_title_font_url, siteSettings.nav_tagline_font_family, siteSettings.nav_tagline_font_url]);

  useEffect(() => {
    const loadPages = async () => {
      const backend = getBackendAdapter();
      const { data } = await backend
        .from('page_builder_pages')
        .select('id, name, slug, parent_page_id, menu_order')
        .eq('is_published', true)
        .order('menu_order');
        
      if (data) {
        // Build hierarchical structure
        const pageMap = new Map<string, NavigationPage>();
        const rootPages: NavigationPage[] = [];
        
        // First pass: create all pages
        data.forEach(page => {
          pageMap.set(page.id, { ...page, children: [] });
        });
        
        // Second pass: build hierarchy
        data.forEach(page => {
          const pageObj = pageMap.get(page.id)!;
          if (page.parent_page_id) {
            const parent = pageMap.get(page.parent_page_id);
            if (parent) {
              parent.children!.push(pageObj);
            }
          } else {
            rootPages.push(pageObj);
          }
        });
        
        setPages(rootPages);
      }
    };

    const loadSettings = async () => {
      const backend = getBackendAdapter();
      const { data } = await backend
        .from('site_settings')
        .select('site_title, show_site_title, header_transparent, header_blur, header_background_opacity, logo_url, logo_height, logo_position, logo_margin_top, logo_margin_left, logo_shadow, nav_title_visible, nav_tagline_visible, nav_title_font_family, nav_title_font_url, nav_tagline_font_family, nav_tagline_font_url, nav_title_font_size, nav_tagline_font_size, nav_title_color, nav_tagline_color, nav_title_margin_top, nav_title_margin_left, nav_tagline_margin_top, nav_tagline_margin_left, nav_text_shadow, site_tagline')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (data) {
        setSiteSettings({
          site_title: data.site_title || 'Portfolio',
          site_tagline: data.site_tagline || '',
          show_site_title: data.show_site_title ?? true,
          header_transparent: data.header_transparent ?? true,
          header_blur: data.header_blur ?? true,
          header_background_opacity: data.header_background_opacity ?? 0.8,
          logo_url: data.logo_url || undefined,
          logo_height: data.logo_height ?? 32,
          logo_position: (data.logo_position as 'left' | 'center' | 'right') ?? 'left',
          logo_margin_top: data.logo_margin_top ?? 0,
          logo_margin_left: data.logo_margin_left ?? 0,
          logo_shadow: data.logo_shadow ?? false,
          nav_title_visible: data.nav_title_visible ?? false,
          nav_tagline_visible: data.nav_tagline_visible ?? false,
          nav_title_font_family: data.nav_title_font_family || 'Inter',
          nav_title_font_url: data.nav_title_font_url || '',
          nav_tagline_font_family: data.nav_tagline_font_family || 'Inter',
          nav_tagline_font_url: data.nav_tagline_font_url || '',
          nav_title_font_size: data.nav_title_font_size ?? 24,
          nav_tagline_font_size: data.nav_tagline_font_size ?? 14,
          nav_title_color: data.nav_title_color || '#ffffff',
          nav_tagline_color: data.nav_tagline_color || '#ffffff',
          nav_title_margin_top: data.nav_title_margin_top ?? 0,
          nav_title_margin_left: data.nav_title_margin_left ?? 0,
          nav_tagline_margin_top: data.nav_tagline_margin_top ?? 0,
          nav_tagline_margin_left: data.nav_tagline_margin_left ?? 0,
          nav_text_shadow: data.nav_text_shadow ?? false
        });
      }
    };
    
    const loadCustomSections = async () => {
      try {
        const response = await fetch('/api/custom-sections');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCustomSections(data.data.filter((section: any) => section.show_in_navigation));
          }
        }
      } catch (error) {
        console.error('Error loading custom sections:', error);
      }
    };

    loadPages();
    loadSettings();
    loadCustomSections();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Get actual header height dynamically
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 80;
      
      // Use a more reliable scroll method
      setTimeout(() => {
        const elementTop = element.offsetTop - headerHeight - 10; // Small buffer
        window.scrollTo({ 
          top: Math.max(0, elementTop), // Ensure we don't scroll to negative values
          behavior: 'smooth' 
        });
      }, 10); // Small delay to ensure layout is settled
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      siteSettings.header_transparent && (isScrolled || isBackgroundLight)
        ? `bg-black/${Math.round(siteSettings.header_background_opacity * 100)} ${siteSettings.header_blur ? 'backdrop-blur-md' : ''}` 
        : siteSettings.header_transparent 
          ? 'bg-transparent'
          : 'bg-black/90'
    }`}>
      <nav className="container mx-auto px-6 py-4 relative">
        <div className={`flex items-center h-6 ${siteSettings.logo_position === 'center' ? 'justify-center' : siteSettings.logo_position === 'right' ? 'justify-end' : 'justify-between'}`} style={{ height: '24px' }}>
          {siteSettings.logo_position !== 'center' && siteSettings.logo_position !== 'right' && (
            <div className="flex items-center gap-4">
              {siteSettings.logo_url && (
                <img 
                  src={siteSettings.logo_url} 
                  alt="Logo" 
                  className="w-auto absolute z-10 md:h-6 lg:h-8"
                  style={{ 
                    height: `${siteSettings.logo_height || 32}px`,
                    marginTop: `${siteSettings.logo_margin_top || 0}px`,
                    marginLeft: `${siteSettings.logo_margin_left || 0}px`,
                    filter: siteSettings.logo_shadow ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
                  }}
                />
              )}
              {siteSettings.show_site_title && (
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-2xl font-bold text-white">
                  {siteSettings.site_title}
                </button>
              )}
              {/* Navigation Title and Tagline */}
              <div className="flex flex-col">
                {siteSettings.nav_title_visible && siteSettings.site_title && (
                  <div
                    className="font-semibold leading-tight"
                    style={{
                      fontFamily: siteSettings.nav_title_font_url ? `'${siteSettings.nav_title_font_family}', sans-serif` : siteSettings.nav_title_font_family || 'Inter',
                      fontSize: `${siteSettings.nav_title_font_size || 24}px`,
                      color: siteSettings.nav_title_color || '#ffffff',
                      marginTop: `${siteSettings.nav_title_margin_top || 0}px`,
                      marginLeft: `${siteSettings.nav_title_margin_left || 0}px`,
                      textShadow: siteSettings.nav_text_shadow ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                    }}
                  >
                    {siteSettings.site_title}
                  </div>
                )}
                {siteSettings.nav_tagline_visible && siteSettings.site_tagline && (
                  <div
                    className="text-sm opacity-90 leading-tight"
                    style={{
                      fontFamily: siteSettings.nav_tagline_font_url ? `'${siteSettings.nav_tagline_font_family}', sans-serif` : siteSettings.nav_tagline_font_family || 'Inter',
                      fontSize: `${siteSettings.nav_tagline_font_size || 14}px`,
                      color: siteSettings.nav_tagline_color || '#ffffff',
                      marginTop: `${siteSettings.nav_tagline_margin_top || 0}px`,
                      marginLeft: `${siteSettings.nav_tagline_margin_left || 0}px`,
                      textShadow: siteSettings.nav_text_shadow ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                    }}
                  >
                    {siteSettings.site_tagline}
                  </div>
                )}
              </div>
            </div>
          )}

          {siteSettings.logo_position === 'center' && (
            <div className="flex items-center gap-4">
              {siteSettings.logo_url && (
                <img 
                  src={siteSettings.logo_url} 
                  alt="Logo" 
                  className="w-auto absolute z-10 md:h-6 lg:h-8"
                  style={{ 
                    height: `${siteSettings.logo_height || 32}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: `${siteSettings.logo_margin_top || 0}px`,
                    filter: siteSettings.logo_shadow ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
                  }}
                />
              )}
              {siteSettings.show_site_title && (
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-2xl font-bold text-white">
                  {siteSettings.site_title}
                </button>
              )}
              {/* Navigation Title and Tagline */}
              <div className="flex flex-col">
                {siteSettings.nav_title_visible && siteSettings.site_title && (
                  <div
                    className="font-semibold leading-tight"
                    style={{
                      fontFamily: siteSettings.nav_title_font_url ? `'${siteSettings.nav_title_font_family}', sans-serif` : siteSettings.nav_title_font_family || 'Inter',
                      fontSize: `${siteSettings.nav_title_font_size || 24}px`,
                      color: siteSettings.nav_title_color || '#ffffff',
                      marginTop: `${siteSettings.nav_title_margin_top || 0}px`,
                      marginLeft: `${siteSettings.nav_title_margin_left || 0}px`,
                      textShadow: siteSettings.nav_text_shadow ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                    }}
                  >
                    {siteSettings.site_title}
                  </div>
                )}
                {siteSettings.nav_tagline_visible && siteSettings.site_tagline && (
                  <div
                    className="text-sm opacity-90 leading-tight"
                    style={{
                      fontFamily: siteSettings.nav_tagline_font_url ? `'${siteSettings.nav_tagline_font_family}', sans-serif` : siteSettings.nav_tagline_font_family || 'Inter',
                      fontSize: `${siteSettings.nav_tagline_font_size || 14}px`,
                      color: siteSettings.nav_tagline_color || '#ffffff',
                      marginTop: `${siteSettings.nav_tagline_margin_top || 0}px`,
                      marginLeft: `${siteSettings.nav_tagline_margin_left || 0}px`,
                      textShadow: siteSettings.nav_text_shadow ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                    }}
                  >
                    {siteSettings.site_tagline}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="hidden md:flex items-center justify-center space-x-6 lg:space-x-8 absolute left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-white/90 hover:text-white transition-colors"
            >
              {t('nav.home', 'Home')}
            </button>
            
            <button
              onClick={() => scrollToSection('portfolio')}
              className="text-white/90 hover:text-white transition-colors"
            >
              {t('nav.portfolio', 'Portfolio')}
            </button>
            
            <button
              onClick={() => scrollToSection('about')}
              className="text-white/90 hover:text-white transition-colors"
            >
              {t('nav.about', 'Over Mij')}
            </button>
            
            {/* Custom sections in navigation */}
            {customSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(`custom-${section.slug}`)}
                className="text-white/90 hover:text-white transition-colors"
              >
                {section.title}
              </button>
            ))}
            
            {pages.map((page) => (
              <div key={page.id} className="relative">
                {page.children && page.children.length > 0 ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(page.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button className="flex items-center text-white/90 hover:text-white transition-colors">
                      {page.name}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                    {openDropdown === page.id && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
                        {page.children.map((child) => (
                          <Link
                            key={child.id}
                            to={`/${child.slug}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={`/${page.slug}`}
                    className="text-white/90 hover:text-white transition-colors"
                  >
                    {page.name}
                  </Link>
                )}
              </div>
            ))}
            
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="text-white/90 hover:text-white transition-colors flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {t('nav.contact', 'Contact')}
            </button>
          </div>

          {siteSettings.logo_position === 'right' && (
            <div className="flex items-center gap-4">
              {siteSettings.logo_url && (
                <img 
                  src={siteSettings.logo_url} 
                  alt="Logo" 
                  className="w-auto absolute z-10 md:h-6 lg:h-8"
                  style={{ 
                    height: `${siteSettings.logo_height || 32}px`,
                    right: `${siteSettings.logo_margin_left || 0}px`,
                    marginTop: `${siteSettings.logo_margin_top || 0}px`,
                    filter: siteSettings.logo_shadow ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
                  }}
                />
              )}
              {siteSettings.show_site_title && (
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-2xl font-bold text-white">
                  {siteSettings.site_title}
                </button>
              )}
              {/* Navigation Title and Tagline */}
              <div className="flex flex-col">
                {siteSettings.nav_title_visible && siteSettings.site_title && (
                  <div
                    className="font-semibold leading-tight"
                    style={{
                      fontFamily: siteSettings.nav_title_font_url ? `'${siteSettings.nav_title_font_family}', sans-serif` : siteSettings.nav_title_font_family || 'Inter',
                      fontSize: `${siteSettings.nav_title_font_size || 24}px`,
                      color: siteSettings.nav_title_color || '#ffffff',
                      marginTop: `${siteSettings.nav_title_margin_top || 0}px`,
                      marginLeft: `${siteSettings.nav_title_margin_left || 0}px`,
                      textShadow: siteSettings.nav_text_shadow ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                    }}
                  >
                    {siteSettings.site_title}
                  </div>
                )}
                {siteSettings.nav_tagline_visible && siteSettings.site_tagline && (
                  <div
                    className="text-sm opacity-90 leading-tight"
                    style={{
                      fontFamily: siteSettings.nav_tagline_font_url ? `'${siteSettings.nav_tagline_font_family}', sans-serif` : siteSettings.nav_tagline_font_family || 'Inter',
                      fontSize: `${siteSettings.nav_tagline_font_size || 14}px`,
                      color: siteSettings.nav_tagline_color || '#ffffff',
                      marginTop: `${siteSettings.nav_tagline_margin_top || 0}px`,
                      marginLeft: `${siteSettings.nav_tagline_margin_left || 0}px`,
                      textShadow: siteSettings.nav_text_shadow ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                    }}
                  >
                    {siteSettings.site_tagline}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            {user ? (
              <>
                {isAdmin && (
                  <Button asChild size="sm" className="text-white hover:opacity-80 transition-opacity" style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}>
                    <Link to="/admin">
                      <Settings className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:text-white hover:bg-white/20">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm">
                  <Link to="/auth">
                    <LogIn className="w-4 h-4 mr-2" />
                    {t('nav.login', 'Login')}
                  </Link>
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 top-0 backdrop-blur-sm z-50 pt-16"
            style={{ backgroundColor: 'hsla(var(--dynamic-accent) / 0.95)' }}
          >
            <div className="px-4 py-6 space-y-4">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block text-white/90 hover:text-white transition-colors py-2 w-full text-left"
              >
                {t('nav.home', 'Home')}
              </button>
              
              {pages.map((page) => (
                <div key={page.id}>
                  {page.children && page.children.length > 0 ? (
                    <div className="py-2">
                      <div className="text-white/70 font-medium mb-2">{page.name}</div>
                      {page.children.map((child) => (
                        <Link
                          key={child.id}
                          to={`/${child.slug}`}
                          className="block text-white/90 hover:text-white transition-colors py-1 pl-4"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      to={`/${page.slug}`}
                      className="block text-white/90 hover:text-white transition-colors py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {page.name}
                    </Link>
                  )}
                </div>
              ))}
              
              <button
                onClick={() => {
                  setIsContactModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors py-2 w-full text-left"
              >
                <Mail className="w-4 h-4" />
                {t('nav.contact', 'Contact')}
              </button>
              
              <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                <div className="pb-2">
                  <LanguageSwitcher />
                </div>
                {user ? (
                  <>
                    {isAdmin && (
                      <Link 
                        to="/admin"
                        className="block text-white/90 hover:text-white transition-colors py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-2 inline" />
                        {t('nav.admin', 'Admin Dashboard')}
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full text-left text-white/90 hover:text-white hover:bg-white/10 transition-colors py-2 px-2 rounded"
                    >
                      <LogOut className="w-4 h-4 mr-2 inline" />
                      {t('nav.logout', 'Logout')}
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/auth"
                    className="block text-white/90 hover:text-white transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4 mr-2 inline" />
                    {t('nav.login', 'Login')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      
      <ContactModal 
        open={isContactModalOpen} 
        onOpenChange={setIsContactModalOpen} 
      />
    </header>
  );
};

export default Navigation;