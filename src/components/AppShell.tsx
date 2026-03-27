import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import SidebarNav from './SidebarNav';
import Topbar from './Topbar';
import CommandBar from './CommandBar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const AppShell = () => {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      // Cmd/Ctrl+N → new creation
      if (isMod && e.key === 'n') {
        e.preventDefault();
        navigate('/app/create');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  // DEV: auth guard temporarily disabled for visual review
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-[#141417] flex items-center justify-center">
  //       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff713d] to-[#FF9B70] flex items-center justify-center animate-pulse">
  //         <span className="text-white font-extrabold text-lg">C</span>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return (
    <div className="min-h-screen flex w-full noise-overlay">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen z-20" style={{ overflow: 'visible' }}>
        <SidebarNav />
      </aside>

      {/* Mobile sidebar — 280px drawer, always expanded */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SidebarNav onClose={() => setMobileOpen(false)} forceExpanded />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {pathname !== '/app/create/studio' && (
          <Topbar onMenuToggle={() => setMobileOpen(true)} />
        )}
        <main className="flex-1 overflow-auto bg-background" style={
          pathname === '/app/create/studio' ? { overflow: 'hidden', background: 'none', position: 'relative' } : {
            backgroundImage: [
              'radial-gradient(ellipse 700px 500px at 10% 4%, rgba(255,113,61,0.12) 0%, transparent 65%)',
              'radial-gradient(ellipse 600px 400px at 80% 8%, rgba(255,155,112,0.09) 0%, transparent 65%)',
              'radial-gradient(ellipse 500px 350px at 45% 2%, rgba(255,180,136,0.07) 0%, transparent 65%)',
            ].join(','),
          }
        }>
          {pathname === '/app/create/studio' ? (
            <Outlet />
          ) : ['/app/projects', '/app/billing'].some(p => pathname.startsWith(p)) ? (
            <div key={pathname} className="animate-fade-up max-w-6xl mx-auto w-full px-4 py-2 md:px-6 lg:px-8">
              <Outlet />
            </div>
          ) : (
            <div key={pathname} className="animate-fade-up px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      <CommandBar />
    </div>
  );
};

export default AppShell;
