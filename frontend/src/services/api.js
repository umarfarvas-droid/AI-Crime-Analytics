import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
}

// Attach JWT token from localStorage if present and valid
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      if (isTokenExpired(token)) {
        console.warn('Stored JWT token has expired. Clearing storage.');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_info');
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 unauth
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access. Clearing stored auth token.');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_info');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email, password) => {
    const response = await apiClient.post('/v1/auth/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('jwt_token', response.data.token);
      localStorage.setItem('user_info', JSON.stringify(response.data));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('jwt_token');
  }
};

export const casesApi = {
  createCase: async (caseData) => {
    const response = await apiClient.post('/v1/cases', caseData);
    return response.data;
  },
  getAllCases: async () => {
    const response = await apiClient.get('/v1/cases');
    return response.data;
  },
  getCaseById: async (id) => {
    const response = await apiClient.get(`/v1/cases/${id}`);
    return response.data;
  },
  analyzeCase: async (id) => {
    const response = await apiClient.post(`/v1/cases/${id}/analyze`);
    return response.data;
  },
  chatWithCase: async (id, message) => {
    const caseIdParam = String(id);
    console.log('[RAG] Sending:', { caseId: caseIdParam, message });
    const response = await apiClient.post(`/v1/cases/${caseIdParam}/chat`, { caseId: caseIdParam, message, question: message });
    console.log('[RAG] Response:', response.data);
    return response.data;
  },
  sendChatMessage: async (id, message) => {
    const caseIdParam = String(id);
    console.log('[RAG] Sending:', { caseId: caseIdParam, message });
    const response = await apiClient.post(`/v1/cases/${caseIdParam}/chat`, { caseId: caseIdParam, message, question: message });
    console.log('[RAG] Response:', response.data);
    return response.data;
  },
  generateReport: async (id) => {
    const response = await apiClient.post(`/v1/cases/${id}/report`);
    return response.data;
  },
  generateVideo: async (id) => {
    const response = await apiClient.post(`/v1/cases/${id}/video/generate`, { caseId: id });
    return response.data;
  },
  generateReconstruction: async (id) => {
    const response = await apiClient.post(`/v1/cases/${id}/reconstruction`, { caseId: id });
    return response.data;
  },
  getReconstructionPlan: async (id) => {
    const response = await apiClient.get(`/v1/cases/${id}/reconstruction/plan`);
    return response.data;
  },
  getVideoStatus: async (id, jobId) => {
    const url = jobId ? `/v1/cases/${id}/video/status?jobId=${jobId}` : `/v1/cases/${id}/video/status`;
    const response = await apiClient.get(url);
    return response.data;
  },
  getVideo: async (id) => {
    const response = await apiClient.get(`/v1/cases/${id}/video`);
    return response.data;
  }
};

export const evidenceApi = {
  createEvidence: async (evidenceData) => {
    const response = await apiClient.post('/v1/evidence', evidenceData);
    return response.data;
  },
  getEvidenceByCase: async (caseId) => {
    const response = await apiClient.get(`/v1/evidence/case/${caseId}`);
    return response.data;
  },
  analyzeEvidence: async (id) => {
    const response = await apiClient.post(`/v1/evidence/${id}/analyze`);
    return response.data;
  }
};

export const suspectsApi = {
  createSuspect: async (suspectData) => {
    const response = await apiClient.post('/v1/suspects', suspectData);
    return response.data;
  },
  getSuspectsByCase: async (caseId) => {
    const response = await apiClient.get(`/v1/suspects/case/${caseId}`);
    return response.data;
  },
  getSuspectProfile: async (id) => {
    const response = await apiClient.get(`/v1/suspects/${id}/profile`);
    return response.data;
  }
};

export const dashboardApi = {
  getStats: async () => {
    const response = await apiClient.get('/v1/dashboard/stats');
    return response.data;
  }
};

export default apiClient;
