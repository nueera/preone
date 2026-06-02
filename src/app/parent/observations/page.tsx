'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Observations() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Observations</h1>
      <Card className="rounded-3xl">
        <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
          <Eye className="h-12 w-12 text-sky-400" />
          <p className="text-muted-foreground">Coming Soon</p>
          <p className="text-xs text-muted-foreground">This module is under development</p>
        </CardContent>
      </Card>
    </div>
  );
}
