'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, Receipt,
  Megaphone, Palette, TrendingUp, MessageSquare, Settings, ChevronLeft,
  ChevronRight, Search, Plus, MoreVertical, Phone, Mail, Star, Clock,
  CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight,
  IndianRupee, UserPlus, Calendar, Filter, Download, Bell, Send,
  BarChart3, Activity, Baby, Heart, Eye, BookOpen, Target, Sparkles,
  Bot, FileText, Image as ImageIcon, Video, MapPin, Zap, CircleDot, UserCheck,
  UserX, Timer, TrendingDown, Award, ChevronDown, Edit, Trash2,
  ExternalLink, Home, Building2, Smile, Frown, Meh, X, Check
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart,
  Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend,
} from 'recharts';

// ============================================================
// TYPES
// ============================================================
type Section = 'dashboard' | 'students' | 'teachers' | 'attendance' | 'fees' | 'crm' | 'activities' | 'growth' | 'communication' | 'settings';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
}

// ============================================================
// MOCK DATA
// ============================================================
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'teachers', label: 'Teachers', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'fees', label: 'Fees', icon: Receipt },
  { id: 'crm', label: 'Admission CRM', icon: Megaphone },
  { id: 'activities', label: 'Activities', icon: Palette },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const revenueData = [
  { month: 'Jan', revenue: 380000, collections: 350000 },
  { month: 'Feb', revenue: 410000, collections: 390000 },
  { month: 'Mar', revenue: 425000, collections: 400000 },
  { month: 'Apr', revenue: 440000, collections: 415000 },
  { month: 'May', revenue: 460000, collections: 435000 },
  { month: 'Jun', revenue: 475000, collections: 452000 },
];

const feeData = [
  { name: 'Collected', value: 3580000, color: '#10b981' },
  { name: 'Pending', value: 890000, color: '#f59e0b' },
  { name: 'Overdue', value: 280000, color: '#ef4444' },
];

const admissionPipeline = [
  { stage: 'New Inquiry', count: 24, color: '#f59e0b' },
  { stage: 'Visit Scheduled', count: 18, color: '#fb923c' },
  { stage: 'School Tour', count: 12, color: '#f97316' },
  { stage: 'Demo Given', count: 8, color: '#ea580c' },
  { stage: 'Follow-up', count: 15, color: '#10b981' },
  { stage: 'Confirmed', count: 6, color: '#059669' },
  { stage: 'Enrolled', count: 45, color: '#047857' },
];

const studentsData = [
  { id: 'STU001', name: 'Aarav Sharma', class: 'Nursery-A', parent: 'Rajesh Sharma', phone: '+91 98765 43210', attendance: 94, feeStatus: 'Paid', gender: 'Male', dob: '2021-05-15', bloodGroup: 'B+', status: 'Active' },
  { id: 'STU002', name: 'Ananya Patel', class: 'LKG-B', parent: 'Priya Patel', phone: '+91 87654 32109', attendance: 88, feeStatus: 'Pending', gender: 'Female', dob: '2020-08-22', bloodGroup: 'O+', status: 'Active' },
  { id: 'STU003', name: 'Vivaan Kumar', class: 'UKG-A', parent: 'Amit Kumar', phone: '+91 76543 21098', attendance: 76, feeStatus: 'Overdue', gender: 'Male', dob: '2019-12-03', bloodGroup: 'A+', status: 'Active' },
  { id: 'STU004', name: 'Diya Singh', class: 'Nursery-B', parent: 'Sunita Singh', phone: '+91 65432 10987', attendance: 97, feeStatus: 'Paid', gender: 'Female', dob: '2021-11-18', bloodGroup: 'AB+', status: 'Active' },
  { id: 'STU005', name: 'Arjun Reddy', class: 'LKG-A', parent: 'Venkat Reddy', phone: '+91 54321 09876', attendance: 91, feeStatus: 'Paid', gender: 'Male', dob: '2020-03-07', bloodGroup: 'B-', status: 'Active' },
  { id: 'STU006', name: 'Isha Gupta', class: 'UKG-B', parent: 'Neha Gupta', phone: '+91 43210 98765', attendance: 85, feeStatus: 'Pending', gender: 'Female', dob: '2019-07-25', bloodGroup: 'O-', status: 'Active' },
  { id: 'STU007', name: 'Kabir Joshi', class: 'Nursery-A', parent: 'Sanjay Joshi', phone: '+91 32109 87654', attendance: 92, feeStatus: 'Paid', gender: 'Male', dob: '2021-09-12', bloodGroup: 'A-', status: 'Active' },
  { id: 'STU008', name: 'Meera Nair', class: 'LKG-B', parent: 'Lakshmi Nair', phone: '+91 21098 76543', attendance: 89, feeStatus: 'Paid', gender: 'Female', dob: '2020-01-30', bloodGroup: 'B+', status: 'Active' },
  { id: 'STU009', name: 'Rohan Das', class: 'UKG-A', parent: 'Rahul Das', phone: '+91 10987 65432', attendance: 73, feeStatus: 'Overdue', gender: 'Male', dob: '2019-06-14', bloodGroup: 'O+', status: 'Inactive' },
  { id: 'STU010', name: 'Sara Khan', class: 'Nursery-B', parent: 'Imran Khan', phone: '+91 09876 54321', attendance: 96, feeStatus: 'Paid', gender: 'Female', dob: '2021-04-28', bloodGroup: 'AB-', status: 'Active' },
];

