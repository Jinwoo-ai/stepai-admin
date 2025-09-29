import React, { useState, useEffect } from 'react';
import { authUtils } from '../utils/auth';

interface AIVideo {
  id: number;
  video_title: string;
  video_description?: string;
  thumbnail_url?: string;
  video_duration?: string;
  view_count: number;
}

interface Curation {
  id: number;
  curation_title: string;
  curation_description?: string;
  curation_thumbnail?: string;
}

interface AIService {
  id: number;
  ai_name: string;
  ai_description?: string;
  ai_logo?: string;
  company_name?: string;
  is_step_pick: boolean;
}

interface Category {
  id: number;
  category_name: string;
  category_icon?: string;
}

interface HomepageVideo {
  id?: number;
  ai_video_id: number;
  display_order: number;
  is_active: boolean;
  video_title?: string;
  thumbnail_url?: string;
}

interface HomepageCuration {
  id?: number;
  curation_id: number;
  display_order: number;
  is_active: boolean;
  curation_title?: string;
}

interface HomepageService {
  id?: number;
  ai_service_id: number;
  category_id?: number;
  display_order: number;
  is_active: boolean;
  ai_name?: string;
  ai_logo?: string;
  category_name?: string;
}

const HomepageSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(false);
  
  // 메인페이지 설정 상태
  const [homepageVideos, setHomepageVideos] = useState<HomepageVideo[]>([]);
  const [homepageCurations, setHomepageCurations] = useState<HomepageCuration[]>([]);
  const [homepageServices, setHomepageServices] = useState<HomepageService[]>([]);
  
  // 카테고리 상태
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // 추가 가능한 항목들
  const [availableVideos, setAvailableVideos] = useState<AIVideo[]>([]);
  const [availableCurations, setAvailableCurations] = useState<Curation[]>([]);
  const [availableServices, setAvailableServices] = useState<AIService[]>([]);
  
  // 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE_URL || '';



  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'videos') {
      fetchHomepageVideos();
      fetchAvailableVideos();
    } else if (activeTab === 'curations') {
      fetchHomepageCurations();
      fetchAvailableCurations();
    } else if (activeTab === 'step-pick') {
      fetchHomepageServices();
      fetchAvailableServices();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'step-pick') {
      fetchHomepageServices();
      fetchAvailableServices();
    }
  }, [selectedCategory]);

  const fetchHomepageVideos = async () => {
    try {
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/videos`);
      const data = await response.json();
      if (data.success) {
        setHomepageVideos(data.data);
      }
    } catch (error) {
      console.error('메인페이지 영상 조회 실패:', error);
    }
  };

  const fetchHomepageCurations = async () => {
    try {
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/curations`);
      const data = await response.json();
      if (data.success) {
        setHomepageCurations(data.data);
      }
    } catch (error) {
      console.error('메인페이지 큐레이션 조회 실패:', error);
    }
  };

  const fetchHomepageServices = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category_id', selectedCategory.toString());
      }
      
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/step-pick?${params}`);
      const data = await response.json();
      if (data.success) {
        setHomepageServices(data.data);
      }
    } catch (error) {
      console.error('메인페이지 서비스 조회 실패:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/main-categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
    }
  };

  const fetchAvailableVideos = async () => {
    try {
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/available-videos?search=${searchTerm}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setAvailableVideos(data.data);
      }
    } catch (error) {
      console.error('사용 가능한 영상 조회 실패:', error);
    }
  };

  const fetchAvailableCurations = async () => {
    try {
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/available-curations?search=${searchTerm}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setAvailableCurations(data.data);
      }
    } catch (error) {
      console.error('사용 가능한 큐레이션 조회 실패:', error);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const params = new URLSearchParams();
      params.append('search', searchTerm);
      params.append('limit', '50');
      
      // STEP PICK 탭에서는 is_step_pick=true인 서비스만 표시
      if (activeTab === 'step-pick') {
        params.append('is_step_pick', 'true');
      }
      
      // 카테고리 필터링
      if (selectedCategory) {
        params.append('category_id', selectedCategory.toString());
      }
      
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/available-services?${params}`);
      const data = await response.json();
      if (data.success) {
        setAvailableServices(data.data);
      }
    } catch (error) {
      console.error('사용 가능한 서비스 조회 실패:', error);
    }
  };

  const saveHomepageVideos = async () => {
    setLoading(true);
    try {
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/videos`, {
        method: 'PUT',
        body: JSON.stringify({ videos: homepageVideos })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('메인페이지 영상 설정이 저장되었습니다.');
        fetchAvailableVideos();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('영상 설정 저장 실패:', error);
      alert('영상 설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const saveHomepageCurations = async () => {
    setLoading(true);
    try {
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/curations`, {
        method: 'PUT',
        body: JSON.stringify({ curations: homepageCurations })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('메인페이지 큐레이션 설정이 저장되었습니다.');
        fetchAvailableCurations();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('큐레이션 설정 저장 실패:', error);
      alert('큐레이션 설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const saveHomepageServices = async () => {
    setLoading(true);
    try {
      const response = await authUtils.authenticatedFetch(`${API_BASE}/api/homepage-settings/step-pick`, {
        method: 'PUT',
        body: JSON.stringify({ 
          services: homepageServices,
          category_id: selectedCategory 
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        alert('메인페이지 STEP PICK 설정이 저장되었습니다.');
        fetchAvailableServices();
      } else {
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('서비스 설정 저장 실패:', error);
      alert('서비스 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };



  const moveItem = (items: any[], fromIndex: number, toIndex: number, setter: Function) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));
    
    setter(reorderedItems);
  };

  const removeItem = (items: any[], index: number, setter: Function) => {
    const newItems = items.filter((_, i) => i !== index);
    const reorderedItems = newItems.map((item, i) => ({
      ...item,
      display_order: i + 1
    }));
    setter(reorderedItems);
  };

  const addVideo = (video: AIVideo) => {
    const newVideo: HomepageVideo = {
      ai_video_id: video.id,
      display_order: homepageVideos.length + 1,
      is_active: true,
      video_title: video.video_title,
      thumbnail_url: video.thumbnail_url
    };
    setHomepageVideos([...homepageVideos, newVideo]);
    setShowAddModal(false);
    fetchAvailableVideos();
  };

  const addCuration = (curation: Curation) => {
    const newCuration: HomepageCuration = {
      curation_id: curation.id,
      display_order: homepageCurations.length + 1,
      is_active: true,
      curation_title: curation.curation_title
    };
    setHomepageCurations([...homepageCurations, newCuration]);
    setShowAddModal(false);
    fetchAvailableCurations();
  };

  const addService = (service: AIService) => {
    const newService: HomepageService = {
      ai_service_id: service.id,
      category_id: selectedCategory || undefined,
      display_order: homepageServices.length + 1,
      is_active: true,
      ai_name: service.ai_name,
      ai_logo: service.ai_logo
    };
    setHomepageServices([...homepageServices, newService]);
    setShowAddModal(false);
    fetchAvailableServices();
  };



  return (
    <div className="categories-page">
      <div className="page-header">
        <h1>메인페이지 관리</h1>
        <div className="header-buttons">
          <p>메인페이지에 표시될 콘텐츠와 트렌드 섹션을 관리합니다.</p>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'videos' ? 'active' : ''}
          onClick={() => setActiveTab('videos')}
        >
          📹 메인 영상
        </button>
        <button 
          className={activeTab === 'curations' ? 'active' : ''}
          onClick={() => setActiveTab('curations')}
        >
          📋 큐레이션
        </button>
        <button 
          className={activeTab === 'step-pick' ? 'active' : ''}
          onClick={() => setActiveTab('step-pick')}
        >
          ⭐ STEP PICK
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'videos' && (
          <div className="section">
            <div className="section-header">
              <h2>메인페이지 영상 설정</h2>
              <div className="section-actions">
                <button onClick={() => setShowAddModal(true)} className="btn btn-secondary">
                  + 영상 추가
                </button>
                <button onClick={saveHomepageVideos} className="btn btn-primary" disabled={loading}>
                  {loading ? '저장 중...' : '설정 저장'}
                </button>
              </div>
            </div>
            
            <div className="items-list">
              {homepageVideos.map((video, index) => (
                <div key={video.ai_video_id} className="item-card">
                  <div className="item-order">{index + 1}</div>
                  <div className="item-content">
                    {video.thumbnail_url && (
                      <img src={video.thumbnail_url} alt="" className="item-thumbnail" />
                    )}
                    <div className="item-info">
                      <h4>{video.video_title}</h4>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      onClick={() => moveItem(homepageVideos, index, index - 1, setHomepageVideos)}
                      disabled={index === 0}
                      className="btn-move"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveItem(homepageVideos, index, index + 1, setHomepageVideos)}
                      disabled={index === homepageVideos.length - 1}
                      className="btn-move"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={() => removeItem(homepageVideos, index, setHomepageVideos)}
                      className="btn-remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'curations' && (
          <div className="section">
            <div className="section-header">
              <h2>메인페이지 큐레이션 설정</h2>
              <div className="section-actions">
                <button onClick={() => setShowAddModal(true)} className="btn btn-secondary">
                  + 큐레이션 추가
                </button>
                <button onClick={saveHomepageCurations} className="btn btn-primary" disabled={loading}>
                  {loading ? '저장 중...' : '설정 저장'}
                </button>
              </div>
            </div>
            
            <div className="items-list">
              {homepageCurations.map((curation, index) => (
                <div key={curation.curation_id} className="item-card">
                  <div className="item-order">{index + 1}</div>
                  <div className="item-content">
                    <div className="item-info">
                      <h4>{curation.curation_title}</h4>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      onClick={() => moveItem(homepageCurations, index, index - 1, setHomepageCurations)}
                      disabled={index === 0}
                      className="btn-move"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveItem(homepageCurations, index, index + 1, setHomepageCurations)}
                      disabled={index === homepageCurations.length - 1}
                      className="btn-move"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={() => removeItem(homepageCurations, index, setHomepageCurations)}
                      className="btn-remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'step-pick' && (
          <div className="section">
            <div className="section-header">
              <h2>메인페이지 STEP PICK 설정</h2>
              <div className="section-actions">
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
                <button onClick={() => setShowAddModal(true)} className="btn btn-secondary">
                  + 서비스 추가
                </button>
                <button onClick={saveHomepageServices} className="btn btn-primary" disabled={loading}>
                  {loading ? '저장 중...' : '설정 저장'}
                </button>
              </div>
            </div>
            
            <div className="items-list">
              {homepageServices.map((service, index) => (
                <div key={`${service.ai_service_id}-${service.category_id || 'all'}`} className="item-card">
                  <div className="item-order">{index + 1}</div>
                  <div className="item-content">
                    {service.ai_logo && (
                      <img src={service.ai_logo} alt="" className="item-logo" />
                    )}
                    <div className="item-info">
                      <h4>{service.ai_name}</h4>
                      {service.category_name && (
                        <span className="category-badge">{service.category_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      onClick={() => moveItem(homepageServices, index, index - 1, setHomepageServices)}
                      disabled={index === 0}
                      className="btn-move"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveItem(homepageServices, index, index + 1, setHomepageServices)}
                      disabled={index === homepageServices.length - 1}
                      className="btn-move"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={() => removeItem(homepageServices, index, setHomepageServices)}
                      className="btn-remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="form-modal">
          <div className="form-container">
            <div className="modal-header">
              <h3>
                {activeTab === 'videos' && '영상 추가'}
                {activeTab === 'curations' && '큐레이션 추가'}
                {activeTab === 'step-pick' && 'AI 서비스 추가'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="btn-close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (activeTab === 'videos') fetchAvailableVideos();
                      else if (activeTab === 'curations') fetchAvailableCurations();
                      else fetchAvailableServices();
                    }
                  }}
                />
              </div>
              
              <div className="available-items">
                {activeTab === 'videos' && availableVideos.map(video => (
                  <div key={video.id} className="available-item" onClick={() => addVideo(video)}>
                    {video.thumbnail_url && (
                      <img src={video.thumbnail_url} alt="" className="item-thumbnail" />
                    )}
                    <div className="item-info">
                      <h4>{video.video_title}</h4>
                      <p>조회수: {video.view_count}</p>
                    </div>
                  </div>
                ))}
                
                {activeTab === 'curations' && availableCurations.map(curation => (
                  <div key={curation.id} className="available-item" onClick={() => addCuration(curation)}>
                    <div className="item-info">
                      <h4>{curation.curation_title}</h4>
                      <p>{curation.curation_description}</p>
                    </div>
                  </div>
                ))}
                
                {activeTab === 'step-pick' && availableServices.map(service => (
                  <div key={service.id} className="available-item" onClick={() => addService(service)}>
                    {service.ai_logo && (
                      <img src={service.ai_logo} alt="" className="item-logo" />
                    )}
                    <div className="item-info">
                      <h4>{service.ai_name}</h4>
                      <p>{service.company_name}</p>
                      {service.is_step_pick && <span className="step-pick-badge">STEP PICK</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default HomepageSettings;