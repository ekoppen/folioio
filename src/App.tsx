import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TranslationProvider } from "@/hooks/useTranslation";
import { useFonts } from "@/hooks/useFonts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { setupEnvironment } from "@/config/environment";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import DynamicPage from "./components/DynamicPage";

const queryClient = new QueryClient();

const FontLoader = ({ children }: { children: React.ReactNode }) => {
  // Setup environment and backend configuration
  setupEnvironment();
  useFonts();
  useAccentColor();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TranslationProvider>
        <FontLoader>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<Admin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="/:slug" element={<DynamicPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </FontLoader>
      </TranslationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
