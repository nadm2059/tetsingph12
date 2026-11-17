import request from 'supertest';
import express from 'express';
import { MarketplaceService } from '../src/marketplace/marketplaceService';
import { RewardsEngine } from '../src/gamification/rewardsEngine';
import { EventsAndClubsService } from '../src/events/eventsService';

// Initialize a dedicated test Express application mirroring main server routes
const app = express();
app.use(express.json());

const marketplace = new MarketplaceService();
const rewards = new RewardsEngine();
const eventsAndClubs = new EventsAndClubsService();

// Mount Phase 2 Endpoints for Testing
app.get('/api/marketplace', (req, res) => {
  const category = req.query.category as string;
  const listings = marketplace.getListings();
  res.json(category ? listings.filter((listing) => listing.category === category) : listings);
});

app.post('/api/marketplace', (req, res) => {
  const newPost = marketplace.createListing(req.body);
  rewards.awardPoints(req.body.sellerId, 20, 'Posted marketplace item');
  res.status(201).json(newPost);
});

app.get('/api/rewards/:userId', (req, res) => {
  res.json(rewards.getProfile(req.params.userId));
});

app.get('/api/events', (req, res) => {
  res.json(eventsAndClubs.getEvents());
});

app.get('/api/clubs', (req, res) => {
  res.json(eventsAndClubs.getClubs());
});

app.post('/api/events/:id/rsvp', (req, res) => {
  const success = eventsAndClubs.rsvpEvent(req.params.id, req.body.userId);
  if (success) {
    rewards.awardPoints(req.body.userId, 10, 'RSVP to campus event');
    res.json({ message: 'RSVP Successful' });
  } else {
    res.status(400).json({ error: 'Already RSVPed or invalid event' });
  }
});

describe('Phase 2: Community, Marketplace, Gamification & Events API', () => {

  const testUserId = 'nadhirah.michael-ho01@student.csulb.edu';

  describe('🛒 Marketplace Feature', () => {
    test('GET /api/marketplace - should fetch all initial listings', async () => {
      const res = await request(app).get('/api/marketplace');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /api/marketplace?category=textbooks - should filter listings by category', async () => {
      const res = await request(app).get('/api/marketplace?category=textbooks');
      expect(res.status).toBe(200);
      expect(res.body.every((item: any) => item.category === 'textbooks')).toBe(true);
    });

    test('POST /api/marketplace - should create a new listing and award points', async () => {
      const newListing = {
        sellerId: testUserId,
        title: 'Linear Algebra Study Guide',
        description: 'Clean notes and problem breakdowns.',
        price: 15,
        category: 'textbooks',
        imageUrl: 'https://via.placeholder.com/150',
        safeMeetupZone: 'University Student Union (USU) Information Desk'
      };

      const res = await request(app)
        .post('/api/marketplace')
        .send(newListing);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(newListing.title);

      // Verify that posting awarded 20 reward points
      const profileRes = await request(app).get(`/api/rewards/${testUserId}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.points).toBeGreaterThan(340); // Base points + 20
    });
  });

  describe('🏆 Gamification & Rewards Engine', () => {
    test('GET /api/rewards/:userId - should return correct user profile, points, and badges', async () => {
      const res = await request(app).get(`/api/rewards/${testUserId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId', testUserId);
      expect(res.body).toHaveProperty('points');
      expect(res.body).toHaveProperty('badges');
      expect(Array.isArray(res.body.badges)).toBe(true);
    });
  });

  describe('📅 Events & Clubs Feature', () => {
    test('GET /api/events - should return active campus events', async () => {
      const res = await request(app).get('/api/events');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('location');
    });

    test('GET /api/clubs - should return active student organizations and Discord links', async () => {
      const res = await request(app).get('/api/clubs');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('discordUrl');
    });

    test('POST /api/events/:id/rsvp - should successfully RSVP for an event and award points', async () => {
      const eventsRes = await request(app).get('/api/events');
      const eventId = eventsRes.body[0].id;

      const res = await request(app)
        .post(`/api/events/${eventId}/rsvp`)
        .send({ userId: testUserId });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'RSVP Successful');
    });

    test('POST /api/events/:id/rsvp - should prevent duplicate RSVPs for the same event', async () => {
      const eventsRes = await request(app).get('/api/events');
      const eventId = eventsRes.body[0].id;

      // Attempt second RSVP with same user
      const res = await request(app)
        .post(`/api/events/${eventId}/rsvp`)
        .send({ userId: testUserId });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Already RSVPed or invalid event');
    });
  });
});
