import React from 'react';

export const ChildIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <circle cx="12" cy="7" r="3" fill="currentColor" />
    <rect x="10" y="11" width="4" height="8" rx="2" fill="currentColor" />
  </svg>
);
