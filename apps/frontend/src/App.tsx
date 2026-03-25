import { Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import  HomePage  from "@/pages/HomePage";
import { ExplorePage } from "@/pages/ExplorePage";
import { MintPage } from "@/pages/MintPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ArtworkPage } from "@/pages/ArtworkPage";
import { ErrorProvider } from "@/contexts/ErrorContext";
import { ErrorToast } from "@/components/ErrorToast";
import { ErrorBoundary } from "@/components/ErrorDisplay";
import { StellarProvider } from "@/hooks/useStellar";

function App() {
  return (
    <ErrorProvider>
      <StellarProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/mint" element={<MintPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/artwork/:id" element={<ArtworkPage />} />
              </Routes>
            </main>
            <ErrorToast />
          </div>
        </ErrorBoundary>
      </StellarProvider>
    </ErrorProvider>
  );
}

export default App;
