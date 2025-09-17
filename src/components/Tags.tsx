import React, { useState, useEffect } from 'react';

export interface TagOption {
  id: number;
  tag_name: string;
  tag_count: number;
}

interface Tag {
  id: number;
  tag_name: string;
  tag_count: number;
  service_count: number;
  video_count: number;
  created_at: string;
}

interface TagItem {
  id: number;
  ai_name?: string;
  ai_type?: string;
  video_title?: string;
  created_at: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const Tags: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagItems, setTagItems] = useState<{ services: TagItem[], videos: TagItem[] }>({ services: [], videos: [] });
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tags`);
      const data = await response.json();
      if (data.success) {
        setTags(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
    setLoading(false);
  };

  const fetchTagItems = async (tagId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tags/${tagId}/items`);
      const data = await response.json();
      if (data.success) {
        setTagItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching tag items:', error);
    }
  };

  const removeServiceFromTag = async (tagId: number, serviceId: number) => {
    if (window.confirm('이 태그에서 AI 서비스를 제거하시겠습니까?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tags/${tagId}/services/${serviceId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchTags();
          if (selectedTag) {
            fetchTagItems(selectedTag.id);
          }
        }
      } catch (error) {
        console.error('Error removing service from tag:', error);
      }
    }
  };

  const removeVideoFromTag = async (tagId: number, videoId: number) => {
    if (window.confirm('이 태그에서 AI 비디오를 제거하시겠습니까?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tags/${tagId}/videos/${videoId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchTags();
          if (selectedTag) {
            fetchTagItems(selectedTag.id);
          }
        }
      } catch (error) {
        console.error('Error removing video from tag:', error);
      }
    }
  };

  const handleTagClick = (tag: Tag) => {
    setSelectedTag(tag);
    fetchTagItems(tag.id);
  };

  const addTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_name: newTagName.trim() }),
      });
      if (response.ok) {
        setNewTagName('');
        setShowAddForm(false);
        fetchTags();
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const deleteTag = async (tagId: number) => {
    if (window.confirm('이 태그를 삭제하시겠습니까? 연결된 모든 관계도 삭제됩니다.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tags/${tagId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchTags();
          if (selectedTag?.id === tagId) {
            setSelectedTag(null);
          }
        }
      } catch (error) {
        console.error('Error deleting tag:', error);
      }
    }
  };

  return (
    <div className="tags">
      <div className="page-header">
        <h1>태그 관리</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + 새 태그
        </button>
      </div>

      <div className="tags-layout">
        {/* 태그 목록 */}
        <div className="tags-list">
          <h2>태그 목록</h2>
          {loading ? (
            <div>로딩 중...</div>
          ) : (
            <div className="tag-items">
              {tags.map(tag => (
                <div 
                  key={tag.id} 
                  className={`tag-item ${selectedTag?.id === tag.id ? 'selected' : ''}`}
                >
                  <div className="tag-content" onClick={() => handleTagClick(tag)}>
                    <div className="tag-name">#{tag.tag_name}</div>
                    <div className="tag-stats">
                      <span>서비스: {tag.service_count}</span>
                      <span>비디오: {tag.video_count}</span>
                      <span>총 사용: {tag.tag_count}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="btn-delete-tag"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 태그 상세 */}
        {selectedTag && (
          <div className="tag-details">
            <h2>#{selectedTag.tag_name} 상세</h2>
            
            {/* AI 서비스 목록 */}
            <div className="tag-section">
              <h3>AI 서비스 ({tagItems.services.length}개)</h3>
              <div className="tag-items-list">
                {tagItems.services.map(service => (
                  <div key={service.id} className="tag-item-row">
                    <div className="item-info">
                      <span className="item-name">{service.ai_name}</span>
                      <span className="item-type">{service.ai_type}</span>
                      <span className="item-date">{new Date(service.created_at).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => removeServiceFromTag(selectedTag.id, service.id)}
                      className="btn-remove"
                    >
                      제거
                    </button>
                  </div>
                ))}
                {tagItems.services.length === 0 && (
                  <div className="no-items">연결된 AI 서비스가 없습니다.</div>
                )}
              </div>
            </div>

            {/* AI 비디오 목록 */}
            <div className="tag-section">
              <h3>AI 비디오 ({tagItems.videos.length}개)</h3>
              <div className="tag-items-list">
                {tagItems.videos.map(video => (
                  <div key={video.id} className="tag-item-row">
                    <div className="item-info">
                      <span className="item-name">{video.video_title}</span>
                      <span className="item-date">{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => removeVideoFromTag(selectedTag.id, video.id)}
                      className="btn-remove"
                    >
                      제거
                    </button>
                  </div>
                ))}
                {tagItems.videos.length === 0 && (
                  <div className="no-items">연결된 AI 비디오가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 태그 추가 모달 */}
      {showAddForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>새 태그 추가</h3>
            <form onSubmit={addTag}>
              <div className="form-group">
                <label>태그명 *</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="태그명 입력 (# 없이)"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tags;