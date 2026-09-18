// API Helper with authentication headers and JSON handling

export const getAuthToken = () => {
  return localStorage.getItem('galeria_token') || sessionStorage.getItem('galeria_token');
};

export const setAuthToken = (token, remember = true) => {
  if (remember) {
    localStorage.setItem('galeria_token', token);
  } else {
    sessionStorage.setItem('galeria_token', token);
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem('galeria_token');
  sessionStorage.removeItem('galeria_token');
};

export const fetchApi = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(endpoint, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (endpoint !== '/api/auth/login' && endpoint !== '/api/auth/me') {
          // Token expired or invalid
          clearAuthToken();
          window.dispatchEvent(new Event('auth_unauthorized'));
        }
      }
      throw new Error(data.message || 'Ocorreu um erro na requisição.');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
