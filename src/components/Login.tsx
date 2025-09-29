import React, { useState } from 'react';
import styles from './Login.module.css';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

type LoginStep = 'email' | 'password' | 'setPassword';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(data.data.hasPassword ? 'password' : 'setPassword');
      } else {
        setError(data.error || '이메일 확인에 실패했습니다.');
      }
    } catch (error) {
      setError('이메일 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.data.user));
        onLogin(data.data.token, data.data.user);
      } else {
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('password');
        setPassword('');
        setConfirmPassword('');
        setError('');
      } else {
        setError(data.error || '비밀번호 설정에 실패했습니다.');
      }
    } catch (error) {
      setError('비밀번호 설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit}>
      <div className={styles.inputGroup}>
        <label>이메일 주소</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? '확인 중...' : '다음'}
      </button>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={handlePasswordSubmit}>
      <div className={styles.emailDisplay}>
        <span>{email}</span>
        <button type="button" onClick={handleBack} className={styles.backBtn}>
          변경
        </button>
      </div>
      <div className={styles.inputGroup}>
        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          required
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );

  const renderSetPasswordStep = () => (
    <form onSubmit={handleSetPasswordSubmit}>
      <div className={styles.emailDisplay}>
        <span>{email}</span>
        <button type="button" onClick={handleBack} className={styles.backBtn}>
          변경
        </button>
      </div>
      <div className={styles.passwordSetupInfo}>
        <p>처음 로그인입니다. 비밀번호를 설정해주세요.</p>
      </div>
      <div className={styles.inputGroup}>
        <label>비밀번호 (6자 이상)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          required
          disabled={loading}
        />
      </div>
      <div className={styles.inputGroup}>
        <label>비밀번호 확인</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          required
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? '설정 중...' : '비밀번호 설정'}
      </button>
    </form>
  );

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <h1>STEPAI ADMIN</h1>
          <p>
            {step === 'email' && '관리자 로그인'}
            {step === 'password' && '비밀번호 입력'}
            {step === 'setPassword' && '비밀번호 설정'}
          </p>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        {step === 'email' && renderEmailStep()}
        {step === 'password' && renderPasswordStep()}
        {step === 'setPassword' && renderSetPasswordStep()}
        
        <div className={styles.loginInfo}>
          <p>관리자 권한이 있는 계정만 로그인할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;