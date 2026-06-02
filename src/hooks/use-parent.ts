// ============================================================
// PreOne — Parent Hooks
// React Query hooks for parent portal data fetching
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentGet, parentPost, parentPatch } from '@/lib/parent-api';

// ============================================================
// Query Key Factory
// ============================================================

export const parentKeys = {
  children: ['parent', 'children'] as const,
  child: (id: string) => ['parent', 'children', id] as const,
  dashboard: (childId?: string) => ['parent', 'dashboard', childId] as const,
  attendance: (childId: string, month?: string) => ['parent', 'attendance', childId, month] as const,
  fees: (childId: string) => ['parent', 'fees', childId] as const,
  dailyUpdates: (childId: string) => ['parent', 'daily-updates', childId] as const,
  growth: (childId: string) => ['parent', 'growth', childId] as const,
  observations: (childId: string) => ['parent', 'observations', childId] as const,
  announcements: ['parent', 'announcements'] as const,
  profile: ['parent', 'profile'] as const,
  notificationPrefs: ['parent', 'notification-preferences'] as const,
};

// ============================================================
// Types — Children List
// ============================================================

interface ParentInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  address: string | null;
  relation: string;
  isEmergencyContact: boolean;
}

interface ClassInfo {
  id: string;
  name: string;
  program: { id: string; name: string } | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    photo: string | null;
    qualification: string | null;
    specialization: string | null;
    experience: number;
  } | null;
}

interface SiblingInfo {
  id: string;
  firstName: string;
  lastName: string;
  className: string | null;
  rollNumber: string | null;
  relation: string;
}

interface MedicalRecord {
  id: string;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  vaccinationStatus: string | null;
  doctorName: string | null;
  doctorPhone: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup: string | null;
  photo: string | null;
  rollNumber: string | null;
  status: string;
  admissionDate: string;
  class: ClassInfo | null;
  parents: Array<ParentInfo & { isPrimary: boolean }>;
  siblings: SiblingInfo[];
  medicalRecords: MedicalRecord[];
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  } | null;
}

// Extended type for child detail page
export interface ChildDetail extends ChildInfo {
  aadhaarNumber: string | null;
  latestMedical: MedicalRecord | null;
  growthScores: Array<{
    id: string;
    period: string;
    creativity: number;
    communication: number;
    social: number;
    confidence: number;
    cognitive: number;
    physical: number;
    overall: number | null;
    comments: string | null;
  }>;
}

// ============================================================
// useParentChildren — Get all children for parent
// ============================================================

