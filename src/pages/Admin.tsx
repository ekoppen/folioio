import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SEOMetaTags } from '@/components/SEOMetaTags';
import { useAuth } from '@/hooks/useAuth';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { PageManager } from '@/components/page-editor/PageManager';
import { AdminAlbums } from '@/components/admin/AdminAlbums';
import { PageEditor } from '@/components/page-editor/PageEditor';
import { LogOut, Settings, Image, FileText, Folder, Edit, User, Phone, Globe, Layers, Shield, Users, Search } from 'lucide-react';
import AdminFooter from '@/components/admin/AdminFooter';
import AdminAbout from '@/components/admin/AdminAbout';
import AdminContact from '@/components/admin/AdminContact';
// import AdminLanguages from '@/components/admin/AdminLanguages';
import AdminCustomSections from '@/components/admin/AdminCustomSections';
import AdminAccount from '@/components/admin/AdminAccount';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminSEO from '@/components/admin/AdminSEO';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  // Handle admin deep links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Remove '#'
      const validTabs = ['settings', 'albums', 'editor', 'about', 'contact', 'custom', 'seo', 'users', 'account', 'footer'];

      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
        // Remove hash from URL after setting tab
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Check initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-portfolio-light dark:bg-portfolio-dark flex items-center justify-center">
        <div className="text-portfolio-dark dark:text-portfolio-light">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-portfolio-light dark:bg-portfolio-dark">
      <SEOMetaTags
        title="Admin Dashboard"
        description="Beheer je portfolio website - instellingen, albums, custom secties en meer"
      />
      <div className="border-b border-portfolio-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-portfolio-dark dark:text-portfolio-light">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="hover:bg-accent hover:text-accent-foreground"
              style={{ borderColor: 'var(--dynamic-accent)', color: 'var(--dynamic-accent)' }}
            >
              View Site
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="flex items-center gap-2"
              style={{ color: 'var(--dynamic-accent)' }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-11 lg:w-fit lg:grid-cols-11">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="albums" className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Albums
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Over Mij
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact
            </TabsTrigger>
            {/* <TabsTrigger value="languages" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Talen
            </TabsTrigger> */}
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Custom
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Footer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="albums">
            <AdminAlbums />
          </TabsContent>
          
          <TabsContent value="editor">
            <PageManager />
          </TabsContent>
          
          <TabsContent value="about">
            <AdminAbout />
          </TabsContent>
          
          <TabsContent value="contact">
            <AdminContact />
          </TabsContent>
          
          {/* <TabsContent value="languages">
            <AdminLanguages />
          </TabsContent> */}
          
          <TabsContent value="custom">
            <AdminCustomSections />
          </TabsContent>

          <TabsContent value="seo">
            <AdminSEO />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="account">
            <AdminAccount />
          </TabsContent>

          <TabsContent value="footer">
            <AdminFooter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;