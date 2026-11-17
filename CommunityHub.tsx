import React, { useState, useEffect } from 'react';
import { Listing } from '../marketplace/marketplaceService.js';
import { CreateListingForm } from './CreateListingForm.js';
import { SellerChatModal } from './SellerChatModal.js';

const INITIAL_LISTINGS: Listing[] = [
  { id: '1', title: 'TI-84 Plus CE Calc', price: 40, condition: 'Used', imageUrl: 'https://via.placeholder.com/120', sellerId: 'seller1', sellerName: 'Alex' },
  { id: '2', title: '882-E Scantrons', price: 0, condition: 'New', imageUrl: 'https://via.placeholder.com/120', sellerId: 'seller2', sellerName: 'Taylor' },
  { id: '3', title: 'Principles of Internal Medicine', price: 20, condition: 'Used - Good', imageUrl: 'https://via.placeholder.com/120', sellerId: 'seller3', sellerName: 'Jordan' },
  { id: '4', title: 'iPad Air w/ pencil', price: 400, condition: 'Like New', imageUrl: 'https://via.placeholder.com/120', sellerId: 'seller4', sellerName: 'Random User' },
  { id: '5', title: 'Cap and Gown', price: 0, condition: 'Used once', imageUrl: 'https://via.placeholder.com/120', sellerId: 'seller5', sellerName: 'Morgan' },
  { id: '6', title: 'Flat Screen Tv', price: 80, condition: 'Good', imageUrl: 'https://via.placeholder.com/120', sellerId: 'seller6', sellerName: 'Chris' }
];

