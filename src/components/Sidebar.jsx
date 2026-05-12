import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Video, 
  CheckSquare, 
  Users, 
  Settings, 
  ChevronDown,
  Bell,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = ({ activePage, setActivePage, session }) => {
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('Member');

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('name')
        .eq('email', session.user.email)
        .single();
      
      if (data) {
        setUserName(data.name);
        // If email contains admin or is specifically set, we could handle roles here
        setUserRole('Admin'); 
      } else {
        setUserName(session.user.email.split('@')[0]);
      }
    } catch (err) {
      console.error('Error fetching sidebar user data:', err);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'activities', label: 'Activities', icon: Bell },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="6" width="4" height="12" rx="2" fill="white"/>
              <rect x="10" y="3" width="4" height="18" rx="2" fill="white"/>
              <rect x="17" y="6" width="4" height="12" rx="2" fill="white"/>
            </svg>
          </div>
          <div className="logo-text">
            <h3>MeetAction</h3>
            <span>AI Meeting Agent</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button 
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {activePage === item.id && <div className="active-indicator" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar-main">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="user-info">
            <p className="user-name">{userName}</p>
            <p className="user-role">{userRole}</p>
          </div>
          <button className="logout-btn" onClick={() => supabase.auth.signOut()} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
        }

        .sidebar-header {
          padding: 2rem 1.5rem;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--primary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1;
        }

        .logo-text span {
          font-size: 12px;
          color: var(--text-muted);
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 0.75rem;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 1rem;
          color: var(--text-muted);
          border-radius: var(--radius-md);
          margin-bottom: 4px;
          position: relative;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .nav-item:hover {
          background: var(--border-light);
          color: var(--text-main);
        }

        .nav-item.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: var(--primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border-light);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar-main {
          width: 36px;
          height: 36px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 12px;
          color: var(--text-muted);
        }

        .logout-btn {
          color: var(--text-muted);
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: none;
          border: none;
          cursor: pointer;
        }

        .logout-btn:hover {
          background: #fee2e2;
          color: var(--danger);
        }
      `}} />
    </aside>
  );
};

export default Sidebar;
