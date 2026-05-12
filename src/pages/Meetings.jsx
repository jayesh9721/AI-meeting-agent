import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus,
  Video,
  Users,
  Clock,
  Eye,
  Calendar,
  X,
  ExternalLink,
  Mail,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { supabase } from '../lib/supabase';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState([
    { label: 'Total Meetings', value: '0', change: '0%', trend: 'up', icon: Video, color: 'purple' },
    { label: 'Meetings This Month', value: '0', change: '0%', trend: 'up', icon: Calendar, color: 'orange' },
    { label: 'Total Participants', value: '0', change: '0%', trend: 'up', icon: Users, color: 'green' },
    { label: 'Total Recordings', value: '0', change: '100%', trend: 'up', icon: Clock, color: 'blue' },
  ]);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fathom_meetings')
        .select('*')
        .order('recording_start_time', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedMeetings = data.map(m => {
          const startDate = new Date(m.recording_start_time || m.inserted_at);
          const attendeesList = Array.isArray(m.attendees) ? m.attendees : [];
          
          return {
            ...m,
            formattedDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            formattedTime: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            duration: m.recording_start_time && m.recording_end_time 
              ? `${Math.round((new Date(m.recording_end_time) - new Date(m.recording_start_time)) / 60000)} min`
              : 'N/A',
            platform: m.share_url?.includes('zoom') ? 'zoom' : m.share_url?.includes('teams') ? 'teams' : 'meet',
            participantInitials: attendeesList.slice(0, 3).map(a => (a.name || a.email || '?')[0].toUpperCase()),
            extraParticipants: Math.max(0, attendeesList.length - 3)
          };
        });

        setMeetings(formattedMeetings);
        
        const totalParticipants = data.reduce((acc, m) => acc + (Array.isArray(m.attendees) ? m.attendees.length : 0), 0);
        const thisMonth = data.filter(m => {
          const date = new Date(m.recording_start_time || m.inserted_at);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;

        setStats([
          { label: 'Total Meetings', value: data.length.toString(), change: '12%', trend: 'up', icon: Video, color: 'purple' },
          { label: 'Meetings This Month', value: thisMonth.toString(), change: '8%', trend: 'up', icon: Calendar, color: 'orange' },
          { label: 'Total Participants', value: totalParticipants.toString(), change: '15%', trend: 'up', icon: Users, color: 'green' },
          { label: 'Total Recordings', value: data.length.toString(), change: '100%', trend: 'up', icon: Clock, color: 'blue' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFull = (meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div className="header-title">
          <h1>Meetings</h1>
          <p>All your meetings processed and organized.</p>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </section>

      <div className="card table-card">
        <div className="table-filters">
          <div className="filter-tabs">
            <button className="tab active">All Meetings</button>
            <button className="tab">Processed</button>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state">Loading meetings...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Meeting Title</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Participants</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map(meeting => (
                  <tr key={meeting.id}>
                    <td>
                      <div className="meeting-title-cell">
                        <div className="platform-icon-sm">
                          {meeting.platform === 'meet' && <div className="platform-icon meet" />}
                          {meeting.platform === 'zoom' && <div className="platform-icon zoom" />}
                          {meeting.platform === 'teams' && <div className="platform-icon teams" />}
                        </div>
                        <div className="title-info">
                          <p className="title">{meeting.meeting_title || 'Untitled Meeting'}</p>
                          <p className="host">{meeting.recorded_by_name}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="datetime-cell">
                        <p className="date">{meeting.formattedDate}</p>
                        <p className="time">{meeting.formattedTime}</p>
                      </div>
                    </td>
                    <td><p className="duration">{meeting.duration}</p></td>
                    <td>
                      <div className="participants-cell">
                        <div className="avatar-stack">
                          {meeting.participantInitials.map((p, i) => (
                            <div key={i} className="avatar-sm" style={{ backgroundColor: `hsl(${i * 60}, 70%, 80%)` }}>{p}</div>
                          ))}
                        </div>
                        {meeting.extraParticipants > 0 && <span className="extra">+{meeting.extraParticipants}</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline sm" onClick={() => handleViewFull(meeting)}>
                        <Eye size={16} />
                        <span>View Full</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && selectedMeeting && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content meeting-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className={`platform-icon-large ${selectedMeeting.platform}`}></div>
                <div>
                  <h2>{selectedMeeting.meeting_title}</h2>
                  <p className="modal-subtitle">{selectedMeeting.formattedDate} at {selectedMeeting.formattedTime}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-main">
                  <div className="modal-section">
                    <h3>Meeting Summary</h3>
                    <div className="summary-text">
                      {selectedMeeting.meeting_summary || 'No summary available for this meeting.'}
                    </div>
                  </div>
                  
                  <div className="modal-section">
                    <h3>Attendees ({selectedMeeting.attendees?.length || 0})</h3>
                    <div className="attendee-list">
                      {selectedMeeting.attendees?.map((a, i) => (
                        <div key={i} className="attendee-item">
                          <div className="attendee-avatar">{ (a.name || a.email || '?')[0].toUpperCase() }</div>
                          <div className="attendee-info">
                            <p className="name">{a.name || 'Anonymous'}</p>
                            <p className="email">{a.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="modal-sidebar">
                  <div className="info-card">
                    <h4>Recording Info</h4>
                    <div className="info-item">
                      <Clock size={16} />
                      <span>Duration: {selectedMeeting.duration}</span>
                    </div>
                    <div className="info-item">
                      <User size={16} />
                      <span>Recorded by: {selectedMeeting.recorded_by_name}</span>
                    </div>
                    <div className="info-item">
                      <Mail size={16} />
                      <span className="truncate">{selectedMeeting.recorded_by_email}</span>
                    </div>
                  </div>

                  <div className="info-card links">
                    <h4>Links</h4>
                    {selectedMeeting.share_url && (
                      <a href={selectedMeeting.share_url} target="_blank" rel="noreferrer" className="link-item">
                        <ExternalLink size={16} />
                        <span>Share URL</span>
                      </a>
                    )}
                    {selectedMeeting.recording_url && (
                      <a href={selectedMeeting.recording_url} target="_blank" rel="noreferrer" className="link-item">
                        <Video size={16} />
                        <span>Recording URL</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .btn.sm { padding: 6px 12px; font-size: 13px; }
        .btn-outline { border: 1px solid var(--border); color: var(--text-main); }
        .btn-outline:hover { background: var(--bg-main); }

        .loading-state { padding: 3rem; text-align: center; color: var(--text-muted); }
        .meeting-title-cell { display: flex; align-items: center; gap: 12px; }
        .platform-icon-sm { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 6px; }
        .title-info .title { font-size: 14px; font-weight: 600; }
        .title-info .host { font-size: 12px; color: var(--text-muted); }

        .datetime-cell .date { font-size: 13px; font-weight: 600; }
        .datetime-cell .time { font-size: 11px; color: var(--text-muted); }

        .duration { font-size: 13px; color: var(--text-muted); }

        .participants-cell { display: flex; align-items: center; gap: 8px; }
        .avatar-sm { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; border: 1.5px solid white; margin-left: -8px; }
        .avatar-sm:first-child { margin-left: 0; }
        .participants-cell .extra { font-size: 11px; color: var(--text-muted); font-weight: 500; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .meeting-modal { 
          width: 95%; 
          max-width: 1100px; 
          max-height: 90vh; 
          display: flex; 
          flex-direction: column; 
          background: white; 
          border-radius: 20px; 
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 { font-size: 22px; color: var(--text-main); margin: 0; }
        .modal-header-left { display: flex; align-items: center; gap: 1rem; }
        .modal-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
        
        .modal-body {
          flex: 1;
          overflow-y: auto;
        }

        .modal-grid { display: grid; grid-template-columns: 1.8fr 1.2fr; gap: 2rem; padding: 2rem; }
        .modal-section { margin-bottom: 2.5rem; }
        .modal-section h3 { font-size: 18px; margin-bottom: 1.25rem; color: var(--text-main); font-weight: 700; border-left: 4px solid var(--primary); padding-left: 12px; }
        .summary-text { line-height: 1.8; color: #334155; font-size: 15px; white-space: pre-wrap; background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px solid #f1f5f9; }

        .platform-icon-large { width: 44px; height: 44px; background-size: contain; background-repeat: no-repeat; }
        .platform-icon-large.meet { background-image: url('https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg'); }
        .platform-icon-large.zoom { background-image: url('https://upload.wikimedia.org/wikipedia/commons/9/94/Zoom_Video_Communications_logo.svg'); }
        .platform-icon-large.teams { background-image: url('https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg'); }

        .attendee-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .attendee-item { display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid var(--border-light); border-radius: 8px; }
        .attendee-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
        .attendee-info .name { font-size: 13px; font-weight: 600; }
        .attendee-info .email { font-size: 11px; color: var(--text-muted); }

        .info-card { background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; }
        .info-card h4 { font-size: 14px; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-light); }
        .info-item { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px; color: var(--text-main); }
        .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        
        .link-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: white; border-radius: 8px; margin-bottom: 8px; font-size: 14px; color: var(--primary); font-weight: 600; border: 1px solid var(--border); transition: all 0.2s; }
        .link-item:hover { border-color: var(--primary); background: var(--primary-light); }

        .platform-icon { width: 18px; height: 18px; background-size: contain; background-repeat: no-repeat; background-position: center; }
        .platform-icon.meet { background-image: url('https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg'); }
        .platform-icon.zoom { background-image: url('https://upload.wikimedia.org/wikipedia/commons/9/94/Zoom_Video_Communications_logo.svg'); }
        .platform-icon.teams { background-image: url('https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg'); }
      `}} />
    </div>
  );
};

export default Meetings;
