// backend/server.js
import express from 'express';
import mysql from 'mysql2';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'local_service_finder',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL database: local_service_finder');
});

const initializeDatabase = async () => {
    try {
        // Create users table
        await db.promise().execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('provider', 'customer') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_role (role)
            )
        `);

        // Create services table
        await db.promise().execute(`
            CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                provider_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                location VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_category (category),
                INDEX idx_provider (provider_id)
            )
        `);

        // Create bookings table
        await db.promise().execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                service_id INT NOT NULL,
                customer_id INT NOT NULL,
                provider_id INT NOT NULL,
                status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                scheduled_date DATETIME,
                customer_note TEXT,
                provider_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_status (status),
                INDEX idx_customer (customer_id),
                INDEX idx_provider (provider_id)
            )
        `);

        // Create notifications table
        await db.promise().execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('booking_update', 'new_service', 'system') DEFAULT 'booking_update',
                is_read BOOLEAN DEFAULT FALSE,
                related_booking_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (related_booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_is_read (is_read),
                INDEX idx_created_at (created_at)
            )
        `);

        console.log('✅ Database tables initialized successfully');
        
        // Check initial data
        const [users] = await db.promise().execute('SELECT COUNT(*) as count FROM users');
        console.log(`📊 Users table has ${users[0].count} users`);
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
};

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Local Service Finder Backend is working!' });
});

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
    console.log('Registration attempt:', req.body);
    
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ 
            success: false,
            message: 'All fields are required' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false,
            message: 'Password must be at least 6 characters long' 
        });
    }

    if (!['provider', 'customer'].includes(role)) {
        return res.status(400).json({ 
            success: false,
            message: 'Invalid role selected' 
        });
    }

    try {
        const [existingUsers] = await db.promise().execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists with this email' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.promise().execute(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role]
        );

        console.log('User registered successfully:', {
            id: result.insertId,
            email: email,
            role: role
        });

        res.status(201).json({ 
            success: true,
            message: 'User registered successfully',
            user: {
                id: result.insertId,
                email: email,
                role: role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error: ' + error.message 
        });
    }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
    console.log('Login attempt:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Email and password are required' 
        });
    }

    try {
        const [users] = await db.promise().execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        console.log('Users found:', users.length);

        if (users.length === 0) {
            console.log('No user found with email:', email);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        const user = users[0];
        console.log('User found:', { id: user.id, email: user.email, role: user.role });

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Generate simple token
        const token = Buffer.from(JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            timestamp: Date.now()
        })).toString('base64');

        console.log('Login successful, sending response with role:', user.role);

        res.json({ 
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error: ' + error.message 
        });
    }
});

// Service endpoints
app.post('/api/services', async (req, res) => {
    const { provider_id, title, description, category, price, location } = req.body;

    try {
        const [result] = await db.promise().execute(
            'INSERT INTO services (provider_id, title, description, category, price, location) VALUES (?, ?, ?, ?, ?, ?)',
            [provider_id, title, description, category, price, location]
        );

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            service: {
                id: result.insertId,
                provider_id,
                title,
                description,
                category,
                price,
                location
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create service: ' + error.message
        });
    }
});

app.get('/api/services', async (req, res) => {
    const { category, location } = req.query;
    
    try {
        let query = `
            SELECT s.*, u.email as provider_email 
            FROM services s 
            JOIN users u ON s.provider_id = u.id 
            WHERE 1=1
        `;
        const params = [];

        if (category && category !== 'All Categories') {
            query += ' AND s.category = ?';
            params.push(category);
        }

        if (location) {
            query += ' AND s.location LIKE ?';
            params.push(`%${location}%`);
        }

        query += ' ORDER BY s.created_at DESC';

        const [services] = await db.promise().execute(query, params);

        res.json({
            success: true,
            services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch services: ' + error.message
        });
    }
});

// Booking endpoints
app.post('/api/bookings', async (req, res) => {
    const { service_id, customer_id, scheduled_date, customer_note } = req.body;

    try {
        // Get provider_id from service
        const [services] = await db.promise().execute(
            'SELECT provider_id FROM services WHERE id = ?',
            [service_id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        const provider_id = services[0].provider_id;

        const [result] = await db.promise().execute(
            'INSERT INTO bookings (service_id, customer_id, provider_id, scheduled_date, customer_note) VALUES (?, ?, ?, ?, ?)',
            [service_id, customer_id, provider_id, scheduled_date, customer_note]
        );

        // Create notification for provider
        const [serviceDetails] = await db.promise().execute(
            'SELECT title FROM services WHERE id = ?',
            [service_id]
        );

        if (serviceDetails.length > 0) {
            const serviceTitle = serviceDetails[0].title;
            
            await db.promise().execute(
                'INSERT INTO notifications (user_id, title, message, type, related_booking_id) VALUES (?, ?, ?, ?, ?)',
                [
                    provider_id, 
                    'New Booking Request! 📅', 
                    `You have a new booking request for "${serviceTitle}"`, 
                    'booking_update', 
                    result.insertId
                ]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Booking request sent successfully',
            booking: {
                id: result.insertId,
                service_id,
                customer_id,
                provider_id,
                scheduled_date,
                customer_note
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create booking: ' + error.message
        });
    }
});

// Enhanced booking status update with notifications
app.put('/api/bookings/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, provider_note } = req.body;

    try {
        // Ensure provider_note is not undefined
        const noteValue = provider_note !== undefined ? provider_note : null;
        
        // Update booking status
        await db.promise().execute(
            'UPDATE bookings SET status = ?, provider_note = ? WHERE id = ?',
            [status, noteValue, id]
        );

        // Get booking details for notification
        const [bookings] = await db.promise().execute(`
            SELECT b.*, s.title as service_title, s.provider_id, u.email as provider_email,
                   c.id as customer_id, c.email as customer_email
            FROM bookings b
            JOIN services s ON b.service_id = s.id
            JOIN users u ON s.provider_id = u.id
            JOIN users c ON b.customer_id = c.id
            WHERE b.id = ?
        `, [id]);

        if (bookings.length > 0) {
            const booking = bookings[0];
            const customer_id = booking.customer_id;

            // Create notification for customer
            let notificationTitle = '';
            let notificationMessage = '';

            switch (status) {
                case 'accepted':
                    notificationTitle = 'Booking Accepted! 🎉';
                    notificationMessage = `Your booking for "${booking.service_title}" has been accepted by the service provider. They will contact you soon!`;
                    break;
                case 'rejected':
                    notificationTitle = 'Booking Declined';
                    notificationMessage = `Your booking for "${booking.service_title}" was declined by the service provider.`;
                    break;
                case 'completed':
                    notificationTitle = 'Service Completed ✅';
                    notificationMessage = `Your service "${booking.service_title}" has been marked as completed. Thank you for using our platform!`;
                    break;
                default:
                    notificationTitle = 'Booking Updated';
                    notificationMessage = `Your booking for "${booking.service_title}" has been updated.`;
            }

            if (notificationTitle && notificationMessage) {
                await db.promise().execute(
                    'INSERT INTO notifications (user_id, title, message, type, related_booking_id) VALUES (?, ?, ?, ?, ?)',
                    [customer_id, notificationTitle, notificationMessage, 'booking_update', id]
                );
            }
        }

        res.json({
            success: true,
            message: `Booking ${status} successfully`
        });
    } catch (error) {
        console.error('Booking update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking: ' + error.message
        });
    }
});

app.get('/api/bookings/provider/:provider_id', async (req, res) => {
    const { provider_id } = req.params;

    try {
        const [bookings] = await db.promise().execute(`
            SELECT b.*, s.title as service_title, u.email as customer_email 
            FROM bookings b
            JOIN services s ON b.service_id = s.id
            JOIN users u ON b.customer_id = u.id
            WHERE b.provider_id = ?
            ORDER BY b.created_at DESC
        `, [provider_id]);

        res.json({
            success: true,
            bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings: ' + error.message
        });
    }
});

app.get('/api/bookings/customer/:customer_id', async (req, res) => {
    const { customer_id } = req.params;

    try {
        const [bookings] = await db.promise().execute(`
            SELECT b.*, s.title as service_title, s.price, u.email as provider_email 
            FROM bookings b
            JOIN services s ON b.service_id = s.id
            JOIN users u ON b.provider_id = u.id
            WHERE b.customer_id = ?
            ORDER BY b.created_at DESC
        `, [customer_id]);

        res.json({
            success: true,
            bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings: ' + error.message
        });
    }
});

// Notification endpoints
app.get('/api/notifications/user/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const [notifications] = await db.promise().execute(`
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `, [user_id]);

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications: ' + error.message
        });
    }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    const { id } = req.params;

    try {
        await db.promise().execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update notification: ' + error.message
        });
    }
});

app.put('/api/notifications/user/:user_id/read-all', async (req, res) => {
    const { user_id } = req.params;

    try {
        await db.promise().execute(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [user_id]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update notifications: ' + error.message
        });
    }
});

app.delete('/api/notifications/user/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        await db.promise().execute(
            'DELETE FROM notifications WHERE user_id = ?',
            [user_id]
        );

        res.json({
            success: true,
            message: 'All notifications deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete notifications: ' + error.message
        });
    }
});

// Debug endpoints
app.get('/api/debug/user/:email', async (req, res) => {
    const { email } = req.params;
    
    try {
        const [users] = await db.promise().execute(
            'SELECT id, email, role, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                hasPassword: !!user.password
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user: ' + error.message
        });
    }
});

app.get('/api/debug/users', async (req, res) => {
    try {
        const [users] = await db.promise().execute(
            'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            users: users,
            count: users.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users: ' + error.message
        });
    }
});

app.get('/api/debug/notifications', async (req, res) => {
    try {
        const [notifications] = await db.promise().execute(`
            SELECT n.*, u.email as user_email 
            FROM notifications n 
            JOIN users u ON n.user_id = u.id 
            ORDER BY n.created_at DESC
        `);

        res.json({
            success: true,
            notifications: notifications,
            count: notifications.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications: ' + error.message
        });
    }
});

// Get all users endpoint (for testing)
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await db.promise().execute('SELECT id, email, role, created_at FROM users');
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});

// Database check endpoint
app.get('/api/db-check', async (req, res) => {
    try {
        const [result] = await db.promise().execute('SELECT DATABASE() as db_name');
        const [users] = await db.promise().execute('SELECT COUNT(*) as user_count FROM users');
        const [services] = await db.promise().execute('SELECT COUNT(*) as service_count FROM services');
        const [bookings] = await db.promise().execute('SELECT COUNT(*) as booking_count FROM bookings');
        const [notifications] = await db.promise().execute('SELECT COUNT(*) as notification_count FROM notifications');
        
        res.json({
            success: true,
            database: result[0].db_name,
            userCount: users[0].user_count,
            serviceCount: services[0].service_count,
            bookingCount: bookings[0].booking_count,
            notificationCount: notifications[0].notification_count,
            message: `Connected to database: ${result[0].db_name}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database check failed: ' + error.message
        });
    }
});

