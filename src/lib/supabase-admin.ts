import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export const ensureDefaultUsersExist = async () => {
    try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) throw listError;

        const defaultUsers = [
            { email: 'admin@alalamiya.com', password: '12345678', user_metadata: { role: 'manager' } },
            { email: 'superadmin@alalamiya.com', password: '12345678', user_metadata: { role: 'manager' } },
        ];

        for (const defaultUser of defaultUsers) {
            const userExists = users.some(u => u.email === defaultUser.email);
            if (!userExists) {
                console.log(`User ${defaultUser.email} not found, creating...`);
                const { data, error } = await supabaseAdmin.auth.admin.createUser(defaultUser);
                if (error) {
                    console.error(`Error creating user ${defaultUser.email}:`, error);
                } else {
                    console.log(`User ${data.user.email} created successfully`);
                }
            }
        }
    } catch (error) {
        console.error("Error in ensureDefaultUsersExist:", error);
    }
};