const teachersData = [
  { id: 'TCH001', name: 'Dr. Kavitha Raman', qualification: 'PhD Early Education', class: 'Nursery-A', rating: 4.9, attendance: 98, phone: '+91 98123 45670', experience: 12, status: 'Active', specialization: 'Montessori Method' },
  { id: 'TCH002', name: 'Priya Menon', qualification: 'M.Ed', class: 'LKG-A', rating: 4.7, attendance: 95, phone: '+91 87234 56789', experience: 8, status: 'Active', specialization: 'Child Psychology' },
  { id: 'TCH003', name: 'Sunita Verma', qualification: 'B.Ed + ECE Diploma', class: 'UKG-A', rating: 4.8, attendance: 92, phone: '+91 76345 67890', experience: 10, status: 'Active', specialization: 'Language Development' },
  { id: 'TCH004', name: 'Rashmi Iyer', qualification: 'M.Ed Special Needs', class: 'Nursery-B', rating: 4.6, attendance: 90, phone: '+91 65456 78901', experience: 6, status: 'Active', specialization: 'Inclusive Education' },
  { id: 'TCH005', name: 'Anita Desai', qualification: 'B.Ed + Art Therapy', class: 'LKG-B', rating: 4.5, attendance: 88, phone: '+91 54567 89012', experience: 5, status: 'OnLeave', specialization: 'Creative Arts' },
  { id: 'TCH006', name: 'Meera Krishnan', qualification: 'M.Sc + B.Ed', class: 'UKG-B', rating: 4.8, attendance: 96, phone: '+91 43678 90123', experience: 9, status: 'Active', specialization: 'STEM for Kids' },
];

const attendanceData = [
  { class: 'Nursery-A', total: 35, present: 32, absent: 2, late: 1 },
  { class: 'Nursery-B', total: 32, present: 29, absent: 2, late: 1 },
  { class: 'LKG-A', total: 38, present: 35, absent: 2, late: 1 },
  { class: 'LKG-B', total: 36, present: 30, absent: 4, late: 2 },
  { class: 'UKG-A', total: 40, present: 37, absent: 2, late: 1 },
  { class: 'UKG-B', total: 34, present: 31, absent: 2, late: 1 },
];

const invoiceData = [
  { id: 'INV-2024-001', student: 'Aarav Sharma', class: 'Nursery-A', amount: 8500, paid: 8500, due: '2024-06-05', status: 'Paid', type: 'Tuition' },
  { id: 'INV-2024-002', student: 'Ananya Patel', class: 'LKG-B', amount: 9500, paid: 0, due: '2024-06-05', status: 'Pending', type: 'Tuition' },
  { id: 'INV-2024-003', student: 'Vivaan Kumar', class: 'UKG-A', amount: 10500, paid: 0, due: '2024-05-05', status: 'Overdue', type: 'Tuition' },
  { id: 'INV-2024-004', student: 'Diya Singh', class: 'Nursery-B', amount: 8500, paid: 8500, due: '2024-06-05', status: 'Paid', type: 'Tuition' },
  { id: 'INV-2024-005', student: 'Arjun Reddy', class: 'LKG-A', amount: 9500, paid: 9500, due: '2024-06-05', status: 'Paid', type: 'Tuition' },
  { id: 'INV-2024-006', student: 'Isha Gupta', class: 'UKG-B', amount: 10500, paid: 5000, due: '2024-06-05', status: 'Partial', type: 'Tuition' },
  { id: 'INV-2024-007', student: 'Kabir Joshi', class: 'Nursery-A', amount: 2500, paid: 2500, due: '2024-06-10', status: 'Paid', type: 'Activity' },
  { id: 'INV-2024-008', student: 'Meera Nair', class: 'LKG-B', amount: 3000, paid: 3000, due: '2024-06-10', status: 'Paid', type: 'Transport' },
];

const leadsData = [
  { id: 'LD001', parentName: 'Vikram Malhotra', childName: 'Ayaan Malhotra', phone: '+91 99887 76655', source: 'Website', stage: 'NewInquiry', priority: 'High', followUp: '2024-06-08', program: 'Nursery', notes: 'Interested in full-day program' },
  { id: 'LD002', parentName: 'Swati Kapoor', childName: 'Riya Kapoor', phone: '+91 88776 65544', source: 'Referral', stage: 'Visit', priority: 'Medium', followUp: '2024-06-07', program: 'LKG', notes: 'Referred by existing parent' },
  { id: 'LD003', parentName: 'Arun Swamy', childName: 'Aditi Swamy', phone: '+91 77665 54433', source: 'WalkIn', stage: 'Tour', priority: 'Hot', followUp: '2024-06-06', program: 'UKG', notes: 'Visited campus, very impressed' },
  { id: 'LD004', parentName: 'Nisha Agarwal', childName: 'Kian Agarwal', phone: '+91 66554 43322', source: 'SocialMedia', stage: 'Demo', priority: 'High', followUp: '2024-06-09', program: 'Nursery', notes: 'Attended demo class' },
  { id: 'LD005', parentName: 'Deepak Rao', childName: 'Saanvi Rao', phone: '+91 55443 32211', source: 'WhatsApp', stage: 'FollowUp', priority: 'Medium', followUp: '2024-06-10', program: 'LKG', notes: 'Comparing with 2 other schools' },
  { id: 'LD006', parentName: 'Pooja Bhatt', childName: 'Vihaan Bhatt', phone: '+91 44332 21100', source: 'Ad', stage: 'Confirmed', priority: 'High', followUp: '2024-06-05', program: 'Nursery', notes: 'Admission confirmed for July' },
  { id: 'LD007', parentName: 'Raj Malhotra', childName: 'Anaya Malhotra', phone: '+91 33221 10099', source: 'Referral', stage: 'Enrolled', priority: 'Low', followUp: '', program: 'UKG', notes: 'Enrolled and fee paid' },
  { id: 'LD008', parentName: 'Kavita Shah', childName: 'Arjun Shah', phone: '+91 22110 09988', source: 'Call', stage: 'NewInquiry', priority: 'Medium', followUp: '2024-06-11', program: 'LKG', notes: 'Called from newspaper ad' },
];

