import { Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/composite/Navigation';
import { ArtworkPage } from './pages/ArtworkPage';
import { UserSettingsPage } from './pages/UserSettingsPage';
import SearchTest from './pages/SearchTest';
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<SearchTest />} />
          <Route path="/explore" element={<SearchTest />} />
          <Route path="/artwork/:id" element={<ArtworkPage />} />
          <Route path="/profile" element={<UserSettingsPage />} />
          <Route path="/mint" element={
            <div className="flex items-center justify-center p-20 text-secondary-500">
              Mint Page (Coming Soon)
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Language Toggle for testing */}
      <div className="fixed bottom-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-lg border border-secondary-200 shadow-sm flex gap-2">
        <button 
          onClick={() => i18n.changeLanguage('en')}
          className={`px-3 py-1 rounded text-xs font-medium ${i18n.language === 'en' ? 'bg-primary-600 text-white' : 'text-secondary-600 hover:bg-secondary-100'}`}
        >
          EN
        </button>
        <button 
          onClick={() => i18n.changeLanguage('es')}
          className={`px-3 py-1 rounded text-xs font-medium ${i18n.language === 'es' ? 'bg-primary-600 text-white' : 'text-secondary-600 hover:bg-secondary-100'}`}
        >
          ES
        </button>
      </div>
    </div>
  );
}

export default App;
