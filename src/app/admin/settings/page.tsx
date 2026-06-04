'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Users, Bus, Bell, Mail,
  MessageSquare, Smartphone, Save, Loader2, Eye, EyeOff,
  RefreshCw, Shield, CheckCircle2, XCircle, Route, KeyRound,
  Upload, ArrowLeftRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

// ============================================================
// TYPES
// ============================================================
interface SchoolData {
  id: string;
  name: string;
  logo: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  academicYear: string | null;
  board: string | null;
  schoolCode: string | null;
}

interface BranchData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  capacity: number;
  inChargeName: string | null;
  inChargePhone: string | null;
  isActive: boolean;
  _count: { students: number; classes: number; teachers: number };
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  isActive: boolean;
  lastLogin: string | null;
  branch: { id: string; name: string } | null;
}

interface RouteData {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  stops: string | null;
  distance: number | null;
  fee: number | null;
  _count: { vehicles: number };
}

interface VehicleData {
  id: string;
  vehicleNo: string;
  type: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  driverLicense: string | null;
  insuranceExpiry: string | null;
  fitnessExpiry: string | null;
  isActive: boolean;
  route: { id: string; name: string } | null;
}

interface NotificationConfig {
  sms: { provider: string; apiKey: string; senderId: string };
  whatsapp: { provider: string; apiKey: string; templateId: string };
  email: { host: string; port: string; username: string; password: string; fromName: string };
  push: { projectId: string; serverKey: string };
  matrix: NotificationMatrixEvent[] | null;
}

interface NotificationMatrixEvent {
  event: string;
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  push: boolean;
}

// ============================================================
// HELPERS
// ============================================================
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Admin', color: 'text-portal-700', bg: 'bg-portal-50 border-portal-200' },
  TEACHER: { label: 'Teacher', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  PARENT: { label: 'Parent', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  TASK_MASTER: { label: 'Task Master', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
};

const DEFAULT_MATRIX_EVENTS: NotificationMatrixEvent[] = [
  { event: 'Fee Received', sms: true, whatsapp: true, email: false, push: true },
  { event: 'Fee Overdue', sms: true, whatsapp: true, email: true, push: true },
  { event: 'Attendance Marked', sms: false, whatsapp: false, email: false, push: true },
  { event: 'Daily Update Published', sms: false, whatsapp: true, email: false, push: true },
  { event: 'New Announcement', sms: false, whatsapp: false, email: true, push: true },
  { event: 'Leave Status Change', sms: true, whatsapp: false, email: false, push: true },
];

// ============================================================
// SUCCESS BANNER
// ============================================================
function SuccessBanner({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:text-emerald-900"><XCircle className="h-4 w-4" /></button>
    </div>
  );
}

// ============================================================
// ERROR BANNER
// ============================================================
function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
      <XCircle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:text-rose-900"><XCircle className="h-4 w-4" /></button>
    </div>
  );
}

