import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Close drawer when route changes
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      closeMobile();
    }
  }, [location.pathname, closeMobile]);

  // Clickable hamburger toggle handler (collapses desktop sidebar, opens mobile drawer)
  const handleToggleMenu = useCallback(() => {
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        closeMobile();
      }
    },
    [closeMobile]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden text-text">
      {/* ── Top Header across full window width ── */}
      <Header
        onMenuClick={handleToggleMenu}
        isCollapsed={sidebarCollapsed}
      />

      {/* ── Below Navbar: Sidebar + Main Content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Desktop Sidebar with collapsible state */}
        <Sidebar mobile={false} collapsed={sidebarCollapsed} />

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}

        {/* Mobile Drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar mobile onClose={closeMobile} />
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}