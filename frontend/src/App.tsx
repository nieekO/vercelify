import { useState, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { useAuth } from './hooks/useAuth';

import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Projects } from './pages/Projects';
import { NewProject } from './pages/NewProject';
import { ProjectDetail } from './pages/ProjectDetail';
import { Deployments } from './pages/Deployments';
import { DeploymentDetail } from './pages/DeploymentDetail';
import { Services } from './pages/Services';
import { Servers } from './pages/Servers';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10000 } },
});

function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated === null) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <AuthGuard>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Overview />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/new" element={<NewProject />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/deployments" element={<Deployments />} />
                    <Route path="/deployments/:uuid" element={<DeploymentDetail />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/servers" element={<Servers />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </AppLayout>
              </AuthGuard>
            } />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
