// backend/test-db.js
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'local_service_finder'
});

db.connect(async (err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL database');

    try {
        // Check users table
        const [users] = await db.promise().execute('SELECT * FROM users');
        console.log('\n📊 USERS TABLE:');
        console.table(users.map(user => ({
            id: user.id,
            email: user.email,
            role: user.role,
            created: user.created_at
        })));

        // Check services table
        const [services] = await db.promise().execute('SELECT * FROM services');
        console.log('\n🛠️ SERVICES TABLE:');
        console.table(services.map(service => ({
            id: service.id,
            title: service.title,
            provider_id: service.provider_id,
            category: service.category,
            price: service.price
        })));

        // Check bookings table
        const [bookings] = await db.promise().execute('SELECT * FROM bookings');
        console.log('\n📅 BOOKINGS TABLE:');
        console.table(bookings.map(booking => ({
            id: booking.id,
            service_id: booking.service_id,
            customer_id: booking.customer_id,
            status: booking.status
        })));

    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        db.end();
    }
});