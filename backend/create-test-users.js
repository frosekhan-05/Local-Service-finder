// backend/create-test-users.js
import mysql from 'mysql2';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'local_service_finder'
});

async function createTestUsers() {
    try {
        await db.promise().connect();
        console.log('✅ Connected to database');

        // Test customer user
        const customerEmail = 'customer@test.com';
        const customerPassword = await bcrypt.hash('password', 10);
        
        // Test provider user
        const providerEmail = 'provider@test.com';
        const providerPassword = await bcrypt.hash('password', 10);

        // Check if users already exist
        const [existingCustomers] = await db.promise().execute(
            'SELECT id FROM users WHERE email = ?',
            [customerEmail]
        );

        if (existingCustomers.length === 0) {
            await db.promise().execute(
                'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
                [customerEmail, customerPassword, 'customer']
            );
            console.log('✅ Test customer user created');
        } else {
            console.log('ℹ️ Test customer user already exists');
        }

        const [existingProviders] = await db.promise().execute(
            'SELECT id FROM users WHERE email = ?',
            [providerEmail]
        );

        if (existingProviders.length === 0) {
            await db.promise().execute(
                'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
                [providerEmail, providerPassword, 'provider']
            );
            console.log('✅ Test provider user created');
        } else {
            console.log('ℹ️ Test provider user already exists');
        }

        // Display all users
        const [users] = await db.promise().execute(
            'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        
        console.log('\n📊 All Users in Database:');
        console.table(users);

    } catch (error) {
        console.error('❌ Error creating test users:', error);
    } finally {
        db.end();
    }
}

createTestUsers();