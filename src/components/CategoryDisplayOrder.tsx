import React, { useState, useEffect, useRef } from 'react';

interface AIService {
  id: number;
  ai_name: string;
  ai_description: string;
  ai_logo?: string;
  company_name: string;
  pricing_info?: string;
  difficulty_level: string;
  is_step_pick: boolean;
}

interface DisplayOrderItem {
  id: number;
  ai_service_id: number;
  display_order: number;
  is_featured: boolean;
  ai_name: string;
  ai_description: string;
  ai_logo?: string;
  company_name: string;
  pricing_info?: string;
  difficulty_level: string;
  is_step_pick: boolean;
}

interface Category {
  id: number;
  category_name: string;
  category_icon?: string;
}

const CategoryDisplayOrder: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [displayServices, setDisplayServices] = useState<DisplayOrderItem[]>([]);
  const [availableServices, setAvailableServices] = useState<AIService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const dragCounter = useRef(0);

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchDisplayServices();
      fetchAvailableServices();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/categories`);
      const data = await response.json();
      if (data.success) {
        // 플랫 구조로 변환 (부모 + 자식)
        const flatCategories: Category[] = [];
        data.data.forEach((parent: any) => {
          flatCategories.push(parent);
          if (parent.children) {
            parent.children.forEach((child: any) => {
              flatCategories.push(child);
            });
          }
        });
        setCategories(flatCategories);
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
    }
  };

  const fetchDisplayServices = async () => {
    if (!selectedCategory) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/category-display-order/${selectedCategory}?limit=20`);
      const data = await response.json();
      if (data.success) {
        setDisplayServices(data.data);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('표시 서비스 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableServices = async () => {
    if (!selectedCategory) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/category-display-order/available-services?category_id=${selectedCategory}&search=${searchTerm}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setAvailableServices(data.data);
      }
    } catch (error) {
      console.error('사용 가능한 서비스 조회 실패:', error);
    }
  };

  const addServiceToCategory = async (serviceId: number) => {
    if (!selectedCategory) return;

    try {
      const response = await fetch(`${API_BASE}/api/category-display-order/${selectedCategory}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_service_id: serviceId,
          display_order: displayServices.length + 1,
          is_featured: false
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchDisplayServices();
        fetchAvailableServices();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('서비스 추가 실패:', error);
      alert('서비스 추가에 실패했습니다.');
    }
  };

  const removeServiceFromCategory = async (serviceId: number) => {
    if (!selectedCategory) return;

    if (!window.confirm('이 서비스를 카테고리에서 제거하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/category-display-order/${selectedCategory}/services/${serviceId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchDisplayServices();
        fetchAvailableServices();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('서비스 제거 실패:', error);
      alert('서비스 제거에 실패했습니다.');
    }
  };

  const toggleFeatured = async (item: DisplayOrderItem) => {
    if (!selectedCategory) return;

    const updatedServices = displayServices.map(service => 
      service.ai_service_id === item.ai_service_id 
        ? { ...service, is_featured: !service.is_featured }
        : service
    );

    setDisplayServices(updatedServices);
    setHasUnsavedChanges(true);
  };

  const moveService = (fromIndex: number, toIndex: number) => {
    const newServices = [...displayServices];
    const [movedItem] = newServices.splice(fromIndex, 1);
    newServices.splice(toIndex, 0, movedItem);

    // 순서 재정렬
    const reorderedServices = newServices.map((service, index) => ({
      ...service,
      display_order: index + 1
    }));

    setDisplayServices(reorderedServices);
    setHasUnsavedChanges(true);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    if (draggedItem !== null && draggedItem !== dropIndex) {
      moveService(draggedItem, dropIndex);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    dragCounter.current = 0;
  };

  const saveOrder = async () => {
    if (!selectedCategory) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/category-display-order/${selectedCategory}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: displayServices.map(s => ({
            ai_service_id: s.ai_service_id,
            display_order: s.display_order,
            is_featured: s.is_featured
          }))
        })
      });

      const data = await response.json();
      if (data.success) {
        setHasUnsavedChanges(false);
        alert('순서가 저장되었습니다.');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('순서 저장 실패:', error);
      alert('순서 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetChanges = () => {
    if (window.confirm('변경사항을 취소하시겠습니까?')) {
      fetchDisplayServices();
      setHasUnsavedChanges(false);
    }
  };

  const setupTable = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/setup/category-display-order`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('테이블이 성공적으로 설정되었습니다.');
        if (selectedCategory) {
          fetchDisplayServices();
          fetchAvailableServices();
        }
      } else {
        alert('테이블 설정 실패: ' + data.error);
      }
    } catch (error) {
      console.error('테이블 설정 실패:', error);
      alert('테이블 설정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1>카테고리별 서비스 표시 순서 관리</h1>
        <div className="header-buttons">
          <p>각 카테고리별로 상단에 표시될 AI 서비스 20개를 선택하고 순서를 조정할 수 있습니다.</p>
          <button 
            onClick={setupTable}
            className="btn btn-secondary"
            title="필요한 테이블을 생성하고 초기 데이터를 설정합니다"
          >
            🔧 테이블 설정
          </button>
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="filters">
        <label>카테고리 선택</label>
        <select
          value={selectedCategory || ''}
          onChange={(e) => {
            if (hasUnsavedChanges && !window.confirm('저장하지 않은 변경사항이 있습니다. 카테고리를 변경하시겠습니까?')) {
              return;
            }
            setSelectedCategory(Number(e.target.value) || null);
            setHasUnsavedChanges(false);
          }}
        >
          <option value="">카테고리를 선택하세요</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.category_icon} {category.category_name}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <div className="dashboard-sections">
          {/* 현재 표시 중인 서비스 */}
          <div className="section">
            <div className="panel-header">
              <h2>현재 표시 중인 서비스 ({displayServices.length}/20)</h2>
              <div className="panel-actions">
                {hasUnsavedChanges && (
                  <>
                    <button
                      onClick={resetChanges}
                      className="btn btn-secondary"
                    >
                      취소
                    </button>
                    <button
                      onClick={saveOrder}
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? '저장 중...' : '순서 저장'}
                    </button>
                  </>
                )}
                {!hasUnsavedChanges && (
                  <span className="saved-indicator">✓ 저장됨</span>
                )}
              </div>
            </div>
            
            {hasUnsavedChanges && (
              <div className="unsaved-warning">
                ⚠️ 저장하지 않은 변경사항이 있습니다.
              </div>
            )}

            {loading ? (
              <div className="loading-state">로딩 중...</div>
            ) : (
              <div className="service-list">
                {displayServices.map((item, index) => (
                  <div
                    key={item.id}
                    className={`service-item ${draggedItem === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="drag-handle">
                      <span className="drag-icon">⋮⋮</span>
                      <span className="order-number">{index + 1}</span>
                    </div>

                    <div className="service-info">
                      {item.ai_logo && (
                        <img
                          src={item.ai_logo}
                          alt={item.ai_name}
                          className="service-logo"
                        />
                      )}
                      <div className="service-details">
                        <div className="service-name">{item.ai_name}</div>
                        <div className="service-company">{item.company_name}</div>
                      </div>
                    </div>

                    <div className="service-actions">
                      <div className="move-buttons">
                        <button
                          onClick={() => index > 0 && moveService(index, index - 1)}
                          disabled={index === 0}
                          className="move-btn"
                          title="위로 이동"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => index < displayServices.length - 1 && moveService(index, index + 1)}
                          disabled={index === displayServices.length - 1}
                          className="move-btn"
                          title="아래로 이동"
                        >
                          ↓
                        </button>
                      </div>
                      
                      <button
                        onClick={() => toggleFeatured(item)}
                        className={`featured-btn ${item.is_featured ? 'active' : ''}`}
                        title={item.is_featured ? '상단 고정 해제' : '상단 고정'}
                      >
                        {item.is_featured ? '📌 고정' : '📌'}
                      </button>
                      
                      <button
                        onClick={() => removeServiceFromCategory(item.ai_service_id)}
                        className="remove-btn"
                        title="제거"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                
                {displayServices.length === 0 && (
                  <div className="empty-state">
                    <p>표시할 서비스가 없습니다.</p>
                    <p>오른쪽에서 서비스를 추가해보세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 추가 가능한 서비스 */}
          <div className="section">
            <div className="panel-header">
              <h2>추가 가능한 서비스</h2>
            </div>

            <div className="search-section">
              <input
                type="text"
                placeholder="서비스 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchAvailableServices()}
                className="search-input"
              />
              <button 
                onClick={fetchAvailableServices}
                className="search-btn"
              >
                🔍
              </button>
            </div>

            <div className="available-service-list">
              {availableServices.map((service) => (
                <div
                  key={service.id}
                  className="available-service-item"
                >
                  <div className="service-info">
                    {service.ai_logo && (
                      <img
                        src={service.ai_logo}
                        alt={service.ai_name}
                        className="service-logo"
                      />
                    )}
                    <div className="service-details">
                      <div className="service-name">{service.ai_name}</div>
                      <div className="service-company">{service.company_name}</div>
                      {service.is_step_pick && (
                        <span className="step-pick-badge">⭐ STEP PICK</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => addServiceToCategory(service.id)}
                    className="add-btn"
                    disabled={displayServices.length >= 20}
                  >
                    {displayServices.length >= 20 ? '최대 20개' : '추가'}
                  </button>
                </div>
              ))}
              
              {availableServices.length === 0 && searchTerm && (
                <div className="empty-state">
                  <p>검색 결과가 없습니다.</p>
                </div>
              )}
              
              {availableServices.length === 0 && !searchTerm && (
                <div className="empty-state">
                  <p>추가 가능한 서비스가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default CategoryDisplayOrder;