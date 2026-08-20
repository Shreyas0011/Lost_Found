import { handleMockApi } from './mockBackend';

export const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${BACKEND_URL}/api`;

export const DEFAULT_FORM_FIELDS = {
  categories: [
    'Electronics', 'Clothing', 'Books', 'ID / Cards',
    'Accessories', 'Bags', 'Keys', 'Stationery', 'Other'
  ],
  locations: [
    'Library', 'Cafeteria', 'Classroom', 'Hostel',
    'Parking', 'Sports Area', 'Administrative Block', 'Other'
  ],
  customFields: [
    { id: 'cf_1', name: 'Security Locker ID', type: 'text', placeholder: 'e.g. Locker #4B', required: false },
    { id: 'cf_2', name: 'Found Item Tags', type: 'text', placeholder: 'e.g. #valuable, #fragile', required: false }
  ]
};

export function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  return BACKEND_URL ? `${BACKEND_URL}${imagePath}` : imagePath;
}

export function getToken() {
  return localStorage.getItem('lf_token');
}

export function setToken(token) {
  localStorage.setItem('lf_token', token);
}

export function clearToken() {
  localStorage.removeItem('lf_token');
  localStorage.removeItem('lf_user');
}

export function setUser(user) {
  localStorage.setItem('lf_user', JSON.stringify(user));
}

export function getUser() {
  const u = localStorage.getItem('lf_user');
  return u ? JSON.parse(u) : null;
}

export async function getFormFields() {
  try {
    const res = await apiFetch('/admin/form-fields');
    if (res && res.categories && res.locations) return res;
  } catch (err) {
    console.warn('Using stored/default form fields:', err);
  }
  const stored = localStorage.getItem('lf_form_fields');
  return stored ? JSON.parse(stored) : DEFAULT_FORM_FIELDS;
}

export async function saveFormFields(formFields) {
  localStorage.setItem('lf_form_fields', JSON.stringify(formFields));
  try {
    await apiFetch('/admin/form-fields', {
      method: 'PUT',
      body: formFields,
    });
  } catch (err) {
    console.warn('Saved form fields locally:', err);
  }
}

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const isFormData = options.body instanceof FormData;
  let fetchBody = options.body;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(options.body);
  }

  const targetUrl = `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(targetUrl, {
      ...options,
      headers,
      body: fetchBody,
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Received HTML response instead of JSON API');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw { status: res.status, message: data.error || 'Request failed' };
    }

    return data;
  } catch (err) {
    if (err.status === 401) {
      clearToken();
      throw err;
    }
    // Fall back to client mock backend if server fetch fails
    try {
      return await handleMockApi(endpoint, options);
    } catch (mockErr) {
      throw err.status ? err : mockErr;
    }
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const CATEGORY_ICONS = {
  'Electronics': '💻',
  'Clothing': '👕',
  'Books': '📚',
  'ID / Cards': '🪪',
  'Accessories': '⌚',
  'Bags': '🎒',
  'Keys': '🔑',
  'Stationery': '✏️',
  'Other': '📦',
};

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || '📦';
}

