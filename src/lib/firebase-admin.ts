// This is a new file for server-side Firebase logic only.
'use server';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // We can still use the client-initialized db for admin tasks on the server
import type { User } from '@/types';
import bcrypt from 'bcryptjs';

// This function is now designed to be robust and run only on the server when needed.
export const ensureDefaultUsersExist = async () => {
    try {
        const usersCol = collection(db, 'users');
        const initialCheck = await getDocs(usersCol);
        
        // If the collection is not empty, it means users (or at least default ones) already exist.
        if (!initialCheck.empty) {
            return;
        }

        console.log('No users found. Creating default users.');
        
        const batch = writeBatch(db);

        // 1. Create Temporary Trial Admin
        const trialSalt = await bcrypt.genSalt(10);
        const trialHashedPassword = await bcrypt.hash('123456', trialSalt);
        const trialAdmin: Omit<User, 'id'> = {
            username: 'admin',
            password: trialHashedPassword,
            role: 'manager',
        };
        const trialAdminRef = doc(collection(db, 'users'));
        batch.set(trialAdminRef, trialAdmin);

        // 2. Create Permanent Super Admin
        const superAdminSalt = await bcrypt.genSalt(10);
        const superAdminHashedPassword = await bcrypt.hash('700210ww', superAdminSalt);
        const superAdmin: Omit<User, 'id'> = {
            username: 'superadmin',
            password: superAdminHashedPassword,
            role: 'manager',
        };
        const superAdminRef = doc(collection(db, 'users'));
        batch.set(superAdminRef, superAdmin);

        await batch.commit();
        console.log('Default admin and superadmin users created successfully.');

    } catch (error) {
        console.error('Failed to ensure default users exist:', error);
        // We re-throw the error so the calling function (e.g., login API) can handle it.
        // This prevents the application from continuing in a broken state.
        throw new Error('Could not initialize default user accounts.');
    }
};
