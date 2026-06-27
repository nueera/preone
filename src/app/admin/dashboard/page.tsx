import { redirect } from 'next/navigation';

// Redirect /admin/dashboard → /admin
// The dashboard is now at /admin (the module grid). Old routes
// and bookmarks pointing to /admin/dashboard are redirected.
export default function AdminDashboardRedirect() {
  redirect('/admin');
}
