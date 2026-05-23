'use client';

import { useApp } from '@/lib/store';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { NotificationToasts } from '@/components/NotificationToasts';
import { HomeSection } from '@/components/sections/HomeSection';
import { OverviewSection } from '@/components/sections/OverviewSection';
import { UploadSection } from '@/components/sections/UploadSection';
import { FilesSection } from '@/components/sections/FilesSection';
import { SearchSection } from '@/components/sections/SearchSection';
import { AnalyticsSection } from '@/components/sections/AnalyticsSection';
import { SettingsSection } from '@/components/sections/SettingsSection';

export default function Page() {
  const { state } = useApp();
  const { activeSection } = state;

  const renderSection = () => {
    switch (activeSection) {
      case 'home': return <HomeSection />;
      case 'overview': return <OverviewSection />;
      case 'upload': return <UploadSection />;
      case 'files': return <FilesSection />;
      case 'search': return <SearchSection />;
      case 'analytics': return <AnalyticsSection />;
      case 'settings': return <SettingsSection />;
      default: return <HomeSection />;
    }
  };

  const isHome = activeSection === 'home';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Grid overlay */}
      <div className="grid-overlay" />

      {isHome ? (
        <div className="relative z-10">
          <HomeSection />
        </div>
      ) : (
        <div className="relative z-10 flex flex-col h-screen">
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto section-enter" key={activeSection}>
                {renderSection()}
              </div>
            </main>
          </div>
        </div>
      )}

      <NotificationToasts />
    </div>
  );
}
