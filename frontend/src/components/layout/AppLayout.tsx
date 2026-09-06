import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopHeader } from './TopHeader';
import { CommandPalette } from '../CommandPalette';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('netguard_sidebar_collapsed');
    return saved === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('netguard_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="app-shell min-h-screen bg-[#06090F] text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      
      <div className="flex flex-1 min-h-screen relative overflow-hidden">
        
        {/* Desktop Collapsible Sidebar */}
        <div className="hidden md:flex">
          <AppSidebar 
            collapsed={sidebarCollapsed} 
            onToggle={handleToggleSidebar} 
          />
        </div>

        {/* Mobile Slide-in Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <div 
              className="w-64 h-full bg-[#080B11] border-r border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <AppSidebar 
                collapsed={false} 
                onToggle={() => setMobileSidebarOpen(false)} 
              />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TopHeader 
            onOpenSearch={() => setIsSearchOpen(true)}
            onToggleSidebarMobile={() => setMobileSidebarOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            <Outlet />
          </main>

          <footer className="border-t border-slate-800/60 bg-[#080B11]/50 py-4 px-6 text-center text-xs text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>NETGUARD AI • Posture & Configuration Intelligence Platform</span>
              <span className="text-emerald-400/80">🔒 Zero-Egress In-Memory Sanitization Baseline</span>
            </div>
          </footer>
        </div>

      </div>

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

    </div>
  );
};
