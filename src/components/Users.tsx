import React, { useState, useEffect } from 'react';
import { authUtils } from '../utils/auth';

interface User {
  id?: number;
  name: string;
  email: string;
  industry?: string;
  job_role?: string;
  job_level?: string;
  experience_years?: number;
  user_type: string;
  user_status: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    user_type: '',
    user_status: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    industry: '',
    job_role: '',
    job_level: '',
    experience_years: 0,
    user_type: 'member',
    user_status: 'active'
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.user_type) params.append('user_type', filters.user_type);
      if (filters.user_status) params.append('user_status', filters.user_status);
      
      const response = await authUtils.authenticatedFetch(`${API_BASE_URL}/api/users?${params}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const url = editingUser 
        ? `${API_BASE_URL}/api/users/${editingUser.id}`
        : `${API_BASE_URL}/api/users`;
      
      const submitData = editingUser 
        ? { 
            name: formData.name, 
            email: formData.email, 
            industry: formData.industry,
            job_role: formData.job_role,
            job_level: formData.job_level,
            experience_years: formData.experience_years,
            user_type: formData.user_type, 
            user_status: formData.user_status 
          }
        : formData;
      
      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      industry: '',
      job_role: '',
      job_level: '',
      experience_years: 0,
      user_type: 'member',
      user_status: 'active'
    });
  };

  const deleteUser = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await authUtils.authenticatedFetch(`${API_BASE_URL}/api/users/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className="users">
      <div className="page-header">
        <h1>회원 관리</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowForm(true);
          }}
        >
          + 새 회원
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="filters">
        <div className="filter-row">
          <input
            type="text"
            placeholder="이름 또는 이메일 검색"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <select
            value={filters.user_type}
            onChange={(e) => setFilters(prev => ({ ...prev, user_type: e.target.value }))}
          >
            <option value="">전체 타입</option>
            <option value="member">일반 회원</option>
            <option value="admin">관리자</option>
          </select>
          <select
            value={filters.user_status}
            onChange={(e) => setFilters(prev => ({ ...prev, user_status: e.target.value }))}
          >
            <option value="">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="pending">대기</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2>{editingUser ? '회원 정보 수정' : '새 회원 등록'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>기본 정보</h3>
                <div className="form-group">
                  <label>이름 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>이메일 *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>직업 정보</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>업종</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="예: IT, 금융, 제조업"
                    />
                  </div>
                  <div className="form-group">
                    <label>직무</label>
                    <input
                      type="text"
                      value={formData.job_role}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_role: e.target.value }))}
                      placeholder="예: 개발자, 마케터, 디자이너"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>직급</label>
                    <input
                      type="text"
                      value={formData.job_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_level: e.target.value }))}
                      placeholder="예: 사원, 대리, 과장"
                    />
                  </div>
                  <div className="form-group">
                    <label>경력 (년)</label>
                    <input
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>계정 설정</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>회원 타입</label>
                    <select
                      value={formData.user_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, user_type: e.target.value }))}
                    >
                      <option value="member">일반 회원</option>
                      <option value="admin">관리자</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>상태</label>
                    <select
                      value={formData.user_status}
                      onChange={(e) => setFormData(prev => ({ ...prev, user_status: e.target.value }))}
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                      <option value="pending">대기</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>이름</th>
                <th>이메일</th>
                <th>업종</th>
                <th>직무</th>
                <th>직급</th>
                <th>경력</th>
                <th>회원 타입</th>
                <th>상태</th>
                <th>가입일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.industry || '-'}</td>
                  <td>{user.job_role || '-'}</td>
                  <td>{user.job_level || '-'}</td>
                  <td>{user.experience_years ? `${user.experience_years}년` : '-'}</td>
                  <td>
                    <span className={`user-type ${user.user_type}`}>
                      {user.user_type === 'admin' ? '관리자' : '일반 회원'}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${user.user_status}`}>
                      {user.user_status === 'active' ? '활성' : 
                       user.user_status === 'inactive' ? '비활성' : '대기'}
                    </span>
                  </td>
                  <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setFormData({
                          name: user.name,
                          email: user.email,
                          industry: user.industry || '',
                          job_role: user.job_role || '',
                          job_level: user.job_level || '',
                          experience_years: user.experience_years || 0,
                          user_type: user.user_type,
                          user_status: user.user_status
                        });
                        setShowForm(true);
                      }}
                      className="btn-edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteUser(user.id!)}
                      className="btn-delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Users;