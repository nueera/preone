'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bus, Route, MapPin, Plus, Pencil, Trash2, Loader2, Search,
  Phone, User, Shield, Calendar, Clock, Navigation, Eye, XCircle,
  CheckCircle2, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { ScrollArea } from '@/components/ui/scroll-area';

// ============================================================
// TYPES
// ============================================================
interface RouteData {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  stops: string | null;
  distance: number | null;
  fee: number | null;
  createdAt: string;
  updatedAt: string;
  _count: { vehicles: number };
}

interface VehicleData {
  id: string;
  vehicleNo: string;
  type: string;
  capacity: number;
  routeId: string | null;
  driverName: string;
  driverPhone: string;
  driverLicense: string | null;
  insuranceExpiry: string | null;
  fitnessExpiry: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  route: { id: string; name: string; startPoint: string; endPoint: string } | null;
}

interface TransportStats {
  totalRoutes: number;
  totalVehicles: number;
  totalStudentsUsingTransport: number;
}

interface StopItem {
  name: string;
  time: string;
}

// ============================================================
// HELPERS
// ============================================================
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    return new Date(dateStr) < new Date();
  } catch {
    return false;
  }
}

function parseStops(stopsJson: string | null): StopItem[] {
  if (!stopsJson) return [];
  try {
    const parsed = JSON.parse(stopsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatFee(fee: number | null): string {
  if (fee == null) return '—';
  return `₹${fee.toLocaleString('en-IN')}`;
}

function formatDistance(distance: number | null): string {
  if (distance == null) return '—';
  return `${distance} km`;
}

// ============================================================
// VEHICLE TYPE BADGE CONFIG
// ============================================================
const VEHICLE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Bus: { label: 'Bus', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  Van: { label: 'Van', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  'Mini Bus': { label: 'Mini Bus', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  Auto: { label: 'Auto', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
};

// ============================================================
// SUCCESS / ERROR BANNERS
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
// MAIN PAGE COMPONENT
// ============================================================
export default function TransportPage() {
  // ── Global state ──
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('routes');

  // ── Stats ──
  const [stats, setStats] = useState<TransportStats>({
    totalRoutes: 0,
    totalVehicles: 0,
    totalStudentsUsingTransport: 0,
  });

  // ── Routes ──
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [routeSearch, setRouteSearch] = useState('');

  // Route dialog
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [routeForm, setRouteForm] = useState({
    name: '', startPoint: '', endPoint: '', distance: '', fee: '',
  });
  const [routeStops, setRouteStops] = useState<StopItem[]>([]);
  const [routeSaving, setRouteSaving] = useState(false);
  const [deleteRouteId, setDeleteRouteId] = useState<string | null>(null);

  // View stops dialog
  const [viewStopsRoute, setViewStopsRoute] = useState<RouteData | null>(null);

  // ── Vehicles ──
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');

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

  // ============================================================
  // DATA FETCHING
  // ============================================================
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/settings/transport/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Fetch transport stats error:', err);
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

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRoutes(), fetchVehicles()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchStats, fetchRoutes, fetchVehicles]);

  // Refresh stats when data changes
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStats(), fetchRoutes(), fetchVehicles()]);
  }, [fetchStats, fetchRoutes, fetchVehicles]);

  // ============================================================
  // ROUTE HANDLERS
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
    setRouteStops(parseStops(route.stops));
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
      const url = editingRoute
        ? `/api/settings/transport/routes/${editingRoute.id}`
        : '/api/settings/transport/routes';
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
        refreshAll();
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
        refreshAll();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete route');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  // Dynamic stops management
  const addStop = () => {
    setRouteStops([...routeStops, { name: '', time: '' }]);
  };

  const removeStop = (index: number) => {
    setRouteStops(routeStops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, field: keyof StopItem, value: string) => {
    const updated = [...routeStops];
    updated[index] = { ...updated[index], [field]: value };
    setRouteStops(updated);
  };

  // ============================================================
  // VEHICLE HANDLERS
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
      const url = editingVehicle
        ? `/api/settings/transport/vehicles/${editingVehicle.id}`
        : '/api/settings/transport/vehicles';
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
        refreshAll();
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
        setSuccess('Vehicle deactivated successfully');
        refreshAll();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete vehicle');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  // ============================================================
  // FILTERED DATA
  // ============================================================
  const filteredRoutes = routes.filter((r) => {
    if (!routeSearch) return true;
    const q = routeSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.startPoint.toLowerCase().includes(q) ||
      r.endPoint.toLowerCase().includes(q)
    );
  });

  const filteredVehicles = vehicles.filter((v) => {
    if (!vehicleSearch) return true;
    const q = vehicleSearch.toLowerCase();
    return (
      v.vehicleNo.toLowerCase().includes(q) ||
      v.driverName.toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q) ||
      (v.route?.name || '').toLowerCase().includes(q)
    );
  });

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-3xl">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // RENDER: STATS ROW
  // ============================================================
  const renderStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="rounded-3xl stat-card-violet">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-violet-100">
              <Route className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Routes</p>
              <p className="text-xl sm:text-2xl font-bold text-violet-700">{stats.totalRoutes}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl stat-card-sky">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-sky-100">
              <Bus className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Vehicles</p>
              <p className="text-xl sm:text-2xl font-bold text-sky-700">{stats.totalVehicles}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl stat-card-emerald">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-emerald-100">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Students Using Transport</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-700">{stats.totalStudentsUsingTransport}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // RENDER: ROUTES TABLE
  // ============================================================
  const renderRoutesTab = () => (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5 text-violet-600" />
            Routes
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search routes..."
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                className="pl-9 w-full sm:w-[220px] rounded-xl"
              />
            </div>
            <Button
              onClick={openAddRoute}
              className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl hover:from-violet-700 hover:to-sky-600 shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Route
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Point</TableHead>
                <TableHead>End Point</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Vehicles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoutes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {routeSearch ? 'No routes match your search.' : 'No routes found. Click "Add Route" to create one.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoutes.map((route) => {
                  const stops = parseStops(route.stops);
                  return (
                    <TableRow key={route.id} className="table-row-preone">
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{route.startPoint}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{route.endPoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                          {stops.length} stop{stops.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDistance(route.distance)}</TableCell>
                      <TableCell className="text-sm font-medium">{formatFee(route.fee)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                          {route._count.vehicles}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {stops.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                    onClick={() => setViewStopsRoute(route)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Stops</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                                  onClick={() => openEditRoute(route)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => setDeleteRouteId(route.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
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
    </Card>
  );

  // ============================================================
  // RENDER: VEHICLES TABLE
  // ============================================================
  const renderVehiclesTab = () => (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bus className="h-5 w-5 text-sky-600" />
            Vehicles
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="pl-9 w-full sm:w-[220px] rounded-xl"
              />
            </div>
            <Button
              onClick={openAddVehicle}
              className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl hover:from-violet-700 hover:to-sky-600 shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Vehicle
            </Button>
          </div>
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
                <TableHead>Insurance</TableHead>
                <TableHead>Fitness</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {vehicleSearch ? 'No vehicles match your search.' : 'No vehicles found. Click "Add Vehicle" to create one.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const typeConfig = VEHICLE_TYPE_CONFIG[vehicle.type] || {
                    label: vehicle.type, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200',
                  };
                  const insExpired = isExpired(vehicle.insuranceExpiry);
                  const fitExpired = isExpired(vehicle.fitnessExpiry);

                  return (
                    <TableRow key={vehicle.id} className="table-row-preone">
                      <TableCell className="font-medium">{vehicle.vehicleNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${typeConfig.bg} ${typeConfig.color}`}>
                          {typeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{vehicle.capacity} seats</TableCell>
                      <TableCell>
                        {vehicle.route ? (
                          <span className="text-sm">{vehicle.route.name}</span>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{vehicle.driverName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{vehicle.driverPhone}</TableCell>
                      <TableCell>
                        <span className={`text-sm ${insExpired ? 'text-rose-600 font-medium' : ''}`}>
                          {formatDate(vehicle.insuranceExpiry)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${fitExpired ? 'text-rose-600 font-medium' : ''}`}>
                          {formatDate(vehicle.fitnessExpiry)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            vehicle.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }
                        >
                          {vehicle.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                                  onClick={() => openEditVehicle(vehicle)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => setDeleteVehicleId(vehicle.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
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
    </Card>
  );

  // ============================================================
  // RENDER: VIEW STOPS DIALOG (Timeline)
  // ============================================================
  const renderViewStopsDialog = () => {
    if (!viewStopsRoute) return null;
    const stops = parseStops(viewStopsRoute.stops);

    return (
      <Dialog open={!!viewStopsRoute} onOpenChange={() => setViewStopsRoute(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-violet-600" />
              Stops — {viewStopsRoute.name}
            </DialogTitle>
            <DialogDescription>
              {viewStopsRoute.startPoint} → {viewStopsRoute.endPoint}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Start point */}
            <div className="flex items-start gap-3 mb-2">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Navigation className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="w-0.5 h-6 bg-gray-200" />
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium text-emerald-700">Start: {viewStopsRoute.startPoint}</p>
              </div>
            </div>

            {/* Stops timeline */}
            {stops.map((stop, index) => (
              <div key={index} className="flex items-start gap-3 mb-2">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-violet-600" />
                  </div>
                  {index < stops.length - 1 && (
                    <div className="w-0.5 h-6 bg-gray-200" />
                  )}
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <div>
                    <p className="text-sm font-medium">{stop.name}</p>
                    {stop.time && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {stop.time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* End point */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {stops.length > 0 && (
                  <div className="w-0.5 h-6 bg-gray-200" />
                )}
                <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-rose-600" />
                </div>
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium text-rose-700">End: {viewStopsRoute.endPoint}</p>
              </div>
            </div>
          </div>

          {viewStopsRoute.distance != null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
              <Navigation className="h-4 w-4" />
              Total Distance: {formatDistance(viewStopsRoute.distance)}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setViewStopsRoute(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // ============================================================
  // RENDER: ADD/EDIT ROUTE DIALOG
  // ============================================================
  const renderRouteDialog = () => (
    <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-violet-600" />
            {editingRoute ? 'Edit Route' : 'Add Route'}
          </DialogTitle>
          <DialogDescription>
            {editingRoute ? 'Update route details and stops.' : 'Create a new transport route with stops.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name <span className="text-rose-500">*</span></Label>
              <Input
                value={routeForm.name}
                onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                placeholder="e.g., Route A - City Center"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Point <span className="text-rose-500">*</span></Label>
              <Input
                value={routeForm.startPoint}
                onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                placeholder="e.g., School Campus"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>End Point <span className="text-rose-500">*</span></Label>
              <Input
                value={routeForm.endPoint}
                onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                placeholder="e.g., City Center"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Distance (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={routeForm.distance}
                onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
                placeholder="e.g., 5.2"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Fee (₹)</Label>
              <Input
                type="number"
                value={routeForm.fee}
                onChange={(e) => setRouteForm({ ...routeForm, fee: e.target.value })}
                placeholder="e.g., 1500"
                className="rounded-xl"
              />
            </div>
          </div>

          <Separator />

          {/* Stops section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-violet-600" />
                Stops
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl gap-1"
                onClick={addStop}
              >
                <Plus className="h-3.5 w-3.5" /> Add Stop
              </Button>
            </div>

            {routeStops.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No stops added. Click &quot;Add Stop&quot; to add pickup/drop points.
              </div>
            ) : (
              <ScrollArea className="max-h-60">
                <div className="space-y-3">
                  {routeStops.map((stop, index) => (
                    <div key={index} className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Stop Name</Label>
                          <Input
                            value={stop.name}
                            onChange={(e) => updateStop(index, 'name', e.target.value)}
                            placeholder="Stop name"
                            className="rounded-xl h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Time</Label>
                          <Input
                            type="time"
                            value={stop.time}
                            onChange={(e) => updateStop(index, 'time', e.target.value)}
                            className="rounded-xl h-9 text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => removeStop(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setRouteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveRoute}
            disabled={routeSaving}
            className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl hover:from-violet-700 hover:to-sky-600 min-w-[120px]"
          >
            {routeSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              editingRoute ? 'Update Route' : 'Create Route'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ============================================================
  // RENDER: ADD/EDIT VEHICLE DIALOG
  // ============================================================
  const renderVehicleDialog = () => (
    <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-sky-600" />
            {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          </DialogTitle>
          <DialogDescription>
            {editingVehicle ? 'Update vehicle and driver details.' : 'Register a new transport vehicle.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Vehicle details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Select
                value={vehicleForm.type}
                onValueChange={(v) => setVehicleForm({ ...vehicleForm, type: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select type" />
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
                placeholder="e.g., 40"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Route</Label>
              <Select
                value={vehicleForm.routeId}
                onValueChange={(v) => setVehicleForm({ ...vehicleForm, routeId: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.startPoint} → {r.endPoint})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Driver details */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-violet-600" />
              Driver Details
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Driver Name <span className="text-rose-500">*</span></Label>
                <Input
                  value={vehicleForm.driverName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                  placeholder="e.g., Ramesh Kumar"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Phone <span className="text-rose-500">*</span></Label>
                <Input
                  value={vehicleForm.driverPhone}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                  placeholder="e.g., 9876543210"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Driver License</Label>
                <Input
                  value={vehicleForm.driverLicense}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverLicense: e.target.value })}
                  placeholder="e.g., DL-1234567890"
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Compliance details */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-600" />
              Compliance
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setVehicleDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveVehicle}
            disabled={vehicleSaving}
            className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl hover:from-violet-700 hover:to-sky-600 min-w-[120px]"
          >
            {vehicleSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              editingVehicle ? 'Update Vehicle' : 'Create Vehicle'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ============================================================
  // RENDER: DELETE ROUTE CONFIRMATION
  // ============================================================
  const renderDeleteRouteDialog = () => (
    <Dialog open={!!deleteRouteId} onOpenChange={() => setDeleteRouteId(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <Trash2 className="h-5 w-5" />
            Delete Route
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this route? This action cannot be undone. Routes with assigned vehicles cannot be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setDeleteRouteId(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={handleDeleteRoute}
          >
            Delete Route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ============================================================
  // RENDER: DELETE VEHICLE CONFIRMATION
  // ============================================================
  const renderDeleteVehicleDialog = () => (
    <Dialog open={!!deleteVehicleId} onOpenChange={() => setDeleteVehicleId(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <Trash2 className="h-5 w-5" />
            Deactivate Vehicle
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate this vehicle? The vehicle will be marked as inactive but not permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setDeleteVehicleId(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={handleDeleteVehicle}
          >
            Deactivate Vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================
  if (loading) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bus className="h-7 w-7 text-violet-600" />
            Transport
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage routes, vehicles, and driver assignments</p>
        </div>
      </div>

      {/* ── Banners ── */}
      {success && <SuccessBanner message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* ── Stats Row ── */}
      {renderStats()}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white dark:bg-gray-800 border rounded-xl p-1 h-auto">
          <TabsTrigger
            value="routes"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-sky-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Route className="h-4 w-4 mr-2" />
            Routes
          </TabsTrigger>
          <TabsTrigger
            value="vehicles"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-sky-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Bus className="h-4 w-4 mr-2" />
            Vehicles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="mt-4">
          {renderRoutesTab()}
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4">
          {renderVehiclesTab()}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      {renderRouteDialog()}
      {renderVehicleDialog()}
      {renderViewStopsDialog()}
      {renderDeleteRouteDialog()}
      {renderDeleteVehicleDialog()}
    </div>
  );
}
