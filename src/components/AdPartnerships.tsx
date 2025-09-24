import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AdPartnership {
  id: number;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone?: string;
  partnership_type: string;
  budget_range?: string;
  campaign_period?: string;
  target_audience?: string;
  campaign_description?: string;
  additional_requirements?: string;
  attachment_url?: string;
  inquiry_status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004';

const AdPartnerships: React.FC = () => {
  const [partnerships, setPartnerships] = useState<AdPartnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartnership, setSelectedPartnership] = useState<AdPartnership | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    partnership_type: '',
    inquiry_status: ''
  });

  const statusOptions = [
    { value: 'pending', label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'reviewing', label: '검토중', color: 'bg-blue-100 text-blue-800' },
    { value: 'approved', label: '승인', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: '거절', color: 'bg-red-100 text-red-800' },
    { value: 'completed', label: '완료', color: 'bg-gray-100 text-gray-800' }
  ];

  const partnershipTypes = [
    'banner',
    'sponsored_content',
    'affiliate',
    'collaboration',
    'other'
  ];

  useEffect(() => {
    fetchPartnerships();
  }, [currentPage, filters]);

  const fetchPartnerships = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...filters
      });

      const response = await axios.get(`${API_BASE_URL}/api/ad-partnerships?${params}`);
      
      if (response.data.success) {
        setPartnerships(response.data.data.data);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('광고제휴 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePartnership = async (id: number, updates: Partial<AdPartnership>) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/ad-partnerships/${id}`, updates);
      
      if (response.data.success) {
        fetchPartnerships();
        setShowModal(false);
        setSelectedPartnership(null);
      }
    } catch (error) {
      console.error('광고제휴 수정 실패:', error);
    }
  };

  const deletePartnership = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/ad-partnerships/${id}`);
      
      if (response.data.success) {
        fetchPartnerships();
      }
    } catch (error) {
      console.error('광고제휴 삭제 실패:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOption.color}`}>
        {statusOption.label}
      </span>
    ) : status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">광고제휴 관리</h1>
      </div>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제휴 유형
            </label>
            <select
              value={filters.partnership_type}
              onChange={(e) => setFilters({...filters, partnership_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {partnershipTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              value={filters.inquiry_status}
              onChange={(e) => setFilters({...filters, inquiry_status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                회사명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제휴 유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                등록일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {partnerships.map((partnership) => (
              <tr key={partnership.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {partnership.company_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{partnership.contact_person}</div>
                  <div className="text-sm text-gray-500">{partnership.contact_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {partnership.partnership_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(partnership.inquiry_status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(partnership.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedPartnership(partnership);
                      setShowModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    상세보기
                  </button>
                  <button
                    onClick={() => deletePartnership(partnership.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>

      {/* 상세보기 모달 */}
      {showModal && selectedPartnership && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                광고제휴 상세정보
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">회사명</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPartnership.company_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">담당자</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPartnership.contact_person}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이메일</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPartnership.contact_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">연락처</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPartnership.contact_phone || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">제휴 유형</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPartnership.partnership_type}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">예산 범위</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPartnership.budget_range || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">캠페인 기간</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPartnership.campaign_period || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">타겟 고객층</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPartnership.target_audience || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">캠페인 설명</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPartnership.campaign_description || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">추가 요구사항</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPartnership.additional_requirements || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <select
                    value={selectedPartnership.inquiry_status}
                    onChange={(e) => setSelectedPartnership({
                      ...selectedPartnership,
                      inquiry_status: e.target.value as any
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">관리자 메모</label>
                  <textarea
                    value={selectedPartnership.admin_notes || ''}
                    onChange={(e) => setSelectedPartnership({
                      ...selectedPartnership,
                      admin_notes: e.target.value
                    })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="관리자 메모를 입력하세요..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPartnership(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={() => updatePartnership(selectedPartnership.id, {
                    inquiry_status: selectedPartnership.inquiry_status,
                    admin_notes: selectedPartnership.admin_notes,
                    response_date: new Date().toISOString()
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdPartnerships;