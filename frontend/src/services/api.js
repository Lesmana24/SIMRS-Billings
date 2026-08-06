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

  pay: (id, payloadOrKey, optionsOrPin) => {
    let key, payload = {}, pinCode;

    if (typeof payloadOrKey === 'string') {
      key = payloadOrKey;
      if (typeof optionsOrPin === 'object' && optionsOrPin !== null) {
        payload = optionsOrPin;
        pinCode = optionsOrPin.two_factor_pin || optionsOrPin['2fa_code'];
      } else if (typeof optionsOrPin === 'string') {
        pinCode = optionsOrPin;
      }
    } else if (typeof payloadOrKey === 'object' && payloadOrKey !== null) {
      payload = payloadOrKey;
      key = payload.idempotency_key || `PAY-BILLING-${id}-${Date.now()}`;
      if (typeof optionsOrPin === 'string') {
        pinCode = optionsOrPin;
      } else if (typeof optionsOrPin === 'object' && optionsOrPin !== null) {
        pinCode = optionsOrPin.two_factor_pin || optionsOrPin['2fa_code'] || payload.two_factor_pin;
      }
    }

    if (!key) {
      key = `PAY-BILLING-${id}-${Date.now()}`;
    }

    const twoFactorPin = pinCode || payload.two_factor_pin || payload['2fa_code'] || '123456';

    const headers = {
      'X-Idempotency-Key': key,
      'X-2FA-Code': twoFactorPin,
    };

    return request(`/billings/${id}/pay`, {
      method: 'POST',
      headers,
      body: {
        payment_method: payload.payment_method || 'CASH',
        cash_amount: Number(payload.cash_amount) || 0,
        transfer_amount: Number(payload.transfer_amount) || 0,
        '2fa_code': twoFactorPin,
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
  downloadExcel: (params = {}) => downloadReport({ ...params, format: 'xlsx' }),
  downloadCsv: (params = {}) => downloadReport({ ...params, format: 'csv' }),
};

/**
 * Shared helper for downloading financial reports (Excel / CSV)
 */
async function downloadReport(params = {}) {
  const token = localStorage.getItem('simrs_token') || '';
  const queryObj = { ...params };
  if (token) queryObj.token = token;
  const query = new URLSearchParams(queryObj).toString();
  const exportUrl = `${API_BASE_URL}/analytics/export?${query}`;

  const res = await fetch(exportUrl, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Gagal mengunduh laporan`);
  }

  const isExcel = params.format === 'xlsx';
  const ext = isExcel ? 'xlsx' : 'csv';
  const mimeType = isExcel
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'text/csv;charset=utf-8';

  const year = params.year || new Date().getFullYear();
  const month = String(params.month || (new Date().getMonth() + 1)).padStart(2, '0');
  let fileName = `Laporan_Kas_SIMRS_${year}_${month}.${ext}`;

  const cd = res.headers.get('Content-Disposition');
  if (cd) {
    const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i);
    if (match && match[1]) {
      fileName = decodeURIComponent(match[1].replace(/['"]/g, ''));
    }
  }

  const data = isExcel ? await res.arrayBuffer() : ('\uFEFF' + await res.text());

  // 1. Try File System Access API (showSaveFilePicker)
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: isExcel ? 'Excel Spreadsheet (*.xlsx)' : 'CSV Spreadsheet (*.csv)',
            accept: { [isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv']: [`.${ext}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return;
    } catch (pickerErr) {
      if (pickerErr.name === 'AbortError') return;
    }
  }

  // 2. Fallback anchor download
  const blob = new Blob([data], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, 10000);
}

// ----------------------------------------------------
// User Profile API
// ----------------------------------------------------
export const profileApi = {
  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: payload }),
};

// ----------------------------------------------------
// BPJS Claim Management API
// ----------------------------------------------------
export const claimsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/claims${query ? `?${query}` : ''}`);
  },
  getSummary: () => request('/claims/summary'),
  updateStatus: (id, status) => request(`/claims/${id}/status`, {
    method: 'PUT',
    body: { status },
  }),
};

