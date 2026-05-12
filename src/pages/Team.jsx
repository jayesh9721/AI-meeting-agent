import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  MoreVertical, 
  X,
  UserPlus
} from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';

const Team = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '' });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
      applySearch(data || [], searchQuery);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const applySearch = (allMembers, query) => {
    if (!query.trim()) {
      setFilteredMembers(allMembers);
      return;
    }
    const q = query.toLowerCase();
    const filtered = allMembers.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.email.toLowerCase().includes(q) || 
      (m.mobile && m.mobile.includes(q))
    );
    setFilteredMembers(filtered);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applySearch(members, query);
  };

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({ name: member.name, mobile: member.mobile || '', email: member.email });
    } else {
      setEditingMember(null);
      setFormData({ name: '', mobile: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        const { error } = await supabase
          .from('team_members')
          .update(formData)
          .eq('id', editingMember.id);
        if (error) throw error;
        
        logActivity({
          type: 'team',
          title: 'Member Updated',
          description: `Team member "${formData.name}" information was updated.`,
          user_name: 'Admin',
          metadata: { member_email: formData.email }
        });
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert([formData]);
        if (error) throw error;

        logActivity({
          type: 'team',
          title: 'New Member Added',
          description: `${formData.name} was added to the organization team.`,
          user_name: 'Admin',
          metadata: { member_email: formData.email }
        });
      }
      setIsModalOpen(false);
      fetchMembers();
    } catch (err) {
      alert('Error saving member: ' + err.message);
    }
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div className="header-title">
          <h1>Team Management</h1>
          <p>Manage your team members and their contact information.</p>
        </div>
        <div className="header-actions">
          <div className="modern-search-container">
            <Search size={18} className="modern-search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, email, or mobile..." 
              className="modern-search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <UserPlus size={18} />
            <span>Add Member</span>
          </button>
        </div>
      </header>

      <div className="card table-card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state">Loading team members...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? filteredMembers.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div className="user-cell">
                        <div className="initial-avatar sm purple">{member.name[0]}</div>
                        <span className="task-name">{member.name}</span>
                      </div>
                    </td>
                    <td><p className="item-sub">{member.mobile || 'N/A'}</p></td>
                    <td><p className="item-sub">{member.email}</p></td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn" onClick={() => handleOpenModal(member)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn"><MoreVertical size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="empty-search-state">
                      <div className="empty-content">
                        <Search size={32} />
                        <p>No team members found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input 
                  type="text" 
                  value={formData.mobile} 
                  onChange={e => setFormData({...formData, mobile: e.target.value})} 
                  placeholder="e.g. +1 234 567 890"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  required 
                  placeholder="e.g. john@company.com"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .loading-state { padding: 3rem; text-align: center; color: var(--text-muted); }
        
        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-main);
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          border-color: var(--primary);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 2rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          width: 90%;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .modal-header {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
        }

        .modal-body { padding: 1.5rem; }

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
      `}} />
    </div>
  );
};

export default Team;
