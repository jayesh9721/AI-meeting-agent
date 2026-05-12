import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-brand-side">
        <div className="brand-content">
          <div className="logo-badge">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="6" width="4" height="12" rx="2" fill="currentColor"/>
              <rect x="10" y="3" width="4" height="18" rx="2" fill="currentColor"/>
              <rect x="17" y="6" width="4" height="12" rx="2" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="brand-title">MeetAction AI</h1>
          <p className="brand-subtitle">The ultimate AI companion for your meetings. Extract insights, manage tasks, and stay organized effortlessly.</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon"><ArrowRight size={16} /></div>
              <span>Automated Meeting Summarization</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><ArrowRight size={16} /></div>
              <span>Smart Task Extraction</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><ArrowRight size={16} /></div>
              <span>Team Collaboration Tools</span>
            </div>
          </div>
        </div>
        <div className="brand-footer">
          <p>© 2026 MeetAction AI. All rights reserved.</p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{isLogin ? 'Welcome back' : 'Create an account'}</h1>
            <p>{isLogin ? 'Enter your details to access your dashboard' : 'Start processing your meetings with AI'}</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required 
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Password</label>
                {isLogin && <button type="button" className="forgot-link">Forgot password?</button>}
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-auth">
            <button className="btn btn-outline btn-block">
              <span>Continue with Social</span>
            </button>
          </div>

          <p className="auth-footer">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-container {
          min-height: 100vh;
          display: flex;
          background: white;
          width: 100%;
        }

        .auth-brand-side {
          flex: 1.2;
          background: linear-gradient(135deg, var(--primary) 0%, #4338ca 100%);
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .auth-brand-side::before {
          content: '';
          position: absolute;
          top: -20%;
          right: -20%;
          width: 60%;
          height: 60%;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          filter: blur(80px);
        }

        .brand-content {
          max-width: 480px;
          position: relative;
          z-index: 1;
        }

        .logo-badge {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2.5rem;
          color: white;
        }

        .brand-title {
          font-size: 42px;
          font-weight: 800;
          margin-bottom: 1.5rem;
          letter-spacing: -1px;
        }

        .brand-subtitle {
          font-size: 18px;
          line-height: 1.6;
          opacity: 0.9;
          margin-bottom: 3rem;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          font-weight: 500;
        }

        .feature-icon {
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-footer {
          font-size: 14px;
          opacity: 0.7;
          position: relative;
          z-index: 1;
        }

        .auth-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          background: #fcfcfd;
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
        }

        .auth-header {
          margin-bottom: 2.5rem;
        }

        .auth-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #101828;
          margin-bottom: 0.75rem;
          letter-spacing: -0.5px;
        }

        .auth-header p {
          font-size: 16px;
          color: #667085;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #344054;
          margin-bottom: 6px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #667085;
        }

        .input-wrapper input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          transition: all 0.2s;
          box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
        }

        .input-wrapper input:focus {
          border-color: var(--primary);
          box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05), 0px 0px 0px 4px rgba(79, 70, 229, 0.1);
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .forgot-link {
          font-size: 14px;
          color: var(--primary);
          font-weight: 600;
        }

        .btn-block {
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 16px;
          font-weight: 600;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          margin: 2rem 0;
          color: #667085;
          font-size: 14px;
        }

        .auth-divider::before, .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #f2f4f7;
        }

        .auth-divider span {
          padding: 0 12px;
        }

        .auth-footer {
          text-align: center;
          font-size: 14px;
          color: #667085;
          margin-top: 2rem;
        }

        .toggle-btn {
          color: var(--primary);
          font-weight: 700;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
        }

        .error-message {
          padding: 12px;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 8px;
          font-size: 14px;
          text-align: center;
          border: 1px solid #fecaca;
        }

        @media (max-width: 900px) {
          .auth-brand-side {
            display: none;
          }
          .auth-form-side {
            padding: 2rem;
          }
        }
      `}} />
    </div>
  );
};

export default Auth;
