import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ErrorProvider } from '@/contexts/ErrorContext'
import { ToastNotifications } from '@/components/Notifications/ToastNotifications'
import { ErrorToastContainer } from '@/components/ErrorToast'
import { ErrorBoundary } from '@/components/ErrorDisplay'
import { Navigation } from '@/components/composite/Navigation'
import { HomePage } from '@/pages/HomePage'
import { ExplorePage } from '@/pages/ExplorePage'
import { MintPage } from '@/pages/MintPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { UserSettingsPage } from '@/pages/UserSettingsPage'

function App() {
    return (
        <ErrorBoundary>
            <NotificationProvider>
                <ErrorProvider>
                    <Router>
                        <div className="min-h-screen bg-gray-50">
                            <Navigation />
                            <main>
                                <Routes>
                                    <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                                    <Route path="/explore" element={<ErrorBoundary><ExplorePage /></ErrorBoundary>} />
                                    <Route path="/mint" element={<ErrorBoundary><MintPage /></ErrorBoundary>} />
                                    <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                                    <Route path="/settings" element={<ErrorBoundary><UserSettingsPage /></ErrorBoundary>} />
                                </Routes>
                            </main>
                            <ToastNotifications />
                            <ErrorToastContainer />
                        </div>
                    </Router>
                </ErrorProvider>
            </NotificationProvider>
        </ErrorBoundary>
    )
}

export default App