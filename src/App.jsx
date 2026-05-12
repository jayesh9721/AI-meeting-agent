import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Meetings from './pages/Meetings';
import Team from './pages/Team';
import Activities from './pages/Activities';
import Auth from './pages/Auth';
import { supabase } from './lib/supabase';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} session={session} />;
      case 'tasks':
        return <Tasks session={session} />;
      case 'meetings':
        return <Meetings />;
      case 'team':
        return <Team />;
      case 'activities':
        return <Activities />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <style dangerouslySetInnerHTML={{ __html: `
          .loading-screen {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: var(--primary);
            font-weight: 600;
          }
          .loader {
            width: 40px;
            height: 40px;
            border: 3px solid var(--primary-light);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} session={session} />
      <main className="main-content">
        {renderPage()}
      </main>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .app-container {
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        .main-content {
          flex: 1;
          width: 100%;
          height: 100vh;
          overflow-y: auto;
          background: var(--bg-main);
          display: flex;
          flex-direction: column;
        }
      `}} />
    </div>
  );
}

export default App;