const activitiesData = [
  { id: 'ACT001', title: 'Color Day Celebration', type: 'Art', date: '2024-06-10', time: '09:00 - 11:00', class: 'All Classes', status: 'Planned', teacher: 'Rashmi Iyer', description: 'Children explore colors through painting, craft, and creative play' },
  { id: 'ACT002', title: 'Rhyme Recitation', type: 'Music', date: '2024-06-08', time: '10:00 - 11:00', class: 'Nursery', status: 'Completed', teacher: 'Kavitha Raman', description: 'Nursery rhymes competition for all nursery sections' },
  { id: 'ACT003', title: 'Sports Day Practice', type: 'Sports', date: '2024-06-12', time: '08:00 - 10:00', class: 'LKG & UKG', status: 'Planned', teacher: 'Meera Krishnan', description: 'Practice session for upcoming annual sports day' },
  { id: 'ACT004', title: 'Story Telling Session', type: 'Story', date: '2024-06-09', time: '11:00 - 12:00', class: 'All Classes', status: 'Completed', teacher: 'Sunita Verma', description: 'Interactive story telling with puppets and props' },
  { id: 'ACT005', title: 'Father\'s Day Craft', type: 'Craft', date: '2024-06-14', time: '09:00 - 10:30', class: 'All Classes', status: 'Planned', teacher: 'Rashmi Iyer', description: 'Handmade card and craft activity for Father\'s Day' },
  { id: 'ACT006', title: 'Nature Walk', type: 'Outdoor', date: '2024-06-11', time: '08:30 - 09:30', class: 'LKG', status: 'Planned', teacher: 'Priya Menon', description: 'Guided nature walk in school garden' },
];

const growthData = [
  { class: 'Nursery-A', creativity: 78, communication: 82, socialSkills: 75, confidence: 70, cognitive: 68, physical: 85 },
  { class: 'Nursery-B', creativity: 72, communication: 76, socialSkills: 80, confidence: 74, cognitive: 65, physical: 82 },
  { class: 'LKG-A', creativity: 80, communication: 85, socialSkills: 78, confidence: 76, cognitive: 74, physical: 88 },
  { class: 'LKG-B', creativity: 75, communication: 80, socialSkills: 82, confidence: 72, cognitive: 70, physical: 84 },
  { class: 'UKG-A', creativity: 85, communication: 88, socialSkills: 84, confidence: 82, cognitive: 80, physical: 90 },
  { class: 'UKG-B', creativity: 82, communication: 86, socialSkills: 80, confidence: 78, cognitive: 78, physical: 87 },
];

const studentGrowthRadar = [
  { subject: 'Creativity', A: 85, B: 72 },
  { subject: 'Communication', A: 90, B: 78 },
  { subject: 'Social Skills', A: 78, B: 82 },
  { subject: 'Confidence', A: 82, B: 70 },
  { subject: 'Cognitive', A: 76, B: 68 },
  { subject: 'Physical', A: 88, B: 80 },
];

const announcementsData = [
  { id: 'ANN001', title: 'Annual Day Celebration', type: 'Event', date: '2024-06-20', audience: 'All', priority: 'High', status: 'Published', content: 'Annual day celebration on June 20th. All parents invited.' },
  { id: 'ANN002', title: 'Fee Payment Reminder', type: 'Fee', date: '2024-06-05', audience: 'Parents', priority: 'Normal', status: 'Published', content: 'June month fee due by 5th. Late fee applicable after 10th.' },
  { id: 'ANN003', title: 'Summer Camp Registration', type: 'Academic', date: '2024-06-15', audience: 'All', priority: 'Normal', status: 'Draft', content: 'Summer camp registrations open. Limited seats available.' },
  { id: 'ANN004', title: 'Health Check-up Drive', type: 'Health', date: '2024-06-18', audience: 'All', priority: 'High', status: 'Published', content: 'Annual health check-up for all students. Pediatrician visit.' },
  { id: 'ANN005', title: 'Parent-Teacher Meeting', type: 'Academic', date: '2024-06-25', audience: 'Parents', priority: 'Urgent', status: 'Published', content: 'PTM scheduled for June 25th. Individual time slots will be shared.' },
];

// Helper components (must be defined before use)
const Globe = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);

const Brain = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>
);

const recentActivities = [
  { text: 'New admission: Ayaan Malhotra enrolled in Nursery-A', time: '2 min ago', icon: UserPlus, color: 'text-emerald-500' },
  { text: 'Fee payment received: ₹8,500 from Rajesh Sharma', time: '15 min ago', icon: IndianRupee, color: 'text-amber-500' },
  { text: 'Attendance marked for UKG-A (37/40 present)', time: '1 hr ago', icon: ClipboardCheck, color: 'text-blue-500' },
  { text: 'Activity completed: Rhyme Recitation', time: '2 hrs ago', icon: Palette, color: 'text-purple-500' },
  { text: 'Lead converted: Pooja Bhatt → Enrolled', time: '3 hrs ago', icon: Megaphone, color: 'text-orange-500' },
  { text: 'New inquiry from website: Vikram Malhotra', time: '4 hrs ago', icon: Globe, color: 'text-teal-500' },
  { text: 'Announcement published: Annual Day Celebration', time: '5 hrs ago', icon: Bell, color: 'text-rose-500' },
];

