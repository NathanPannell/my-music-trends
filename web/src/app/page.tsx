'use client';

import { Suspense } from 'react';
import { Hero } from '@/components/Hero';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <Hero />
    </Suspense>
  );
}
