'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-brand-navy px-8 py-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Miva Maintenance API</h1>
          <p className="text-white/60 text-sm mt-1">
            RESTful API Documentation — MIT 8333 Project Reference
          </p>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="max-w-7xl mx-auto py-6 px-4">
        <SwaggerUI url="/api/docs/spec" docExpansion="list" />
      </div>
    </div>
  );
}
