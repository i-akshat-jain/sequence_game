'use client';

import { useEffect, useState, ReactNode } from 'react';

interface HydrationBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function HydrationBoundary({ 
  children, 
  fallback = (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    // Wait for the next tick to ensure all extensions have finished modifying the DOM
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // During SSR and before hydration, show fallback
  if (!isHydrated) {
    return <>{fallback}</>;
  }

  // After hydration, render children
  return <>{children}</>;
}

