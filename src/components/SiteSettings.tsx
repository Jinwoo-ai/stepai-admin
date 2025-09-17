import React, { useState, useEffect } from 'react';

interface SiteSettings {
  id?: number;
  site_title: string;
  company_name: string;
  ceo_name?: string;
  business_number?: string;
  phone_number?: string;
  address?: string;
  privacy_officer?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const SiteSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: '',
    company_name: '',
    ceo_name: '',
    business_number: '',
    phone_number: '',
    address: '',
    privacy_officer: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/site-settings`);
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('설정이 저장되었습니다.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('저장 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error saving site settings:', error);
      setMessage('저장 중 오류가 발생했습니다.');
    }
    setSaving(false);
  };

  const handleInputChange = (field: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="site-settings loading">로딩 중...</div>;
  }

  return (
    <div className="site-settings">
      <div className="page-header">
        <h1>사이트 정보 관리</h1>
        {message && (
          <div className={`message ${message.includes('오류') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h2>기본 정보</h2>
          
          <div className="form-group">
            <label htmlFor="site_title">웹 브라우저 타이틀 *</label>
            <input
              type="text"
              id="site_title"
              value={settings.site_title}
              onChange={(e) => handleInputChange('site_title', e.target.value)}
              placeholder="StepAI - AI 서비스 추천 플랫폼"
              required
            />
            <small>브라우저 탭에 표시되는 제목입니다.</small>
          </div>

          <div className="form-group">
            <label htmlFor="company_name">회사명 *</label>
            <input
              type="text"
              id="company_name"
              value={settings.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="StepAI"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ceo_name">대표자</label>
              <input
                type="text"
                id="ceo_name"
                value={settings.ceo_name || ''}
                onChange={(e) => handleInputChange('ceo_name', e.target.value)}
                placeholder="홍길동"
              />
            </div>

            <div className="form-group">
              <label htmlFor="business_number">사업자 등록번호</label>
              <input
                type="text"
                id="business_number"
                value={settings.business_number || ''}
                onChange={(e) => handleInputChange('business_number', e.target.value)}
                placeholder="123-45-67890"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">대표번호</label>
            <input
              type="tel"
              id="phone_number"
              value={settings.phone_number || ''}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              placeholder="02-1234-5678"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">주소</label>
            <textarea
              id="address"
              value={settings.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="서울특별시 강남구 테헤란로 123, 456호"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="privacy_officer">개인정보관리책임자</label>
            <input
              type="text"
              id="privacy_officer"
              value={settings.privacy_officer || ''}
              onChange={(e) => handleInputChange('privacy_officer', e.target.value)}
              placeholder="김개인 (privacy@stepai.com)"
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? '저장 중...' : '설정 저장'}
          </button>
          <button 
            type="button" 
            onClick={fetchSettings}
            className="btn btn-secondary"
          >
            초기화
          </button>
        </div>
      </form>

      <div className="settings-preview">
        <h2>미리보기</h2>
        <div className="preview-content">
          <div className="preview-item">
            <strong>브라우저 타이틀:</strong> {settings.site_title}
          </div>
          <div className="preview-item">
            <strong>회사 정보:</strong>
            <div className="company-info">
              <p>{settings.company_name}</p>
              {settings.ceo_name && <p>대표자: {settings.ceo_name}</p>}
              {settings.business_number && <p>사업자등록번호: {settings.business_number}</p>}
              {settings.phone_number && <p>대표번호: {settings.phone_number}</p>}
              {settings.address && <p>주소: {settings.address}</p>}
              {settings.privacy_officer && <p>개인정보관리책임자: {settings.privacy_officer}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;