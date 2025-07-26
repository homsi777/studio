
import { AuthGuard } from '@/components/auth-guard';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Order, Table } from '@/types';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

async function getInitialDashboardData() {
  try {
    const tablesPromise = supabaseAdmin.from('tables').select('*').order('id');
    const ordersPromise = supabaseAdmin.from('orders').select('*').in('status', ['pending_chef_approval', 'pending_cashier_approval', 'awaiting_final_confirmation', 'confirmed', 'ready', 'paying', 'needs_attention']);
    
    const [tablesRes, ordersRes] = await Promise.all([tablesPromise, ordersPromise]);

    if (tablesRes.error) throw tablesRes.error;
    if (ordersRes.error) throw ordersRes.error;

    return {
      initialTables: tablesRes.data,
      initialOrders: ordersRes.data
    };
  } catch (error) {
    console.error("Error fetching initial dashboard data:", error);
    return {
      initialTables: [],
      initialOrders: []
    }
  }
}


async function DashboardPage() {
  const { initialTables, initialOrders } = await getInitialDashboardData();

  return (
    <main className="flex-1 p-4 sm:p-6">
       <DashboardClient initialDbTables={initialTables as Table[]} initialOrders={initialOrders as any[]} />
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
