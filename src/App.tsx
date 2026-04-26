import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Training from "./pages/Training";
import WorkoutStart from "./pages/WorkoutStart";
import SessionDetail from "./pages/SessionDetail";
import Schedule from "./pages/Schedule";
import Health from "./pages/Health";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import UserGuide from "./pages/UserGuide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
              <Route path="/workouts/:id/start" element={<ProtectedRoute><WorkoutStart /></ProtectedRoute>} />
              <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
              <Route path="/health" element={<ProtectedRoute><Health /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />

              {/* Redirects from old routes */}
              <Route path="/exercises" element={<Navigate to="/training?tab=library" replace />} />
              <Route path="/workouts" element={<Navigate to="/training?tab=workouts" replace />} />
              <Route path="/programs" element={<Navigate to="/training?tab=programs" replace />} />
              <Route path="/sessions" element={<Navigate to="/schedule" replace />} />
              <Route path="/snapshots" element={<Navigate to="/health" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
