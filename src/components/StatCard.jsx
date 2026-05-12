import React from 'react';

const StatCard = ({ label, value, change, trend, icon: Icon, color }) => {
  const isPositive = trend === 'up';
  
  return (
    <div className="card stat-card">
      <div className="stat-header">
        <div className={`stat-icon-wrapper ${color}`}>
          <Icon size={20} />
        </div>
        <div className="stat-info">
          <p className="stat-label">{label}</p>
          <h2 className="stat-value">{value}</h2>
          <div className="stat-trend">
            <span className={`trend-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : '-'}{change}
            </span>
            <span className="trend-label"> from last {label.includes('Task') ? 'yesterday' : '7 days'}</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .stat-card {
          flex: 1;
          min-width: 200px;
        }
        
        .stat-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.purple { background: #f5f3ff; color: #7c3aed; }
        .stat-icon-wrapper.orange { background: #fff7ed; color: #ea580c; }
        .stat-icon-wrapper.green { background: #f0fdf4; color: #16a34a; }
        .stat-icon-wrapper.red { background: #fef2f2; color: #dc2626; }
        .stat-icon-wrapper.blue { background: #eff6ff; color: #2563eb; }

        .stat-label {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.2;
        }

        .stat-trend {
          font-size: 12px;
          margin-top: 4px;
        }

        .trend-value.positive { color: var(--success); font-weight: 600; }
        .trend-value.negative { color: var(--danger); font-weight: 600; }
        .trend-label { color: var(--text-light); }
      `}} />
    </div>
  );
};

export default StatCard;