export function useParentChildren() {
  return useQuery({
    queryKey: parentKeys.children,
    queryFn: () =>
      parentGet<{ children: ChildInfo[]; total: number }>('/api/parent/children'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// useParentChild — Get single child detail
// ============================================================

export function useParentChild(childId: string | null) {
  return useQuery({
    queryKey: parentKeys.child(childId || ''),
    queryFn: () =>
      parentGet<{ child: ChildDetail }>(`/api/parent/children?childId=${childId}`),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// Fees Types
// ============================================================

export interface FeeOverview {
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

export interface FeeStructureInfo {
  id: string;
  name: string;
  type: string;
  frequency: string;
  amount: number;
}

export interface PaymentInfo {
  id: string;
  amount: number;
  method: string;
  transactionRef: string | null;
  paymentDate: string;
}

export interface InvoiceInfo {
  id: string;
  invoiceNo: string;
  description: string | null;
  amount: number;
  discount: number;
  netAmount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
  feeStructure: FeeStructureInfo | null;
  payments: PaymentInfo[];
  receipt: {
    id: string;
    receiptNo: string;
    amount: number;
  } | null;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  method: string;
  transactionRef: string | null;
  paymentDate: string;
  invoiceNo: string;
  description: string | null;
  receiptNo: string | null;
}

export interface UpcomingDue {
  invoiceNo: string;
  description: string | null;
  amount: number;
  dueDate: string;
}

export interface OverdueDue extends UpcomingDue {
  daysOverdue: number;
}

export interface FeesData {
  childId: string;
  childName: string;
  className: string | null;
  overview: FeeOverview;
  invoices: InvoiceInfo[];
  payments: PaymentHistoryItem[];
  upcomingDues: UpcomingDue[];
  overdueDues: OverdueDue[];
}

// ============================================================
// useParentFees — Get fees data for a child
// ============================================================

export function useParentFees(childId: string | null) {
  return useQuery({
    queryKey: parentKeys.fees(childId || ''),
    queryFn: () =>
      parentGet<FeesData>(`/api/parent/fees?childId=${childId}`),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// Receipt Types
// ============================================================

export interface ReceiptData {
  id: string;
  receiptNo: string;
  amount: number;
  createdAt: string;
  invoice: {
    id: string;
    invoiceNo: string;
    description: string | null;
    amount: number;
    discount: number;
    netAmount: number;
    status: string;
    dueDate: string;
    paidDate: string | null;
    feeStructure: {
      name: string;
      type: string;
      frequency: string;
    } | null;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      rollNumber: string | null;
      className: string | null;
      programName: string | null;
    };
    payments: Array<{
      id: string;
      amount: number;
      method: string;
      transactionRef: string | null;
      chequeNo: string | null;
      bankName: string | null;
      paymentDate: string;
      notes: string | null;
    }>;
  };
  branch: {
    name: string;
    address: string | null;
    phone: string | null;
    logo: string | null;
  } | null;
}

// ============================================================
// useParentReceipt — Get receipt details by receipt ID
// ============================================================

export function useParentReceipt(receiptId: string | null) {
  return useQuery({
    queryKey: ['parent', 'receipt', receiptId] as const,
    queryFn: () =>
      parentGet<{ receipt: ReceiptData }>(`/api/parent/fees/receipt/${receiptId}`),
    enabled: !!receiptId,
    staleTime: 5 * 60 * 1000, // 5 minutes — receipts don't change
  });
}

// ============================================================
// Daily Updates Types
// ============================================================

export interface DailyUpdateData {
  id: string;
  date: string;
  breakfast: string | null;
  breakfastMenu: string | null;
  lunch: string | null;
  lunchMenu: string | null;
  snacks: string | null;
  snacksMenu: string | null;
  sleepStart: string | null;
  sleepEnd: string | null;
  sleepDuration: string | null;
  sleepQuality: string | null;
  moodMorning: string | null;
  moodAfternoon: string | null;
  pottyCount: number;
  pottyType: string | null;
  waterGlasses: number;
  highlights: string | null;
  status: string;
  publishedAt: string | null;
  teacherName: string | null;
}

export interface DailyUpdateResponse {
  childId: string;
  childName: string;
  date: string;
  update: DailyUpdateData | null;
  latestUpdateDate: string | null;
}

export interface DailyUpdatesHistoryResponse {
  updates: DailyUpdateData[];
  summary: {
    totalDays: number;
    food: {
      breakfast: { eaten: number; partial: number; total: number };
      lunch: { eaten: number; partial: number; total: number };
      snacks: { eaten: number; partial: number; total: number };
    };
    moodCounts: Record<string, number>;
    moodTrend: Array<{ date: string; moodMorning: string | null; moodAfternoon: string | null }>;
    sleepAvgHours: number;
    waterAvgGlasses: number;
    highlights: Array<{ date: string; text: string }>;
  };
  month: number;
  year: number;
}

export interface LatestUpdateResponse {
  update: {
    id: string;
    date: string;
    breakfast: string | null;
    lunch: string | null;
    snacks: string | null;
    moodMorning: string | null;
    moodAfternoon: string | null;
    highlights: string | null;
    waterGlasses: number;
    sleepQuality: string | null;
    publishedAt: string | null;
    teacherName: string | null;
  } | null;
}

// ============================================================
// useParentDailyUpdate — Get daily update for a specific date
// ============================================================

export function useParentDailyUpdate(childId: string | null, date?: string) {
  return useQuery({
    queryKey: [...parentKeys.dailyUpdates(childId || ''), date] as const,
    queryFn: () => {
      const params = new URLSearchParams();
      if (childId) params.set('childId', childId);
      if (date) params.set('date', date);
      return parentGet<DailyUpdateResponse>(`/api/parent/daily-updates?${params.toString()}`);
    },
    enabled: !!childId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================================
// useParentDailyUpdatesHistory — Get monthly history
// ============================================================

export function useParentDailyUpdatesHistory(
  childId: string | null,
  month?: number,
  year?: number
) {
  return useQuery({
    queryKey: ['parent', 'daily-updates', 'history', childId, month, year] as const,
    queryFn: () => {
      const params = new URLSearchParams();
      if (childId) params.set('childId', childId);
      if (month) params.set('month', String(month));
      if (year) params.set('year', String(year));
      return parentGet<DailyUpdatesHistoryResponse>(`/api/parent/daily-updates/history?${params.toString()}`);
    },
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// useParentLatestUpdate — Get latest published update
// ============================================================

export function useParentLatestUpdate(childId: string | null) {
  return useQuery({
    queryKey: ['parent', 'daily-updates', 'latest', childId] as const,
    queryFn: () =>
      parentGet<LatestUpdateResponse>(`/api/parent/daily-updates/latest?childId=${childId}`),
    enabled: !!childId,
    staleTime: 60 * 1000,
  });
}

// ============================================================
// Observations Types
// ============================================================

export interface ObservationData {
  id: string;
  category: string;
  content: string;
  priority: string;
  isShared: boolean;
  parentAck: boolean;
  parentComment: string | null;
  media: string | null;
  createdAt: string;
}

export interface ObservationsResponse {
  observations: ObservationData[];
  total: number;
  categories: Record<string, number>;
}

// ============================================================
// useParentObservations — Get observations for a child
// ============================================================

export function useParentObservations(childId: string | null) {
  return useQuery({
    queryKey: parentKeys.observations(childId || ''),
    queryFn: () =>
      parentGet<ObservationsResponse>(`/api/parent/observations?childId=${childId}`),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// Growth Types
// ============================================================

export interface GrowthScoreData {
  id: string;
  period: string;
  creativity: number;
  communication: number;
  social: number;
  confidence: number;
  cognitive: number;
  physical: number;
  overall: number | null;
  comments: string | null;
  createdAt: string;
}

export interface AchievementData {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  date: string | null;
}

export interface MilestoneData {
  id: string;
  milestoneId: string;
  milestoneName: string | null;
  milestoneCategory: string | null;
  milestoneAgeGroup: string | null;
  achievedDate: string | null;
  status: string;
  notes: string | null;
}

export interface GrowthResponse {
  growthScores: GrowthScoreData[];
  achievements: AchievementData[];
  milestones: MilestoneData[];
}

// ============================================================
// Enhanced Growth Types
// ============================================================

export interface EnhancedGrowthResponse {
  childId: string;
  childName: string;
  period: string;
  scores: Record<string, number>;
  classAverage: Record<string, number>;
  trend: Array<{
    period: string;
    creativity: number;
    communication: number;
    social: number;
    confidence: number;
    cognitive: number;
    physical: number;
    overall: number | null;
  }>;
  growthScores: GrowthScoreData[];
  achievements: AchievementData[];
  milestones: {
    ageGroup: string;
    total: number;
    achieved: number;
    items: Array<{
      id: string;
      milestoneId: string;
      name: string;
      category: string;
      ageGroup: string;
      description: string | null;
      achievedDate: string | null;
      status: string;
      notes: string | null;
    }>;
  };
  aiInsights: Array<{
    insight: string;
    dimension: string | null;
    severity: string | null;
  }>;
}

// ============================================================
// Growth Comparison Types
// ============================================================

export interface GrowthComparisonChild {
  childId: string;
  name: string;
  className: string | null;
  overall: number;
  scores: Record<string, number>;
}

export interface GrowthComparisonResponse {
  children: GrowthComparisonChild[];
}

// ============================================================
// Chat Thread Types
// ============================================================

export interface ChatThreadData {
  id: string;
  teacher: {
    id: string;
    name: string;
    photo: string | null;
    className: string | null;
    phone: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

export interface ChatThreadsResponse {
  threads: ChatThreadData[];
}

// ============================================================
// Chat Message Types
// ============================================================

export interface ChatMessageData {
  id: string;
  content: string;
  type: string;
  senderId: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessagesResponse {
  threadId: string;
  teacher: {
    id: string;
    name: string;
    photo: string | null;
    className: string | null;
    phone: string;
  } | null;
  messages: ChatMessageData[];
}

// ============================================================
// useParentGrowth — Get growth data for a child (enhanced)
// ============================================================

export function useParentGrowth(childId: string | null, period?: string) {
  return useQuery({
    queryKey: [...parentKeys.growth(childId || ''), period] as const,
    queryFn: () => {
      const params = new URLSearchParams();
      if (childId) params.set('childId', childId);
      if (period) params.set('period', period);
      return parentGet<EnhancedGrowthResponse>(`/api/parent/growth?${params.toString()}`);
    },
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// useParentGrowthComparison — Compare growth across children
// ============================================================

export function useParentGrowthComparison() {
  return useQuery({
    queryKey: ['parent', 'growth', 'comparison'] as const,
    queryFn: () =>
      parentGet<GrowthComparisonResponse>('/api/parent/growth/comparison'),
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useParentChatThreads — Get chat threads for parent
// ============================================================

export function useParentChatThreads(childId?: string | null) {
  return useQuery({
    queryKey: ['parent', 'chat', 'threads', childId] as const,
    queryFn: () => {
      const params = new URLSearchParams();
      if (childId) params.set('childId', childId);
      return parentGet<ChatThreadsResponse>(`/api/parent/chat/threads?${params.toString()}`);
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================
// useParentChatMessages — Get messages for a thread
// ============================================================

export function useParentChatMessages(threadId: string | null) {
  return useQuery({
    queryKey: ['parent', 'chat', 'messages', threadId] as const,
    queryFn: () =>
      parentGet<ChatMessagesResponse>(`/api/parent/chat/${threadId}/messages?limit=50`),
    enabled: !!threadId,
    staleTime: 10 * 1000, // 10 seconds
  });
}

// ============================================================
// Announcement Types
// ============================================================

export interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  attachments: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface AnnouncementsResponse {
  announcements: AnnouncementData[];
  total: number;
  page: number;
  totalPages: number;
}

// ============================================================
// useParentAnnouncements — Get announcements for parent
// ============================================================

export function useParentAnnouncements(page?: number) {
  return useQuery({
    queryKey: [...parentKeys.announcements, page] as const,
    queryFn: () => {
      const params = new URLSearchParams();
      if (page) params.set('page', String(page));
      params.set('limit', '10');
      return parentGet<AnnouncementsResponse>(`/api/parent/announcements?${params.toString()}`);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// useParentDashboard — Get dashboard data
// ============================================================

interface DashboardData {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    relation: string;
  };
  selectedChild: {
    id: string;
    firstName: string;
    lastName: string;
    photo: string | null;
    rollNumber: string | null;
    className: string | null;
    programName: string | null;
    status: string;
  } | null;
  todayUpdate: Record<string, unknown> | null;
  stats: {
    attendanceRate: number;
    feesDue: number;
    feesPaid: number;
    feesOverdue: number;
    growthOverall: number;
    unacknowledgedObservations: number;
  };
  nextFeeDue: {
    amount: number;
    dueDate: string;
    invoiceNo: string;
  } | null;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    type: string;
    priority: string;
    publishedAt: string | null;
  }>;
  growthSnapshot: {
    period: string;
    creativity: number;
    communication: number;
    social: number;
    confidence: number;
    cognitive: number;
    physical: number;
    overall: number;
  } | null;
  otherChildren: Array<{
    id: string;
    firstName: string;
    lastName: string;
    className: string | null;
    photo: string | null;
  }>;
}

// ============================================================
// Attendance Types
// ============================================================

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  workingDays: number;
  rate: number;
}

export interface AttendanceRecord {
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  duration: string | null;
}

export interface AttendanceTrendPoint {
  month: string;
  rate: number;
}

export interface AttendanceData {
  childId: string;
  childName: string;
  month: number;
  year: number;
  stats: AttendanceStats;
  records: AttendanceRecord[];
  trend: AttendanceTrendPoint[];
}

// ============================================================
// useParentAttendance — Get attendance for a child in a month
// ============================================================

export function useParentAttendance(
  childId: string | null,
  month?: number,
  year?: number
) {
  return useQuery({
    queryKey: parentKeys.attendance(childId || '', month && year ? `${year}-${String(month).padStart(2, '0')}` : undefined),
    queryFn: () => {
      const params = new URLSearchParams();
      if (childId) params.set('childId', childId);
      if (month) params.set('month', String(month));
      if (year) params.set('year', String(year));
      return parentGet<AttendanceData>(`/api/parent/attendance?${params.toString()}`);
    },
    enabled: !!childId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================================
// useParentDashboard — Get dashboard data
// ============================================================

export function useParentDashboard(childId?: string | null) {
  return useQuery({
    queryKey: parentKeys.dashboard(childId || undefined),
    queryFn: () => {
      const url = childId
        ? `/api/parent/dashboard?childId=${childId}`
        : '/api/parent/dashboard';
      return parentGet<DashboardData>(url);
    },
    enabled: childId !== undefined,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================
// Settings — Profile Types
// ============================================================

export interface ProfileData {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    occupation: string | null;
    address: string | null;
    relation: string;
    isEmergencyContact: boolean;
    photo: string | null;
    kycDoc: string | null;
    kycStatus: string | null;
    kycRejectionReason: string | null;
  };
  children: Array<{
    id: string;
    firstName: string;
    lastName: string;
    photo: string | null;
    rollNumber: string | null;
    className: string | null;
    programName: string | null;
    isPrimary: boolean;
  }>;
  kycDocuments: Array<{
    id: string;
    documentType: string;
    documentUrl: string;
    status: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
  }>;
  notificationPreferences: NotificationPreferencesData | null;
}

export interface NotificationPreferencesData {
  id: string;
  dailyUpdateApp: boolean;
  dailyUpdateSms: boolean;
  dailyUpdateEmail: boolean;
  observationApp: boolean;
  observationSms: boolean;
  observationEmail: boolean;
  feeReminderApp: boolean;
  feeReminderSms: boolean;
  feeReminderEmail: boolean;
  feeOverdueApp: boolean;
  feeOverdueSms: boolean;
  feeOverdueEmail: boolean;
  attendanceApp: boolean;
  attendanceSms: boolean;
  attendanceEmail: boolean;
  announcementApp: boolean;
  announcementSms: boolean;
  announcementEmail: boolean;
  teacherMessageApp: boolean;
  teacherMessageSms: boolean;
  teacherMessageEmail: boolean;
  leaveStatusApp: boolean;
  leaveStatusSms: boolean;
  leaveStatusEmail: boolean;
}

// ============================================================
// useParentProfile — Get full profile data
// ============================================================

export function useParentProfile() {
  return useQuery({
    queryKey: parentKeys.profile,
    queryFn: () =>
      parentGet<ProfileData>('/api/parent/profile'),
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useUpdateProfile — Update editable profile fields
// ============================================================

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      phone?: string;
      email?: string;
      occupation?: string;
      address?: string;
      photo?: string;
    }) => parentPatch<{ message: string; parent: ProfileData['parent'] }>('/api/parent/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parentKeys.profile });
    },
  });
}

// ============================================================
// useUploadKyc — Upload KYC document
// ============================================================

export function useUploadKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      documentType: string;
      document: string;
    }) => parentPost<{ message: string; document: { id: string; documentType: string; status: string } }>('/api/parent/kyc', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parentKeys.profile });
    },
  });
}

// ============================================================
// useNotificationPreferences — Get notification preferences
// ============================================================

export function useNotificationPreferences() {
  return useQuery({
    queryKey: parentKeys.notificationPrefs,
    queryFn: () =>
      parentGet<{ preferences: NotificationPreferencesData }>('/api/parent/notification-preferences'),
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useUpdateNotificationPreferences — Update notification prefs
// ============================================================

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotificationPreferencesData>) =>
      parentPatch<{ message: string; preferences: NotificationPreferencesData }>('/api/parent/notification-preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parentKeys.notificationPrefs });
    },
  });
}

// ============================================================
// useChangePassword — Change password mutation
// ============================================================

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: {
      currentPassword: string;
      newPassword: string;
    }) => parentPost<{ message: string }>('/api/parent/change-password', data),
  });
}
