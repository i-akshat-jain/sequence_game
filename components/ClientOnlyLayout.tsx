'use client';

import { useHydration } from '../hooks/useHydration';

interface ClientOnlyLayoutProps {
  children: React.ReactNode;
}

export default function ClientOnlyLayout({ children }: ClientOnlyLayoutProps) {
  const { isHydrated, isStable, hasExtensions } = useHydration();

  // During SSR and initial hydration, render a minimal version
  if (!isHydrated || !isStable) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {hasExtensions ? 'Loading game (detected browser extensions)...' : 'Loading game...'}
          </p>
        </div>
      </div>
    );
  }

  // After hydration is complete and DOM is stable, render the full app
  return <>{children}</>;
}
