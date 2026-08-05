const API_BASE_URL = '/api/v1';

/**
 * Custom request wrapper for API calls with token and error handling
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('simrs_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// ----------------------------------------------------
// Authentication API
// ----------------------------------------------------
export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
};

// ----------------------------------------------------
// Master Tarif API
// ----------------------------------------------------
export const tarifApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tarifs${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/tarifs/${id}`),
  create: (payload) => request('/tarifs', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/tarifs/${id}`, { method: 'PUT', body: payload }),
  delete: (id) => request(`/tarifs/${id}`, { method: 'DELETE' }),
};

// ----------------------------------------------------
// Medical Billing API
// ----------------------------------------------------
export const billingApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/billings${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/billings/${id}`),
  create: (payload) => request('/billings', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/billings/${id}`, { method: 'PUT', body: payload }),
  delete: (id) => request(`/billings/${id}`, { method: 'DELETE' }),
  pay: (id, idempotencyKey) => {
    const key = idempotencyKey || `PAY-BILLING-${id}-${Date.now()}`;
    return request(`/billings/${id}/pay`, {
      method: 'POST',
      headers: {
        'X-Idempotency-Key': key,
      },
    });
  },
};

// ----------------------------------------------------
// User Management API
// ----------------------------------------------------
export const userApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/users/${id}`),
  update: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: payload }),
  delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

// ----------------------------------------------------
// Payment Ledgers API
// ----------------------------------------------------
export const ledgerApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/ledgers${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/ledgers/${id}`),
};

// ----------------------------------------------------
// Pasien Portal API
// ----------------------------------------------------
export const pasienApi = {
  getMyBillings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/pasien/my-billings${query ? `?${query}` : ''}`);
  },
  getMyBillingById: (id) => request(`/pasien/my-billings/${id}`),
};
