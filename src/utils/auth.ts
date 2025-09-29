const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export interface User {
  id: number;
  name: string;
  email: string;
  user_type: string;
}

export const authUtils = {
  // 토큰 저장
  setToken: (token: string) => {
    localStorage.setItem('admin_token', token);
  },

  // 토큰 조회
  getToken: (): string | null => {
    return localStorage.getItem('admin_token');
  },

  // 사용자 정보 저장
  setUser: (user: User) => {
    localStorage.setItem('admin_user', JSON.stringify(user));
  },

  // 사용자 정보 조회
  getUser: (): User | null => {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 로그인 상태 확인
  isLoggedIn: (): boolean => {
    const token = authUtils.getToken();
    const user = authUtils.getUser();
    return !!(token && user && user.user_type === 'admin');
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    const token = authUtils.getToken();
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/admin/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
    
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  // API 요청 헤더 생성
  getAuthHeaders: (): Record<string, string> => {
    const token = authUtils.getToken();
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    } : {
      'Content-Type': 'application/json',
    };
  },

  // 인증이 필요한 API 요청
  authenticatedFetch: async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = {
      ...authUtils.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 401 또는 403 에러 시 로그아웃 처리
    if (response.status === 401 || response.status === 403) {
      await authUtils.logout();
      window.location.reload();
    }

    return response;
  },
};

export default authUtils;