const communicationStats = [
  { channel: 'SMS', sent: 1250, delivered: 1180, failed: 70, icon: Phone },
  { channel: 'WhatsApp', sent: 2100, delivered: 2050, failed: 50, icon: MessageSquare },
  { channel: 'Push', sent: 1800, delivered: 1600, failed: 200, icon: Bell },
  { channel: 'Email', sent: 950, delivered: 920, failed: 30, icon: Mail },
];

const feeStructureData = [
  { program: 'PlayGroup', tuition: 6000, activity: 1500, transport: 3000, total: 10500 },
  { program: 'Nursery', tuition: 7500, activity: 2000, transport: 3000, total: 12500 },
  { program: 'LKG', tuition: 8500, activity: 2000, transport: 3000, total: 13500 },
  { program: 'UKG', tuition: 9500, activity: 2500, transport: 3000, total: 15000 },
];

const growthScoreDistribution = [
  { range: '0-20', count: 5 },
  { range: '21-40', count: 18 },
  { range: '41-60', count: 65 },
  { range: '61-80', count: 145 },
  { range: '81-100', count: 87 },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PreOneDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<typeof studentsData[0] | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('all');

  const todayAttendance = useMemo(() => {
    const total = attendanceData.reduce((s, c) => s + c.total, 0);
    const present = attendanceData.reduce((s, c) => s + c.present, 0);
    const absent = attendanceData.reduce((s, c) => s + c.absent, 0);
    const late = attendanceData.reduce((s, c) => s + c.late, 0);
    return { total, present, absent, late };
  }, []);

  const filteredStudents = useMemo(() => {
    return studentsData.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.parent.toLowerCase().includes(studentSearch.toLowerCase());
      const matchesFilter = studentFilter === 'all' || s.feeStatus.toLowerCase() === studentFilter || s.class.toLowerCase() === studentFilter;
      return matchesSearch && matchesFilter;
    });
  }, [studentSearch, studentFilter]);

  const filteredTeachers = useMemo(() => {
    return teachersData.filter(t =>
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.qualification.toLowerCase().includes(teacherSearch.toLowerCase())
    );
  }, [teacherSearch]);

  const stageLabels: Record<string, string> = {
    NewInquiry: 'New Inquiry', Visit: 'Visit Scheduled', Tour: 'School Tour',
    Demo: 'Demo Given', FollowUp: 'Follow-up', Confirmed: 'Confirmed', Enrolled: 'Enrolled',
  };

  // ============================================================
  // RENDER SECTIONS
  // ============================================================

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Students', value: '320', icon: GraduationCap, change: '+12', up: true, color: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-100' },
          { label: 'Total Teachers', value: '28', icon: Users, change: '+3', up: true, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
          { label: 'Monthly Revenue', value: '₹4,75,000', icon: IndianRupee, change: '+8.2%', up: true, color: 'bg-orange-50 text-orange-600', iconBg: 'bg-orange-100' },
          { label: 'Admissions', value: '45', icon: UserPlus, change: '+18', up: true, color: 'bg-rose-50 text-rose-600', iconBg: 'bg-rose-100' },
          { label: 'Occupancy', value: '87%', icon: Building2, change: '+5%', up: true, color: 'bg-teal-50 text-teal-600', iconBg: 'bg-teal-100' },
          { label: 'Satisfaction', value: '4.8/5', icon: Star, change: '+0.2', up: true, color: 'bg-yellow-50 text-yellow-600', iconBg: 'bg-yellow-100' },
        ].map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color.split(' ')[1]}`} />
                </div>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart + Admission Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue vs collections</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`} />
                <RTooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="collections" stroke="#10b981" fillOpacity={1} fill="url(#colorCollections)" strokeWidth={2} name="Collections" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admission Pipeline</CardTitle>
            <CardDescription>Current lead stages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {admissionPipeline.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                <span className="text-sm flex-1 truncate">{stage.stage}</span>
                <span className="text-sm font-semibold">{stage.count}</span>
                <div className="w-20 bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${(stage.count / 45) * 100}%`, backgroundColor: stage.color }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fee Overview + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Collection</CardTitle>
            <CardDescription>Current quarter overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={feeData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {feeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RTooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {feeData.map((item) => (
                <div key={item.name} className="text-center">
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                  <p className="text-sm font-semibold">₹{(item.value / 100000).toFixed(1)}L</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activities</CardTitle>
            <CardDescription>Latest updates from your preschool</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px]">
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${activity.color}`}>
                      <activity.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Add Student', icon: UserPlus, action: () => { setActiveSection('students'); setAddStudentOpen(true); } },
              { label: 'Mark Attendance', icon: ClipboardCheck, action: () => setActiveSection('attendance') },
              { label: 'Collect Fee', icon: IndianRupee, action: () => setActiveSection('fees') },
              { label: 'New Lead', icon: Megaphone, action: () => { setActiveSection('crm'); setAddLeadOpen(true); } },
              { label: 'Send Message', icon: Send, action: () => setActiveSection('communication') },
              { label: 'Add Activity', icon: Plus, action: () => { setActiveSection('activities'); setAddActivityOpen(true); } },
            ].map((item) => (
              <Button key={item.label} variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-200 transition-all" onClick={item.action}>
                <item.icon className="h-5 w-5 text-amber-600" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground text-sm">Manage all student records</p>
        </div>
        <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>Enter student details to enroll them</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input placeholder="First name" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input placeholder="Last name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent><SelectItem value="nursery-a">Nursery-A</SelectItem><SelectItem value="nursery-b">Nursery-B</SelectItem><SelectItem value="lkg-a">LKG-A</SelectItem><SelectItem value="lkg-b">LKG-B</SelectItem><SelectItem value="ukg-a">UKG-A</SelectItem><SelectItem value="ukg-b">UKG-B</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Input placeholder="e.g. A+" />
                </div>
              </div>
              <Separator />
              <p className="text-sm font-semibold">Parent/Guardian Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parent Name</Label>
                  <Input placeholder="Parent name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea placeholder="Full address" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setAddStudentOpen(false)}>Enroll Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or parent..." className="pl-9" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
        </div>
        <Select value={studentFilter} onValueChange={setStudentFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="nursery-a">Nursery-A</SelectItem>
            <SelectItem value="nursery-b">Nursery-B</SelectItem>
            <SelectItem value="lkg-a">LKG-A</SelectItem>
            <SelectItem value="lkg-b">LKG-B</SelectItem>
            <SelectItem value="ukg-a">UKG-A</SelectItem>
            <SelectItem value="ukg-b">UKG-B</SelectItem>
            <SelectItem value="paid">Fee: Paid</SelectItem>
            <SelectItem value="pending">Fee: Pending</SelectItem>
            <SelectItem value="overdue">Fee: Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Class</TableHead>
                <TableHead className="hidden lg:table-cell">Parent</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Fee Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="cursor-pointer" onClick={() => setSelectedStudent(student)}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{student.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{student.class}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="text-xs">{student.class}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{student.parent}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={student.attendance} className="w-16 h-2" />
                      <span className="text-xs font-medium">{student.attendance}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${student.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : student.feeStatus === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}`}>
                      {student.feeStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedStudent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-lg font-semibold">
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedStudent.name}</DialogTitle>
                    <DialogDescription>{selectedStudent.class} • {selectedStudent.id}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Gender</p><p className="text-sm font-medium">{selectedStudent.gender}</p></div>
                  <div><p className="text-xs text-muted-foreground">Date of Birth</p><p className="text-sm font-medium">{selectedStudent.dob}</p></div>
                  <div><p className="text-xs text-muted-foreground">Blood Group</p><p className="text-sm font-medium">{selectedStudent.bloodGroup}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p><Badge className={selectedStudent.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{selectedStudent.status}</Badge></div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Parent/Guardian</p>
                  <p className="text-sm font-medium">{selectedStudent.parent}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.phone}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedStudent.attendance} className="flex-1 h-2" />
                      <span className="text-sm font-semibold">{selectedStudent.attendance}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fee Status</p>
                    <Badge className={`mt-1 ${selectedStudent.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : selectedStudent.feeStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {selectedStudent.feeStatus}
                    </Badge>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm"><Edit className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                <Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5 mr-1" /> View Report</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderTeachers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Teachers</h2>
          <p className="text-muted-foreground text-sm">Manage teaching staff</p>
        </div>
        <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Enter teacher details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input placeholder="First name" /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Last name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Qualification</Label><Input placeholder="e.g. M.Ed" /></div>
                <div className="space-y-2"><Label>Specialization</Label><Input placeholder="e.g. Montessori" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Experience (Years)</Label><Input type="number" placeholder="0" /></div>
                <div className="space-y-2"><Label>Assign Class</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>
                    <SelectItem value="nursery-a">Nursery-A</SelectItem><SelectItem value="nursery-b">Nursery-B</SelectItem>
                    <SelectItem value="lkg-a">LKG-A</SelectItem><SelectItem value="lkg-b">LKG-B</SelectItem>
                    <SelectItem value="ukg-a">UKG-A</SelectItem><SelectItem value="ukg-b">UKG-B</SelectItem>
                  </SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91 XXXXX XXXXX" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@example.com" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddTeacherOpen(false)}>Cancel</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setAddTeacherOpen(false)}>Add Teacher</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search teachers..." className="pl-9 max-w-sm" value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => (
          <Card key={teacher.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                    {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{teacher.qualification}</p>
                </div>
                <Badge className={teacher.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
                  {teacher.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Class</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">{teacher.class}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="font-medium">{teacher.experience} yrs</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{teacher.rating}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <div className="flex items-center gap-2">
                    <Progress value={teacher.attendance} className="flex-1 h-1.5" />
                    <span className="text-xs font-medium">{teacher.attendance}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs"><Phone className="h-3 w-3 mr-1" /> Call</Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs"><Mail className="h-3 w-3 mr-1" /> Email</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Attendance</h2>
          <p className="text-muted-foreground text-sm">Track daily attendance records</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-[180px]" />
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="nursery-a">Nursery-A</SelectItem>
              <SelectItem value="nursery-b">Nursery-B</SelectItem>
              <SelectItem value="lkg-a">LKG-A</SelectItem>
              <SelectItem value="lkg-b">LKG-B</SelectItem>
              <SelectItem value="ukg-a">UKG-A</SelectItem>
              <SelectItem value="ukg-b">UKG-B</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: todayAttendance.total, icon: GraduationCap, color: 'bg-amber-100 text-amber-600' },
          { label: 'Present Today', value: todayAttendance.present, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Absent Today', value: todayAttendance.absent, icon: UserX, color: 'bg-rose-100 text-rose-600' },
          { label: 'Late Arrivals', value: todayAttendance.late, icon: Timer, color: 'bg-orange-100 text-orange-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color.split(' ')[0]}`}>
                <stat.icon className={`h-5 w-5 ${stat.color.split(' ')[1]}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Attendance Rate: {((todayAttendance.present / todayAttendance.total) * 100).toFixed(1)}%</CardTitle>
          <CardDescription>Class-wise attendance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="class" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip />
              <Bar dataKey="present" fill="#10b981" name="Present" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[4, 4, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Class-wise Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mark Attendance</CardTitle>
          <CardDescription>Click to toggle student attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsData.slice(0, 8).map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{student.class}</Badge></TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Present</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">08:15 AM</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"><Check className="h-3 w-3 mr-0.5" />P</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"><X className="h-3 w-3 mr-0.5" />A</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700"><Timer className="h-3 w-3 mr-0.5" />L</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderFees = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fee Management</h2>
          <p className="text-muted-foreground text-sm">Track collections, invoices, and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export</Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white"><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
        </div>
      </div>

      {/* Fee Collection Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-600">₹35,80,000</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><ArrowUpRight className="h-3 w-3" /> +12.5% from last quarter</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending Payments</p>
            <p className="text-2xl font-bold text-amber-600">₹8,90,000</p>
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1"><Clock className="h-3 w-3" /> 23 invoices pending</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Overdue Amount</p>
            <p className="text-2xl font-bold text-rose-600">₹2,80,000</p>
            <p className="text-xs text-rose-600 flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" /> 8 invoices overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Collection Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Fee Collection Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`} />
              <RTooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
              <Bar dataKey="collections" fill="#10b981" name="Collected" radius={[6, 6, 0, 0]} />
              <Bar dataKey="revenue" fill="#f59e0b" name="Expected" radius={[6, 6, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fee Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee Structure (Monthly)</CardTitle>
          <CardDescription>Academic Year 2024-2025</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Tuition</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead className="font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeStructureData.map((row) => (
                <TableRow key={row.program}>
                  <TableCell className="font-medium">{row.program}</TableCell>
                  <TableCell>₹{row.tuition.toLocaleString()}</TableCell>
                  <TableCell>₹{row.activity.toLocaleString()}</TableCell>
                  <TableCell>₹{row.transport.toLocaleString()}</TableCell>
                  <TableCell className="font-bold">₹{row.total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceData.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell className="text-sm font-medium">{inv.student}</TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{inv.type}</Badge></TableCell>
                  <TableCell className="text-sm">₹{inv.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.due}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : inv.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : inv.status === 'Overdue' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}`}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderCRM = () => {
    const crmStats = [
      { label: 'Total Leads', value: leadsData.length, icon: Megaphone, color: 'text-amber-600' },
      { label: 'Conversion Rate', value: '32%', icon: Target, color: 'text-emerald-600' },
      { label: 'Avg. Time to Enroll', value: '12 days', icon: Clock, color: 'text-orange-600' },
      { label: 'Hot Leads', value: leadsData.filter(l => l.priority === 'Hot').length, icon: Zap, color: 'text-rose-600' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Admission CRM</h2>
            <p className="text-muted-foreground text-sm">Manage leads and track admissions pipeline</p>
          </div>
          <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>Enter inquiry details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Parent Name</Label><Input placeholder="Parent name" /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91 XXXXX XXXXX" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Child Name</Label><Input placeholder="Child name" /></div>
                  <div className="space-y-2"><Label>Program Interest</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>
                      <SelectItem value="playgroup">PlayGroup</SelectItem><SelectItem value="nursery">Nursery</SelectItem>
                      <SelectItem value="lkg">LKG</SelectItem><SelectItem value="ukg">UKG</SelectItem>
                    </SelectContent></Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Source</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger><SelectContent>
                      <SelectItem value="walkin">Walk-in</SelectItem><SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem><SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="call">Call</SelectItem>
                    </SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Priority</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>
                      <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem><SelectItem value="hot">Hot</SelectItem>
                    </SelectContent></Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddLeadOpen(false)}>Cancel</Button>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setAddLeadOpen(false)}>Add Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* CRM Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {crmStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admission Pipeline</CardTitle>
            <CardDescription>Kanban-style pipeline view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
              {admissionPipeline.map((stage) => (
                <div key={stage.stage} className="min-w-[180px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs font-semibold uppercase tracking-wider">{stage.stage}</span>
                    <Badge variant="secondary" className="text-xs ml-auto">{stage.count}</Badge>
                  </div>
                  <div className="space-y-2">
                    {leadsData.filter(l => l.stage === stage.stage.replace(/\s/g, '') || (l.stage === 'NewInquiry' && stage.stage === 'New Inquiry') || (l.stage === 'FollowUp' && stage.stage === 'Follow-up')).slice(0, 3).map((lead) => (
                      <div key={lead.id} className="p-2.5 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted transition-colors cursor-pointer">
                        <p className="text-sm font-medium truncate">{lead.parentName}</p>
                        <p className="text-xs text-muted-foreground">{lead.childName}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Badge variant="outline" className="text-[10px] h-5 px-1">{lead.source}</Badge>
                          {lead.priority === 'Hot' && <Badge className="text-[10px] h-5 px-1 bg-rose-100 text-rose-700">🔥 Hot</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI CRM Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 mb-2"><Bot className="h-4 w-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700">Lead Scoring</span></div>
                <p className="text-sm">3 leads have &gt;80% conversion probability based on engagement patterns. Prioritize follow-ups with Swati Kapoor and Arun Swamy.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-emerald-500" /><span className="text-xs font-semibold text-emerald-700">Conversion Trend</span></div>
                <p className="text-sm">Website referrals convert 2.3x faster than social media leads. Consider increasing digital ad spend by 20% for better ROI.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-orange-500" /><span className="text-xs font-semibold text-orange-700">At-Risk Leads</span></div>
                <p className="text-sm">5 leads haven&apos;t been contacted in 7+ days. Immediate follow-up recommended to prevent pipeline stagnation.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Child</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="hidden lg:table-cell">Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsData.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div><p className="text-sm font-medium">{lead.parentName}</p><p className="text-xs text-muted-foreground">{lead.phone}</p></div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.childName}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{lead.source}</Badge></TableCell>
                    <TableCell>
                      <Badge className="text-xs" style={{ backgroundColor: admissionPipeline.find(s => s.stage === stageLabels[lead.stage])?.color + '20', color: admissionPipeline.find(s => s.stage === stageLabels[lead.stage])?.color }}>
                        {stageLabels[lead.stage]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${lead.priority === 'Hot' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : lead.priority === 'High' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : lead.priority === 'Medium' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'}`}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{lead.followUp || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Phone className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderActivities = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Activities</h2>
          <p className="text-muted-foreground text-sm">Plan and track school activities</p>
        </div>
        <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Activity</DialogTitle>
              <DialogDescription>Plan a new activity for students</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Activity Title</Label><Input placeholder="e.g. Color Day" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>
                    <SelectItem value="art">Art</SelectItem><SelectItem value="music">Music</SelectItem><SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="craft">Craft</SelectItem><SelectItem value="story">Story</SelectItem><SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Class</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>
                    <SelectItem value="all">All Classes</SelectItem><SelectItem value="nursery">Nursery</SelectItem>
                    <SelectItem value="lkg">LKG</SelectItem><SelectItem value="ukg">UKG</SelectItem>
                  </SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>Time</Label><Input placeholder="09:00 - 11:00" /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Activity description..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddActivityOpen(false)}>Cancel</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setAddActivityOpen(false)}>Create Activity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Planned', value: '8', icon: Calendar, color: 'text-amber-600' },
          { label: 'Completed', value: '24', icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'This Week', value: '5', icon: Activity, color: 'text-orange-600' },
          { label: 'Photos Shared', value: '156', icon: Image, color: 'text-rose-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activitiesData.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                  <Badge className={`text-xs ${activity.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}`}>
                    {activity.status}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
              </div>
              <h3 className="font-semibold mb-1">{activity.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{activity.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{activity.time}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px]">{activity.teacher.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{activity.teacher}</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">{activity.class}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photo Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photo Gallery</CardTitle>
          <CardDescription>Recent activity photos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/50 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-amber-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGrowth = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Growth & Development</h2>
        <p className="text-muted-foreground text-sm">Track student development and AI-powered insights</p>
      </div>

      {/* Class-wise Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Class-wise Growth Overview</CardTitle>
          <CardDescription>Average scores across development areas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growthData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="class" tick={{ fontSize: 11 }} width={80} />
              <RTooltip />
              <Legend />
              <Bar dataKey="creativity" fill="#f59e0b" name="Creativity" />
              <Bar dataKey="communication" fill="#10b981" name="Communication" />
              <Bar dataKey="socialSkills" fill="#f97316" name="Social" />
              <Bar dataKey="cognitive" fill="#fb7185" name="Cognitive" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Student Growth Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Growth Radar</CardTitle>
            <CardDescription>Aarav Sharma vs Class Average</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={studentGrowthRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Aarav" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Class Avg" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                <Legend />
                <RTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Growth Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Growth Score Distribution</CardTitle>
            <CardDescription>Overall student distribution by score range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthScoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RTooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            AI Growth Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-emerald-500" /><span className="text-xs font-semibold text-emerald-700">Positive Trend</span></div>
              <p className="text-sm">Nursery-A shows 15% improvement in communication skills this quarter. The rhyme recitation activities are showing measurable impact.</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700">Attention Needed</span></div>
              <p className="text-sm">8 students in UKG-B show below-average social skills. Recommend increased group activities and peer interaction exercises.</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2"><Brain className="h-4 w-4 text-blue-500" /><span className="text-xs font-semibold text-blue-700">Cognitive Milestone</span></div>
              <p className="text-sm">72% of LKG students have achieved age-appropriate cognitive milestones. 5 students may benefit from additional attention in problem-solving activities.</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-rose-100">
              <div className="flex items-center gap-2 mb-2"><Heart className="h-4 w-4 text-rose-500" /><span className="text-xs font-semibold text-rose-700">Emotional Wellness</span></div>
              <p className="text-sm">3 students show changes in morning mood patterns. Consider check-ins with parents to understand any home environment changes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Communication</h2>
          <p className="text-muted-foreground text-sm">Announcements, messages, and notifications</p>
        </div>
        <Dialog open={addAnnouncementOpen} onOpenChange={setAddAnnouncementOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>Send announcement to parents/teachers</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input placeholder="Announcement title" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent>
                    <SelectItem value="general">General</SelectItem><SelectItem value="event">Event</SelectItem><SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="health">Health</SelectItem><SelectItem value="academic">Academic</SelectItem>
                  </SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Audience</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Audience" /></SelectTrigger><SelectContent>
                    <SelectItem value="all">All</SelectItem><SelectItem value="parents">Parents</SelectItem><SelectItem value="teachers">Teachers</SelectItem>
                  </SelectContent></Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Content</Label><Textarea placeholder="Announcement content..." rows={4} /></div>
              <div className="space-y-2"><Label>Priority</Label>
                <Select><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>
                  <SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent></Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAnnouncementOpen(false)}>Cancel</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setAddAnnouncementOpen(false)}>
                <Send className="h-4 w-4 mr-2" /> Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {communicationStats.map((stat) => (
          <Card key={stat.channel}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{stat.channel}</span>
              </div>
              <p className="text-2xl font-bold">{stat.sent.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-emerald-600">{stat.delivered} delivered</span>
                <span className="text-xs text-rose-500">{stat.failed} failed</span>
              </div>
              <Progress value={(stat.delivered / stat.sent) * 100} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {announcementsData.map((ann) => (
            <div key={ann.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`p-2 rounded-lg shrink-0 ${ann.priority === 'Urgent' ? 'bg-rose-100' : ann.priority === 'High' ? 'bg-amber-100' : 'bg-muted'}`}>
                <Bell className={`h-4 w-4 ${ann.priority === 'Urgent' ? 'text-rose-600' : ann.priority === 'High' ? 'text-amber-600' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm">{ann.title}</p>
                  <Badge variant="outline" className="text-[10px]">{ann.type}</Badge>
                  {ann.priority === 'Urgent' && <Badge className="text-[10px] bg-rose-100 text-rose-700 hover:bg-rose-100">Urgent</Badge>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{ann.content}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>{ann.date}</span>
                  <span>•</span>
                  <span>{ann.audience}</span>
                  <Badge className={`text-[10px] ml-auto ${ann.status === 'Published' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>{ann.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Message Center */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message Center</CardTitle>
          <CardDescription>Recent conversations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: 'Rajesh Sharma', message: 'Thank you for the update about Aarav...', time: '10 min ago', unread: true },
            { name: 'Priya Patel', message: 'Can we schedule a meeting?', time: '1 hr ago', unread: true },
            { name: 'Amit Kumar', message: 'I will pay the pending fee tomorrow', time: '3 hrs ago', unread: false },
            { name: 'Sunita Singh', message: 'Diya loved the art activity!', time: '5 hrs ago', unread: false },
          ].map((msg, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">{msg.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{msg.name}</p>
                  {msg.unread && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{msg.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm">Manage school and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">School Profile</CardTitle>
            <CardDescription>Basic information about your school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>School Name</Label><Input defaultValue="PreOne Preschool" /></div>
              <div className="space-y-2"><Label>Tagline</Label><Input defaultValue="Where learning begins with joy" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+91 11 4567 8900" /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue="hello@preone.edu" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Textarea defaultValue="123, Learning Lane, Knowledge Park, New Delhi - 110001" /></div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-amber-500 text-white text-lg">SP</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">Sunil Prasad</p>
                <p className="text-sm text-muted-foreground">Owner / Admin</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="sunil@preone.edu" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue="+91 98765 43210" />
            </div>
            <Button variant="outline" className="w-full">Change Password</Button>
          </CardContent>
        </Card>
      </div>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select defaultValue="2024-2025">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select defaultValue="dd-mm-yyyy">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                  <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select defaultValue="inr">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inr">₹ Indian Rupee (INR)</SelectItem>
                  <SelectItem value="usd">$ US Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // RENDER MAIN LAYOUT
  // ============================================================
  const sectionRenderers: Record<Section, () => React.ReactNode> = {
    dashboard: renderDashboard,
    students: renderStudents,
    teachers: renderTeachers,
    attendance: renderAttendance,
    fees: renderFees,
    crm: renderCRM,
    activities: renderActivities,
    growth: renderGrowth,
    communication: renderCommunication,
    settings: renderSettings,
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'} bg-[oklch(0.22_0.03_50)] text-[oklch(0.92_0.01_80)] flex flex-col transition-all duration-300 shrink-0`}>
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <Baby className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight text-white">PreOne</h1>
                <p className="text-[10px] text-amber-300/70 -mt-0.5">Preschool OS</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-3">
            <nav className="space-y-1 px-2">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <Tooltip key={item.id} delayDuration={sidebarCollapsed ? 0 : 1000}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-300 font-medium shadow-sm'
                            : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                        }`}
                      >
                        <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        {isActive && !sidebarCollapsed && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Sidebar Toggle */}
          <div className="px-2 py-2 border-t border-white/10">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/8 hover:text-white/80 transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>

          {/* User Profile */}
          <div className="px-3 py-3 border-t border-white/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-amber-500 text-white text-xs font-semibold">SP</AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">Sunil Prasad</p>
                  <p className="text-xs text-white/40 truncate">Owner / Admin</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm font-medium capitalize">{activeSection === 'crm' ? 'Admission CRM' : activeSection}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search anything..." className="pl-9 w-[240px] h-9 text-sm" />
              </div>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">3</span>
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-6 max-w-[1400px]">
            {sectionRenderers[activeSection]?.()}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
