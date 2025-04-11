'use client';
import React from 'react';
import PageHead from '@/components/shared/page-head.jsx';
import GolfSection from './components/GolfSection';

export default function DashboardPage() {
  return (
    <>
      <PageHead title="Golf Swing Identifier | App" />
      <div className="max-h-screen flex-1 space-y-4 overflow-y-auto p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Golf Swing Identifier
          </h2>
        </div>

        {/* Golf Swing Identifier Component */}
        <GolfSection />
      </div>
    </>
  );
}
