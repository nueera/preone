import { redirect } from 'next/navigation';

/**
 * /admin/crm → redirect to /admin/admissions
 * The CRM module lives under /admin/admissions to avoid duplication.
 */
export default function CrmRedirectPage() {
  redirect('/admin/admissions');
}
