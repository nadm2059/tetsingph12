import dotenv from 'dotenv';
dotenv.config(); // Loads .env file safely and explicitly

import express from 'express';
import cors from 'cors';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import multer from 'multer';

import { MarketplaceService } from './marketplace/marketplaceService.js';
import { RewardsEngine } from './gamification/rewardsEngine.js';
import { EventsAndClubsService } from './events/eventsService.js';
import { sendRsvpConfirmation } from './utils/emailService.js';

// Define __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env values without depending on the dotenv package.
try {
  const envFile = readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;

    let value = (match[2] || '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    process.env[match[1]] = value;
  }
} catch {
  // .env is optional; the runtime may provide environment variables directly.
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configure multer to store uploaded files in memory buffers for immediate base64 conversion
const upload = multer({ storage: multer.memoryStorage() });

// Serve static frontend assets if built
app.use(express.static(path.join(__dirname, '../dist')));

// Configure PostgreSQL / NeonDB connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Asynchronous function to auto-initialize database tables on server startup
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
          id SERIAL PRIMARY KEY,
          seller_email VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image_data TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS marketplace_chats (
          id SERIAL PRIMARY KEY,
          listing_id INT NOT NULL,
          buyer_email VARCHAR(255) NOT NULL,
          seller_email VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS marketplace_messages (
          id SERIAL PRIMARY KEY,
          chat_id INT REFERENCES marketplace_chats(id) ON DELETE CASCADE,
          sender_email VARCHAR(255) NOT NULL,
          message_text TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ NeonDB Marketplace tables (listings, chats, messages) verified successfully!');
  } catch (err) {
    console.error('⚠️ Database table init warning:', err);
  }
}

initializeDatabase();

const marketplace = new MarketplaceService();
const rewards = new RewardsEngine();
const eventsAndClubs = new EventsAndClubsService();

// Helper to extract user email
function getUserEmailFromReq(req: any): string {
  return req.headers['x-user-email'] || 'nadhirah.michael-ho01@student.csulb.edu';
}

// Debug Environment variables on startup
console.log('--- Environment Check ---');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? `Loaded (${process.env.EMAIL_USER})` : 'MISSING ❌');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `Loaded (Length: ${process.env.EMAIL_PASS.length})` : 'MISSING ❌');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded (NeonDB Connected) ✅' : 'MISSING ❌');
console.log('-------------------------');

// Root status endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CSULB Campus Resource Finder - Phase 2 API',
    status: 'Running',
    endpoints: [
      '/api/marketplace',
      '/api/v1/marketplace/listings',
      '/api/v1/marketplace/chats',
      '/api/rewards/:userId',
      '/api/events',
      '/api/clubs',
      '/api/events/:id/rsvp'
    ]
  });
});

// Marketplace API (In-Memory / Legacy Support)
app.get('/api/marketplace', (req, res) => {
  const category = req.query.category as string;
  res.json(marketplace.getPosts(category));
});

app.post('/api/marketplace', (req, res) => {
  const newPost = marketplace.createPost(req.body);
  rewards.awardPoints(req.body.sellerId || 'current_user', 20, 'Posted marketplace item');
  res.status(201).json(newPost);
});

// ----------------------------------------------------
// POSTGRESQL / NEONDB MARKETPLACE LISTINGS WITH PHOTO UPLOAD
// ----------------------------------------------------

