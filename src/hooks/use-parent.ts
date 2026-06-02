// ============================================================
// PreOne — Parent Hooks
// React Query hooks for parent portal data fetching
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { parentGet } from '@/lib/parent-api';

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
