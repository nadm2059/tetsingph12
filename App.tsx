import React, { useState, useEffect } from 'react';
import { SellerChatModal } from './frontend/SellerChatModal.js';

interface Listing {
  id: number;
  seller_email: string;
  title: string;
  description: string;
  price: number;
  image_data: string | null;
  created_at: string;
}

// Integrated Create Listing Form supporting custom seller email, image file selection, and preview
function CreateListingFormWithPhoto({ onBack, onPostSuccess }: { onBack: () => void; onPostSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [sellerEmail, setSellerEmail] = useState('nadhirah.michael-ho01@student.csulb.edu');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);
    formData.append('description', description);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      // Pass the custom seller email via the x-user-email header
      const res = await fetch('/api/v1/marketplace/listings', {
        method: 'POST',
        headers: {
          'x-user-email': sellerEmail
        },
        body: formData,
      });

      if (res.ok) {
        alert('Listing published successfully with photo (+20 points earned)!');
        onPostSuccess();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to publish listing.');
      }
    } catch (err) {
      alert('Network error publishing listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1rem', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: '800' }}>🛍️ Create Marketplace Listing</h3>
        <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', color: '#6B7280' }}>✕ Cancel</button>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#374151' }}>Seller Email Address</label>
        <input 
          type="email" 
          value={sellerEmail} 
          onChange={e => setSellerEmail(e.target.value)} 
          placeholder="seller@student.csulb.edu" 
          required 
          style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #D1D5DB', boxSizing: 'border-box', background: '#F9FAFB' }} 
        />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#374151' }}>Item Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CSULB Textbook - CECS 323" required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #D1D5DB', boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#374151' }}>Price ($)</label>
        <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="45.00" required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #D1D5DB', boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#374151' }}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Condition, pickup location on campus..." rows={3} style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #D1D5DB', boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#374151' }}>Upload Listing Photo</label>
        <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '14px', width: '100%', padding: '8px', background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }} />
        {imagePreview && (
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', height: '140px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }} />
          </div>
        )}
      </div>

      <button type="submit" disabled={loading} style={{ width: '100%', background: '#FFC72C', color: '#111827', padding: '12px', border: 'none', borderRadius: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>
        {loading ? 'Publishing to NeonDB...' : 'Publish Listing'}
      </button>
    </form>
  );
}

// Unified PostgreSQL Marketplace Feed Component with Chat Button
function PostgresMarketplaceFeed({ refreshKey, onOpenChat }: { refreshKey: number; onOpenChat: (listing: Listing) => void }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/marketplace/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(err => console.error('Failed to fetch marketplace listings', err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <p style={{ textAlign: 'center', color: '#6B7280' }}>Loading marketplace listings from NeonDB...</p>;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>🛍️ CSULB Campus Marketplace Feed</h3>
        <span style={{ fontSize: '13px', color: '#059669', fontWeight: '700', background: '#D1FAE5', padding: '4px 10px', borderRadius: '1rem' }}>
          Rewards Balance: 340 PTS
        </span>
      </div>

      {listings.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6B7280', padding: '40px' }}>No marketplace listings found. Post the first one above!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {listings.map(item => (
            <div key={item.id} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ height: '160px', background: '#F3F4F6' }}>
                  {item.image_data ? (
                    <img src={item.image_data} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '13px' }}>
                      No Photo Available
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827' }}>{item.title}</h4>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>
                      {Number(item.price) === 0 ? 'FREE' : `$${Number(item.price).toFixed(2)}`}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '12px' }}>{item.description}</p>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Seller: {item.seller_email}</p>
                </div>
              </div>
              <div style={{ padding: '0 16px 16px 16px' }}>
                <button 
                  onClick={() => onOpenChat(item)}
                  style={{ width: '100%', background: '#002B49', color: '#FFC72C', border: 'none', padding: '10px', borderRadius: '0.75rem', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
                >
                  💬 Contact Seller
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeChatListing, setActiveChatListing] = useState<Listing | null>(null);
  const currentUserEmail = 'nadhirah.michael-ho01@student.csulb.edu';

  const handleListingCreated = () => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1);
  };

  // Render Full Screen Chat Modal when a listing's chat button is clicked
  if (activeChatListing) {
    return (
      <SellerChatModal 
        listing={activeChatListing} 
        currentUserEmail={currentUserEmail} 
        onBack={() => setActiveChatListing(null)} 
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F5', paddingBottom: '60px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Action Bar */}
      <div style={{ background: '#002B49', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#FFC72C', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Phase 2 NeonDB Test Environment
          </span>
          <h2 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '900' }}>
            CSULB Campus Community & Marketplace
          </h2>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: '#FFC72C',
            color: '#002B49',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '10px 18px',
            fontWeight: '900',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
        >
          {showCreateForm ? 'Close Form' : '➕ Create New Listing'}
        </button>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {showCreateForm && (
          <div style={{ marginBottom: '24px' }}>
            <CreateListingFormWithPhoto
              onBack={() => setShowCreateForm(false)}
              onPostSuccess={handleListingCreated}
            />
          </div>
        )}

        {/* Marketplace Feed with Chat trigger */}
        <PostgresMarketplaceFeed 
          refreshKey={refreshKey} 
          onOpenChat={(listing) => setActiveChatListing(listing)} 
        />
      </div>
    </div>
  );
}