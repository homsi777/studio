
import { AuthGuard } from '@/components/auth-guard';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

function DashboardPage() {
  // The DashboardClient will now be responsible for fetching and managing all data on the client-side.
  // This ensures that we have a single source of truth from the useOrderFlow hook,
  // which handles real-time updates, preventing any state inconsistencies.
  return (
    <main className="flex-1 p-4 sm:p-6">
       <DashboardClient />
    </main>
  );
}

export default function GuardedDashboardPage() {
    return (
        <AuthGuard>
            <DashboardPage />
        </AuthGuard>
    )
}
