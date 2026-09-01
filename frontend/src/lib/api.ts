const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1${path}`, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }

    return res.json();
  }

  // Auth
  login = (email: string, password: string) =>
    this.request<{ access_token: string; refresh_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

  register = (data: { email: string; password: string; full_name: string; badge_number?: string }) =>
    this.request("/auth/register", { method: "POST", body: JSON.stringify(data) });

  getMe = () => this.request<User>("/auth/me");

  forgotPassword = (email: string) =>
    this.request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });

  // Cases
  getCases = (params?: { status?: string; priority?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<Case[]>(`/cases/${q ? `?${q}` : ""}`);
  };

  getCase = (id: number) => this.request<Case>(`/cases/${id}`);

  createCase = (data: Partial<Case>) =>
    this.request<Case>("/cases/", { method: "POST", body: JSON.stringify(data) });

  updateCase = (id: number, data: Partial<Case>) =>
    this.request<Case>(`/cases/${id}`, { method: "PUT", body: JSON.stringify(data) });

  analyzeCase = (id: number) =>
    this.request<{ case: Case; analysis: AnalysisResult }>(`/cases/${id}/analyze`, { method: "POST" });

  analyzeSimulation = (description: string) =>
    this.request<{ simulation: SimulationResult }>(`/simulator/analyze`, {
      method: "POST",
      body: JSON.stringify({ description }),
    });

  uploadDocument = async (caseId: number, file: File) => {
    const token = this.getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/api/v1/cases/${caseId}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  };

  chat = (caseId: number, message: string) =>
    this.request<{ response: string; sources?: unknown[]; disclaimer: string }>(`/cases/${caseId}/chat`, {
      method: "POST",
      body: JSON.stringify({ case_id: caseId, message }),
    });

  generateReport = (caseId: number) =>
    this.request<{ report_id: number; pdf_path: string }>(`/cases/${caseId}/report`, { method: "POST" });

  // Dashboard
  getDashboardStats = () => this.request<DashboardStats>("/dashboard/stats");
  getActivities = () => this.request<Activity[]>("/dashboard/activities");
  getAnalytics = () => this.request<AnalyticsData>("/dashboard/analytics");
  search = (query: string) =>
    this.request<SearchResult[]>("/search", { method: "POST", body: JSON.stringify({ query }) });
  getNotifications = () => this.request<Notification[]>("/notifications");
  markNotificationRead = (id: number) =>
    this.request(`/notifications/${id}/read`, { method: "PATCH" });

  // Admin
  getUsers = () => this.request<User[]>("/admin/users");
  getAISettings = () => this.request<AISetting[]>("/admin/ai-settings");
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "administrator" | "investigator" | "supervisor";
  badge_number?: string;
  department?: string;
  is_active: boolean;
}

export interface Predictions {
  likely_motive?: string;
  likely_suspect?: string;
  likely_sequence?: string[];
  possible_escape_route?: string;
  missing_investigation_steps?: string[];
  next_recommended_actions?: string[];
  investigation_complexity?: string;
  solvability_percentage?: number;
  expected_duration_days?: string;
  possible_legal_charges?: string[];
  confidence_score?: number;
  disclaimer?: string;
}

export interface Case {
  id: number;
  case_id: string;
  fir_number: string;
  police_station: string;
  crime_category?: string;
  crime_category_confidence?: number;
  incident_date?: string;
  incident_time?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  crime_description?: string;
  victim_details?: Record<string, unknown>;
  suspect_details?: Record<string, unknown>;
  witness_details?: Record<string, unknown>;
  evidence_list?: Record<string, unknown>;
  additional_notes?: string;
  status: string;
  priority: string;
  solvability_score?: number;
  investigation_complexity?: string;
  extracted_entities?: Record<string, unknown>;
  ai_analysis?: Record<string, unknown>;
  timeline?: { events: TimelineEvent[] };
  suspect_rankings?: { rankings: SuspectRanking[]; disclaimer: string };
  recommendations?: { recommendations: Recommendation[] };
  predictions?: Predictions;
  relationship_graph?: { nodes: GraphNode[]; edges: GraphEdge[] };
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  source: string;
  confidence: number;
}

export interface SuspectRanking {
  rank: number;
  suspect: string;
  probability: number;
  confidence: number;
  reason: string;
  risk_level: string;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  relationship_to_victim: string;
  opportunity: string;
  possible_motive: string;
}

export interface Recommendation {
  priority: number;
  action: string;
  importance: string;
  category: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  label: string;
}

export interface AnalysisResult {
  extracted_entities: Record<string, unknown>;
  crime_category: string;
  crime_category_confidence: number;
  suspect_rankings: Case["suspect_rankings"];
  timeline: Case["timeline"];
  predictions: Record<string, unknown>;
  recommendations: Case["recommendations"];
  relationship_graph: Case["relationship_graph"];
  disclaimer: string;
}

export interface SimulationPerson {
  name?: string;
  description?: string;
  relationship?: string;
  probability?: number;
  [key: string]: unknown;
}

export interface SimulationScenario {
  title: string;
  confidence: number;
  summary: string;
}

export interface SimulationResult {
  case_summary: string;
  crime_type: string;
  crime_type_confidence: number;
  victims: SimulationPerson[];
  persons_of_interest: SimulationPerson[];
  witnesses: SimulationPerson[];
  locations: string[];
  objects: {
    weapons?: string[];
    phones?: string[];
    vehicles?: string[];
    [key: string]: string[] | undefined;
  };
  events: unknown[];
  timeline: Case["timeline"];
  clues: {
    strong: string[];
    weak: string[];
    contradictions: string[];
    missing_information: string[];
  };
  possible_motives: string[];
  scenarios: SimulationScenario[];
  prediction: {
    scenario: string;
    confidence: number;
    summary: string;
    reasoning: string[];
    what_would_change: string[];
    type: string;
  };
  missing_information: string[];
  investigation_leads: string[];
  evidence_analysis: Record<string, unknown>;
  relationship_graph: Case["relationship_graph"];
}

export interface DashboardStats {
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  high_priority_cases: number;
  pending_evidence: number;
  todays_investigations: number;
  crime_categories: Record<string, number>;
  ai_prediction_accuracy: number;
  avg_solvability_score: number;
}

export interface Activity {
  id: number;
  action: string;
  details?: string;
  case_id?: number;
  created_at: string;
}

export interface AnalyticsData {
  monthly_trends: { month: string; cases: number }[];
  crime_categories: Record<string, number>;
  resolution_rate: number;
  avg_investigation_days: number;
  evidence_collection_rate: number;
  ai_accuracy: number;
  hotspots: { location: string; count: number; lat: number; lng: number }[];
}

export interface SearchResult {
  id: number;
  case_id: string;
  fir_number: string;
  crime_category?: string;
  status: string;
  location?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  case_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface AISetting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export const api = new ApiClient();
