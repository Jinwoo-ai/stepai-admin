import React, { useState, useEffect } from 'react';

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  inquiry_type: 'general' | 'technical' | 'partnership' | 'bug_report' | 'feature_request';
  subject: string;
  message: string;
  attachment_url?: string;
  inquiry_status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  admin_notes?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

interface InquiriesProps {
  onUpdate?: () => void;
}

const Inquiries: React.FC<InquiriesProps> = ({ onUpdate }) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filters, setFilters] = useState({
    inquiry_type: '',
    inquiry_status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const inquiryTypeLabels = {
    general: '일반 문의',
    technical: '기술 문의',
    partnership: '제휴 문의',
    bug_report: '버그 신고',
    feature_request: '기능 요청'
  };

  const inquiryStatusLabels = {
    pending: '대기',
    in_progress: '진행중',
    resolved: '해결',
    closed: '종료'
  };

  useEffect(() => {
    fetchInquiries();
  }, [filters, pagination.page]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (filters.inquiry_type) params.append('inquiry_type', filters.inquiry_type);
      if (filters.inquiry_status) params.append('inquiry_status', filters.inquiry_status);

      const response = await fetch(`${API_BASE_URL}/api/inquiries?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setInquiries(data.data?.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.data?.pagination?.total || 0,
          totalPages: data.data?.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
    setLoading(false);
  };

  const updateInquiryStatus = async (id: number, status: string, adminNotes?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiry_status: status,
          admin_notes: adminNotes,
          response_date: new Date().toISOString()
        })
      });

      if (response.ok) {
        fetchInquiries();
        onUpdate?.(); // 미처리 건수 업데이트
        if (selectedInquiry?.id === id) {
          const updatedInquiry = { ...selectedInquiry, inquiry_status: status as any, admin_notes: adminNotes };
          setSelectedInquiry(updatedInquiry);
        }
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
    }
  };

  const deleteInquiry = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/inquiries/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchInquiries();
          onUpdate?.(); // 미처리 건수 업데이트
          if (selectedInquiry?.id === id) {
            setShowDetail(false);
            setSelectedInquiry(null);
          }
        }
      } catch (error) {
        console.error('Error deleting inquiry:', error);
      }
    }
  };

  const handleStatusChange = (inquiry: Inquiry, newStatus: string) => {
    const adminNotes = prompt('관리자 메모를 입력하세요 (선택사항):');
    updateInquiryStatus(inquiry.id, newStatus, adminNotes || undefined);
  };

  return (
    <div className="inquiries">
      <div className="page-header">
        <h1>고객문의 관리</h1>
      </div>

      {/* 필터 섹션 */}
      <div className="filters">
        <div className="filter-row">
          <select
            value={filters.inquiry_type}
            onChange={(e) => setFilters(prev => ({ ...prev, inquiry_type: e.target.value }))}
          >
            <option value="">전체 문의 유형</option>
            {Object.entries(inquiryTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filters.inquiry_status}
            onChange={(e) => setFilters(prev => ({ ...prev, inquiry_status: e.target.value }))}
          >
            <option value="">전체 상태</option>
            {Object.entries(inquiryStatusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>문의 유형</th>
                <th>제목</th>
                <th>문의자</th>
                <th>등록일</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry, index) => (
                <tr key={inquiry.id}>
                  <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                  <td>
                    <span className={`inquiry-type ${inquiry.inquiry_type}`}>
                      {inquiryTypeLabels[inquiry.inquiry_type]}
                    </span>
                  </td>
                  <td>
                    <div className="inquiry-subject">
                      {inquiry.subject}
                      {inquiry.attachment_url && <span className="attachment-icon">📎</span>}
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="inquirer-name">{inquiry.name}</div>
                      <div className="inquirer-email">{inquiry.email}</div>
                    </div>
                  </td>
                  <td>{new Date(inquiry.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status ${inquiry.inquiry_status}`}>
                      {inquiryStatusLabels[inquiry.inquiry_status]}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedInquiry(inquiry);
                        setShowDetail(true);
                      }}
                      className="btn-view"
                    >
                      👁️
                    </button>
                    <select
                      value={inquiry.inquiry_status}
                      onChange={(e) => handleStatusChange(inquiry, e.target.value)}
                      className="status-select"
                    >
                      {Object.entries(inquiryStatusLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteInquiry(inquiry.id)}
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
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="pagination-btn"
              >
                이전
              </button>
              
              <div className="pagination-info">
                페이지 {pagination.page} / {pagination.totalPages} (총 {pagination.total}개)
              </div>
              
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="pagination-btn"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {/* 상세 보기 모달 */}
      {showDetail && selectedInquiry && (
        <div className="form-modal">
          <div className="form-container large">
            <h2>고객문의 상세</h2>
            
            <div className="inquiry-detail">
              <div className="detail-section">
                <h3>기본 정보</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>문의 유형</label>
                    <span className={`inquiry-type ${selectedInquiry.inquiry_type}`}>
                      {inquiryTypeLabels[selectedInquiry.inquiry_type]}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>상태</label>
                    <span className={`status ${selectedInquiry.inquiry_status}`}>
                      {inquiryStatusLabels[selectedInquiry.inquiry_status]}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>문의자명</label>
                    <span>{selectedInquiry.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>이메일</label>
                    <span>{selectedInquiry.email}</span>
                  </div>
                  {selectedInquiry.phone && (
                    <div className="detail-item">
                      <label>전화번호</label>
                      <span>{selectedInquiry.phone}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>등록일</label>
                    <span>{new Date(selectedInquiry.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>문의 내용</h3>
                <div className="detail-item">
                  <label>제목</label>
                  <div className="inquiry-subject-detail">{selectedInquiry.subject}</div>
                </div>
                <div className="detail-item">
                  <label>내용</label>
                  <div className="inquiry-message">{selectedInquiry.message}</div>
                </div>
                {selectedInquiry.attachment_url && (
                  <div className="detail-item">
                    <label>첨부파일</label>
                    <a 
                      href={selectedInquiry.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="attachment-link"
                    >
                      📎 첨부파일 보기
                    </a>
                  </div>
                )}
              </div>

              {selectedInquiry.admin_notes && (
                <div className="detail-section">
                  <h3>관리자 메모</h3>
                  <div className="admin-notes">{selectedInquiry.admin_notes}</div>
                </div>
              )}

              {selectedInquiry.response_date && (
                <div className="detail-section">
                  <h3>처리 정보</h3>
                  <div className="detail-item">
                    <label>처리일시</label>
                    <span>{new Date(selectedInquiry.response_date).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button onClick={() => setShowDetail(false)}>
                닫기
              </button>
              <button 
                onClick={() => {
                  const adminNotes = prompt('관리자 메모를 입력하세요:', selectedInquiry.admin_notes || '');
                  if (adminNotes !== null) {
                    updateInquiryStatus(selectedInquiry.id, selectedInquiry.inquiry_status, adminNotes);
                  }
                }}
                className="btn-secondary"
              >
                메모 수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inquiries;