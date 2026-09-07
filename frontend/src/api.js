const API_BASE = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? "http://127.0.0.1:8000/api" : "/api");

export async function fetchHunter() {
  const res = await fetch(`${API_BASE}/hunter`);
  if (!res.ok) throw new Error("Failed to fetch Hunter profile");
  return res.json();
}

export async function allocateStat(stat) {
  const res = await fetch(`${API_BASE}/hunter/allocate-stat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stat }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to allocate stat point");
  }
  return res.json();
}

export async function resetHunter(seedDefault = true) {
  const res = await fetch(`${API_BASE}/hunter/reset?seed_default_quests=${seedDefault}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset progress");
  return res.json();
}

export async function fetchQuests(targetDate = null) {
  const url = targetDate ? `${API_BASE}/quests?target_date=${targetDate}` : `${API_BASE}/quests`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch quests");
  return res.json();
}

export async function createQuest(data) {
  const res = await fetch(`${API_BASE}/quests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create quest");
  }
  return res.json();
}

export async function updateQuest(id, data) {
  const res = await fetch(`${API_BASE}/quests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update quest");
  return res.json();
}

export async function deleteQuest(id) {
  const res = await fetch(`${API_BASE}/quests/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete quest");
  return res.json();
}

export async function toggleQuest(id, targetDate = null) {
  const url = targetDate
    ? `${API_BASE}/quests/${id}/toggle?target_date=${targetDate}`
    : `${API_BASE}/quests/${id}/toggle`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to toggle quest");
  }
  return res.json();
}

export async function endDay(targetDate = null) {
  const url = targetDate
    ? `${API_BASE}/history/end-day?target_date=${targetDate}`
    : `${API_BASE}/history/end-day`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to evaluate day");
  }
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/history/analytics`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}
