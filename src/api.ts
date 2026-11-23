/**
 * api.ts — thin fetch wrapper for the MediPath backend
 * Base URL defaults to localhost:3001 during dev; can be overridden via
 * VITE_API_URL environment variable.
 */

import type { Department, HospitalEdge, HospitalNode } from "./data";

const BASE = (import.meta as any).env?.VITE_API_URL ?? "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ─── Departments ──────────────────────────────────────────────────────────────

export const getDepartments = (): Promise<Department[]> =>
  get("/api/departments");

export const createDepartment = (payload: Omit<Department, "nodeId"> & { node_id?: string }): Promise<Department> =>
  request("POST", "/api/departments", payload);

export const updateDepartment = (
  id: string,
  payload: Partial<Pick<Department, "name" | "floor" | "room" | "category" | "color">>
): Promise<Department> => request("PUT", `/api/departments/${id}`, payload);

export const deleteDepartment = (id: string): Promise<{ success: boolean }> =>
  request("DELETE", `/api/departments/${id}`);

// ─── Graph data ───────────────────────────────────────────────────────────────

export const getNodes = (): Promise<HospitalNode[]> =>
  get("/api/nodes");

export const getEdges = (): Promise<(HospitalEdge & { blocked: boolean })[]> =>
  get("/api/edges");

export const blockEdge = (id: string, blocked: boolean): Promise<{ id: string; blocked: boolean }> =>
  request("PUT", `/api/edges/${id}/block`, { blocked });

// ─── QR Locations ─────────────────────────────────────────────────────────────

export interface QrLocation {
  code: string;
  nodeId: string;
  label: string;
  floor: number;
}

export const getQrLocations = (): Promise<QrLocation[]> =>
  get("/api/qr-locations");

// ─── Health ───────────────────────────────────────────────────────────────────

export const checkHealth = (): Promise<{ status: string; timestamp: string }> =>
  get("/api/health");
