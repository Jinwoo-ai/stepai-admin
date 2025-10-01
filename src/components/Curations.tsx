import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { authUtils } from '../utils/auth';

interface Curation {
  id?: number;
  curation_title: string;
  curation_description?: string;
  curation_thumbnail?: string;
  curation_order: number;
  curation_status: string;
  created_at?: string;
  service_count?: number;
  ai_services?: AIService[];
}

interface AIService {
  id: number;
  ai_service_id?: number;
  ai_name: string;
  ai_name_en?: string;
  ai_type: string;
  service_order?: number;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const Curations: React.FC = () => {
  const [curations, setCurations] = useState<Curation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCuration, setEditingCuration] = useState<Curation | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    curation_status: ''
  });

  const [formData, setFormData] = useState({
    curation_title: '',
    curation_description: '',
    curation_order: 0,
    curation_status: 'active',
    ai_service_ids: [] as number[]
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceResults, setServiceResults] = useState<AIService[]>([]);
  const [selectedServices, setSelectedServices] = useState<AIService[]>([]);

  useEffect(() => {
    fetchCurations();
  }, [filters]);

  const fetchCurations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.curation_status) params.append('curation_status', filters.curation_status);
      params.append('include_ai_services', 'true');
      
      const response = await authUtils.authenticatedFetch(`${API_BASE_URL}/api/curations?${params}`);
      const data = await response.json();
      if (data.success) {
        setCurations(data.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching curations:', error);
    }
    setLoading(false);
  };

  const searchServices = async (query: string) => {
    if (!query.trim()) {
      setServiceResults([]);
      return;
    }
    
    try {
      const response = await authUtils.authenticatedFetch(`${API_BASE_URL}/api/ai-services/admin-search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setServiceResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const url = editingCuration 
        ? `${API_BASE_URL}/api/curations/${editingCuration.id}`
        : `${API_BASE_URL}/api/curations`;
      
      const response = await authUtils.authenticatedFetch(url, {
        method: editingCuration ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...formData,
          ai_service_ids: selectedServices.map(s => s.ai_service_id || s.id)
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingCuration(null);
        resetForm();
        fetchCurations();
      }
    } catch (error) {
      console.error('Error saving curation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      curation_title: '',
      curation_description: '',
      curation_order: 0,
      curation_status: 'active',
      ai_service_ids: []
    });
    setSelectedServices([]);
  };

  const deleteCuration = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await authUtils.authenticatedFetch(`${API_BASE_URL}/api/curations/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchCurations();
        }
      } catch (error) {
        console.error('Error deleting curation:', error);
      }
    }
  };

  const addService = (service: AIService) => {
    if (!selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(prev => [...prev, service]);
    }
    setShowServiceModal(false);
    setServiceSearch('');
    setServiceResults([]);
  };

  const removeService = (serviceId: number) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const moveService = (index: number, direction: 'up' | 'down') => {
    const newServices = [...selectedServices];
    if (direction === 'up' && index > 0) {
      [newServices[index], newServices[index - 1]] = [newServices[index - 1], newServices[index]];
    } else if (direction === 'down' && index < newServices.length - 1) {
      [newServices[index], newServices[index + 1]] = [newServices[index + 1], newServices[index]];
    }
    setSelectedServices(newServices);
  };

  return (
    <div className="curations">
      <div className="page-header">
        <h1>큐레이션 관리</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingCuration(null);
            resetForm();
            setShowForm(true);
          }}
        >
          + 새 큐레이션
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="filters">
        <div className="filter-row">
          <input
            type="text"
            placeholder="큐레이션 제목 검색"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <select
            value={filters.curation_status}
            onChange={(e) => setFilters(prev => ({ ...prev, curation_status: e.target.value }))}
          >
            <option value="">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container large">
            <h2>{editingCuration ? '큐레이션 수정' : '새 큐레이션 등록'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>기본 정보</h3>
                <div className="form-group">
                  <label>큐레이션 제목 *</label>
                  <input
                    type="text"
                    value={formData.curation_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, curation_title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>설명</label>
                  <ReactQuill
                    value={formData.curation_description}
                    onChange={(value) => setFormData(prev => ({ ...prev, curation_description: value }))}
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link']
                      ]
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>순서</label>
                  <input
                    type="number"
                    value={formData.curation_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, curation_order: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label>상태</label>
                  <select
                    value={formData.curation_status}
                    onChange={(e) => setFormData(prev => ({ ...prev, curation_status: e.target.value }))}
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                  </select>
                </div>
              </div>

              {/* AI 서비스 선택 */}
              <div className="form-section">
                <h3>포함된 AI 서비스</h3>
                <div className="selected-services-grid">
                  {selectedServices.map((service, index) => (
                    <div key={service.id} className="service-card">
                      <div className="service-card-header">
                        <div className="service-order-badge">{index + 1}</div>
                        <button 
                          type="button" 
                          onClick={() => removeService(service.id)}
                          className="btn-remove-card"
                          title="제거"
                        >
                          ×
                        </button>
                      </div>
                      <div className="service-card-content">
                        <div className="service-icon">
                          🤖
                        </div>
                        <div className="service-info">
                          <div className="service-name">{service.ai_name_en || service.ai_name}</div>
                          <div className="service-type">{service.ai_type}</div>
                        </div>
                      </div>
                      <div className="service-card-actions">
                        <button 
                          type="button" 
                          onClick={() => moveService(index, 'up')}
                          disabled={index === 0}
                          className="btn-move"
                          title="위로 이동"
                        >
                          ↑
                        </button>
                        <button 
                          type="button" 
                          onClick={() => moveService(index, 'down')}
                          disabled={index === selectedServices.length - 1}
                          className="btn-move"
                          title="아래로 이동"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="add-service-card">
                    <button 
                      type="button" 
                      onClick={() => setShowServiceModal(true)}
                      className="btn-add-service"
                    >
                      <div className="add-icon">+</div>
                      <div className="add-text">AI 서비스 추가</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  {editingCuration ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI 서비스 검색 모달 */}
      {showServiceModal && (
        <div className="form-modal">
          <div className="form-container">
            <h3>AI 서비스 검색</h3>
            <div className="search-input-container">
              <input
                type="text"
                placeholder="AI 서비스명으로 검색"
                value={serviceSearch}
                onChange={(e) => {
                  setServiceSearch(e.target.value);
                  searchServices(e.target.value);
                }}
                className="search-input"
              />
            </div>
            <div className="search-results-grid">
              {serviceResults.map(service => (
                <div key={service.id} className="search-result-card">
                  <div className="result-card-content">
                    <div className="result-service-icon">
                      🤖
                    </div>
                    <div className="result-service-info">
                      <div className="result-service-name">{service.ai_name_en || service.ai_name}</div>
                      <div className="result-service-type">{service.ai_type}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => addService(service)}
                    className="btn-add-result"
                    disabled={selectedServices.some(s => s.id === service.id)}
                  >
                    {selectedServices.some(s => s.id === service.id) ? '이미 추가됨' : '추가'}
                  </button>
                </div>
              ))}
              {serviceSearch && serviceResults.length === 0 && (
                <div className="no-results">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowServiceModal(false)} className="btn-close">
                닫기
              </button>
            </div>
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
                <th>큐레이션 제목</th>
                <th>포함된 서비스 수</th>
                <th>순서</th>
                <th>상태</th>
                <th>등록일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {curations.map((curation, index) => (
                <tr key={curation.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="curation-title">{curation.curation_title}</div>
                  </td>
                  <td>{curation.service_count || 0}개</td>
                  <td>{curation.curation_order}</td>
                  <td>
                    <span className={`status ${curation.curation_status}`}>
                      {curation.curation_status}
                    </span>
                  </td>
                  <td>{curation.created_at ? new Date(curation.created_at).toLocaleDateString() : ''}</td>
                  <td>
                    <button
                      onClick={async () => {
                        setEditingCuration(curation);
                        setFormData({
                          curation_title: curation.curation_title,
                          curation_description: curation.curation_description || '',
                          curation_order: curation.curation_order,
                          curation_status: curation.curation_status,
                          ai_service_ids: []
                        });
                        
                        // 기존 서비스 목록 불러오기
                        try {
                          const response = await authUtils.authenticatedFetch(`${API_BASE_URL}/api/curations/${curation.id}/services`);
                          const data = await response.json();
                          if (data.success) {
                            setSelectedServices(data.data || []);
                          }
                        } catch (error) {
                          console.error('Error fetching curation services:', error);
                          setSelectedServices([]);
                        }
                        
                        setShowForm(true);
                      }}
                      className="btn-edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteCuration(curation.id!)}
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

export default Curations;