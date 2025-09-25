import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Categories from './components/Categories';
import CategoryDisplayOrder from './components/CategoryDisplayOrder';
import HomepageSettings from './components/HomepageSettings';
import Curations from './components/Curations';
import Users from './components/Users';
import Dashboard from './components/Dashboard';
import SiteSettings from './components/SiteSettings';
import Tags, { TagOption } from './components/Tags';
import AdPartnerships from './components/AdPartnerships';
import './App.css';

interface AIService {
  id: number;
  ai_name: string;
  ai_name_en?: string;
  ai_description?: string;
  ai_type?: string;
  ai_website?: string;
  ai_logo?: string;
  company_name?: string;
  company_name_en?: string;
  embedded_video_url?: string;
  headquarters?: string;
  main_features?: string;
  target_users?: string;
  use_cases?: string;
  similar_services?: string;
  pricing_model?: string;
  pricing_info?: string;
  difficulty_level?: string;
  target_type?: string;
  usage_availability?: string;
  ai_status?: string;
  is_visible?: boolean;
  is_step_pick?: boolean;
  nationality?: string;
  created_at?: string;
  categories?: Category[];
  contents?: AIServiceContent[];
  sns?: AIServiceSNS[];
  similar_services_list?: AIService[];
  service_order?: number;
}

interface Category {
  id: number;
  category_name: string;
  category_description?: string;
  category_icon?: string;
  parent_id?: number;
  category_order: number;
  category_status: string;
  children?: Category[];
  created_at?: string;
  updated_at?: string;
  is_main_category?: boolean | number; // AI 서비스와의 관계에서 메인 카테고리 여부
  parent_category_name?: string; // 부모 카테고리 이름
}

interface AIServiceContent {
  id?: number;
  content_type: string;
  content_title?: string;
  content_text?: string;
  content_order: number;
}

interface AIServiceSNS {
  id?: number;
  sns_type: string;
  sns_url: string;
  sns_order: number;
}

