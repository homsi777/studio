import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const ensureDefaultUsersExist = async () => {
    try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) throw listError;

        if (users.length === 0) {
            console.log("No users found, creating default users...");
            const defaultUsers = [
                { email: 'admin@alalamiya.com', password: '12345678', user_metadata: { role: 'manager' } },
                { email: 'superadmin@alalamiya.com', password: '12345678', user_metadata: { role: 'manager' } },
            ];

            for (const user of defaultUsers) {
                const { data, error } = await supabaseAdmin.auth.admin.createUser(user);
                if (error) {
                    console.error(`Error creating user ${user.email}:`, error);
                } else {
                    console.log(`User ${data.user.email} created successfully`);
                }
            }
        } else {
             console.log("Default users already exist.");
        }
    } catch (error) {
        console.error("Error in ensureDefaultUsersExist:", error);
    }
};
