import React, { useEffect, useState } from 'react';
import { 
  Search, 
  MoreVertical,
  ClipboardList,
  Plus,
  X,
  User,
  Calendar,
  Filter,
  CheckSquare
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { supabase, logActivity } from '../lib/supabase';

const Tasks = ({ session }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userTeamMember, setUserTeamMember] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Add Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', priority: 'Medium', assignee: '', dueDate: '' });

  const [stats, setStats] = useState([
    { label: 'Total Tasks', value: '0', change: '0', trend: 'up', icon: ClipboardList, color: 'purple' },
    { label: 'Pending', value: '0', change: '0', trend: 'up', icon: ClipboardList, color: 'orange' },
    { label: 'Completed', value: '0', change: '0', trend: 'up', icon: ClipboardList, color: 'green' },
    { label: 'Overdue', value: '0', change: '0', trend: 'down', icon: ClipboardList, color: 'red' },
  ]);

  useEffect(() => {
    if (session) {
      fetchUserTeamData();
      fetchTeamMembers();
    }
    fetchTasks();
  }, [session]);

  const fetchUserTeamData = async () => {
    try {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      if (data) setUserTeamMember(data);
    } catch (err) {
      console.error('Error fetching user team data:', err);
    }
  };

  const fetchTeamMembers = async () => {
    const { data } = await supabase.from('team_members').select('name, email');
    if (data) setTeamMembers(data);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fathom_meeting_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const flattened = [];
        data.forEach(m => {
          const actionItems = Array.isArray(m.action_items) ? m.action_items : [];
          actionItems.forEach((item, index) => {
            flattened.push({
              id: `${m.id}-${index}`,
              originalRowId: m.id,
              taskIndex: index,
              title: typeof item === 'string' ? item : item.task || 'Task',
              project: m.meeting_title,
              assignee: m.person,
              priority: item.priority || 'Medium',
              status: item.status || 'Pending',
              due_date: item.due_date || new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              initial: m.person?.[0] || '?',
              color: ['purple', 'orange', 'green', 'blue'][flattened.length % 4],
            });
          });
        });

        setTasks(flattened);
        applyFilters(flattened, activeTab, searchQuery);
        
        // Calculate stats
        const pending = flattened.filter(t => t.status !== 'Completed').length;
        const completed = flattened.length - pending;
        const overdue = flattened.filter(t => t.status !== 'Completed' && new Date(t.due_date) < new Date()).length;

        setStats([
          { label: 'Total Tasks', value: flattened.length.toString(), change: '+12%', trend: 'up', icon: ClipboardList, color: 'purple' },
          { label: 'Pending', value: pending.toString(), change: '+5%', trend: 'up', icon: ClipboardList, color: 'orange' },
          { label: 'Completed', value: completed.toString(), change: '+8%', trend: 'up', icon: ClipboardList, color: 'green' },
          { label: 'Overdue', value: overdue.toString(), change: '-2%', trend: 'down', icon: ClipboardList, color: 'red' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (allTasks, tab, query) => {
    let filtered = [...allTasks];
    
    // Tab filter
    if (tab === 'my') {
      if (userTeamMember) {
        filtered = allTasks.filter(t => t.assignee === userTeamMember.name);
      } else {
        filtered = [];
      }
    }

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.assignee.toLowerCase().includes(q) || 
        t.project.toLowerCase().includes(q)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    applyFilters(tasks, tab, searchQuery);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(tasks, activeTab, query);
  };

  const handleUpdateTask = async (task, field, value) => {
    try {
      const { data: row } = await supabase
        .from('fathom_meeting_tasks')
        .select('action_items')
        .eq('id', task.originalRowId)
        .single();

      const updatedActionItems = [...row.action_items];
      const itemToUpdate = updatedActionItems[task.taskIndex];
      
      if (typeof itemToUpdate === 'string') {
        updatedActionItems[task.taskIndex] = {
          task: itemToUpdate,
          [field]: value
        };
      } else {
        updatedActionItems[task.taskIndex] = {
          ...itemToUpdate,
          [field]: value
        };
      }

      const { error: updateError } = await supabase
        .from('fathom_meeting_tasks')
        .update({ action_items: updatedActionItems })
        .eq('id', task.originalRowId);

      if (updateError) throw updateError;

      logActivity({
        type: 'task',
        title: 'Task Property Updated',
        description: `Task "${task.title}": ${field} changed to "${value}" by ${userTeamMember?.name || 'User'}.`,
        user_name: userTeamMember?.name || session?.user?.email,
        user_email: session?.user?.email,
        metadata: { field, value, task_id: task.id }
      });

      const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, [field]: value } : t
      );
      setTasks(updatedTasks);
      applyFilters(updatedTasks, activeTab, searchQuery);
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('fathom_meeting_tasks')
        .insert([{
          meeting_title: 'Manual Task Entry',
          person: formData.assignee,
          action_items: [{
            task: formData.title,
            priority: formData.priority,
            status: 'Pending',
            due_date: formData.dueDate || new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }]
        }]);

      if (error) throw error;

      logActivity({
        type: 'task',
        title: 'New Task Created',
        description: `A new task "${formData.title}" was manually created and assigned to ${formData.assignee}.`,
        user_name: userTeamMember?.name || session?.user?.email,
        user_email: session?.user?.email,
        metadata: { assignee: formData.assignee }
      });

      // Send webhook to n8n
      fetch('https://soxibetahr.app.n8n.cloud/webhook/52d2f692-371d-43da-a3af-133b1b8fce68', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'task_created',
          task: {
            title: formData.title,
            priority: formData.priority,
            assignee: formData.assignee,
            due_date: formData.dueDate || new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Pending'
          },
          user: {
            name: userTeamMember?.name || session?.user?.email,
            email: session?.user?.email
          }
        })
      }).catch(err => console.error('Webhook failed:', err));

      setIsModalOpen(false);
      setFormData({ title: '', priority: 'Medium', assignee: '', dueDate: '' });
      fetchTasks();
    } catch (err) {
      alert('Error adding task: ' + err.message);
    }
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div className="header-title">
          <h1>Tasks Management</h1>
          <p>Track and manage all action items from your meetings.</p>
        </div>
        <div className="header-actions">
          <div className="modern-search-container">
            <Search size={18} className="modern-search-icon" />
            <input 
              type="text" 
              placeholder="Search by task, project, or assignee..." 
              className="modern-search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Add Task</span>
          </button>
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
            <button 
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              All Tasks
            </button>
            <button 
              className={`tab ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => handleTabChange('my')}
            >
              My Tasks
            </button>
          </div>
          <button className="btn btn-outline sm">
            <Filter size={14} />
            <span>Filters</span>
          </button>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state">Syncing tasks...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Project / Meeting</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? filteredTasks.map(task => {
                  const canEdit = userTeamMember && task.assignee === userTeamMember.name;
                  
                  return (
                    <tr key={task.id}>
                      <td>
                        <div className="task-name-cell">
                          <div 
                            className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}`} 
                            onClick={() => canEdit && handleUpdateTask(task, 'status', task.status === 'Completed' ? 'Pending' : 'Completed')}
                          >
                            {task.status === 'Completed' && <CheckSquare size={14} />}
                          </div>
                          <span className={task.status === 'Completed' ? 'strikethrough' : ''}>{task.title}</span>
                        </div>
                      </td>
                      <td><p className="item-sub">{task.project}</p></td>
                      <td>
                        <div className="user-cell">
                          <div className={`initial-avatar sm ${task.color}`}>{task.initial}</div>
                          <span>{task.assignee}</span>
                        </div>
                      </td>
                      <td>
                        <select 
                          className={`priority-select ${task.priority.toLowerCase()}`}
                          value={task.priority}
                          onChange={(e) => handleUpdateTask(task, 'priority', e.target.value)}
                          disabled={!canEdit}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          type="date" 
                          className="date-input"
                          value={task.due_date}
                          onChange={(e) => handleUpdateTask(task, 'due_date', e.target.value)}
                          disabled={!canEdit}
                        />
                      </td>
                      <td>
                        <select 
                          className={`status-select ${task.status.toLowerCase().replace(' ', '-')}`}
                          value={task.status}
                          onChange={(e) => handleUpdateTask(task, 'status', e.target.value)}
                          disabled={!canEdit}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Review">In Review</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td>
                        {canEdit && (
                          <button className="action-btn"><MoreVertical size={16} /></button>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" className="empty-search-state">
                      <div className="empty-content">
                        <Search size={32} />
                        <p>No tasks found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Add New Task</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddTask} className="modal-body">
              <div className="form-group">
                <label>Task Description</label>
                <textarea 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="What needs to be done?"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '100px', fontSize: '14px' }}
                />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Assign To</label>
                <select 
                  value={formData.assignee} 
                  onChange={e => setFormData({...formData, assignee: e.target.value})}
                  required
                >
                  <option value="">Select Team Member</option>
                  {teamMembers.map(m => <option key={m.email} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .task-name-cell { display: flex; align-items: center; gap: 12px; font-weight: 500; color: var(--text-main); }
        .task-checkbox { width: 20px; height: 20px; border: 2px solid var(--border); border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--primary); background: white; }
        .task-checkbox.checked { background: var(--primary-light); border-color: var(--primary); }
        .task-checkbox.disabled { opacity: 0.5; cursor: not-allowed; background: #f8fafc; }
        .strikethrough { text-decoration: line-through; color: var(--text-muted); }
        
        .priority-select, .status-select { padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-light); font-size: 13px; font-weight: 600; outline: none; }
        .priority-select.high { color: #ef4444; background: #fee2e2; }
        .priority-select.medium { color: #f59e0b; background: #fef3c7; }
        .priority-select.low { color: #10b981; background: #d1fae5; }
        
        .status-select.completed { color: #10b981; background: #d1fae5; }
        .status-select.pending { color: #64748b; background: #f1f5f9; }
        .status-select.in-review { color: #6366f1; background: #e0e7ff; }

        .date-input { border: 1px solid var(--border-light); border-radius: 6px; padding: 4px 8px; font-size: 13px; color: var(--text-main); outline: none; }
        .user-cell { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: white; border-radius: 16px; width: 90%; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 1.5rem; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-main); }
        .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; }

        /* Modern Search UI */
        .modern-search-container {
          position: relative;
          width: 350px;
          margin-right: 12px;
        }

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

        .empty-search-state {
          padding: 4rem;
          text-align: center;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-muted);
        }

        .empty-content p {
          font-weight: 500;
        }
      `}} />
    </div>
  );
};

export default Tasks;
