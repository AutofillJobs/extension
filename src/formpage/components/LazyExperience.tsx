import React, { Suspense } from 'react';

// Lazy load the Experience component
const Experience = React.lazy(() => import('../components/Experience'));

const LazyExperience = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading Experience...</div>
      </div>
    }>
      <Experience />
    </Suspense>
  );
};

export default LazyExperience; 