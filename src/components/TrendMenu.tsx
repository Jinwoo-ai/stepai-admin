import React, { useState, useEffect } from 'react';

interface TrendSection {
  id?: number;
  section_type: string;
  section_title: string;
  section_description: string;
  is_category_based: boolean;
  is_active: boolean;
  display_order: number;
}

interface Category {
  id: number;
  category_name: string;
  category_icon?: string;
}

interface AIService {
  id: number;
  ai_name: string;
  ai_description: string;
  ai_logo?: string;
  company_name?: string;
  is_step_pick: boolean;
}

interface TrendService {
  id?: number;
  ai_service_id: number;
  category_id?: number;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  ai_name?: string;
  ai_description?: string;
  ai_logo?: string;
  company_name?: string;
  category_name?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const TrendMenu: React.FC = () => {
  const [trendSections, setTrendSections] = useState<TrendSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<TrendSection | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendServices, setTrendServices] = useState<TrendService[]>([]);
  const [availableServices, setAvailableServices] = useState<AIService[]>([]);
  const [loading, setLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [newSection, setNewSection] = useState({
    section_type: '',
    section_title: '',
    section_description: '',
    is_category_based: true,
    is_active: true
  });

  useEffect(() => {
    fetchTrendSections();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      fetchTrendServices();
    }
  }, [selectedSection, selectedCategory]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchTrendSections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/homepage-settings/trends`);
      const data = await response.json();
      if (data.success) {
        setTrendSections(data.data);
        // 기본 섹션들이 없으면 생성
        if (data.data.length === 0) {
          await initializeDefaultSections();
        }
      }
    } catch (error) {
      console.error('Error fetching trend sections:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/homepage-settings/main-categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTrendServices = async () => {
    if (!selectedSection) return;
    
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category_id', selectedCategory.toString());
      }
      
      const response = await fetch(
        `${API_BASE_URL}/api/homepage-settings/trends/${selectedSection.id}/services?${params}`
      );
      const data = await response.json();
      if (data.success) {
        setTrendServices(data.data);
      }
    } catch (error) {
      console.error('Error fetching trend services:', error);
    }
  };

  const fetchAvailableServices = async (query?: string) => {
    try {
      const params = new URLSearchParams();
      const searchTerm = query !== undefined ? query : searchQuery;
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSection?.id) params.append('section_id', selectedSection.id.toString());
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      
      const response = await fetch(
        `${API_BASE_URL}/api/homepage-settings/available-services?${params}`
      );
      const data = await response.json();
      if (data.success) {
        setAvailableServices(data.data);
      }
    } catch (error) {
      console.error('Error fetching available services:', error);
    }
  };

  const initializeDefaultSections = async () => {
    const defaultSections = [
      {
        section_type: 'popular',
        section_title: '요즘 많이 쓰는',
        section_description: '사용자들이 많이 이용하는 인기 AI 서비스',
        is_category_based: true,
        is_active: true,
        display_order: 1
      },
      {
        section_type: 'latest',
        section_title: '최신 등록',
        section_description: '최근에 등록된 새로운 AI 서비스',
        is_category_based: true,
        is_active: true,
        display_order: 2
      },
      {
        section_type: 'step_pick',
        section_title: 'STEP PICK',
        section_description: 'STEP AI가 추천하는 엄선된 AI 서비스',
        is_category_based: true,
        is_active: true,
        display_order: 3
      }
    ];

    try {
      const response = await fetch(`${API_BASE_URL}/api/homepage-settings/trends`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: defaultSections })
      });
      
      if (response.ok) {
        fetchTrendSections();
      }
    } catch (error) {
      console.error('Error initializing default sections:', error);
    }
  };

  const updateTrendSection = async (section: TrendSection) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/homepage-settings/trends`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: [section] })
      });
      
      if (response.ok) {
        fetchTrendSections();
      }
    } catch (error) {
      console.error('Error updating trend section:', error);
    }
  };

  const addTrendSection = async () => {
    try {
      const sectionWithOrder = {
        ...newSection,
        display_order: trendSections.length + 1
      };
      
      const response = await fetch(`${API_BASE_URL}/api/homepage-settings/trends`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: [sectionWithOrder] })
      });
      
      if (response.ok) {
        setShowAddSectionModal(false);
        setNewSection({
          section_type: '',
          section_title: '',
          section_description: '',
          is_category_based: true,
          is_active: true
        });
        fetchTrendSections();
      }
    } catch (error) {
      console.error('Error adding trend section:', error);
    }
  };

  const deleteTrendSection = async (sectionId: number) => {
    if (!window.confirm('이 트렌드 섹션을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/homepage-settings/trends/${sectionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (selectedSection?.id === sectionId) {
          setSelectedSection(null);
        }
        fetchTrendSections();
      }
    } catch (error) {
      console.error('Error deleting trend section:', error);
    }
  };

  const updateTrendServices = async () => {
    if (!selectedSection?.id) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/homepage-settings/trends/${selectedSection.id}/services`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            services: trendServices,
            category_id: selectedCategory 
          })
        }
      );
      
      if (response.ok) {
        fetchTrendServices();
      }
    } catch (error) {
      console.error('Error updating trend services:', error);
    }
  };

  const addServiceToTrend = (service: AIService) => {
    const newService: TrendService = {
      ai_service_id: service.id,
      category_id: selectedCategory || undefined,
      display_order: trendServices.length + 1,
      is_featured: false,
      is_active: true,
      ai_name: service.ai_name,
      ai_description: service.ai_description,
      ai_logo: service.ai_logo,
      company_name: service.company_name
    };
    
    setTrendServices([...trendServices, newService]);
    // 팝업을 닫지 않고 사용 가능한 서비스 목록을 새로고침
    fetchAvailableServices();
  };

  const removeServiceFromTrend = (index: number) => {
    const updatedServices = trendServices.filter((_, i) => i !== index);
    setTrendServices(updatedServices);
  };

  const moveService = (index: number, direction: 'up' | 'down') => {
    const newServices = [...trendServices];
    if (direction === 'up' && index > 0) {
      [newServices[index], newServices[index - 1]] = [newServices[index - 1], newServices[index]];
    } else if (direction === 'down' && index < newServices.length - 1) {
      [newServices[index], newServices[index + 1]] = [newServices[index + 1], newServices[index]];
    }
    
    // display_order 재정렬
    newServices.forEach((service, i) => {
      service.display_order = i + 1;
    });
    
    setTrendServices(newServices);
  };

  const toggleFeatured = (index: number) => {
    const updatedServices = [...trendServices];
    updatedServices[index].is_featured = !updatedServices[index].is_featured;
    setTrendServices(updatedServices);
  };

  return (
    <div className="trend-menu-page">
      <div className="page-header">
        <h1>트렌드 메뉴 관리</h1>
        <p>메인페이지 트렌드 섹션의 하위메뉴를 설정합니다.</p>
      </div>

      <div className="trend-sections">
        <div className="section-header">
          <h2>트렌드 섹션 목록</h2>
          <button 
            onClick={() => setShowAddSectionModal(true)}
            className="btn btn-primary"
          >
            + 섹션 추가
          </button>
        </div>
        <div className="sections-grid">
          {trendSections.map((section) => (
            <div 
              key={section.id} 
              className={`section-card ${selectedSection?.id === section.id ? 'selected' : ''}`}
              onClick={() => setSelectedSection(section)}
            >
              <div className="section-header">
                <h3>{section.section_title}</h3>
                <div className="section-actions">
                  <div className="section-badges">
                    {section.is_category_based && (
                      <span className="badge category-based">카테고리별</span>
                    )}
                    {section.is_active && (
                      <span className="badge active">활성</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTrendSection(section.id!);
                    }}
                    className="btn-delete-section"
                    title="섹션 삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p>{section.section_description}</p>
              
              <div className="section-settings">
                <div className="form-group">
                  <label>섹션명</label>
                  <input
                    type="text"
                    value={section.section_title}
                    onChange={(e) => {
                      const updatedSection = { ...section, section_title: e.target.value };
                      updateTrendSection(updatedSection);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>설명</label>
                  <textarea
                    value={section.section_description}
                    onChange={(e) => {
                      const updatedSection = { ...section, section_description: e.target.value };
                      updateTrendSection(updatedSection);
                    }}
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={section.is_category_based}
                      onChange={(e) => {
                        const updatedSection = { ...section, is_category_based: e.target.checked };
                        updateTrendSection(updatedSection);
                      }}
                    />
                    카테고리별 설정
                  </label>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={section.is_active}
                      onChange={(e) => {
                        const updatedSection = { ...section, is_active: e.target.checked };
                        updateTrendSection(updatedSection);
                      }}
                    />
                    활성화
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSection && (
        <div className="trend-services-section">
          <div className="section-header">
            <h2>{selectedSection.section_title} 서비스 관리</h2>
            <div className="section-actions">
              <button 
                onClick={updateTrendServices}
                className="btn btn-primary"
              >
                저장
              </button>
            </div>
          </div>

          <div className="services-management">
            <div className="services-list">
              <div className="list-header">
                <h3>설정된 서비스</h3>
                <div className="list-actions">
                  {selectedSection.is_category_based && (
                    <div className="category-selector">
                      <label>카테고리 선택</label>
                      <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">전체</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.category_icon} {category.category_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setShowServiceModal(true);
                      fetchAvailableServices();
                    }}
                    className="btn btn-secondary"
                  >
                    + 서비스 추가
                  </button>
                </div>
              </div>
              
              {trendServices.map((service, index) => (
                <div key={`${service.ai_service_id}-${index}`} className="service-item">
                  <div className="service-order">{service.display_order}</div>
                  <div className="service-content">
                    {service.ai_logo && (
                      <img src={service.ai_logo} alt="logo" className="service-logo" />
                    )}
                    <div className="service-info">
                      <h4>{service.ai_name}</h4>
                      <p>{service.company_name}</p>
                      {service.category_name && (
                        <span className="category-badge">{service.category_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="service-actions">
                    <button
                      onClick={() => moveService(index, 'up')}
                      disabled={index === 0}
                      className="btn-move"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveService(index, 'down')}
                      disabled={index === trendServices.length - 1}
                      className="btn-move"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => toggleFeatured(index)}
                      className={`btn-featured ${service.is_featured ? 'active' : ''}`}
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => removeServiceFromTrend(index)}
                      className="btn-remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              
              {trendServices.length === 0 && (
                <div className="empty-state">
                  <p>설정된 서비스가 없습니다.</p>
                  <p>서비스를 추가해주세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 서비스 추가 모달 */}
      {showServiceModal && (
        <div className="form-modal">
          <div className="form-container">
            <div className="modal-header">
              <h3>서비스 추가</h3>
              <div className="modal-header-actions">
                <span className="added-count">추가된 서비스: {trendServices.length}개</span>
                <button 
                  onClick={() => setShowServiceModal(false)}
                  className="btn-close"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="서비스명으로 검색"
                  value={searchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSearchQuery(newValue);
                    
                    // 기존 타이머 취소
                    if (searchTimeout) {
                      clearTimeout(searchTimeout);
                    }
                    
                    // 새 타이머 설정 (디바운스)
                    const newTimeout = setTimeout(() => {
                      fetchAvailableServices(newValue);
                    }, 500);
                    setSearchTimeout(newTimeout);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (searchTimeout) {
                        clearTimeout(searchTimeout);
                      }
                      fetchAvailableServices(searchQuery);
                    }
                  }}
                />
              </div>
              
              <div className="available-services">
                {availableServices.map(service => {
                  const isAlreadyAdded = trendServices.some(ts => ts.ai_service_id === service.id);
                  return (
                    <div key={service.id} className={`available-service-item ${isAlreadyAdded ? 'added' : ''}`}>
                      <div className="service-content">
                        {service.ai_logo && (
                          <img src={service.ai_logo} alt="logo" className="service-logo" />
                        )}
                        <div className="service-info">
                          <h4>{service.ai_name}</h4>
                          <p>{service.company_name}</p>
                          {service.is_step_pick && (
                            <span className="step-pick-badge">STEP PICK</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => addServiceToTrend(service)}
                        className={`btn btn-small ${isAlreadyAdded ? 'btn-secondary' : 'btn-primary'}`}
                        disabled={isAlreadyAdded}
                      >
                        {isAlreadyAdded ? '추가됨' : '추가'}
                      </button>
                    </div>
                  );
                })}
                
                {availableServices.length === 0 && (
                  <div className="no-results">
                    추가 가능한 서비스가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 추가 모달 */}
      {showAddSectionModal && (
        <div className="form-modal">
          <div className="form-container">
            <div className="modal-header">
              <h3>트렌드 섹션 추가</h3>
              <button 
                onClick={() => setShowAddSectionModal(false)}
                className="btn-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>섹션 타입</label>
                <input
                  type="text"
                  placeholder="예: custom, special 등"
                  value={newSection.section_type}
                  onChange={(e) => setNewSection({...newSection, section_type: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>섹션명</label>
                <input
                  type="text"
                  placeholder="예: 인기 급상승"
                  value={newSection.section_title}
                  onChange={(e) => setNewSection({...newSection, section_title: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>설명</label>
                <textarea
                  placeholder="섹션에 대한 설명"
                  value={newSection.section_description}
                  onChange={(e) => setNewSection({...newSection, section_description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newSection.is_category_based}
                    onChange={(e) => setNewSection({...newSection, is_category_based: e.target.checked})}
                  />
                  카테고리별 설정
                </label>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newSection.is_active}
                    onChange={(e) => setNewSection({...newSection, is_active: e.target.checked})}
                  />
                  활성화
                </label>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowAddSectionModal(false)}
                className="btn btn-secondary"
              >
                취소
              </button>
              <button 
                onClick={addTrendSection}
                className="btn btn-primary"
                disabled={!newSection.section_type || !newSection.section_title}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendMenu;