import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import PendingPage from "@/pages/PendingPage";
import ParentPortal from "@/pages/ParentPortal";
import DashboardHome from "@/pages/DashboardHome";
import AlertsPage from "@/pages/AlertsPage";
import CalendarPage from "@/pages/CalendarPage";
import ComunicadosPage from "@/pages/ComunicadosPage";
import TeacherNotesPage from "@/pages/TeacherNotesPage";
import GalleryPage from "@/pages/GalleryPage";
import PaymentsPage from "@/pages/PaymentsPage";
import BirthdaysPage from "@/pages/BirthdaysPage";
import ThanksPage from "@/pages/ThanksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl gradient-warm mx-auto animate-pulse" />
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  // Pending users see a waiting screen
  if (user?.role === "pendiente") return <PendingPage />;

  // Parents go to their portal
  if (user?.role === "padre") return <ParentPortal />;

  // Staff (directora, maestro) see the dashboard
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/avisos" element={<AlertsPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/comunicados" element={<ComunicadosPage />} />
        <Route path="/notas" element={<TeacherNotesPage />} />
        <Route path="/galeria" element={<GalleryPage />} />
        <Route path="/pagos" element={<PaymentsPage />} />
        <Route path="/cumpleanos" element={<BirthdaysPage />} />
        <Route path="/agradecimientos" element={<ThanksPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
