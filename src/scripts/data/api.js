import { getAccessToken } from '../utils/auth';
import { BASE_URL } from '../config';

async function fetchWithTimeout(resource, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

const ENDPOINTS = {
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  STORIES: `${BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${BASE_URL}/stories/${id}`,
  NOTIFICATIONS_SUBSCRIBE: `${BASE_URL}/notifications/subscribe`, // ✅ Sesuai dokumentasi
  NOTIFICATIONS_SEND: `${BASE_URL}/notifications/send`,
};

// ===== REGISTER =====
export async function getRegistered({ name, email, password }) {
  if (!name || !email || !password || password.length < 8) {
    return {
      ok: false,
      error: true,
      message: 'Invalid registration data. Password must be at least 8 chars',
    };
  }

  try {
    const res = await fetchWithTimeout(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await res.json();
    return { ...json, ok: !json.error };
  } catch (e) {
    return { ok: false, error: true, message: e.message };
  }
}

// ===== LOGIN =====
export async function getLogin({ email, password }) {
  try {
    const res = await fetchWithTimeout(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!json.error) {
      return {
        ok: true,
        data: {
          accessToken: json.loginResult.token,
          userId: json.loginResult.userId,
          name: json.loginResult.name,
        },
      };
    }

    return { ok: false, message: json.message };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

// ===== STORIES (REPORTS) =====
export async function getAllReports({ page, size, location } = {}) {
  const token = getAccessToken();
  const params = new URLSearchParams();

  if (page !== undefined) params.append('page', page);
  if (size !== undefined) params.append('size', size);
  if (location !== undefined) params.append('location', location ? 1 : 0);

  const url = `${ENDPOINTS.STORIES}${params.toString() ? '?' + params.toString() : ''}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();

    if (!json.error && Array.isArray(json.listStory)) {
      return {
        ok: true,
        data: json.listStory.map((story) => ({
          id: story.id,
          title: story.description,
          description: story.description,
          evidenceImages: story.photoUrl ? [story.photoUrl] : [],
          latitude: story.lat ?? null,
          longitude: story.lon ?? null,
          createdAt: story.createdAt,
          reporterName: story.name ?? 'Unknown',
        })),
      };
    }

    return { ok: false, data: [], message: json.message };
  } catch (e) {
    return { ok: false, message: e.message, data: [] };
  }
}

export async function getReportById(id) {
  const token = getAccessToken();

  try {
    const res = await fetchWithTimeout(ENDPOINTS.STORY_DETAIL(id), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();

    if (!json.error && json.story) {
      const s = json.story;
      return {
        ok: true,
        data: {
          id: s.id,
          title: s.description,
          evidenceImages: s.photoUrl ? [s.photoUrl] : [],
          location: { latitude: s.lat, longitude: s.lon },
          reporter: { name: s.name },
          createdAt: s.createdAt,
        },
      };
    }

    return { ok: false, message: json.message };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

export async function storeNewReport(formData) {
  const token = getAccessToken();

  try {
    const res = await fetchWithTimeout(ENDPOINTS.STORIES, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const json = await res.json();
    return { ...json, ok: !json.error };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

// ===== COMMENTS =====
export async function getAllCommentsByReportId() {
  return { ok: true, message: 'Comment feature not available', data: [] };
}

export async function storeNewCommentByReportId() {
  return { ok: false, message: 'Comment feature not available' };
}

// ===== PUSH NOTIFICATION =====

// ✅ sesuai dokumentasi Dicoding
export async function subscribePushNotification({ endpoint, keys: { p256dh, auth } }) {
  const token = getAccessToken();
  const payload = JSON.stringify({ endpoint, keys: { p256dh, auth } });

  try {
    const res = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: payload,
    });

    const json = await res.json();
    return { ...json, ok: !json.error };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

// ✅ sesuai dokumentasi Dicoding
export async function unsubscribePushNotification({ endpoint }) {
  const token = getAccessToken();
  const payload = JSON.stringify({ endpoint });

  try {
    const res = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: payload,
    });

    const json = await res.json();
    return { ...json, ok: !json.error };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function sendReportToMeViaNotification(reportId) {
  const token = getAccessToken();
  if (!token) return { ok: false, message: 'Unauthorized' };

  try {
    const res = await fetchWithTimeout(ENDPOINTS.NOTIFICATIONS_SEND, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reportId }),
    });

    const json = await res.json();
    return { ...json, ok: !json.error };
  } catch (e) {
    return { ok: false, error: true, message: e.message };
  }
}