// ============================================================
// PASSWORD INPUT WITH TOGGLE
// ============================================================
function PasswordInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 rounded-xl"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // ── School Profile ──
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [schoolForm, setSchoolForm] = useState<Partial<SchoolData>>({});
  const [savingSchool, setSavingSchool] = useState(false);

  // ── Branches ──
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', capacity: '', inChargeName: '', inChargePhone: '' });
  const [branchSaving, setBranchSaving] = useState(false);
  const [deleteBranchId, setDeleteBranchId] = useState<string | null>(null);

  // ── Users ──
  const [users, setUsers] = useState<UserData[]>([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: 'TEACHER', password: '', sendCredentials: false });
  const [userSaving, setUserSaving] = useState(false);
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);
  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [resetPwdResult, setResetPwdResult] = useState<string | null>(null);

  // ── Transport ──
  const [transportSubTab, setTransportSubTab] = useState('routes');
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);

  // Route dialog
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [routeForm, setRouteForm] = useState({ name: '', startPoint: '', endPoint: '', distance: '', fee: '' });
  const [routeStops, setRouteStops] = useState<{ name: string; time: string }[]>([]);
  const [routeSaving, setRouteSaving] = useState(false);
  const [deleteRouteId, setDeleteRouteId] = useState<string | null>(null);

  // Vehicle dialog
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleData | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNo: '', type: 'Bus', capacity: '', routeId: 'none',
    driverName: '', driverPhone: '', driverLicense: '',
    insuranceExpiry: '', fitnessExpiry: '',
  });
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);

  // ── Notifications ──
  const [notifConfig, setNotifConfig] = useState<NotificationConfig>({
    sms: { provider: '', apiKey: '', senderId: '' },
    whatsapp: { provider: '', apiKey: '', templateId: '' },
    email: { host: '', port: '', username: '', password: '', fromName: '' },
    push: { projectId: '', serverKey: '' },
    matrix: null,
  });
  const [matrixEvents, setMatrixEvents] = useState<NotificationMatrixEvent[]>(DEFAULT_MATRIX_EVENTS);
  const [notifSaving, setNotifSaving] = useState(false);

  // ============================================================
  // DATA FETCHING
  // ============================================================
  const fetchSchool = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/settings/school', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchool(data.school);
        setSchoolForm(data.school);
      }
    } catch (err) {
      console.error('Fetch school error:', err);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/settings/branches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch (err) {
      console.error('Fetch branches error:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/settings/users?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/settings/transport/routes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
      }
    } catch (err) {
      console.error('Fetch routes error:', err);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/settings/transport/vehicles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      }
    } catch (err) {
      console.error('Fetch vehicles error:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/settings/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifConfig(data.notifications);
          if (data.notifications.matrix && Array.isArray(data.notifications.matrix)) {
            setMatrixEvents(data.notifications.matrix);
          }
        }
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchSchool(),
        fetchBranches(),
        fetchUsers(),
        fetchRoutes(),
        fetchVehicles(),
        fetchNotifications(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, [fetchSchool, fetchBranches, fetchUsers, fetchRoutes, fetchVehicles, fetchNotifications]);

  // ============================================================
  // SCHOOL PROFILE HANDLERS
  // ============================================================
  const handleSaveSchool = async () => {
    setSavingSchool(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/school', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(schoolForm),
      });
      if (res.ok) {
        setSuccess('School profile updated successfully');
        fetchSchool();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save school profile');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSavingSchool(false);
    }
  };

  // ============================================================
  // BRANCH HANDLERS
  // ============================================================
  const openAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({ name: '', address: '', phone: '', capacity: '', inChargeName: '', inChargePhone: '' });
    setBranchDialogOpen(true);
  };

  const openEditBranch = (branch: BranchData) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      capacity: String(branch.capacity),
      inChargeName: branch.inChargeName || '',
      inChargePhone: branch.inChargePhone || '',
    });
    setBranchDialogOpen(true);
  };

  const handleSaveBranch = async () => {
    if (!branchForm.name) { setError('Branch name is required'); return; }
    setBranchSaving(true);
    setError('');
    try {
      const token = getToken();
      const url = editingBranch ? `/api/settings/branches/${editingBranch.id}` : '/api/settings/branches';
      const method = editingBranch ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        name: branchForm.name,
        address: branchForm.address || null,
        phone: branchForm.phone || null,
        capacity: parseInt(branchForm.capacity) || 0,
        inChargeName: branchForm.inChargeName || null,
        inChargePhone: branchForm.inChargePhone || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setBranchDialogOpen(false);
        setSuccess(editingBranch ? 'Branch updated successfully' : 'Branch created successfully');
        fetchBranches();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save branch');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBranchSaving(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!deleteBranchId) return;
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`/api/settings/branches/${deleteBranchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteBranchId(null);
        setSuccess('Branch deleted successfully');
        fetchBranches();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete branch');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  // ============================================================
  // USER HANDLERS
  // ============================================================
  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', phone: '', role: 'TEACHER', password: '', sendCredentials: false });
    setUserDialogOpen(true);
  };

  const openEditUser = (user: UserData) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
      sendCredentials: false,
    });
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      setError('Name, email, and role are required');
      return;
    }
    if (!editingUser && !userForm.password) {
      setError('Password is required for new users');
      return;
    }
    setUserSaving(true);
    setError('');
    try {
      const token = getToken();
      const url = editingUser ? `/api/settings/users/${editingUser.id}` : '/api/settings/users';
      const method = editingUser ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone || null,
        role: userForm.role,
        sendCredentials: userForm.sendCredentials,
      };
      if (!editingUser) {
        body.password = userForm.password;
      } else if (userForm.password) {
        body.password = userForm.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setUserDialogOpen(false);
        setSuccess(editingUser ? 'User updated successfully' : 'User created successfully');
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save user');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!deactivateUserId) return;
    setError('');
    try {
      const token = getToken();
      const user = users.find(u => u.id === deactivateUserId);
      const res = await fetch(`/api/settings/users/${deactivateUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !user?.isActive }),
      });
      if (res.ok) {
        setDeactivateUserId(null);
        setSuccess(user?.isActive ? 'User deactivated successfully' : 'User activated successfully');
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update user status');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPwdUserId) return;
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`/api/settings/users/${resetPwdUserId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResetPwdResult(data.newPassword);
        setResetPwdUserId(null);
        setSuccess('Password reset successfully');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  // ============================================================
  // TRANSPORT ROUTE HANDLERS
  // ============================================================
  const openAddRoute = () => {
    setEditingRoute(null);
    setRouteForm({ name: '', startPoint: '', endPoint: '', distance: '', fee: '' });
    setRouteStops([]);
    setRouteDialogOpen(true);
  };

  const openEditRoute = (route: RouteData) => {
    setEditingRoute(route);
    setRouteForm({
      name: route.name,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      distance: route.distance != null ? String(route.distance) : '',
      fee: route.fee != null ? String(route.fee) : '',
    });
    try {
      const parsed = route.stops ? JSON.parse(route.stops) : [];
      setRouteStops(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRouteStops([]);
    }
    setRouteDialogOpen(true);
  };

  const handleSaveRoute = async () => {
    if (!routeForm.name || !routeForm.startPoint || !routeForm.endPoint) {
      setError('Name, start point, and end point are required');
      return;
    }
    setRouteSaving(true);
    setError('');
    try {
      const token = getToken();
      const url = editingRoute ? `/api/settings/transport/routes/${editingRoute.id}` : '/api/settings/transport/routes';
      const method = editingRoute ? 'PATCH' : 'POST';
      const body = {
        name: routeForm.name,
        startPoint: routeForm.startPoint,
        endPoint: routeForm.endPoint,
        stops: routeStops.length > 0 ? JSON.stringify(routeStops) : null,
        distance: routeForm.distance ? parseFloat(routeForm.distance) : null,
        fee: routeForm.fee ? parseFloat(routeForm.fee) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setRouteDialogOpen(false);
        setSuccess(editingRoute ? 'Route updated successfully' : 'Route created successfully');
        fetchRoutes();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save route');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setRouteSaving(false);
    }
  };

  const handleDeleteRoute = async () => {
    if (!deleteRouteId) return;
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`/api/settings/transport/routes/${deleteRouteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteRouteId(null);
        setSuccess('Route deleted successfully');
        fetchRoutes();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete route');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  // ============================================================
  // TRANSPORT VEHICLE HANDLERS
  // ============================================================
  const openAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({
      vehicleNo: '', type: 'Bus', capacity: '', routeId: 'none',
      driverName: '', driverPhone: '', driverLicense: '',
      insuranceExpiry: '', fitnessExpiry: '',
    });
    setVehicleDialogOpen(true);
  };

  const openEditVehicle = (vehicle: VehicleData) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      vehicleNo: vehicle.vehicleNo,
      type: vehicle.type,
      capacity: String(vehicle.capacity),
      routeId: vehicle.route?.id || 'none',
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      driverLicense: vehicle.driverLicense || '',
      insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split('T')[0] : '',
      fitnessExpiry: vehicle.fitnessExpiry ? vehicle.fitnessExpiry.split('T')[0] : '',
    });
    setVehicleDialogOpen(true);
  };

  const handleSaveVehicle = async () => {
    if (!vehicleForm.vehicleNo || !vehicleForm.type || !vehicleForm.capacity || !vehicleForm.driverName || !vehicleForm.driverPhone) {
      setError('Vehicle No, type, capacity, driver name, and driver phone are required');
      return;
    }
    setVehicleSaving(true);
    setError('');
    try {
      const token = getToken();
      const url = editingVehicle ? `/api/settings/transport/vehicles/${editingVehicle.id}` : '/api/settings/transport/vehicles';
      const method = editingVehicle ? 'PATCH' : 'POST';
      const body = {
        vehicleNo: vehicleForm.vehicleNo,
        type: vehicleForm.type,
        capacity: parseInt(vehicleForm.capacity),
        routeId: vehicleForm.routeId === 'none' ? null : vehicleForm.routeId,
        driverName: vehicleForm.driverName,
        driverPhone: vehicleForm.driverPhone,
        driverLicense: vehicleForm.driverLicense || null,
        insuranceExpiry: vehicleForm.insuranceExpiry || null,
        fitnessExpiry: vehicleForm.fitnessExpiry || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setVehicleDialogOpen(false);
        setSuccess(editingVehicle ? 'Vehicle updated successfully' : 'Vehicle created successfully');
        fetchVehicles();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save vehicle');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setVehicleSaving(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteVehicleId) return;
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`/api/settings/transport/vehicles/${deleteVehicleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteVehicleId(null);
        setSuccess('Vehicle deleted successfully');
        fetchVehicles();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete vehicle');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  // ============================================================
  // NOTIFICATION HANDLERS
  // ============================================================
  const handleSaveNotifications = async () => {
    setNotifSaving(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sms: notifConfig.sms,
          whatsapp: notifConfig.whatsapp,
          email: notifConfig.email,
          push: notifConfig.push,
          matrix: matrixEvents,
        }),
      });
      if (res.ok) {
        setSuccess('Notification settings saved successfully');
        fetchNotifications();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save notification settings');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setNotifSaving(false);
    }
  };

  // ============================================================
  // RENDER: SKELETON LOADER
  // ============================================================
  const renderSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
      </div>
      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // RENDER: TAB 1 — SCHOOL PROFILE
  // ============================================================
  const renderSchoolProfile = () => (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-portal-600" />
          School Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* School Name */}
          <div className="space-y-2">
            <Label>School Name <span className="text-rose-500">*</span></Label>
            <Input
              value={schoolForm.name || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
              placeholder="Enter school name"
              className="rounded-xl"
            />
          </div>

          {/* School Logo */}
          <div className="space-y-2">
            <Label>School Logo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-300">
                {schoolForm.logo ? (
                  <AvatarFallback className="rounded-xl bg-portal-100 text-portal-600 text-xl font-bold">
                    {(schoolForm.name || 'S').charAt(0)}
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="rounded-xl bg-gray-100 text-gray-400">
                    <Upload className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <Input
                  value={schoolForm.logo || ''}
                  onChange={(e) => setSchoolForm({ ...schoolForm, logo: e.target.value })}
                  placeholder="Logo URL"
                  className="rounded-xl"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Paste a URL for the school logo</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2 md:col-span-2">
            <Label>Address <span className="text-rose-500">*</span></Label>
            <Textarea
              value={schoolForm.address || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
              placeholder="Enter school address"
              className="rounded-xl"
              rows={2}
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label>City <span className="text-rose-500">*</span></Label>
            <Input
              value={schoolForm.city || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
              placeholder="Enter city"
              className="rounded-xl"
            />
          </div>

          {/* State */}
          <div className="space-y-2">
            <Label>State <span className="text-rose-500">*</span></Label>
            <Input
              value={schoolForm.state || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value })}
              placeholder="Enter state"
              className="rounded-xl"
            />
          </div>

          {/* Pincode */}
          <div className="space-y-2">
            <Label>Pincode <span className="text-rose-500">*</span></Label>
            <Input
              value={schoolForm.pincode || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, pincode: e.target.value })}
              placeholder="6-digit pincode"
              maxLength={6}
              className="rounded-xl"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label>Phone <span className="text-rose-500">*</span></Label>
            <Input
              value={schoolForm.phone || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
              placeholder="Enter phone number"
              className="rounded-xl"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email <span className="text-rose-500">*</span></Label>
            <Input
              type="email"
              value={schoolForm.email || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
              placeholder="Enter email address"
              className="rounded-xl"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={schoolForm.website || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, website: e.target.value })}
              placeholder="https://example.com"
              className="rounded-xl"
            />
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            <Label>Academic Year <span className="text-rose-500">*</span></Label>
            <Select
              value={schoolForm.academicYear || ''}
              onValueChange={(v) => setSchoolForm({ ...schoolForm, academicYear: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-26">2025-26</SelectItem>
                <SelectItem value="2026-27">2026-27</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Board/Affiliation */}
          <div className="space-y-2">
            <Label>Board / Affiliation</Label>
            <Input
              value={schoolForm.board || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, board: e.target.value })}
              placeholder="e.g., CBSE, ICSE"
              className="rounded-xl"
            />
          </div>

          {/* School Code */}
          <div className="space-y-2">
            <Label>School Code</Label>
            <Input
              value={schoolForm.schoolCode || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, schoolCode: e.target.value })}
              placeholder="Enter school code"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button
            onClick={() => {
              window.location.href = '/admin/onboarding';
            }}
            variant="outline"
            className="rounded-xl text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Re-run Setup Wizard
          </Button>
          <Button
            onClick={handleSaveSchool}
            disabled={savingSchool}
            className="bg-brand-gradient text-white border-0 rounded-xl hover:bg-brand-gradient-hover min-w-[160px]"
          >
            {savingSchool ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================
  // RENDER: TAB 2 — BRANCHES
  // ============================================================
  const renderBranches = () => (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-portal-600" />
            Branches
          </CardTitle>
          <Button
            onClick={openAddBranch}
            className="bg-brand-gradient text-white border-0 rounded-xl hover:bg-brand-gradient-hover"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Branch
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No branches found. Click &quot;Add Branch&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{branch.address || '—'}</TableCell>
                    <TableCell className="text-sm">{branch.phone || '—'}</TableCell>
                    <TableCell>{branch.capacity}</TableCell>
                    <TableCell>{branch._count.students}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={branch.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                      }>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditBranch(branch)}>
                                <Pencil className="h-3.5 w-3.5 text-sky-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteBranchId(branch.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
            <DialogDescription>
              {editingBranch ? 'Update branch details' : 'Create a new branch for your school'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-rose-500">*</span></Label>
              <Input
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                placeholder="Branch name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                placeholder="Phone number"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Textarea
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                placeholder="Branch address"
                className="rounded-xl"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                value={branchForm.capacity}
                onChange={(e) => setBranchForm({ ...branchForm, capacity: e.target.value })}
                placeholder="Student capacity"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>In-Charge Name</Label>
              <Input
                value={branchForm.inChargeName}
                onChange={(e) => setBranchForm({ ...branchForm, inChargeName: e.target.value })}
                placeholder="In-charge name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>In-Charge Phone</Label>
              <Input
                value={branchForm.inChargePhone}
                onChange={(e) => setBranchForm({ ...branchForm, inChargePhone: e.target.value })}
                placeholder="In-charge phone"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveBranch} disabled={branchSaving} className="rounded-xl bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
              {branchSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingBranch ? 'Update Branch' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirm */}
      <Dialog open={!!deleteBranchId} onOpenChange={() => setDeleteBranchId(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this branch? This action will first deactivate it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBranchId(null)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteBranch} className="rounded-xl">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  // ============================================================
  // RENDER: TAB 3 — USERS
  // ============================================================
  const renderUsers = () => (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-portal-600" />
            Users
          </CardTitle>
          <Button
            onClick={openAddUser}
            className="bg-brand-gradient text-white border-0 rounded-xl hover:bg-brand-gradient-hover"
          >
            <Plus className="h-4 w-4 mr-1" /> Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found. Click &quot;Add User&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.PARENT;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${roleCfg.bg} ${roleCfg.color}`}>
                          {roleCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                        }>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(user.lastLogin)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditUser(user)}>
                                  <Pencil className="h-3.5 w-3.5 text-sky-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeactivateUserId(user.id)}>
                                  {user.isActive
                                    ? <Shield className="h-3.5 w-3.5 text-orange-500" />
                                    : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  }
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{user.isActive ? 'Deactivate' : 'Activate'}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setResetPwdUserId(user.id)}>
                                  <KeyRound className="h-3.5 w-3.5 text-portal-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reset Password</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user details' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-rose-500">*</span></Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Full name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-rose-500">*</span></Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="Email address"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-rose-500">*</span></Label>
              <Input
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="Phone number"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Role <span className="text-rose-500">*</span></Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="TASK_MASTER">Task Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password' + ' '}<span className="text-rose-500">{!editingUser ? '*' : ''}</span></Label>
                {!editingUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-portal-600 hover:text-portal-700"
                    onClick={() => setUserForm({ ...userForm, password: generatePassword() })}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Auto-Generate
                  </Button>
                )}
              </div>
              <Input
                type="text"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                className="rounded-xl"
              />
            </div>
            {!editingUser && (
              <div className="sm:col-span-2 flex items-center gap-3">
                <Checkbox
                  id="sendCredentials"
                  checked={userForm.sendCredentials}
                  onCheckedChange={(checked) => setUserForm({ ...userForm, sendCredentials: !!checked })}
                />
                <Label htmlFor="sendCredentials" className="text-sm font-normal">
                  Send credentials via Email / SMS
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveUser} disabled={userSaving} className="rounded-xl bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
              {userSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Confirm */}
      <Dialog open={!!deactivateUserId} onOpenChange={() => setDeactivateUserId(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{users.find(u => u.id === deactivateUserId)?.isActive ? 'Deactivate User' : 'Activate User'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {users.find(u => u.id === deactivateUserId)?.isActive ? 'deactivate' : 'activate'} this user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateUserId(null)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivateUser} className="rounded-xl">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirm */}
      <Dialog open={!!resetPwdUserId} onOpenChange={() => setResetPwdUserId(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              This will generate a new random password. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwdUserId(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleResetPassword} className="rounded-xl bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Result */}
      <Dialog open={!!resetPwdResult} onOpenChange={() => setResetPwdResult(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
            <DialogDescription>
              The new password has been generated. Please share it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded-xl border">
            <p className="text-xs text-muted-foreground mb-1">New Password</p>
            <p className="text-lg font-mono font-bold tracking-wider text-portal-700">{resetPwdResult}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => { navigator.clipboard.writeText(resetPwdResult || ''); }} className="rounded-xl">
              Copy Password
            </Button>
            <Button variant="outline" onClick={() => setResetPwdResult(null)} className="rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  // ============================================================
  // RENDER: TAB 4 — TRANSPORT
  // ============================================================
  const renderTransportRoutes = () => (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5 text-portal-600" />
            Routes
          </CardTitle>
          <Button
            onClick={openAddRoute}
            className="bg-brand-gradient text-white border-0 rounded-xl hover:bg-brand-gradient-hover"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Route
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Distance (km)</TableHead>
                <TableHead>Fee (₹)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No routes found. Click &quot;Add Route&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                routes.map((route) => {
                  let stopsCount = 0;
                  try {
                    const parsed = route.stops ? JSON.parse(route.stops) : [];
                    stopsCount = Array.isArray(parsed) ? parsed.length : 0;
                  } catch { /* ignore */ }
                  return (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell className="text-sm">{route.startPoint}</TableCell>
                      <TableCell className="text-sm">{route.endPoint}</TableCell>
                      <TableCell>{stopsCount}</TableCell>
                      <TableCell>{route.distance ?? '—'}</TableCell>
                      <TableCell>{route.fee != null ? `₹${route.fee}` : '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditRoute(route)}>
                                  <Pencil className="h-3.5 w-3.5 text-sky-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteRouteId(route.id)}>
                                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Route Dialog */}
      <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoute ? 'Edit Route' : 'Add Route'}</DialogTitle>
            <DialogDescription>
              {editingRoute ? 'Update route details' : 'Create a new transport route'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-rose-500">*</span></Label>
              <Input
                value={routeForm.name}
                onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                placeholder="Route name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2" />
            <div className="space-y-2">
              <Label>Start Point <span className="text-rose-500">*</span></Label>
              <Input
                value={routeForm.startPoint}
                onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                placeholder="Start point"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>End Point <span className="text-rose-500">*</span></Label>
              <Input
                value={routeForm.endPoint}
                onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                placeholder="End point"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Distance (km)</Label>
              <Input
                type="number"
                value={routeForm.distance}
                onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
                placeholder="Distance in km"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Fee (₹)</Label>
              <Input
                type="number"
                value={routeForm.fee}
                onChange={(e) => setRouteForm({ ...routeForm, fee: e.target.value })}
                placeholder="Transportation fee"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Dynamic Stops */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Stops</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs rounded-xl"
                onClick={() => setRouteStops([...routeStops, { name: '', time: '' }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Stop
              </Button>
            </div>
            {routeStops.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No stops added. Click &quot;Add Stop&quot; to add pick-up points.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {routeStops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={stop.name}
                      onChange={(e) => {
                        const newStops = [...routeStops];
                        newStops[idx] = { ...newStops[idx], name: e.target.value };
                        setRouteStops(newStops);
                      }}
                      placeholder="Stop name"
                      className="rounded-xl flex-1"
                    />
                    <Input
                      value={stop.time}
                      onChange={(e) => {
                        const newStops = [...routeStops];
                        newStops[idx] = { ...newStops[idx], time: e.target.value };
                        setRouteStops(newStops);
                      }}
                      placeholder="Time (e.g. 08:00)"
                      className="rounded-xl w-28"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() => setRouteStops(routeStops.filter((_, i) => i !== idx))}
                    >
                      <XCircle className="h-4 w-4 text-rose-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRouteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveRoute} disabled={routeSaving} className="rounded-xl bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
              {routeSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingRoute ? 'Update Route' : 'Create Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Route Confirm */}
      <Dialog open={!!deleteRouteId} onOpenChange={() => setDeleteRouteId(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Route</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this route? This cannot be undone if vehicles are not assigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRouteId(null)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRoute} className="rounded-xl">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  const renderTransportVehicles = () => {
    const isExpired = (dateStr: string | null) => {
      if (!dateStr) return false;
      return new Date(dateStr) < new Date();
    };

    return (
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bus className="h-5 w-5 text-portal-600" />
              Vehicles
            </CardTitle>
            <Button
              onClick={openAddVehicle}
              className="bg-brand-gradient text-white border-0 rounded-xl hover:bg-brand-gradient-hover"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Vehicle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Insurance Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No vehicles found. Click &quot;Add Vehicle&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.vehicleNo}</TableCell>
                      <TableCell className="text-sm">{vehicle.type}</TableCell>
                      <TableCell>{vehicle.capacity}</TableCell>
                      <TableCell className="text-sm">{vehicle.route?.name || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell className="text-sm">{vehicle.driverName}</TableCell>
                      <TableCell className="text-sm">{vehicle.driverPhone}</TableCell>
                      <TableCell>
                        {vehicle.insuranceExpiry ? (
                          <span className={isExpired(vehicle.insuranceExpiry) ? 'text-rose-600 font-medium' : ''}>
                            {formatDate(vehicle.insuranceExpiry)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={vehicle.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                        }>
                          {vehicle.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditVehicle(vehicle)}>
                                  <Pencil className="h-3.5 w-3.5 text-sky-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteVehicleId(vehicle.id)}>
                                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Vehicle Dialog */}
        <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
          <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
              <DialogDescription>
                {editingVehicle ? 'Update vehicle details' : 'Register a new vehicle'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Vehicle No <span className="text-rose-500">*</span></Label>
                <Input
                  value={vehicleForm.vehicleNo}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNo: e.target.value })}
                  placeholder="e.g., KA-01-AB-1234"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Type <span className="text-rose-500">*</span></Label>
                <Select value={vehicleForm.type} onValueChange={(v) => setVehicleForm({ ...vehicleForm, type: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Mini Bus">Mini Bus</SelectItem>
                    <SelectItem value="Auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacity <span className="text-rose-500">*</span></Label>
                <Input
                  type="number"
                  value={vehicleForm.capacity}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                  placeholder="Seating capacity"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <Select value={vehicleForm.routeId} onValueChange={(v) => setVehicleForm({ ...vehicleForm, routeId: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver Name <span className="text-rose-500">*</span></Label>
                <Input
                  value={vehicleForm.driverName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                  placeholder="Driver name"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Phone <span className="text-rose-500">*</span></Label>
                <Input
                  value={vehicleForm.driverPhone}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                  placeholder="Driver phone"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Driver License</Label>
                <Input
                  value={vehicleForm.driverLicense}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverLicense: e.target.value })}
                  placeholder="License number"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Insurance Expiry</Label>
                <Input
                  type="date"
                  value={vehicleForm.insuranceExpiry}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Fitness Expiry</Label>
                <Input
                  type="date"
                  value={vehicleForm.fitnessExpiry}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, fitnessExpiry: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVehicleDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSaveVehicle} disabled={vehicleSaving} className="rounded-xl bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
                {vehicleSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Vehicle Confirm */}
        <Dialog open={!!deleteVehicleId} onOpenChange={() => setDeleteVehicleId(null)}>
          <DialogContent className="rounded-3xl max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Vehicle</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this vehicle? It will be deactivated first.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteVehicleId(null)} className="rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteVehicle} className="rounded-xl">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  };

  const renderTransport = () => (
    <div className="space-y-4">
      <Tabs value={transportSubTab} onValueChange={setTransportSubTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="routes" className="gap-1.5">
            <Route className="h-3.5 w-3.5" /> Routes
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="gap-1.5">
            <Bus className="h-3.5 w-3.5" /> Vehicles
          </TabsTrigger>
        </TabsList>
        <TabsContent value="routes" className="mt-4">
          {renderTransportRoutes()}
        </TabsContent>
        <TabsContent value="vehicles" className="mt-4">
          {renderTransportVehicles()}
        </TabsContent>
      </Tabs>
    </div>
  );

  // ============================================================
  // RENDER: TAB 5 — NOTIFICATIONS
  // ============================================================
  const renderNotifications = () => {
    const ChannelCard = ({
      icon: Icon,
      title,
      color,
      children,
    }: {
      icon: React.ElementType;
      title: string;
      color: string;
      children: React.ReactNode;
    }) => (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className={`p-1.5 rounded-lg ${color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
    );

    return (
      <div className="space-y-6">
        {/* Channel Configuration */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Channel Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SMS Card */}
            <ChannelCard icon={Smartphone} title="SMS" color="bg-portal-500">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Provider</Label>
                  <Select
                    value={notifConfig.sms.provider}
                    onValueChange={(v) => setNotifConfig({ ...notifConfig, sms: { ...notifConfig.sms, provider: v } })}
                  >
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MSG91">MSG91</SelectItem>
                      <SelectItem value="Twilio">Twilio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">API Key</Label>
                  <PasswordInput
                    value={notifConfig.sms.apiKey}
                    onChange={(v) => setNotifConfig({ ...notifConfig, sms: { ...notifConfig.sms, apiKey: v } })}
                    placeholder="Enter API key"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sender ID</Label>
                  <Input
                    value={notifConfig.sms.senderId}
                    onChange={(e) => setNotifConfig({ ...notifConfig, sms: { ...notifConfig.sms, senderId: e.target.value } })}
                    placeholder="Sender ID"
                    className="rounded-xl h-9"
                  />
                </div>
              </div>
            </ChannelCard>

            {/* WhatsApp Card */}
            <ChannelCard icon={MessageSquare} title="WhatsApp" color="bg-emerald-500">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Provider</Label>
                  <Select
                    value={notifConfig.whatsapp.provider}
                    onValueChange={(v) => setNotifConfig({ ...notifConfig, whatsapp: { ...notifConfig.whatsapp, provider: v } })}
                  >
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gupshup">Gupshup</SelectItem>
                      <SelectItem value="WATI">WATI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">API Key</Label>
                  <PasswordInput
                    value={notifConfig.whatsapp.apiKey}
                    onChange={(v) => setNotifConfig({ ...notifConfig, whatsapp: { ...notifConfig.whatsapp, apiKey: v } })}
                    placeholder="Enter API key"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Template ID</Label>
                  <Input
                    value={notifConfig.whatsapp.templateId}
                    onChange={(e) => setNotifConfig({ ...notifConfig, whatsapp: { ...notifConfig.whatsapp, templateId: e.target.value } })}
                    placeholder="Template ID"
                    className="rounded-xl h-9"
                  />
                </div>
              </div>
            </ChannelCard>

            {/* Email Card */}
            <ChannelCard icon={Mail} title="Email" color="bg-sky-500">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">SMTP Host</Label>
                    <Input
                      value={notifConfig.email.host}
                      onChange={(e) => setNotifConfig({ ...notifConfig, email: { ...notifConfig.email, host: e.target.value } })}
                      placeholder="smtp.example.com"
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Port</Label>
                    <Input
                      value={notifConfig.email.port}
                      onChange={(e) => setNotifConfig({ ...notifConfig, email: { ...notifConfig.email, port: e.target.value } })}
                      placeholder="587"
                      className="rounded-xl h-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Username</Label>
                  <Input
                    value={notifConfig.email.username}
                    onChange={(e) => setNotifConfig({ ...notifConfig, email: { ...notifConfig.email, username: e.target.value } })}
                    placeholder="SMTP username"
                    className="rounded-xl h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Password</Label>
                  <PasswordInput
                    value={notifConfig.email.password}
                    onChange={(v) => setNotifConfig({ ...notifConfig, email: { ...notifConfig.email, password: v } })}
                    placeholder="SMTP password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">From Name</Label>
                  <Input
                    value={notifConfig.email.fromName}
                    onChange={(e) => setNotifConfig({ ...notifConfig, email: { ...notifConfig.email, fromName: e.target.value } })}
                    placeholder="Sender display name"
                    className="rounded-xl h-9"
                  />
                </div>
              </div>
            </ChannelCard>

            {/* Push Card */}
            <ChannelCard icon={Bell} title="Push Notifications" color="bg-orange-500">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Firebase Project ID</Label>
                  <Input
                    value={notifConfig.push.projectId}
                    onChange={(e) => setNotifConfig({ ...notifConfig, push: { ...notifConfig.push, projectId: e.target.value } })}
                    placeholder="your-project-id"
                    className="rounded-xl h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Server Key</Label>
                  <PasswordInput
                    value={notifConfig.push.serverKey}
                    onChange={(v) => setNotifConfig({ ...notifConfig, push: { ...notifConfig.push, serverKey: v } })}
                    placeholder="Firebase server key"
                  />
                </div>
              </div>
            </ChannelCard>
          </div>
        </div>

        {/* Auto-notifications Matrix */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Auto-Notification Rules</h3>
          <Card className="rounded-3xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead className="text-center w-24">SMS</TableHead>
                      <TableHead className="text-center w-24">WhatsApp</TableHead>
                      <TableHead className="text-center w-24">Email</TableHead>
                      <TableHead className="text-center w-24">Push</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrixEvents.map((evt, idx) => (
                      <TableRow key={evt.event}>
                        <TableCell className="font-medium">{evt.event}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={evt.sms}
                            onCheckedChange={(checked) => {
                              const newEvents = [...matrixEvents];
                              newEvents[idx] = { ...newEvents[idx], sms: !!checked };
                              setMatrixEvents(newEvents);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={evt.whatsapp}
                            onCheckedChange={(checked) => {
                              const newEvents = [...matrixEvents];
                              newEvents[idx] = { ...newEvents[idx], whatsapp: !!checked };
                              setMatrixEvents(newEvents);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={evt.email}
                            onCheckedChange={(checked) => {
                              const newEvents = [...matrixEvents];
                              newEvents[idx] = { ...newEvents[idx], email: !!checked };
                              setMatrixEvents(newEvents);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={evt.push}
                            onCheckedChange={(checked) => {
                              const newEvents = [...matrixEvents];
                              newEvents[idx] = { ...newEvents[idx], push: !!checked };
                              setMatrixEvents(newEvents);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveNotifications}
            disabled={notifSaving}
            className="bg-brand-gradient text-white border-0 rounded-xl hover:bg-brand-gradient-hover min-w-[160px]"
          >
            {notifSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save Settings</>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  if (loading) return renderSkeleton();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${theme.avatarGradientClass} shadow-lg shadow-violet-500/25`}>
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage school profile, branches, users, transport, and notifications</p>
        </div>
      </div>

      {/* Feedback Banners */}
      {success && <SuccessBanner message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* Main Tabs */}
      <Tabs defaultValue="school" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="school" className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 className="h-3.5 w-3.5" /> School Profile
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 className="h-3.5 w-3.5" /> Branches
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-3.5 w-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="transport" className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bus className="h-3.5 w-3.5" /> Transport
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="mt-4">
          {renderSchoolProfile()}
        </TabsContent>

        <TabsContent value="branches" className="mt-4">
          {renderBranches()}
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          {renderUsers()}
        </TabsContent>

        <TabsContent value="transport" className="mt-4">
          {renderTransport()}
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          {renderNotifications()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
