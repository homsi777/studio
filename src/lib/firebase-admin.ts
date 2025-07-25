'use server';
// IMPORTANT: Use Firebase Admin SDK for server-side operations
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import type { User } from '@/types';
import bcrypt from 'bcryptjs';
// Correctly import the service account key JSON file using `import`.
import serviceAccount from './serviceAccountKey.json';

// Initialize Firebase Admin SDK - This is the single source of truth for admin init.
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
        console.log('Firebase Admin SDK initialized successfully with service account.');
    } catch (error: any) {
        console.error('Firebase Admin SDK initialization error:', error.stack);
        // Throw a specific error to make debugging easier.
        throw new Error('Failed to initialize Firebase Admin SDK. Check your service account credentials.');
    }
}

export const adminDb = getFirestore();

export const ensureDefaultUsersExist = async () => {
    try {
        const usersCol = adminDb.collection('users');
        const initialCheck = await usersCol.limit(1).get();

        if (!initialCheck.empty) {
            // console.log('Users collection is not empty. Skipping default user creation.');
            return;
        }

        console.log('No users found. Creating default users.');

        const batch = adminDb.batch();

        // 1. Create Temporary Trial Admin
        const trialSalt = await bcrypt.genSalt(10);
        const trialHashedPassword = await bcrypt.hash('123456', trialSalt);
        const trialAdmin: Omit<User, 'id'> = {
            username: 'admin',
            password: trialHashedPassword,
            role: 'manager',
        };
        const trialAdminRef = usersCol.doc();
        batch.set(trialAdminRef, trialAdmin);

        // 2. Create Permanent Super Admin
        const superAdminSalt = await bcrypt.genSalt(10);
        const superAdminHashedPassword = await bcrypt.hash('700210ww', superAdminSalt);
        const superAdmin: Omit<User, 'id'> = {
            username: 'superadmin',
            password: superAdminHashedPassword,
            role: 'manager',
        };
        const superAdminRef = usersCol.doc();
        batch.set(superAdminRef, superAdmin);
        
        // 3. Create New Manager User
        const managerSalt = await bcrypt.genSalt(10);
        const managerHashedPassword = await bcrypt.hash('manager', managerSalt);
        const newManager: Omit<User, 'id'> = {
            username: 'manager',
            password: managerHashedPassword,
            role: 'manager',
        };
        const newManagerRef = usersCol.doc();
        batch.set(newManagerRef, newManager);


        await batch.commit();
        console.log('Default admin, superadmin, and manager users created successfully.');

    } catch (error) {
        console.error('Failed to ensure default users exist:', error);
        // Throwing an error here can help diagnose issues if user creation fails.
        throw new Error('Could not initialize default user accounts.');
    }
};
