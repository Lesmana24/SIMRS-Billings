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

  // Submit payment proof file (Patient upload -> status WAITING_VERIFICATION)
  submitProof: (id, proofFile) => {
    const token = localStorage.getItem('simrs_token');
    const formData = new FormData();
    formData.append('proof_file', proofFile);

    return fetch(`${API_BASE_URL}/billings/${id}/submit-proof`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Gagal mengunggah bukti pembayaran');
      }
      return data;
    });
  },

  // Approve & Process payment (Cashier / Admin verification -> status PAID)
  pay: (id, idempotencyKey, options = {}) => {
    const key = idempotencyKey || `PAY-BILLING-${id}-${Date.now()}`;
    const token = localStorage.getItem('simrs_token');

    let proofFile, payment_method, cash_amount, transfer_amount, two_factor_pin;
    if (typeof options === 'object' && options !== null && !(options instanceof File)) {
      proofFile = options.proofFile;
      payment_method = options.payment_method;
      cash_amount = options.cash_amount;
      transfer_amount = options.transfer_amount;
      two_factor_pin = options.two_factor_pin;
    } else if (options instanceof File) {
      proofFile = options;
    }

    const headers = {
      'X-Idempotency-Key': key,
      ...(two_factor_pin ? { 'X-2FA-Code': two_factor_pin } : {}),
    };

    if (proofFile) {
      const formData = new FormData();
      formData.append('proof_file', proofFile);
      if (payment_method) formData.append('payment_method', payment_method);
      if (cash_amount) formData.append('cash_amount', cash_amount);
      if (transfer_amount) formData.append('transfer_amount', transfer_amount);
      if (two_factor_pin) formData.append('2fa_code', two_factor_pin);

      return fetch(`${API_BASE_URL}/billings/${id}/pay`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: formData,
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || data.message || 'Gagal memproses pembayaran');
        }
        return data;
      });
    }

    return request(`/billings/${id}/pay`, {
      method: 'POST',
      headers,
      body: {
        payment_method: payment_method || 'CASH',
        cash_amount: Number(cash_amount) || 0,
        transfer_amount: Number(transfer_amount) || 0,
        '2fa_code': two_factor_pin || '123456',
      },
    });
  },

  // Reject payment proof (Cashier / Admin -> status REJECTED)
  reject: (id) => request(`/billings/${id}/reject`, { method: 'POST' }),
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
  create: (payload) => request('/users', { method: 'POST', body: payload }),
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
  delete: (id) => request(`/ledgers/${id}`, { method: 'DELETE' }),
};

// ----------------------------------------------------
// Audit Trail API
// ----------------------------------------------------
export const auditApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs${query ? `?${query}` : ''}`);
  },
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

// ----------------------------------------------------
// Analytics & Financial Reporting API
// ----------------------------------------------------
export const analyticsApi = {
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics/summary${query ? `?${query}` : ''}`);
  },
  downloadCsv: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('simrs_token');
    const response = await fetch(`${API_BASE_URL}/analytics/export${query ? `?${query}` : ''}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Gagal mengunduh laporan keuangan');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Kas_SIMRS_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
