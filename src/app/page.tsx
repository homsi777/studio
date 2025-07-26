
import { AuthGuard } from '@/components/auth-guard';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

function DashboardPage() {
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
