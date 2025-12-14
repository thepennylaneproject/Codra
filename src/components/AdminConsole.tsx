
import { useState } from 'react';
import { AdminLayout } from './admin/AdminLayout';
import { OverviewPage } from './admin/pages/OverviewPage';
import { UsersPage } from './admin/pages/UsersPage';
import { AIProvidersPage } from './admin/pages/AIProvidersPage';
import { SettingsPage } from './admin/pages/SettingsPage';

export default function CodraAdminConsole() {
  const [activePage, setActivePage] = useState('overview');

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'users':
        return <UsersPage />;
      case 'providers':
        return <AIProvidersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background-default">
      {/* Custom font injection reused from original file */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        code, .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>

      <AdminLayout activePage={activePage} onNavigate={setActivePage}>
        {renderContent()}
      </AdminLayout>
    </div>
  );
}
