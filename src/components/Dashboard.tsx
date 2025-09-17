import React, { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  newUsers: number;
  totalAIServices: number;
  totalVideos: number;
  totalCategories: number;
  totalCurations: number;
  stepPickServices: number;
  activeServices: number;
  totalViews: number;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsers: 0,
    totalAIServices: 0,
    totalVideos: 0,
    totalCategories: 0,
    totalCurations: 0,
    stepPickServices: 0,
    activeServices: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
    setLoading(false);
  };

  const StatCard: React.FC<{ title: string; value: number; icon: string; color: string }> = ({ title, value, icon, color }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{value.toLocaleString()}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  if (loading) {
    return <div className="dashboard loading">로딩 중...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>대시보드</h1>
        <button onClick={fetchStats} className="btn btn-secondary">
          🔄 새로고침
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="전체 회원 수"
          value={stats.totalUsers}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="신규 회원 (30일)"
          value={stats.newUsers}
          icon="🆕"
          color="green"
        />
        <StatCard
          title="AI 서비스 수"
          value={stats.totalAIServices}
          icon="🤖"
          color="purple"
        />
        <StatCard
          title="영상 콘텐츠 수"
          value={stats.totalVideos}
          icon="🎥"
          color="red"
        />
        <StatCard
          title="카테고리 수"
          value={stats.totalCategories}
          icon="📁"
          color="orange"
        />
        <StatCard
          title="큐레이션 수"
          value={stats.totalCurations}
          icon="📋"
          color="teal"
        />
        <StatCard
          title="Step Pick 서비스"
          value={stats.stepPickServices}
          icon="⭐"
          color="yellow"
        />
        <StatCard
          title="활성 서비스"
          value={stats.activeServices}
          icon="✅"
          color="green"
        />
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>최근 활동</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">🤖</span>
              <span className="activity-text">새로운 AI 서비스가 등록되었습니다.</span>
              <span className="activity-time">방금 전</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🎥</span>
              <span className="activity-text">영상 콘텐츠가 업데이트되었습니다.</span>
              <span className="activity-time">1시간 전</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">👥</span>
              <span className="activity-text">새로운 회원이 가입했습니다.</span>
              <span className="activity-time">2시간 전</span>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>시스템 상태</h2>
          <div className="system-status">
            <div className="status-item">
              <span className="status-indicator green"></span>
              <span>API 서버</span>
              <span className="status-text">정상</span>
            </div>
            <div className="status-item">
              <span className="status-indicator green"></span>
              <span>데이터베이스</span>
              <span className="status-text">정상</span>
            </div>
            <div className="status-item">
              <span className="status-indicator green"></span>
              <span>파일 업로드</span>
              <span className="status-text">정상</span>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>빠른 작업</h2>
        <div className="action-buttons">
          <button className="action-btn">
            <span className="action-icon">🤖</span>
            <span>AI 서비스 추가</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">🎥</span>
            <span>영상 콘텐츠 추가</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📋</span>
            <span>큐레이션 생성</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📁</span>
            <span>카테고리 관리</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;