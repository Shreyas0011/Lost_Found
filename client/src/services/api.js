export const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${BACKEND_URL}/api`;

export function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
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

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw { status: res.status, message: data.error || 'Request failed' };
    }

    return data;
  } catch (err) {
    if (err.status === 401) {
      clearToken();
    }
    throw err;
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
