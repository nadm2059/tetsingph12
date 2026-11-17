import React, { useState } from 'react';
import { Listing } from '../marketplace/marketplaceService.js';

interface CreateListingFormProps {
  onBack: () => void;
  onPostSuccess: (newListing: Listing) => void;
}

export const CreateListingForm: React.FC<CreateListingFormProps> = ({ onBack, onPostSuccess }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !condition) {
      alert('Please fill out all required fields.');
      return;
    }

    const priceNum = price.toLowerCase() === 'free' || price === '0' ? 0 : parseFloat(price);
    const validPrice = isNaN(priceNum) ? 0 : priceNum;

    const payload = {
      title,
      price: validPrice,
      condition,
      description,
      imageUrl: 'https://via.placeholder.com/150',
      sellerId: 'current_user',
      sellerName: 'You'
    };

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdItem: Listing = await res.json();
        alert('Item successfully listed! (+20 Perk Points) 🎉');
        onPostSuccess(createdItem);
      } else {
        // Fallback for direct UI state updates if API is offline
        const localListing: Listing = {
          id: Date.now().toString(),
          ...payload
        };
        onPostSuccess(localListing);
      }
    } catch (err) {
      console.error('Failed to connect to marketplace service:', err);
      // Fallback to local state update on network issue
      const localListing: Listing = {
        id: Date.now().toString(),
        ...payload
      };
      onPostSuccess(localListing);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '1.25rem', padding: '24px', border: '1.5px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <button 
        onClick={onBack} 
        style={{ border: 'none', background: 'transparent', fontSize: '15px', fontWeight: 'bold', color: '#002B49', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        ← Back to Marketplace
      </button>

      <h2 style={{ margin: '0 0 20px 0', color: '#002B49', fontWeight: '900', fontSize: '20px' }}>Create New Listing</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A5568' }}>Item name*</label>
          <input 
            type="text" 
            placeholder="e.g. TI-84 Plus CE Calculator"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            style={inputStyle} 
            required 
          />
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A5568' }}>Photos*</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            {[1, 2, 3].map((idx) => (
              <div key={idx} style={{ width: '80px', height: '80px', border: '1px dashed #CBD5E0', borderRadius: '12px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#A0AEC0', cursor: 'pointer' }}>
                +
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A5568' }}>Price*</label>
          <input 
            type="text" 
            placeholder="e.g. 20 or FREE"
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            style={inputStyle} 
            required 
          />
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A5568' }}>Condition*</label>
          <input 
            type="text" 
            placeholder="e.g. Used - Good, Like New"
            value={condition} 
            onChange={(e) => setCondition(e.target.value)} 
            style={inputStyle} 
            required 
          />
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A5568' }}>Description (optional)</label>
          <textarea 
            rows={4}
            placeholder="Add any specific pickup details or additional information..."
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            style={{ ...inputStyle, resize: 'none' }} 
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{ 
            background: '#FFC72C', 
            color: '#002B49', 
            border: 'none', 
            borderRadius: '12px', 
            padding: '14px', 
            fontWeight: '900', 
            fontSize: '16px', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginTop: '10px',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Posting...' : 'Post Item (+20 PTS)'}
        </button>
      </form>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
  background: '#FFF',
  fontSize: '14px',
  marginTop: '4px',
  boxSizing: 'border-box'
};