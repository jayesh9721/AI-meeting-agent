import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Plus, 
  ArrowRight, 
  MoreVertical, 
  Video, 
  ClipboardList, 
  Users, 
  Clock,
  X,
  ExternalLink,
  Edit2,
  CheckCircle,
  Eye,
  Mail,
  User,
  Calendar
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { supabase, logActivity } from '../lib/supabase';

const Dashboard = ({ setActivePage, session }) => {
  const [tasks, setTasks] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [allUpcomingMeetings, setAllUpcomingMeetings] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isAllMeetingsModalOpen, setIsAllMeetingsModalOpen] = useState(false);
  const [isAddMeetingModalOpen, setIsAddMeetingModalOpen] = useState(false);
  const [isSingleMeetingModalOpen, setIsSingleMeetingModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Forms
  const [meetingForm, setMeetingForm] = useState({ title: '', startTime: '', organizerEmail: '', meetLink: '' });
  const [taskForm, setTaskForm] = useState({ title: '', priority: '', status: '', assignee: '' });
  
  // Stats
  const [stats, setStats] = useState([
    { label: 'Total Meetings', value: '0', change: '12', trend: 'up', icon: Video, color: 'purple' },
    { label: 'Total Tasks', value: '0', change: '4', trend: 'up', icon: ClipboardList, color: 'orange' },
    { label: 'Pending Tasks', value: '0', change: '18', trend: 'down', icon: ClipboardList, color: 'green' },
    { label: 'Completed', value: '0', change: '1', trend: 'up', icon: CheckCircle, color: 'blue' },
  ]);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (session?.user?.email) {
        const { data: userData } = await supabase
          .from('team_members')
          .select('*')
          .eq('email', session.user.email)
          .single();
        if (userData) setCurrentUser(userData);
      }

      const { data: meetingData } = await supabase.from('fathom_meetings').select('*');
      const { data: taskData } = await supabase.from('fathom_meeting_tasks').select('*');
      const { data: upcomingData } = await supabase.from('upcoming_meetings').select('*').order('start_time', { ascending: true });
      const { data: teamData } = await supabase.from('team_members').select('name, email');

      if (teamData) setTeamMembers(teamData);

      if (upcomingData) {
        setAllUpcomingMeetings(upcomingData);
        setUpcomingMeetings(upcomingData.slice(0, 4).map(m => ({
          ...m,
          id: m.id,
          title: m.title || 'Untitled Meeting',
          date: new Date(m.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: new Date(m.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          link: m.meet_link,
          attendeeCount: Array.isArray(m.attendees) ? m.attendees.length : 0,
          icon: m.meet_link?.includes('zoom') ? 'zoom' : m.meet_link?.includes('teams') ? 'teams' : 'google-meet'
        })));
      }

      if (taskData) {
        const highPriorityTasks = [];
        taskData.forEach(m => {
          const actionItems = Array.isArray(m.action_items) ? m.action_items : [];
          actionItems.forEach((item, index) => {
            const priority = (item.priority || 'Medium').toUpperCase();
            if (priority === 'HIGH') {
              highPriorityTasks.push({
                id: `${m.id}-${index}`,
                originalRowId: m.id,
                taskIndex: index,
                title: typeof item === 'string' ? item : item.task || 'Task',
                project: m.meeting_title,
                assignee: m.person,
                priority: 'High',
                initial: m.person?.[0] || '?',
                color: ['purple', 'orange', 'green', 'blue'][highPriorityTasks.length % 4],
                status: item.status || 'Pending'
              });
            }
          });
        });
        setTasks(highPriorityTasks);

        const totalMeetings = meetingData?.length || 0;
        const totalTasks = taskData.reduce((acc, m) => acc + (Array.isArray(m.action_items) ? m.action_items.length : 0), 0);
        const pendingTasks = taskData.reduce((acc, m) => acc + (Array.isArray(m.action_items) ? m.action_items.filter(i => i.status !== 'Completed').length : 0), 0);
        const completedTasks = totalTasks - pendingTasks;

        setStats([
          { label: 'Total Meetings', value: totalMeetings.toString(), change: '12', trend: 'up', icon: Video, color: 'purple' },
          { label: 'Total Tasks', value: totalTasks.toString(), change: '4', trend: 'up', icon: ClipboardList, color: 'orange' },
          { label: 'Pending Tasks', value: pendingTasks.toString(), change: '18', trend: 'down', icon: ClipboardList, color: 'green' },
          { label: 'Completed', value: completedTasks.toString(), change: '1', trend: 'up', icon: CheckCircle, color: 'blue' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee
    });
    setIsEditTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    try {
      const { data: row } = await supabase
        .from('fathom_meeting_tasks')
        .select('action_items')
        .eq('id', selectedTask.originalRowId)
        .single();

      const updatedActionItems = [...row.action_items];
      const item = updatedActionItems[selectedTask.taskIndex];
      
      updatedActionItems[selectedTask.taskIndex] = {
        ...(typeof item === 'string' ? { task: item } : item),
        task: taskForm.title,
        priority: taskForm.priority,
        status: taskForm.status
      };

      await supabase
        .from('fathom_meeting_tasks')
        .update({ action_items: updatedActionItems, person: taskForm.assignee })
        .eq('id', selectedTask.originalRowId);

      logActivity({
        type: 'task',
        title: 'Task Details Updated',
        description: `Task "${taskForm.title}" was modified (Status: ${taskForm.status}, Priority: ${taskForm.priority}) by ${currentUser?.name || 'User'}.`,
        user_name: currentUser?.name || session?.user?.email,
        user_email: session?.user?.email,
        metadata: { task_id: selectedTask.id, status: taskForm.status }
      });

      setIsEditTaskModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error saving task: ' + err.message);
    }
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('upcoming_meetings')
        .insert([{
          title: meetingForm.title,
          start_time: meetingForm.startTime,
          organizer_email: meetingForm.organizerEmail || session?.user?.email,
          meet_link: meetingForm.meetLink,
          attendees: []
        }]);

      if (error) throw error;

      logActivity({
        type: 'meeting',
        title: 'Upcoming Meeting Added',
        description: `New meeting "${meetingForm.title}" scheduled for ${new Date(meetingForm.startTime).toLocaleString()}.`,
        user_name: currentUser?.name || session?.user?.email,
        user_email: session?.user?.email,
        metadata: { title: meetingForm.title }
      });

      setIsAddMeetingModalOpen(false);
      setMeetingForm({ title: '', startTime: '', organizerEmail: '', meetLink: '' });
      fetchData();
    } catch (err) {
      alert('Error adding meeting: ' + err.message);
    }
  };

  const handleViewMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setIsSingleMeetingModalOpen(true);
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div className="header-title">
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening today.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddMeetingModalOpen(true)}>
            <Plus size={18} />
            <span>Add Meeting</span>
          </button>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </section>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-header">
            <h3>Today's Important Tasks</h3>
            <button className="text-link" onClick={() => setActivePage('tasks')}>View all tasks <ArrowRight size={14} /></button>
          </div>
          <div className="list-container">
            {loading ? <p>Loading tasks...</p> : tasks.length > 0 ? tasks.map(task => {
              const canEdit = currentUser && task.assignee === currentUser.name;
              return (
                <div key={task.id} className="list-item">
                  <div className={`initial-avatar ${task.color}`}>{task.initial}</div>
                  <div className="item-main">
                    <p className="item-name">{task.assignee}</p>
                    <div className="item-details">
                      <p className="item-title">{task.title}</p>
                      <p className="item-sub">{task.project}</p>
                    </div>
                  </div>
                  <div className="item-meta">
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                    {canEdit && (
                      <button className="action-btn-icon" onClick={() => handleEditTask(task)}>
                        <MoreVertical size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            }) : <p className="empty-state">No high priority tasks.</p>}
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="card-header">
            <h3>Upcoming Meetings</h3>
            <button className="text-link" onClick={() => setIsAllMeetingsModalOpen(true)}>View all <ArrowRight size={14} /></button>
          </div>
          <div className="list-container">
            {loading ? <p>Loading meetings...</p> : upcomingMeetings.map(meeting => (
              <div key={meeting.id} className="list-item">
                <div className="meeting-icon">
                  {meeting.icon === 'google-meet' && <div className="platform-icon meet" />}
                  {meeting.icon === 'zoom' && <div className="platform-icon zoom" />}
                  {meeting.icon === 'teams' && <div className="platform-icon teams" />}
                </div>
                <div className="item-main">
                  <p className="meeting-title">{meeting.title}</p>
                  <p className="item-sub">{meeting.date} • {meeting.time}</p>
                </div>
                <div className="item-meta">
                  <span className="task-count">{meeting.attendeeCount} Attendees</span>
                  <button className="btn btn-outline sm" onClick={() => handleViewMeeting(meeting)}>
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Meeting Modal */}
      {isAddMeetingModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddMeetingModalOpen(false)}>
          <div className="modal-content sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule New Meeting</h2>
              <button className="close-btn" onClick={() => setIsAddMeetingModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddMeeting} className="modal-body">
              <div className="edit-form">
                <div className="form-group">
                  <label>Meeting Title</label>
                  <input 
                    type="text" 
                    value={meetingForm.title} 
                    onChange={e => setMeetingForm({...meetingForm, title: e.target.value})}
                    required
                    placeholder="e.g. Weekly Sync"
                  />
                </div>
                <div className="form-group">
                  <label>Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={meetingForm.startTime} 
                    onChange={e => setMeetingForm({...meetingForm, startTime: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Meeting Link (Optional)</label>
                  <input 
                    type="url" 
                    value={meetingForm.meetLink} 
                    onChange={e => setMeetingForm({...meetingForm, meetLink: e.target.value})}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '2rem', borderTop: 'none', padding: 0 }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddMeetingModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Edit Modal */}
      {isEditTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditTaskModalOpen(false)}>
          <div className="modal-content sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Task</h2>
              <button className="close-btn" onClick={() => setIsEditTaskModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="edit-form">
                <div className="form-group">
                  <label>Task Title</label>
                  <input 
                    type="text" 
                    value={taskForm.title} 
                    onChange={e => setTaskForm({...taskForm, title: e.target.value})} 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                      <option value="Pending">Pending</option>
                      <option value="In Review">In Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Assignee</label>
                  <select 
                    value={taskForm.assignee} 
                    onChange={e => setTaskForm({...taskForm, assignee: e.target.value})}
                  >
                    <option value="">Select Assignee</option>
                    {teamMembers.map(member => (
                      <option key={member.email} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsEditTaskModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveTask}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Single Meeting Details Modal */}
      {isSingleMeetingModalOpen && selectedMeeting && (
        <div className="modal-overlay" onClick={() => setIsSingleMeetingModalOpen(false)}>
          <div className="modal-content sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className={`platform-icon-large ${selectedMeeting.icon === 'google-meet' ? 'meet' : selectedMeeting.icon}`}></div>
                <div>
                  <h2 style={{ fontSize: '18px' }}>{selectedMeeting.title}</h2>
                  <p className="modal-subtitle">{selectedMeeting.date} at {selectedMeeting.time}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsSingleMeetingModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="meeting-details-compact">
                <div className="info-card">
                  <div className="info-item">
                    <Mail size={16} />
                    <span>Organizer: {selectedMeeting.organizer_email}</span>
                  </div>
                  <div className="info-item">
                    <Users size={16} />
                    <span>Attendees: {selectedMeeting.attendeeCount} people</span>
                  </div>
                </div>

                <div className="info-card links">
                  {selectedMeeting.link && (
                    <a href={selectedMeeting.link} target="_blank" rel="noreferrer" className="link-item">
                      <ExternalLink size={16} />
                      <span>Join Meeting</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for All Upcoming Meetings */}
      {isAllMeetingsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAllMeetingsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>All Upcoming Meetings</h2>
              <button className="close-btn" onClick={() => setIsAllMeetingsModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Date & Time</th>
                      <th>Organizer</th>
                      <th>Attendees</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUpcomingMeetings.map(m => (
                      <tr key={m.id}>
                        <td><div className="meeting-title">{m.title}</div></td>
                        <td>
                          <div className="datetime-cell">
                            <p className="date">{new Date(m.start_time).toLocaleDateString()}</p>
                            <p className="time">{new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </td>
                        <td><p className="host">{m.organizer_email}</p></td>
                        <td><p className="task-count-text">{Array.isArray(m.attendees) ? m.attendees.length : 0}</p></td>
                        <td>
                          {m.meet_link && (
                            <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="action-btn">
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: white; width: 90%; max-width: 900px; max-height: 80vh; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; box-shadow: var(--shadow-md); }
        .modal-content.sm { max-width: 500px; }
        .modal-header { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); }
        .modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; }
        .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border-light); display: flex; justify-content: flex-end; gap: 1rem; background: #fcfcfd; }
        
        .edit-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #344054; margin-bottom: 6px; }
        .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #d0d5dd; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s; }
        .form-group input:focus, .form-group select:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        .info-card { background: #f8fafc; padding: 1.25rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid #f1f5f9; }
        .info-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 14px; color: var(--text-main); }
        .link-item { display: flex; align-items: center; gap: 10px; padding: 12px; background: white; border-radius: 8px; font-size: 14px; color: var(--primary); font-weight: 600; border: 1px solid var(--border); justify-content: center; transition: all 0.2s; }
        .link-item:hover { background: var(--primary-light); border-color: var(--primary); }

        .platform-icon-large { width: 36px; height: 36px; background-size: contain; background-repeat: no-repeat; }
        .platform-icon-large.meet { background-image: url('https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg'); }
        .platform-icon-large.zoom { background-image: url('https://upload.wikimedia.org/wikipedia/commons/9/94/Zoom_Video_Communications_logo.svg'); }
        .platform-icon-large.teams { background-image: url('https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg'); }

        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .card-header h3 { font-size: 18px; font-weight: 600; }
        .list-container { display: flex; flex-direction: column; gap: 0.5rem; }
        .list-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-light); }
        .initial-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
        .initial-avatar.purple { background: #f5f3ff; color: #7c3aed; }
        .initial-avatar.orange { background: #fff7ed; color: #ea580c; }
        .initial-avatar.green { background: #f0fdf4; color: #16a34a; }
        .initial-avatar.blue { background: #eff6ff; color: #2563eb; }
        .item-main { flex: 1; }
        .item-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
        .item-title { font-size: 14px; font-weight: 600; }
        .item-sub { font-size: 12px; color: var(--text-muted); }
        .item-meta { display: flex; align-items: center; gap: 1rem; }
        .action-btn-icon { color: var(--text-light); transition: color 0.2s; background: none; border: none; cursor: pointer; display: flex; align-items: center; }
        .action-btn-icon:hover { color: var(--primary); }

        .meeting-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
        .platform-icon { width: 20px; height: 20px; background-size: contain; background-repeat: no-repeat; background-position: center; }
        .platform-icon.meet { background-image: url('https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg'); }
        .platform-icon.zoom { background-image: url('https://upload.wikimedia.org/wikipedia/commons/9/94/Zoom_Video_Communications_logo.svg'); }
        .platform-icon.teams { background-image: url('https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg'); }
        
        .task-count { font-size: 12px; color: var(--primary); font-weight: 600; background: var(--primary-light); padding: 4px 10px; border-radius: 20px; }
        .empty-state { padding: 2rem; text-align: center; color: var(--text-muted); font-size: 14px; }
        .btn.sm { padding: 6px 12px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
        .btn-outline { border: 1px solid var(--border); color: var(--text-main); background: white; }
        .btn-outline:hover { background: var(--bg-main); }
        .text-link { background: none; border: none; cursor: pointer; color: var(--primary); font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
      `}} />
    </div>
  );
};

export default Dashboard;
