import React from 'react';

export default function CustomerMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout adds a data attribute to the body, so we can hide the sidebar
  // on customer-facing pages. See the root layout for how it's used.
  return <div data-customer-menu>{children}</div>;
}