export const CommunityHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'events' | 'clubs'>('marketplace');
  const [marketplaceView, setMarketplaceView] = useState<'browse' | 'create' | 'chat'>('browse');
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  
  // Gamification & Rewards State
  const [userPoints, setUserPoints] = useState<number>(0);
  const [badges, setBadges] = useState<string[]>(['New Student', 'Campus Helper']);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('n.s.michaelho2004@gmail.com');

  // Fetch points from backend profile when email changes
  const fetchRewards = async (email: string) => {
    try {
      const res = await fetch(`/api/rewards/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setUserPoints(data.points || 0);
        if (data.badges) setBadges(data.badges);
      }
    } catch (err) {
      console.error('Failed to fetch rewards profile:', err);
    }
  };

  useEffect(() => {
    fetchRewards(currentUserEmail);
  }, [currentUserEmail]);

  const handlePostSuccess = (newListing: Listing) => {
    setListings([newListing, ...listings]);
    setMarketplaceView('browse');
    setUserPoints(prev => prev + 20); // Optimistic local reward update
  };

  const handleOpenChat = (listing: Listing) => {
    setActiveListing(listing);
    setMarketplaceView('chat');
  };

  const handleRsvp = async (eventId: string, eventTitle: string, eventDate: string) => {
    const userEmail = prompt(`Enter your email address to receive the RSVP confirmation for "${eventTitle}":`, currentUserEmail);
    
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address to complete your RSVP.');
      return;
    }

    setCurrentUserEmail(userEmail);

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          eventTitle,
          eventDate
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Success! RSVP confirmed for ${eventTitle}. A confirmation email has been sent to ${userEmail} (+${data.pointsAwarded || 10} Perk Points)! 🎉`);
        // Refresh reward points immediately from backend
        fetchRewards(userEmail);
      } else {
        alert(data.error || 'You have already RSVPed for this event with this email.');
      }
    } catch (err) {
      console.error('RSVP Network Error:', err);
      alert('Failed to connect to the campus event server.');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#F4F5F7', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ background: '#FFC72C', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#002B49', border: '2px solid #FFF' }} />
          <span style={{ fontWeight: '900', color: '#002B49', fontSize: '18px' }}>Campus Resource Finder</span>
        </div>
        {activeTab === 'marketplace' && marketplaceView === 'browse' && (
          <button 
            onClick={() => setMarketplaceView('create')} 
            style={{ padding: '10px 20px', borderRadius: '2rem', background: '#000', color: '#FFF', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
          >
            + Create New Listing
          </button>
        )}
      </div>

      {/* Rewards Bar */}
      <div style={{ background: '#FAF9F5', padding: '12px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#D97706' }}>Rewards Balance: {userPoints} PTS</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {badges.map((b, i) => (
            <span key={i} style={{ background: '#002B49', color: '#FFC72C', borderRadius: '1rem', padding: '4px 10px', fontSize: '11px', fontWeight: '800' }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', background: '#FFF', borderBottom: '1px solid #E5E7EB' }}>
        {[
          { id: 'marketplace', label: '🛒 Marketplace' },
          { id: 'events', label: '📅 Events' },
          { id: 'clubs', label: '👥 Clubs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'marketplace') setMarketplaceView('browse');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '2rem',
              border: activeTab === tab.id ? 'none' : '1.5px solid #E5E7EB',
              background: activeTab === tab.id ? '#002B49' : '#FFFFFF',
              color: activeTab === tab.id ? '#FFC72C' : '#374151',
              fontWeight: '900',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Body Routing */}
      <div style={{ flex: 1, padding: '24px' }}>
        {activeTab === 'marketplace' && (
          <>
            {marketplaceView === 'create' && (
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <CreateListingForm onBack={() => setMarketplaceView('browse')} onPostSuccess={handlePostSuccess} />
              </div>
            )}

            {marketplaceView === 'chat' && activeListing && (
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <SellerChatModal
                  listing={activeListing}
                  currentUserEmail={currentUserEmail}
                  onBack={() => setMarketplaceView('browse')}
                />
              </div>
            )}

            {marketplaceView === 'browse' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {listings.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleOpenChat(item)}
                    style={{ background: '#FFF', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }} 
                    />
                    <div style={{ fontSize: '15px', color: '#2D3748', marginBottom: '8px', fontWeight: '700', minHeight: '44px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontWeight: '900', fontSize: '16px', color: '#000' }}>
                      {item.price === 0 ? 'FREE' : `$${item.price}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
            {[
              { id: 'ev1', title: 'Week of Welcome', date: 'Sept 2, 2026', location: "Speaker's Lawn", org: 'ASI' },
              { id: 'ev2', title: 'Campus Movie Night', date: 'Oct 15, 2026', location: 'USU West Lawn', org: 'Beach Events' }
            ].map((ev) => (
              <div key={ev.id} style={{ background: '#FFFFFF', borderRadius: '1.25rem', padding: '20px', border: '1.5px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#002B49' }}>{ev.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4B5563' }}>{ev.date} at {ev.location} Hosted by {ev.org}</p>
                </div>
                <button 
                  onClick={() => handleRsvp(ev.id, ev.title, ev.date)} 
                  style={{ background: '#002B49', color: '#FFC72C', border: 'none', borderRadius: '0.75rem', padding: '12px 20px', fontWeight: '900', cursor: 'pointer', fontSize: '14px' }}
                >
                  RSVP Now
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'clubs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {[
              { name: 'ACM CSULB', category: 'Technology', meeting: 'Wednesdays 5:00 PM (ECS 302)', discord: 'https://discord.com/invite/zYRBYU2nqD' },
              { name: 'IEEE CSULB', category: 'Engineering', meeting: 'Thursdays 6:00 PM (VEC 112)', discord: 'https://discord.com/invite/EWVPk4H' }
            ].map((club, i) => (
              <div key={i} style={{ background: '#FFFFFF', borderRadius: '1.25rem', padding: '24px', border: '1.5px solid #E5E7EB' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#002B49' }}>{club.name}</h3>
                <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#4B5563' }}>🕒 {club.meeting}</p>
                <a href={club.discord} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#5865F2', color: '#FFFFFF', padding: '10px 16px', borderRadius: '0.75rem', fontSize: '13px', fontWeight: '800', textDecoration: 'none' }}>
                  Join Discord Server ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};