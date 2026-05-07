export const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json();
}

export function getHealth() {
  return request('/api/health');
}

export function getStats() {
  return request('/api/stats');
}

export function createPrediction(payload) {
  return request('/api/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getPredictions(limit = 8) {
  return request(`/api/predictions?limit=${limit}`);
}

export function clearPredictions() {
  return request('/api/predictions', { method: 'DELETE' });
}

export function getDataset(page = 1, limit = 12) {
  return request(`/api/dataset?page=${page}&limit=${limit}`);
}

export function getDatasetByAlgorithm(algorithm) {
  return request(`/api/dataset/filter?algorithm=${algorithm}`);
}
