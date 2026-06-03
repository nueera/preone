'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * CRM Leads page — Redirects to main CRM page with leads list view.
 * The main CRM page at /admin/crm already has the full leads list.
 * This page serves as a standalone route for the sidebar navigation.
 */
export default function CrmLeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/crm">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to CRM
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-portal-50 flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-portal-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Leads Management</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          The full leads management experience with list view, filters, and pipeline is available on the main CRM page.
        </p>
        <Link href="/admin/crm">
          <Button className="mt-4 gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
            Open Full CRM
          </Button>
        </Link>
      </div>
    </div>
  );
}
