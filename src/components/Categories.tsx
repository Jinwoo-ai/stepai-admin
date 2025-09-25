import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface Category {
  id: number;
  category_name: string;
  category_description?: string;
  category_icon?: string;
  parent_id?: number;
  category_order: number;
  category_status: 'active' | 'inactive';
  children?: Category[];
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [parentId, setParentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    category_name: '',
    category_description: '',
    category_icon: '',
    category_status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await response.json();
      if (data.success) {
        const categoriesData = data.data || [];
        const organized = organizeCategories(categoriesData);
        setCategories(organized);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    setLoading(false);
  };

  const organizeCategories = (categoriesData: Category[]): Category[] => {
    return categoriesData
      .filter(cat => !cat.parent_id)
      .sort((a, b) => a.category_order - b.category_order)
      .map(cat => ({
        ...cat,
        children: cat.children?.sort((a, b) => a.category_order - b.category_order) || []
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        parent_id: parentId,
        category_order: editingCategory ? editingCategory.category_order : getNextOrder()
      };

      const url = editingCategory 
        ? `${API_BASE_URL}/api/categories/${editingCategory.id}`
        : `${API_BASE_URL}/api/categories`;
      
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingCategory(null);
        setParentId(null);
        resetForm();
        fetchCategories();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const getNextOrder = (): number => {
    if (parentId) {
      const parent = findCategoryById(parentId);
      return parent?.children ? parent.children.length + 1 : 1;
    } else {
      return categories.length + 1;
    }
  };

  const findCategoryById = (id: number): Category | undefined => {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = cat.children.find(child => child.id === id);
        if (found) return cat;
      }
    }
    return undefined;
  };

  const resetForm = () => {
    setFormData({
      category_name: '',
      category_description: '',
      category_icon: '',

      category_status: 'active'
    });
  };

  const deleteCategory = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까? 하위 카테고리도 함께 삭제됩니다.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchCategories();
        }
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category_status: category.category_status === 'active' ? 'inactive' : 'active' 
        }),
      });
      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error updating category status:', error);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.index === destination.index && source.droppableId === destination.droppableId) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${draggableId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_order: destination.index + 1,
          parent_id: destination.droppableId === 'main' ? null : parseInt(destination.droppableId)
        }),
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error reordering categories:', error);
    }
  };

  const openForm = (category?: Category, parent?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        category_name: category.category_name,
        category_description: category.category_description || '',
        category_icon: category.category_icon || '',

        category_status: category.category_status
      });
      setParentId(category.parent_id || null);
    } else {
      setEditingCategory(null);
      resetForm();
      setParentId(parent?.id || null);
    }
    setShowForm(true);
  };

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1>카테고리 관리</h1>
        <button 
          className="btn btn-primary"
          onClick={() => openForm()}
        >
          + 메인 카테고리 추가
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2>
              {editingCategory ? '카테고리 수정' : 
               parentId ? '서브 카테고리 추가' : '메인 카테고리 추가'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>카테고리명 *</label>
                <input
                  type="text"
                  value={formData.category_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={formData.category_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>아이콘 (이모지 또는 URL)</label>
                <input
                  type="text"
                  value={formData.category_icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_icon: e.target.value }))}
                  placeholder="📁 또는 https://example.com/icon.png"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="categories-container">
            <Droppable droppableId="main" type="MAIN_CATEGORY">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="main-categories"
                >
                  {categories.map((category, index) => (
                    <Draggable
                      key={category.id}
                      draggableId={category.id.toString()}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`category-item main-category ${snapshot.isDragging ? 'dragging' : ''}`}
                        >
                          <div className="category-header">
                            <div 
                              {...provided.dragHandleProps}
                              className="drag-handle"
                            >
                              ⋮⋮
                            </div>
                            <div className="category-info">
                              <div className="category-title">
                                {category.category_icon && (
                                  <span className="category-icon">{category.category_icon}</span>
                                )}
                                <span className="category-name">{category.category_name}</span>
                              </div>
                              {category.category_description && (
                                <div className="category-description">
                                  {category.category_description}
                                </div>
                              )}
                            </div>
                            <div className="category-actions">
                              <label className="switch">
                                <input
                                  type="checkbox"
                                  checked={category.category_status === 'active'}
                                  onChange={() => toggleStatus(category)}
                                />
                                <span className="slider"></span>
                              </label>
                              <button
                                onClick={() => openForm(undefined, category)}
                                className="btn-add-sub"
                                title="서브 카테고리 추가"
                              >
                                + 서브
                              </button>
                              <button
                                onClick={() => openForm(category)}
                                className="btn-edit"
                                title="수정"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteCategory(category.id)}
                                className="btn-delete"
                                title="삭제"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {category.children && category.children.length > 0 && (
                            <Droppable 
                              droppableId={category.id.toString()} 
                              type="SUB_CATEGORY"
                            >
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className="sub-categories"
                                >
                                  {category.children?.map((subCategory, subIndex) => (
                                    <Draggable
                                      key={subCategory.id}
                                      draggableId={subCategory.id.toString()}
                                      index={subIndex}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`category-item sub-category ${snapshot.isDragging ? 'dragging' : ''}`}
                                        >
                                          <div className="category-header">
                                            <div 
                                              {...provided.dragHandleProps}
                                              className="drag-handle"
                                            >
                                              ⋮⋮
                                            </div>
                                            <div className="category-info">
                                              <div className="category-title">
                                                {subCategory.category_icon && (
                                                  <span className="category-icon">{subCategory.category_icon}</span>
                                                )}
                                                <span className="category-name">{subCategory.category_name}</span>
                                              </div>
                                              {subCategory.category_description && (
                                                <div className="category-description">
                                                  {subCategory.category_description}
                                                </div>
                                              )}
                                            </div>
                                            <div className="category-actions">
                                              <label className="switch">
                                                <input
                                                  type="checkbox"
                                                  checked={subCategory.category_status === 'active'}
                                                  onChange={() => toggleStatus(subCategory)}
                                                />
                                                <span className="slider"></span>
                                              </label>
                                              <button
                                                onClick={() => openForm(subCategory)}
                                                className="btn-edit"
                                                title="수정"
                                              >
                                                ✏️
                                              </button>
                                              <button
                                                onClick={() => deleteCategory(subCategory.id)}
                                                className="btn-delete"
                                                title="삭제"
                                              >
                                                🗑️
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default Categories;