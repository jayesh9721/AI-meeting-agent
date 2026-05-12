import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Calendar, 
  CheckSquare, 
  UserPlus, 
  RefreshCw,
  Clock,
  ChevronRight,
  Filter,
  Search,
  Video,
  FileText,
  User,
  History
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        const formatted = data.map(log => ({
          ...log,
          timestamp: new Date(log.created_at),
          icon: getIcon(log.type),
          color: getColor(log.type)
        }));
        setActivities(formatted);
        applyFilters(formatted, activeFilter, searchQuery);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (allActivities, typeFilter, query) => {
    let filtered = [...allActivities];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type?.toLowerCase() === typeFilter.toLowerCase());
    }

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.description.toLowerCase().includes(q) || 
        (a.user_name && a.user_name.toLowerCase().includes(q)) ||
        (a.user_email && a.user_email.toLowerCase().includes(q))
      );
    }

    setFilteredActivities(filtered);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(activities, activeFilter, query);
  };

  const handleFilterChange = (type) => {
    setActiveFilter(type);
    applyFilters(activities, type, searchQuery);
  };

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'meeting': return Video;
      case 'task': return CheckSquare;
      case 'team': return UserPlus;
      case 'member': return User;
      default: return History;
    }
  };

  const getColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'meeting': return 'blue';
      case 'task': return 'orange';
      case 'team':
      case 'member': return 'green';
      default: return 'purple';
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div className="header-title">
          <h1>Organization Activities</h1>
          <p>A live audit log of every movement in MeetAction.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchActivities}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </header>

      <div className="activity-container">
        <div className="activity-filters-card card">
          <div className="modern-search-container compact">
            <Search size={18} className="modern-search-icon" />
            <input 
              type="text" 
              placeholder="Search movements, people, or descriptions..." 
              className="modern-search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div className="filter-chips-group">
            {['all', 'meetings', 'task', 'team'].map(type => (
              <button 
                key={type}
                className={`filter-chip ${activeFilter === type ? 'active' : ''}`}
                onClick={() => handleFilterChange(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('s', ' Events')}
              </button>
            ))}
          </div>
        </div>

        <div className="activity-list card">
          {loading ? (
            <div className="loading-state">Syncing live movements...</div>
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon-wrapper ${activity.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-header">
                      <p className="activity-title">{activity.title}</p>
                      <span className="activity-time">
                        <Clock size={12} />
                        {getTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    <p className="activity-description">{activity.description}</p>
                    <div className="activity-footer">
                      <div className="activity-user">
                        <div className="user-avatar-sm">{activity.user_name?.[0]?.toUpperCase() || '?'}</div>
                        <span>{activity.user_name || 'System'}</span>
                        {activity.user_email && <span className="user-email-dot">•</span>}
                        <span className="user-email">{activity.user_email}</span>
                      </div>
                    </div>
                  </div>
                  <button className="activity-more">
                    <ChevronRight size={18} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <History size={48} className="empty-icon" />
              <h3>No activities found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .activity-container { display: flex; flex-direction: column; gap: 1.5rem; }
        .activity-filters-card { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; background: white; border: 1px solid var(--border-light); }
        .filter-chips-group { display: flex; gap: 0.75rem; }
        .filter-chip { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; color: var(--text-muted); background: #f1f5f9; transition: all 0.2s; border: none; cursor: pointer; }
        .filter-chip:hover { background: #e2e8f0; }
        .filter-chip.active { background: var(--primary); color: white; }
        
        .activity-list { padding: 0; background: white; overflow: hidden; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); }
        .activity-item { display: flex; gap: 1.5rem; padding: 1.5rem; border-bottom: 1px solid var(--border-light); transition: background 0.2s; cursor: pointer; }
        .activity-item:hover { background: #fcfcfd; }
        .activity-item:last-child { border-bottom: none; }
        .activity-icon-wrapper { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .activity-icon-wrapper.blue { background: #eff6ff; color: #2563eb; }
        .activity-icon-wrapper.orange { background: #fff7ed; color: #ea580c; }
        .activity-icon-wrapper.green { background: #f0fdf4; color: #16a34a; }
        .activity-icon-wrapper.purple { background: #f5f3ff; color: #7c3aed; }
        .activity-content { flex: 1; }
        .activity-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .activity-title { font-weight: 700; font-size: 15px; color: var(--text-main); }
        .activity-time { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
        .activity-description { font-size: 14px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.5; }
        .activity-footer { display: flex; align-items: center; gap: 1rem; }
        .activity-user { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-main); font-weight: 600; }
        .user-avatar-sm { width: 22px; height: 22px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
        .user-email-dot { color: var(--border); }
        .user-email { color: var(--text-muted); font-weight: 400; }
        .activity-more { color: var(--text-light); align-self: center; background: none; border: none; cursor: pointer; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .loading-state, .empty-state { padding: 5rem; text-align: center; color: var(--text-muted); }
        .empty-icon { color: var(--border); margin-bottom: 1.5rem; opacity: 0.5; }
        .empty-state h3 { color: var(--text-main); margin-bottom: 8px; }

        /* Modern Search UI */
        .modern-search-container {
          position: relative;
          width: 350px;
        }
        .modern-search-container.compact { width: 400px; }

        .modern-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .modern-search-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: var(--text-main);
          transition: all 0.2s;
          outline: none;
        }

        .modern-search-input:focus {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
      `}} />
    </div>
  );
};

export default Activities;