// Check users table structure
app.get('/api/table-structure', async (req, res) => {
    try {
        const [usersStructure] = await db.promise().execute('DESCRIBE users');
        const [servicesStructure] = await db.promise().execute('DESCRIBE services');
        const [bookingsStructure] = await db.promise().execute('DESCRIBE bookings');
        const [notificationsStructure] = await db.promise().execute('DESCRIBE notifications');
        
        res.json({
            success: true,
            tables: {
                users: usersStructure,
                services: servicesStructure,
                bookings: bookingsStructure,
                notifications: notificationsStructure
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get table structure: ' + error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is healthy and running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 3001;

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log(`📊 Available endpoints:`);
        console.log(`   http://localhost:${PORT}/api/test`);
        console.log(`   http://localhost:${PORT}/api/health`);
        console.log(`   http://localhost:${PORT}/api/db-check`);
        console.log(`   http://localhost:${PORT}/api/auth/register`);
        console.log(`   http://localhost:${PORT}/api/auth/login`);
        console.log(`   http://localhost:${PORT}/api/services`);
        console.log(`   http://localhost:${PORT}/api/bookings`);
        console.log(`   http://localhost:${PORT}/api/notifications`);
        console.log(`\n🔔 Notification System: Active`);
        console.log(`📱 Real-time updates for booking status changes`);
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server gracefully...');
    db.end();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Server terminated');
    db.end();
    process.exit(0);
});

// Add these endpoints to your server.js

// Get services by provider
app.get('/api/services/provider/:provider_id', async (req, res) => {
    const { provider_id } = req.params;

    try {
        const [services] = await db.promise().execute(`
            SELECT * FROM services 
            WHERE provider_id = ? 
            ORDER BY created_at DESC
        `, [provider_id]);

        res.json({
            success: true,
            services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch provider services: ' + error.message
        });
    }
});

// Delete service (only by owner)
app.delete('/api/services/:id', async (req, res) => {
    const { id } = req.params;
    const { provider_id } = req.body; // Provider ID should be sent from frontend

    try {
        // First check if the service belongs to the provider
        const [services] = await db.promise().execute(
            'SELECT * FROM services WHERE id = ? AND provider_id = ?',
            [id, provider_id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found or you are not the owner'
            });
        }

        // Check if there are any active bookings for this service
        const [activeBookings] = await db.promise().execute(
            'SELECT id FROM bookings WHERE service_id = ? AND status IN ("pending", "accepted")',
            [id]
        );

        if (activeBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete service with active bookings. Please cancel all bookings first.'
            });
        }

        // Delete the service
        await db.promise().execute(
            'DELETE FROM services WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete service: ' + error.message
        });
    }
});

// Update service
app.put('/api/services/:id', async (req, res) => {
    const { id } = req.params;
    const { provider_id, title, description, category, price, location } = req.body;

    try {
        // Check if the service belongs to the provider
        const [services] = await db.promise().execute(
            'SELECT * FROM services WHERE id = ? AND provider_id = ?',
            [id, provider_id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found or you are not the owner'
            });
        }

        // Update the service
        await db.promise().execute(
            'UPDATE services SET title = ?, description = ?, category = ?, price = ?, location = ? WHERE id = ?',
            [title, description, category, price, location, id]
        );

        res.json({
            success: true,
            message: 'Service updated successfully'
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update service: ' + error.message
        });
    }
});