// Shared handler for fetching listings
const handleGetListings = async (req: any, res: any) => {
  try {
    const result = await pool.query(`
      SELECT * FROM marketplace_listings 
      ORDER BY created_at DESC;
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Fetch Listings Error:', err);
    res.status(500).json({ error: 'Failed to retrieve marketplace listings.' });
  }
};

// Shared handler for creating listings with photos
const handleCreateListing = async (req: any, res: any) => {
  try {
    const userEmail = getUserEmailFromReq(req);
    const { title, description, price } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required.' });
    }

    let imageUri = null;
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';
      imageUri = `data:${mimeType};base64,${b64}`;
    }

    const result = await pool.query(`
      INSERT INTO marketplace_listings (seller_email, title, description, price, image_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [userEmail, title, description, price, imageUri]);

    // Award gamification points for listing an item
    rewards.awardPoints(userEmail, 20, 'Posted marketplace item with photo');

    res.status(201).json({ 
      success: true, 
      message: 'Listing created successfully with photo!', 
      listing: result.rows[0] 
    });
  } catch (err: any) {
    console.error('Create Listing Error:', err);
    res.status(500).json({ error: 'Failed to create marketplace listing.' });
  }
};

// Register routes with both /api/v1/... and /api/... prefixes to avoid 404 mismatches
app.get('/api/v1/marketplace/listings', handleGetListings);
app.get('/api/marketplace/listings', handleGetListings);

app.post('/api/v1/marketplace/listings', upload.single('image'), handleCreateListing);
app.post('/api/marketplace/listings', upload.single('image'), handleCreateListing);

// ----------------------------------------------------
// MARKETPLACE CHAT & MESSAGING ENDPOINTS
// ----------------------------------------------------

// 1. Start or Get Chat for a Listing
app.post('/api/v1/marketplace/chats', async (req: any, res: any) => {
  try {
    const buyerEmail = getUserEmailFromReq(req);
    const { listingId, sellerEmail } = req.body;

    let chatResult = await pool.query(`
      SELECT * FROM marketplace_chats 
      WHERE listing_id = $1 AND buyer_email = $2
    `, [listingId, buyerEmail]);

    let chat;
    if (chatResult.rows.length === 0) {
      const newChat = await pool.query(`
        INSERT INTO marketplace_chats (listing_id, buyer_email, seller_email)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [listingId, buyerEmail, sellerEmail]);
      chat = newChat.rows[0];
    } else {
      chat = chatResult.rows[0];
    }

    return res.json({ success: true, chat });
  } catch (err) {
    console.error('Chat Init Error:', err);
    return res.status(500).json({ error: 'Failed to initialize chat.' });
  }
});

// 2. Get Messages for a Chat
app.get('/api/v1/marketplace/chats/:chatId/messages', async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const messages = await pool.query(`
      SELECT * FROM marketplace_messages 
      WHERE chat_id = $1 
      ORDER BY sent_at ASC;
    `, [chatId]);

    return res.json(messages.rows);
  } catch (err) {
    console.error('Fetch Messages Error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// 3. Send Message in Chat
app.post('/api/v1/marketplace/chats/:chatId/messages', async (req: any, res: any) => {
  try {
    const senderEmail = getUserEmailFromReq(req);
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Message text is required.' });

    const chatCheck = await pool.query(`
      SELECT * FROM marketplace_chats WHERE id = $1;
    `, [chatId]);

    if (chatCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const msgResult = await pool.query(`
      INSERT INTO marketplace_messages (chat_id, sender_email, message_text)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [chatId, senderEmail, text]);

    return res.status(201).json({ success: true, message: msgResult.rows[0] });
  } catch (err) {
    console.error('Send Message Error:', err);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Rewards API
app.get('/api/rewards/:userId', (req, res) => {
  res.json(rewards.getProfile(req.params.userId));
});

// Events & Clubs API
app.get('/api/events', (req, res) => res.json(eventsAndClubs.getEvents()));
app.get('/api/clubs', (req, res) => res.json(eventsAndClubs.getClubs()));

app.post('/api/events/:id/rsvp', async (req, res) => {
  const eventId = req.params.id;
  const { userId, eventTitle, eventDate } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User email is required for RSVP.' });
  }

  const success = eventsAndClubs.rsvpEvent(eventId, userId);

  if (success) {
    rewards.awardPoints(userId, 10, 'RSVP to campus event');
    
    let emailStatus = 'Not Sent (SMTP Not Configured)';

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendRsvpConfirmation(userId, eventTitle || 'Campus Event', eventDate || 'TBD');
        emailStatus = 'Sent Successfully';
        console.log(`Confirmation email successfully sent to: ${userId}`);
      } else {
        console.warn('Skipping email: EMAIL_USER or EMAIL_PASS is missing in environment variables.');
      }
    } catch (e: any) {
      console.error('Email sending failed with error:', e.message || e);
      emailStatus = `Failed to Send: ${e.message || 'Unknown error'}`;
    }

    return res.json({ 
      message: 'RSVP Successful', 
      pointsAwarded: 10,
      emailStatus 
    });
  } else {
    return res.status(400).json({ error: 'Already RSVPed or invalid event' });
  }
});

app.listen(PORT, () => {
  console.log(`Phase 2 Community & Gamification running on http://localhost:${PORT}`);
});