interface AIVideo {
  id?: number;
  video_title: string;
  video_description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  video_status: string;
  is_visible: boolean;
  view_count?: number;
  like_count?: number;
  created_at?: string;
  categories?: Category[];
  ai_services?: AIService[];
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function App() {
  const [currentPage, setCurrentPage] = useState('ai-services');
  const [aiServices, setAiServices] = useState<AIService[]>([]);
  const [aiVideos, setAiVideos] = useState<AIVideo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [aiTypes, setAiTypes] = useState<{id: number, type_name: string}[]>([]);
  const [pricingModels, setPricingModels] = useState<{id: number, model_name: string}[]>([]);
  const [targetTypes, setTargetTypes] = useState<{id: number, type_code: string, type_name: string}[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<AIService | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    ai_status: '',
    is_step_pick: '',
    date_from: '',
    date_to: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [videoPagination, setVideoPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Form states
  const [formData, setFormData] = useState({
    ai_name: '',
    ai_name_en: '',
    ai_description: '',
    ai_type_ids: [] as number[],
    ai_website: '',
    ai_logo: '',
    company_name: '',
    company_name_en: '',
    embedded_video_url: '',
    headquarters: '',

    pricing_model_ids: [] as number[],
    pricing_info: '',
    difficulty_level: 'beginner',
    target_type_ids: [] as number[],
    usage_availability: '',
    nationality: '',
    is_visible: true,
    is_step_pick: false,
    categories: [] as { category_id: number; is_main: boolean; category_name: string; parent_name?: string }[],
    contents: [
      { content_type: 'target_users', content_title: '타겟 사용자', content_text: '', content_order: 1 },
      { content_type: 'main_features', content_title: '주요 기능', content_text: '', content_order: 2 },
      { content_type: 'use_cases', content_title: '추천 활용사례', content_text: '', content_order: 3 }
    ] as AIServiceContent[],
    sns: [] as AIServiceSNS[],
    similar_service_ids: [] as number[],
    selected_tags: [] as number[]
  });

  const [showSimilarServiceModal, setShowSimilarServiceModal] = useState(false);
  const [similarServiceSearch, setSimilarServiceSearch] = useState('');
  const [similarServiceResults, setSimilarServiceResults] = useState<AIService[]>([]);
  const [addedSimilarServices, setAddedSimilarServices] = useState<AIService[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState<Category | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AIVideo | null>(null);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoFormData, setVideoFormData] = useState({
    video_title: '',
    video_description: '',
    video_url: '',
    thumbnail_url: '',
    duration: 0,
    video_status: 'active',
    is_visible: true,
    categories: [] as { category_id: number; category_name: string }[],
    ai_services: [] as { ai_service_id: number; ai_name: string }[],
    selected_tags: [] as number[]
  });
  
  const [showVideoServiceModal, setShowVideoServiceModal] = useState(false);
  const [videoServiceSearch, setVideoServiceSearch] = useState('');
  const [videoServiceResults, setVideoServiceResults] = useState<AIService[]>([]);
  const [selectedVideoServices, setSelectedVideoServices] = useState<AIService[]>([]);

  // AI 서비스 페이지에서만 필요한 API 호출
  useEffect(() => {
    if (currentPage === 'ai-services') {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchAIServices(1);
    }
  }, [filters, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // AI 서비스 폼 열릴 때 데이터 로드
  useEffect(() => {
    if (currentPage === 'ai-services' && showForm) {
      if (categories.length === 0) fetchCategories();
      if (availableTags.length === 0) fetchTags();
      if (aiTypes.length === 0) fetchAiTypes();
      if (pricingModels.length === 0) fetchPricingModels();
      if (targetTypes.length === 0) fetchTargetTypes();
    }
  }, [currentPage, showForm]); // eslint-disable-line react-hooks/exhaustive-deps

  // AI 비디오 페이지에서만 필요한 API 호출
  useEffect(() => {
    if (currentPage === 'ai-videos') {
      setVideoPagination(prev => ({ ...prev, page: 1 }));
      fetchAIVideos(1);
    }
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // AI 비디오 폼 열릴 때 데이터 로드
  useEffect(() => {
    if (currentPage === 'ai-videos' && showVideoForm) {
      if (categories.length === 0) fetchCategories();
      if (availableTags.length === 0) fetchTags();
    }
  }, [currentPage, showVideoForm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAIServices = async (page = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.ai_status) params.append('ai_status', filters.ai_status);
      if (filters.is_step_pick) params.append('is_step_pick', filters.is_step_pick);
      
      const response = await fetch(`${API_BASE_URL}/api/ai-services?${params}&include_categories=true`);
      const data = await response.json();
      if (data.success) {
        setAiServices(data.data?.data || []);
        setPagination(prev => ({
          ...prev,
          page: data.data?.pagination?.page || 1,
          total: data.data?.pagination?.total || 0,
          totalPages: data.data?.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching AI services:', error);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tags`);
      const data = await response.json();
      if (data.success) {
        setAvailableTags(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchAiTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-types`);
      const data = await response.json();
      if (data.success) {
        setAiTypes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching AI types:', error);
    }
  };

  const fetchPricingModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-types/pricing-models`);
      const data = await response.json();
      if (data.success) {
        setPricingModels(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pricing models:', error);
    }
  };

  const fetchTargetTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-types/target-types`);
      const data = await response.json();
      if (data.success) {
        setTargetTypes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching target types:', error);
    }
  };

  const fetchAIVideos = async (page = videoPagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', videoPagination.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.category_id) params.append('category_id', filters.category_id);
      
      const response = await fetch(`${API_BASE_URL}/api/ai-videos?${params}`);
      const data = await response.json();
      if (data.success) {
        setAiVideos(data.data?.data || []);
        setVideoPagination(prev => ({
          ...prev,
          page: data.data?.pagination?.page || 1,
          total: data.data?.pagination?.total || 0,
          totalPages: data.data?.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching AI videos:', error);
    }
    setLoading(false);
  };

  const searchSimilarServices = async (query: string) => {
    if (!query.trim()) {
      setSimilarServiceResults([]);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-services/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setSimilarServiceResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching similar services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const url = editingService 
        ? `${API_BASE_URL}/api/ai-services/${editingService.id}`
        : `${API_BASE_URL}/api/ai-services`;
      
      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingService(null);
        resetForm();
        fetchAIServices();
      }
    } catch (error) {
      console.error('Error saving AI service:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      ai_name: '',
      ai_name_en: '',
      ai_description: '',
      ai_type_ids: [] as number[],
      ai_website: '',
      ai_logo: '',
      company_name: '',
      company_name_en: '',
      embedded_video_url: '',
      headquarters: '',

      pricing_model_ids: [] as number[],
      pricing_info: '',
      difficulty_level: 'beginner',
      target_type_ids: [] as number[],
      usage_availability: '가능',
      nationality: '',
      is_visible: true,
      is_step_pick: false,
      categories: [],
      contents: [
        { content_type: 'target_users', content_title: '타겟 사용자', content_text: '', content_order: 1 },
        { content_type: 'main_features', content_title: '주요 기능', content_text: '', content_order: 2 },
        { content_type: 'use_cases', content_title: '추천 활용사례', content_text: '', content_order: 3 }
      ],
      sns: [],
      similar_service_ids: [],
      selected_tags: []
    });
  };

  const deleteService = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ai-services/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchAIServices();
        }
      } catch (error) {
        console.error('Error deleting AI service:', error);
      }
    }
  };

  const toggleStepPick = async (service: AIService) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_step_pick: !service.is_step_pick }),
      });
      if (response.ok) {
        fetchAIServices();
      }
    } catch (error) {
      console.error('Error updating step pick:', error);
    }
  };

  const addSNS = () => {
    setFormData(prev => ({
      ...prev,
      sns: [...prev.sns, { sns_type: '', sns_url: '', sns_order: prev.sns.length + 1 }]
    }));
  };

  const removeSNS = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sns: prev.sns.filter((_, i) => i !== index)
    }));
  };

  const addSimilarService = async (service: AIService) => {
    if (!editingService) {
      // 새 서비스 등록 시 로컬 상태만 업데이트
      if (!formData.similar_service_ids.includes(service.id)) {
        setFormData(prev => ({
          ...prev,
          similar_service_ids: [...prev.similar_service_ids, service.id]
        }));
      }
    } else {
      // 기존 서비스 수정 시 API 호출
      try {
        const response = await fetch(`${API_BASE_URL}/api/ai-services/${editingService.id}/similar-services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ similar_service_id: service.id })
        });
        
        if (response.ok) {
          setFormData(prev => ({
            ...prev,
            similar_service_ids: [...prev.similar_service_ids, service.id]
          }));
          // 추가된 서비스 정보 저장
          setAddedSimilarServices(prev => [...prev, service]);
          // AI 서비스 목록 새로고침으로 유사 서비스 정보 업데이트
          fetchAIServices();
        }
      } catch (error) {
        console.error('Error adding similar service:', error);
      }
    }
    setShowSimilarServiceModal(false);
    setSimilarServiceSearch('');
    setSimilarServiceResults([]);
  };

  const removeSimilarService = async (serviceId: number) => {
    if (!editingService) {
      // 새 서비스 등록 시 로컬 상태만 업데이트
      setFormData(prev => ({
        ...prev,
        similar_service_ids: prev.similar_service_ids.filter(id => id !== serviceId)
      }));
    } else {
      // 기존 서비스 수정 시 API 호출
      try {
        const response = await fetch(`${API_BASE_URL}/api/ai-services/${editingService.id}/similar-services/${serviceId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setFormData(prev => ({
            ...prev,
            similar_service_ids: prev.similar_service_ids.filter(id => id !== serviceId)
          }));
          // 제거된 서비스 정보 삭제
          setAddedSimilarServices(prev => prev.filter(s => s.id !== serviceId));
          // AI 서비스 목록 새로고침으로 유사 서비스 정보 업데이트
          fetchAIServices();
        }
      } catch (error) {
        console.error('Error removing similar service:', error);
      }
    }
  };

  const addCategory = (category: Category) => {
    const categoryName = category.parent_id 
      ? `${categories.find(c => c.id === category.parent_id)?.category_name} > ${category.category_name}`
      : category.category_name;
    
    const parentName = category.parent_id 
      ? categories.find(c => c.id === category.parent_id)?.category_name
      : undefined;

    if (!formData.categories.find(c => c.category_id === category.id)) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, {
          category_id: category.id,
          is_main: prev.categories.length === 0, // 처음 추가되는 카테고리를 메인으로
          category_name: categoryName,
          parent_name: parentName
        }]
      }));
    }
    setShowCategoryModal(false);
    setSelectedMainCategory(null);
  };

  const removeCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.category_id !== categoryId)
    }));
  };

  const setMainCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(c => ({
        ...c,
        is_main: c.category_id === categoryId
      }))
    }));
  };

  const getMainCategory = (categories: Category[]) => {
    // 메인으로 설정된 카테고리의 부모 카테고리를 반환
    const mainCat = categories.find(cat => !!cat.is_main_category);
    return mainCat?.parent_category_name || '';
  };

  const getSubCategories = (categories: Category[]) => {
    // 메인으로 설정된 카테고리 자체를 서브카테고리로 반환
    const mainCat = categories.find(cat => !!cat.is_main_category);
    return mainCat?.category_name || '';
  };

  const handleVideoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const url = editingVideo 
        ? `${API_BASE_URL}/api/ai-videos/${editingVideo.id}`
        : `${API_BASE_URL}/api/ai-videos`;
      
      const response = await fetch(url, {
        method: editingVideo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...videoFormData,
          ai_services: selectedVideoServices.map((service, index) => ({
            ai_service_id: service.id,
            ai_name: service.ai_name,
            usage_order: index + 1
          }))
        }),
      });

      if (response.ok) {
        setShowVideoForm(false);
        setEditingVideo(null);
        resetVideoForm();
        fetchAIVideos();
      }
    } catch (error) {
      console.error('Error saving AI video:', error);
    }
  };

  const resetVideoForm = () => {
    setVideoFormData({
      video_title: '',
      video_description: '',
      video_url: '',
      thumbnail_url: '',
      duration: 0,
      video_status: 'active',
      is_visible: true,
      categories: [],
      ai_services: [],
      selected_tags: []
    });
    setSelectedVideoServices([]);
  };
  
  const searchVideoServices = async (query: string) => {
    if (!query.trim()) {
      setVideoServiceResults([]);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-services/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setVideoServiceResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching services:', error);
    }
  };
  
  const addVideoService = (service: AIService) => {
    if (!selectedVideoServices.find(s => s.id === service.id)) {
      setSelectedVideoServices(prev => [...prev, service]);
    }
    setShowVideoServiceModal(false);
    setVideoServiceSearch('');
    setVideoServiceResults([]);
  };
  
  const removeVideoService = (serviceId: number) => {
    setSelectedVideoServices(prev => prev.filter(s => s.id !== serviceId));
  };
  
  const moveVideoService = (index: number, direction: 'up' | 'down') => {
    const newServices = [...selectedVideoServices];
    if (direction === 'up' && index > 0) {
      [newServices[index], newServices[index - 1]] = [newServices[index - 1], newServices[index]];
    } else if (direction === 'down' && index < newServices.length - 1) {
      [newServices[index], newServices[index + 1]] = [newServices[index + 1], newServices[index]];
    }
    setSelectedVideoServices(newServices);
  };

  const deleteVideo = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ai-videos/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchAIVideos(videoPagination.page);
        }
      } catch (error) {
        console.error('Error deleting video:', error);
      }
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  const renderAIVideos = () => (
    <div className="ai-videos">
      <div className="page-header">
        <h1>영상 콘텐츠 관리</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingVideo(null);
            resetVideoForm();
            setShowVideoForm(true);
            // 폼 열릴 때 필요한 데이터 로드
            if (categories.length === 0) fetchCategories();
            if (availableTags.length === 0) fetchTags();
          }}
        >
          + 새 영상 콘텐츠
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="filters">
        <div className="filter-row">
          <input
            type="text"
            placeholder="영상 제목 검색"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <select
            value={filters.category_id}
            onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
          >
            <option value="">전체 카테고리</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
            ))}
          </select>
        </div>
      </div>

      {showVideoForm && (
        <div className="form-modal">
          <div className="form-container large">
            <h2>{editingVideo ? '영상 콘텐츠 수정' : '새 영상 콘텐츠 등록'}</h2>
            <form onSubmit={handleVideoSubmit}>
              <div className="form-section">
                <h3>기본 정보</h3>
                <div className="form-group">
                  <label>영상 제목 *</label>
                  <input
                    type="text"
                    value={videoFormData.video_title}
                    onChange={(e) => setVideoFormData(prev => ({ ...prev, video_title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>YouTube 영상 URL *</label>
                  <input
                    type="url"
                    value={videoFormData.video_url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setVideoFormData(prev => ({ 
                        ...prev, 
                        video_url: url,
                        thumbnail_url: getYouTubeThumbnail(url)
                      }));
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                  {videoFormData.video_url && getYouTubeVideoId(videoFormData.video_url) && (
                    <div className="video-preview">
                      <h4>미리보기</h4>
                      <iframe
                        width="300"
                        height="169"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoFormData.video_url)}`}
                        frameBorder="0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>영상 설명</label>
                  <ReactQuill
                    value={videoFormData.video_description}
                    onChange={(value) => setVideoFormData(prev => ({ ...prev, video_description: value }))}
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
                  <label>태그</label>
                  <div className="selected-tags">
                    {videoFormData.selected_tags.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      return tag ? (
                        <div key={tagId} className="tag-item">
                          <span>#{tag.tag_name}</span>
                          <button 
                            type="button" 
                            onClick={() => setVideoFormData(prev => ({
                              ...prev,
                              selected_tags: prev.selected_tags.filter(id => id !== tagId)
                            }))}
                            className="btn-remove-tag"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="tag-selector">
                    <select
                      onChange={(e) => {
                        const tagId = parseInt(e.target.value);
                        if (tagId && !videoFormData.selected_tags.includes(tagId)) {
                          setVideoFormData(prev => ({
                            ...prev,
                            selected_tags: [...prev.selected_tags, tagId]
                          }));
                        }
                        e.target.value = '';
                      }}
                      value=""
                    >
                      <option value="">태그 선택</option>
                      {availableTags
                        .filter(tag => !videoFormData.selected_tags.includes(tag.id))
                        .map(tag => (
                          <option key={tag.id} value={tag.id}>
                            #{tag.tag_name} ({tag.tag_count})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={videoFormData.is_visible}
                        onChange={(e) => setVideoFormData(prev => ({ ...prev, is_visible: e.target.checked }))}
                      />
                      사이트에 노출
                    </label>
                  </div>
                </div>
              </div>
              
              {/* AI 서비스 선택 */}
              <div className="form-section">
                <h3>연관 AI 서비스</h3>
                <div className="selected-services-grid">
                  {selectedVideoServices.map((service, index) => (
                    <div key={service.id} className="service-card">
                      <div className="service-card-header">
                        <div className="service-order-badge">{index + 1}</div>
                        <button 
                          type="button" 
                          onClick={() => removeVideoService(service.id)}
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
                          <div className="service-name">{service.ai_name}</div>
                          <div className="service-type">{service.ai_type}</div>
                        </div>
                      </div>
                      <div className="service-card-actions">
                        <button 
                          type="button" 
                          onClick={() => moveVideoService(index, 'up')}
                          disabled={index === 0}
                          className="btn-move"
                          title="위로 이동"
                        >
                          ↑
                        </button>
                        <button 
                          type="button" 
                          onClick={() => moveVideoService(index, 'down')}
                          disabled={index === selectedVideoServices.length - 1}
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
                      onClick={() => setShowVideoServiceModal(true)}
                      className="btn-add-service"
                    >
                      <div className="add-icon">+</div>
                      <div className="add-text">AI 서비스 추가</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowVideoForm(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  {editingVideo ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* AI 서비스 검색 모달 (영상용) */}
      {showVideoServiceModal && (
        <div className="form-modal">
          <div className="form-container">
            <h3>AI 서비스 검색</h3>
            <div className="search-input-container">
              <input
                type="text"
                placeholder="AI 서비스명으로 검색"
                value={videoServiceSearch}
                onChange={(e) => {
                  setVideoServiceSearch(e.target.value);
                  searchVideoServices(e.target.value);
                }}
                className="search-input"
              />
            </div>
            <div className="search-results-grid">
              {videoServiceResults.map(service => (
                <div key={service.id} className="search-result-card">
                  <div className="result-card-content">
                    <div className="result-service-icon">
                      🤖
                    </div>
                    <div className="result-service-info">
                      <div className="result-service-name">{service.ai_name}</div>
                      <div className="result-service-type">{service.ai_type}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => addVideoService(service)}
                    className="btn-add-result"
                    disabled={selectedVideoServices.some(s => s.id === service.id)}
                  >
                    {selectedVideoServices.some(s => s.id === service.id) ? '이미 추가됨' : '추가'}
                  </button>
                </div>
              ))}
              {videoServiceSearch && videoServiceResults.length === 0 && (
                <div className="no-results">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowVideoServiceModal(false)} className="btn-close">
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
                <th>썸네일</th>
                <th>영상제목</th>
                <th>등록일</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {aiVideos.map((video, index) => (
                <tr key={video.id}>
                  <td>{(videoPagination.page - 1) * videoPagination.limit + index + 1}</td>
                  <td>
                    {video.thumbnail_url && (
                      <img src={video.thumbnail_url} alt="thumbnail" className="video-thumbnail" />
                    )}
                  </td>
                  <td>
                    <div>
                      <div className="video-title">{video.video_title}</div>
                      <div className="video-categories">
                        {video.categories?.map(cat => (
                          <span key={cat.id} className="category-tag">{cat.category_name}</span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>{video.created_at ? new Date(video.created_at).toLocaleDateString() : ''}</td>
                  <td>
                    <span className={`status ${video.video_status}`}>
                      {video.video_status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingVideo(video);
                        setVideoFormData({
                          video_title: video.video_title,
                          video_description: video.video_description || '',
                          video_url: video.video_url,
                          thumbnail_url: video.thumbnail_url || '',
                          duration: video.duration || 0,
                          video_status: video.video_status,
                          is_visible: video.is_visible,
                          categories: video.categories?.map(cat => ({ category_id: cat.id, category_name: cat.category_name })) || [],
                          ai_services: video.ai_services?.map(service => ({ ai_service_id: service.id!, ai_name: service.ai_name })) || [],
                          selected_tags: (video as any).tag_ids || []
                        });
                        setSelectedVideoServices(video.ai_services?.map(service => ({
                          id: service.id!,
                          ai_name: service.ai_name,
                          ai_type: service.ai_type || ''
                        })) || []);
                        setShowVideoForm(true);
                      }}
                      className="btn-edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteVideo(video.id!)}
                      className="btn-delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* 페이징 */}
          {videoPagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => {
                  const newPage = videoPagination.page - 1;
                  setVideoPagination(prev => ({ ...prev, page: newPage }));
                  fetchAIVideos(newPage);
                }}
                disabled={videoPagination.page <= 1}
                className="pagination-btn"
              >
                이전
              </button>
              
              <div className="pagination-info">
                {Math.max(1, videoPagination.page - 2)} ~ {Math.min(videoPagination.totalPages, videoPagination.page + 2)} 페이지 중 {videoPagination.page} 페이지
                (총 {videoPagination.total}개)
              </div>
              
              <div className="pagination-numbers">
                {Array.from({ length: Math.min(5, videoPagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, videoPagination.page - 2) + i;
                  if (pageNum > videoPagination.totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setVideoPagination(prev => ({ ...prev, page: pageNum }));
                        fetchAIVideos(pageNum);
                      }}
                      className={`pagination-number ${pageNum === videoPagination.page ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => {
                  const newPage = videoPagination.page + 1;
                  setVideoPagination(prev => ({ ...prev, page: newPage }));
                  fetchAIVideos(newPage);
                }}
                disabled={videoPagination.page >= videoPagination.totalPages}
                className="pagination-btn"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderAIServices = () => (
    <div className="ai-services">
      <div className="page-header">
        <h1>AI 서비스 관리</h1>
        <div className="header-buttons">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowExcelUpload(true)}
          >
            📄 엑셀 업로드
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingService(null);
              resetForm();
              setShowForm(true);
              // 폼 열릴 때 필요한 데이터 로드
              if (categories.length === 0) fetchCategories();
              if (availableTags.length === 0) fetchTags();
              if (aiTypes.length === 0) fetchAiTypes();
              if (pricingModels.length === 0) fetchPricingModels();
              if (targetTypes.length === 0) fetchTargetTypes();
            }}
          >
            + 새 AI 서비스
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="filters">
        <div className="filter-row">
          <input
            type="text"
            placeholder="서비스명 검색"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <select
            value={filters.category_id}
            onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
          >
            <option value="">전체 카테고리</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
            ))}
          </select>
          <select
            value={filters.ai_status}
            onChange={(e) => setFilters(prev => ({ ...prev, ai_status: e.target.value }))}
          >
            <option value="">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
          <select
            value={filters.is_step_pick}
            onChange={(e) => setFilters(prev => ({ ...prev, is_step_pick: e.target.value }))}
          >
            <option value="">Step Pick 전체</option>
            <option value="true">Step Pick</option>
            <option value="false">일반</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container large">
            <h2>{editingService ? 'AI 서비스 수정' : '새 AI 서비스 등록'}</h2>
            <form onSubmit={handleSubmit}>
              {/* 기본 정보 */}
              <div className="form-section">
                <h3>기본 정보</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>서비스명(국문) *</label>
                    <input
                      type="text"
                      value={formData.ai_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, ai_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>서비스명(영문)</label>
                    <input
                      type="text"
                      value={formData.ai_name_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, ai_name_en: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>기업명(국문)</label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>기업명(영문)</label>
                    <input
                      type="text"
                      value={formData.company_name_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name_en: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>한줄설명</label>
                  <textarea
                    value={formData.ai_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, ai_description: e.target.value }))}
                    rows={2}
                    placeholder="서비스에 대한 간단한 설명을 입력하세요"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>형태 * (복수 선택 가능)</label>
                    <div className="checkbox-group">
                      {aiTypes.map(type => (
                        <label key={type.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.ai_type_ids.includes(type.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, ai_type_ids: [...prev.ai_type_ids, type.id] }));
                              } else {
                                setFormData(prev => ({ ...prev, ai_type_ids: prev.ai_type_ids.filter(id => id !== type.id) }));
                              }
                            }}
                          />
                          {type.type_name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>난이도</label>
                    <select
                      value={formData.difficulty_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value }))}
                    >
                      <option value="beginner">초급</option>
                      <option value="intermediate">중급</option>
                      <option value="advanced">고급</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>대표 URL</label>
                    <input
                      type="url"
                      value={formData.ai_website}
                      onChange={(e) => setFormData(prev => ({ ...prev, ai_website: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>본사</label>
                    <input
                      type="text"
                      value={formData.headquarters}
                      onChange={(e) => setFormData(prev => ({ ...prev, headquarters: e.target.value }))}
                      placeholder="대한민국, 미국, 일본 등"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>로고</label>
                  <div className="logo-upload-section">
                    <div className="logo-input-group">
                      <input
                        type="url"
                        value={formData.ai_logo}
                        onChange={(e) => setFormData(prev => ({ ...prev, ai_logo: e.target.value }))}
                        placeholder="https://example.com/logo.png 또는 파일 업로드"
                      />
                      <div className="upload-buttons">
                        <input
                          type="file"
                          id="logo-upload"
                          accept=".jpg,.jpeg,.png,.gif,.ico,.svg"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const formData = new FormData();
                              formData.append('icon', file);
                              
                              try {
                                // Railway proxy를 통해 요청
                                const response = await fetch(`/api/ai-services/upload-icon`, {
                                  method: 'POST',
                                  body: formData
                                });
                                
                                const result = await response.json();
                                if (result.success) {
                                  // API에서 반환된 URL 그대로 사용 (이미 전체 URL임)
                                  setFormData(prev => ({ ...prev, ai_logo: result.data.url }));
                                } else {
                                  alert('업로드 실패: ' + result.error);
                                }
                              } catch (error) {
                                console.error('Upload error:', error);
                                alert('업로드 중 오류가 발생했습니다.');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          className="btn btn-secondary btn-small"
                        >
                          파일 업로드
                        </button>
                      </div>
                    </div>
                    {formData.ai_logo && (
                      <div className="logo-preview">
                        <img src={formData.ai_logo} alt="로고 미리보기" className="logo-preview-img" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>임베디드 영상 URL</label>
                  <input
                    type="url"
                    value={formData.embedded_video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, embedded_video_url: e.target.value }))}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Target (복수 선택 가능)</label>
                    <div className="checkbox-group">
                      {targetTypes.map(type => (
                        <label key={type.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.target_type_ids.includes(type.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, target_type_ids: [...prev.target_type_ids, type.id] }));
                              } else {
                                setFormData(prev => ({ ...prev, target_type_ids: prev.target_type_ids.filter(id => id !== type.id) }));
                              }
                            }}
                          />
                          {type.type_name} ({type.type_code})
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>사용 가능 여부</label>
                    <select
                      value={formData.usage_availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, usage_availability: e.target.value }))}
                    >
                      <option value="">선택하세요</option>
                      <option value="가능">가능</option>
                      <option value="불가능">불가능</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>가격 모델 (복수 선택 가능)</label>
                    <div className="checkbox-group">
                      {pricingModels.map(model => (
                        <label key={model.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.pricing_model_ids.includes(model.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, pricing_model_ids: [...prev.pricing_model_ids, model.id] }));
                              } else {
                                setFormData(prev => ({ ...prev, pricing_model_ids: prev.pricing_model_ids.filter(id => id !== model.id) }));
                              }
                            }}
                          />
                          {model.model_name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>국가 (구버전)</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                      placeholder="호환성을 위한 필드"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>가격 정보</label>
                  <textarea
                    value={formData.pricing_info}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricing_info: e.target.value }))}
                    rows={2}
                    placeholder="가격 세부 정보를 입력하세요"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.is_visible}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_visible: e.target.checked }))}
                      />
                      사이트에 노출 (Alive)
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.is_step_pick}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_step_pick: e.target.checked }))}
                      />
                      Step Pick (표시위치)
                    </label>
                  </div>
                </div>
              </div>



              {/* 상세 설명 섹션 */}
              <div className="form-section">
                <h3>상세 설명</h3>
                {formData.contents.map((content, index) => (
                  <div key={content.content_type} className="form-group">
                    <label>{content.content_title}</label>
                    <ReactQuill
                      value={content.content_text || ''}
                      onChange={(value) => {
                        const newContents = [...formData.contents];
                        newContents[index].content_text = value;
                        setFormData(prev => ({ ...prev, contents: newContents }));
                      }}
                      modules={{
                        toolbar: [
                          [{ 'font': [] }],
                          [{ 'size': ['small', false, 'large', 'huge'] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'align': [] }],
                          ['link', 'image'],
                          ['clean']
                        ]
                      }}
                      formats={[
                        'font', 'size',
                        'bold', 'italic', 'underline', 'strike',
                        'color', 'background',
                        'header',
                        'list', 'bullet',
                        'align',
                        'link', 'image'
                      ]}
                    />
                  </div>
                ))}
              </div>

              {/* SNS 섹션 */}
              <div className="form-section">
                <h3>공식 SNS</h3>
                {formData.sns.map((sns, index) => (
                  <div key={index} className="sns-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>SNS 타입</label>
                        <select
                          value={sns.sns_type}
                          onChange={(e) => {
                            const newSns = [...formData.sns];
                            newSns[index].sns_type = e.target.value;
                            setFormData(prev => ({ ...prev, sns: newSns }));
                          }}
                        >
                          <option value="">선택하세요</option>
                          <option value="twitter">Twitter</option>
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                          <option value="youtube">YouTube</option>
                          <option value="linkedin">LinkedIn</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>URL</label>
                        <input
                          type="url"
                          value={sns.sns_url}
                          onChange={(e) => {
                            const newSns = [...formData.sns];
                            newSns[index].sns_url = e.target.value;
                            setFormData(prev => ({ ...prev, sns: newSns }));
                          }}
                        />
                      </div>
                      <button type="button" onClick={() => removeSNS(index)} className="btn-remove">
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addSNS} className="btn btn-secondary">
                  + SNS 추가
                </button>
              </div>

              {/* 카테고리 섹션 */}
              <div className="form-section">
                <h3>카테고리 설정</h3>
                <div className="selected-categories">
                  {formData.categories.map(category => (
                    <div key={category.category_id} className="category-tag">
                      <span className="category-name">
                        {category.category_name}
                        {category.is_main && <span className="main-badge">메인</span>}
                      </span>
                      <div className="category-actions">
                        {!category.is_main && (
                          <button 
                            type="button" 
                            onClick={() => setMainCategory(category.category_id)}
                            className="btn-set-main"
                          >
                            메인으로
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => removeCategory(category.category_id)}
                          className="btn-remove-category"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setShowCategoryModal(true)}
                    className="btn btn-secondary"
                  >
                    + 카테고리 추가
                  </button>
                </div>
              </div>

              {/* 태그 섹션 */}
              <div className="form-section">
                <h3>태그</h3>
                <div className="selected-tags">
                  {formData.selected_tags.map(tagId => {
                    const tag = availableTags.find(t => t.id === tagId);
                    return tag ? (
                      <div key={tagId} className="tag-item">
                        <span>#{tag.tag_name}</span>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            selected_tags: prev.selected_tags.filter(id => id !== tagId)
                          }))}
                          className="btn-remove-tag"
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="tag-selector">
                  <select
                    onChange={(e) => {
                      const tagId = parseInt(e.target.value);
                      if (tagId && !formData.selected_tags.includes(tagId)) {
                        setFormData(prev => ({
                          ...prev,
                          selected_tags: [...prev.selected_tags, tagId]
                        }));
                      }
                      e.target.value = '';
                    }}
                    value=""
                  >
                    <option value="">태그 선택</option>
                    {availableTags
                      .filter(tag => !formData.selected_tags.includes(tag.id))
                      .map(tag => (
                        <option key={tag.id} value={tag.id}>
                          #{tag.tag_name} ({tag.tag_count})
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {/* 유사 서비스 섹션 */}
              <div className="form-section">
                <h3>유사 서비스</h3>
                <div className="selected-similar-services">
                  {formData.similar_service_ids.map(serviceId => {
                    const service = aiServices.find(s => s.id === serviceId) || addedSimilarServices.find(s => s.id === serviceId);
                    return service ? (
                      <div key={serviceId} className="similar-service-card">
                        <div className="similar-service-info">
                          {service.ai_logo && (
                            <img src={service.ai_logo} alt="logo" className="similar-service-logo" />
                          )}
                          <div className="similar-service-details">
                            <h4>{service.ai_name}</h4>
                            {service.company_name && (
                              <p className="company-name">{service.company_name}</p>
                            )}
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeSimilarService(serviceId)}
                          className="btn-remove-similar"
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  })}
                  <button 
                    type="button" 
                    onClick={() => setShowSimilarServiceModal(true)}
                    className="btn btn-secondary add-similar-btn"
                  >
                    + 유사 서비스 추가
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  {editingService ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 카테고리 선택 모달 */}
      {showCategoryModal && (
        <div className="form-modal">
          <div className="form-container">
            <h3>카테고리 선택</h3>
            
            {!selectedMainCategory ? (
              <div>
                <h4>메인 카테고리 선택</h4>
                <div className="category-list">
                  {categories.filter(cat => !cat.parent_id && cat.category_status === 'active').map(mainCat => (
                    <div key={mainCat.id} className="category-option">
                      <button 
                        onClick={() => {
                          if (mainCat.children && mainCat.children.length > 0) {
                            setSelectedMainCategory(mainCat);
                          } else {
                            addCategory(mainCat);
                          }
                        }}
                        className="category-button"
                      >
                        {mainCat.category_icon && <span>{mainCat.category_icon}</span>}
                        <span>{mainCat.category_name}</span>
                        {mainCat.children && mainCat.children.length > 0 && <span>›</span>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="breadcrumb">
                  <button onClick={() => setSelectedMainCategory(null)}>
                    {selectedMainCategory.category_name}
                  </button>
                  <span>&gt; 서브 카테고리 선택</span>
                </div>
                <div className="category-list">
                  <div className="category-option">
                    <button 
                      onClick={() => addCategory(selectedMainCategory)}
                      className="category-button main-only"
                    >
                      {selectedMainCategory.category_icon && <span>{selectedMainCategory.category_icon}</span>}
                      <span>{selectedMainCategory.category_name} (메인만)</span>
                    </button>
                  </div>
                  {selectedMainCategory.children?.filter(cat => cat.category_status === 'active').map(subCat => (
                    <div key={subCat.id} className="category-option">
                      <button 
                        onClick={() => addCategory(subCat)}
                        className="category-button sub-category"
                      >
                        {subCat.category_icon && <span>{subCat.category_icon}</span>}
                        <span>{subCat.category_name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => {
                setShowCategoryModal(false);
                setSelectedMainCategory(null);
              }}
              className="btn-close"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 유사 서비스 검색 모달 */}
      {showSimilarServiceModal && (
        <div className="form-modal">
          <div className="form-container large">
            <h3>유사 서비스 검색</h3>
            <input
              type="text"
              placeholder="AI 서비스명으로 검색"
              value={similarServiceSearch}
              onChange={(e) => {
                setSimilarServiceSearch(e.target.value);
                searchSimilarServices(e.target.value);
              }}
              className="search-input"
            />
            <div className="service-cards-grid">
              {similarServiceResults.map(service => (
                <div key={service.id} className="service-card" onClick={() => addSimilarService(service)}>
                  <div className="service-card-header">
                    {service.ai_logo && (
                      <img src={service.ai_logo} alt="logo" className="service-card-logo" />
                    )}
                    <div className="service-card-info">
                      <h4 className="service-card-name">{service.ai_name}</h4>
                      {service.ai_name_en && (
                        <p className="service-card-name-en">{service.ai_name_en}</p>
                      )}
                      {service.company_name && (
                        <p className="service-card-company">{service.company_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="service-card-actions">
                    <button type="button" className="btn-add-service">
                      + 추가
                    </button>
                  </div>
                </div>
              ))}
              {similarServiceResults.length === 0 && similarServiceSearch && (
                <div className="no-results">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowSimilarServiceModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 모달 */}
      {showExcelUpload && (
        <div className="form-modal">
          <div className="form-container">
            <h3>AI 서비스 엑셀 업로드</h3>
            
            <div className="excel-upload-info">
              <div className="info-header">
                <h4>엑셀 파일 형식</h4>
                <a 
                  href={`${API_BASE_URL}/public/ai_services_template.xlsx`}
                  download="ai_services_template.xlsx"
                  className="btn btn-secondary btn-small"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  💾 샘플 다운로드
                </a>
              </div>
              <p>샘플 파일을 다운로드하여 편집 후 업로드하세요.</p>
              <p>다음 열 순서로 작성해주세요:</p>
              <ul>
                <li><strong>Alive</strong> (Yes/No) - 서비스 활성 상태</li>
                <li><strong>표시위치</strong> (STEP_PICK/빈값) - 우선 표시 여부</li>
                <li><strong>서비스명(영문)</strong> - 영문 서비스명</li>
                <li><strong>서비스명(국문)</strong> (필수) - 한글 서비스명</li>
                <li><strong>기업명(영문)</strong> - 영문 기업명</li>
                <li><strong>기업명(국문)</strong> - 한글 기업명</li>
                <li><strong>임베디드 영상 URL</strong> - 소개 영상 URL</li>
                <li><strong>본사</strong> - 본사 소재지</li>
                <li><strong>대표 URL</strong> - 서비스 공식 웹사이트</li>
                <li><strong>로고(URL)</strong> - 로고 이미지 URL</li>
                <li><strong>형태</strong> (필수) - WEB, MOB, DES, EXT, API 등 (쉼표로 구분)</li>
                <li><strong>메인 카테고리</strong> - 대분류</li>
                <li><strong>Tags</strong> - 태그 (#태그1 #태그2 형식)</li>
                <li><strong>Target</strong> - B, C, G 등 대상 고객 (쉼표로 구분)</li>
                <li><strong>Price</strong> - 유료, 무료, 프리미엄 등 (쉼표로 구분)</li>
                <li><strong>사용</strong> - 가능, 불가능</li>
                <li><strong>한줄설명</strong> - 서비스 간단 설명</li>
                <li><strong>주요기능</strong> - 주요 기능 설명</li>
                <li><strong>난이도</strong> - 초급, 중급, 고급</li>
                <li><strong>타겟 사용자</strong> - 대상 사용자 설명</li>
                <li><strong>추천활용사례</strong> - 추천 활용 방법</li>
                <li><strong>유사 서비스</strong> - 유사한 다른 서비스명 (쉼표로 구분)</li>
              </ul>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              
              if (isUploading) return; // 업로드 중이면 중복 실행 방지
              
              setIsUploading(true);
              setUploadResult(null);
              
              const formData = new FormData(e.target as HTMLFormElement);
              
              try {
                const response = await fetch(`${API_BASE_URL}/api/ai-services/upload-excel`, {
                  method: 'POST',
                  body: formData
                });
                
                const result = await response.json();
                setUploadResult(result);
                
                if (result.success) {
                  setPagination(prev => ({ ...prev, page: 1 }));
                  fetchAIServices(1);
                }
              } catch (error) {
                console.error('Excel upload error:', error);
                setUploadResult({
                  success: false,
                  error: '업로드 중 오류가 발생했습니다.'
                });
              } finally {
                setIsUploading(false);
              }
            }}>
              <div className="form-group">
                <label>엑셀 파일 선택</label>
                <input
                  type="file"
                  name="excel"
                  accept=".xlsx,.xls"
                  required
                  disabled={isUploading}
                />
              </div>
              
              {isUploading && (
                <div className="upload-progress">
                  <div className="spinner"></div>
                  <p>업로드 중입니다. 잠시만 기다려주세요...</p>
                </div>
              )}
              
              {uploadResult && (
                <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
                  <p>{uploadResult.message || uploadResult.error}</p>
                  {uploadResult.data && uploadResult.data.errors && uploadResult.data.errors.length > 0 && (
                    <div className="error-details">
                      <h5>오류 상세:</h5>
                      <ul>
                        {uploadResult.data.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="form-actions">
                {!uploadResult ? (
                  <>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowExcelUpload(false);
                        setUploadResult(null);
                        setIsUploading(false);
                      }}
                      disabled={isUploading}
                    >
                      취소
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <span className="spinner-small"></span>
                          업로드 중...
                        </>
                      ) : (
                        '업로드'
                      )}
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowExcelUpload(false);
                      setUploadResult(null);
                      setIsUploading(false);
                    }}
                    className="btn-primary"
                  >
                    확인
                  </button>
                )}
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
                <th>카테고리</th>
                <th>태그</th>
                <th>로고</th>
                <th>AI서비스명</th>
                <th>등록일</th>
                <th>Step Pick</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {aiServices.map((service, index) => (
                <tr key={service.id}>
                  <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                  <td>
                    <div className="category-display">
                      {service.categories?.map(cat => (
                        <span key={cat.id} className="category-tag">
                          {cat.parent_category_name ? `${cat.parent_category_name} > ${cat.category_name}` : cat.category_name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="tags-display">
                      {(service as any).tags && (
                        <span className="tags-text">{(service as any).tags}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {service.ai_logo && (
                      <img src={service.ai_logo} alt="logo" className="service-logo" />
                    )}
                  </td>
                  <td>
                    <div>
                      <div className="service-name">{service.ai_name}</div>
                      <div className="service-type">{service.ai_type}</div>
                    </div>
                  </td>
                  <td>{service.created_at ? new Date(service.created_at).toLocaleDateString() : ''}</td>
                  <td>
                    <button
                      onClick={() => toggleStepPick(service)}
                      className={`step-pick-btn ${service.is_step_pick ? 'active' : ''}`}
                    >
                      {service.is_step_pick ? '⭐' : '☆'}
                    </button>
                  </td>
                  <td>
                    <span className={`status ${service.ai_status}`}>
                      {service.ai_status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingService(service);
                        setFormData({
                          ai_name: service.ai_name,
                          ai_name_en: service.ai_name_en || '',
                          ai_description: service.ai_description || '',
                          ai_type_ids: (service as any).ai_types ? aiTypes.filter(t => (service as any).ai_types.includes(t.type_name)).map(t => t.id) : [],
                          ai_website: service.ai_website || '',
                          ai_logo: service.ai_logo || '',
                          company_name: service.company_name || '',
                          company_name_en: service.company_name_en || '',
                          embedded_video_url: service.embedded_video_url || '',
                          headquarters: service.headquarters || '',
                          pricing_model_ids: (service as any).pricing_models ? pricingModels.filter(m => (service as any).pricing_models.includes(m.model_name)).map(m => m.id) : [],
                          pricing_info: service.pricing_info || '',
                          difficulty_level: service.difficulty_level || 'beginner',
                          target_type_ids: (service as any).target_types ? targetTypes.filter(t => (service as any).target_types.some((st: any) => st.code === t.type_code)).map(t => t.id) : [],
                          usage_availability: service.usage_availability || '',
                          nationality: service.nationality || '',
                          is_visible: service.is_visible ?? true,
                          is_step_pick: service.is_step_pick ?? false,
                          categories: service.categories?.map(cat => ({
                            category_id: cat.id,
                            is_main: !!cat.is_main_category,
                            category_name: cat.parent_id 
                              ? `${cat.parent_category_name} > ${cat.category_name}`
                              : cat.category_name,
                            parent_name: cat.parent_category_name
                          })) || [],
                          contents: service.contents?.length ? service.contents : [
                            { content_type: 'target_users', content_title: '타겟 사용자', content_text: '', content_order: 1 },
                            { content_type: 'main_features', content_title: '주요 기능', content_text: '', content_order: 2 },
                            { content_type: 'use_cases', content_title: '추천 활용사례', content_text: '', content_order: 3 }
                          ],
                          sns: service.sns || [],
                          similar_service_ids: service.similar_services_list?.map(s => s.id) || [],
                          selected_tags: (service as any).tag_ids || []
                        });
                        setShowForm(true);
                      }}
                      className="btn-edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteService(service.id)}
                      className="btn-delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* 페이징 */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => {
                  const newPage = pagination.page - 1;
                  setPagination(prev => ({ ...prev, page: newPage }));
                  fetchAIServices(newPage);
                }}
                disabled={pagination.page <= 1}
                className="pagination-btn"
              >
                이전
              </button>
              
              <div className="pagination-info">
                페이지 {pagination.page} / {pagination.totalPages} (총 {pagination.total}개)
              </div>
              
              <div className="pagination-numbers">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setPagination(prev => ({ ...prev, page: pageNum }));
                        fetchAIServices(pageNum);
                      }}
                      className={`pagination-number ${pageNum === pagination.page ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => {
                  const newPage = pagination.page + 1;
                  setPagination(prev => ({ ...prev, page: newPage }));
                  fetchAIServices(newPage);
                }}
                disabled={pagination.page >= pagination.totalPages}
                className="pagination-btn"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="App">
      <nav className="sidebar">
        <div className="logo">
          <h2>StepAI Admin</h2>
        </div>
        <ul className="nav-menu">
          <li>
            <button
              className={currentPage === 'dashboard' ? 'active' : ''}
              onClick={() => setCurrentPage('dashboard')}
            >
              📊 대시보드
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'categories' ? 'active' : ''}
              onClick={() => setCurrentPage('categories')}
            >
              📁 카테고리
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'category-display-order' ? 'active' : ''}
              onClick={() => setCurrentPage('category-display-order')}
            >
              📋 카테고리 표시순서
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'homepage-settings' ? 'active' : ''}
              onClick={() => setCurrentPage('homepage-settings')}
            >
              🏠 메인페이지 관리
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'tags' ? 'active' : ''}
              onClick={() => setCurrentPage('tags')}
            >
              🏷️ 태그 관리
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'ai-services' ? 'active' : ''}
              onClick={() => setCurrentPage('ai-services')}
            >
              🤖 AI 서비스
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'ai-videos' ? 'active' : ''}
              onClick={() => setCurrentPage('ai-videos')}
            >
              🎥 영상 콘텐츠
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'curations' ? 'active' : ''}
              onClick={() => setCurrentPage('curations')}
            >
              📋 큐레이션
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'users' ? 'active' : ''}
              onClick={() => setCurrentPage('users')}
            >
              👥 회원관리
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'ad-partnerships' ? 'active' : ''}
              onClick={() => setCurrentPage('ad-partnerships')}
            >
              🤝 광고제휴
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'site-settings' ? 'active' : ''}
              onClick={() => setCurrentPage('site-settings')}
            >
              ⚙️ 사이트 정보
            </button>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'categories' && <Categories />}
        {currentPage === 'category-display-order' && <CategoryDisplayOrder />}
        {currentPage === 'homepage-settings' && <HomepageSettings />}
        {currentPage === 'ai-services' && renderAIServices()}
        {currentPage === 'ai-videos' && renderAIVideos()}
        {currentPage === 'curations' && <Curations />}
        {currentPage === 'users' && <Users />}
        {currentPage === 'tags' && <Tags />}
        {currentPage === 'ad-partnerships' && <AdPartnerships />}
        {currentPage === 'site-settings' && <SiteSettings />}
      </main>
    </div>
  );
}

export default App;