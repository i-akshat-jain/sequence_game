'use client';

import dynamic from 'next/dynamic';

// Dynamically import the entire client app to force client-side rendering
const ClientApp = dynamic(() => import('../components/ClientApp'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto mb-6"></div>
        <p className="text-secondary text-lg font-medium">Loading game...</p>
      </div>
    </div>
  )
});

export default function Home() {
  return <ClientApp />;
}