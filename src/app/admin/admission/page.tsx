import { redirect } from 'next/navigation';

/**
 * /admin/admission → redirect to /admin/admissions
 * The admission module lives at /admin/admissions (plural).
 */
export default function AdmissionRedirectPage() {
  redirect('/admin/admissions');
}
