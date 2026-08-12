import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'local_service_finder'
});

async function createTestServices() {
    try {
        await db.promise().connect();
        console.log('✅ Connected to database');

        // Find the provider user
        const providerEmail = 'provider@test.com';
        const [providers] = await db.promise().execute(
            'SELECT id FROM users WHERE email = ?',
            [providerEmail]
        );

        if (providers.length === 0) {
            console.error('❌ Provider user not found. Please run create-test-users.js first.');
            return;
        }

        const providerId = providers[0].id;

        const sampleServices = [
            {
                title: 'Professional Plumbing Services',
                description: 'Expert plumbing repairs, pipe installations, and leak fixing.',
                category: 'Plumbing',
                price: 75.00,
                location: 'New York City, NY'
            },
            {
                title: 'Home Cleaning Service',
                description: 'Thorough deep cleaning of your home or apartment.',
                category: 'Cleaning',
                price: 120.00,
                location: 'Brooklyn, NY'
            },
            {
                title: 'Electrical Repairs',
                description: 'Fixing electrical issues, wiring, and installing fixtures safely.',
                category: 'Electrical',
                price: 90.00,
                location: 'Queens, NY'
            }
        ];

        for (const service of sampleServices) {
            await db.promise().execute(
                'INSERT INTO services (provider_id, title, description, category, price, location) VALUES (?, ?, ?, ?, ?, ?)',
                [providerId, service.title, service.description, service.category, service.price, service.location]
            );
        }

        console.log(`✅ Successfully added ${sampleServices.length} test services!`);

    } catch (error) {
        console.error('❌ Error creating test services:', error);
    } finally {
        db.end();
    }
}

createTestServices();
