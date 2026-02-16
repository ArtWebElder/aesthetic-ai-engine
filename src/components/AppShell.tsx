import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/fake-auth';
import SidebarNav from './SidebarNav';
import Topbar from './Topbar';
import CommandBar from './CommandBar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const AppShell = () => {
  const { isAuthed } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex w-full noise-overlay">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block shrink-0 relative z-10">
        <SidebarNav />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <SidebarNav onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <CommandBar />
    </div>
  );
};

export default AppShell;
