/**
 * Analytics service — connects to backend /api/analytics/* endpoints.
 */
import { api } from "./api.js";

export async function getVendorAnalytics() {
  try {
    return await api.get("/analytics/vendors");
  } catch {
    return [];
  }
}

export async function getVendorDetail(vendorName) {
  try {
    return await api.get(`/analytics/vendors/${encodeURIComponent(vendorName)}`);
  } catch {
    return null;
  }
}

export async function getSiteAnalytics() {
  try {
    return await api.get("/analytics/sites");
  } catch {
    return [];
  }
}

export async function getRepeatOffenders() {
  try {
    return await api.get("/analytics/repeat-offenders");
  } catch {
    return [];
  }
}

export async function getMonthlyTrend() {
  try {
    return await api.get("/analytics/monthly-trend");
  } catch {
    return [];
  }
}
