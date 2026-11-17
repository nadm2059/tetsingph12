import React, { useState, useEffect } from 'react';

interface Listing {
  id: number | string;
  title: string;
  price: number;
  seller_email?: string;
  sellerId?: string;
  sellerName?: string;
  image_data?: string | null;
}

interface SellerChatModalProps {
  listing: Listing;
  currentUserEmail: string;
  onBack: () => void;
}

export const SellerChatModal: React.FC<SellerChatModalProps> = ({ listing, currentUserEmail, onBack }) => {
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [selectedSpot, setSelectedSpot] = useState<string>('University Student Union');
  const [confirmedSpot, setConfirmedSpot] = useState<boolean>(false);
  const [viewState, setViewState] = useState<'chat' | 'checkout' | 'success'>('chat');
  const [loading, setLoading] = useState<boolean>(true);

  // Payment form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const sellerEmail = listing.seller_email || listing.sellerId || listing.sellerName || 'nadhirah.michael-ho01@student.csulb.edu';

  // 1. Initialize or find the chat thread on mount
  useEffect(() => {
    async function initChat() {
      try {
        const res = await fetch('/api/v1/marketplace/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUserEmail
          },
          body: JSON.stringify({
            listingId: listing.id,
            sellerEmail: sellerEmail
          })
        });
        const data = await res.json();
        if (data.success && data.chat) {
          setChatId(data.chat.id);
        }
      } catch (err) {
        console.error('Failed to initialize chat session', err);
      } finally {
        setLoading(false);
      }
    }
    initChat();
  }, [listing, currentUserEmail, sellerEmail]);

  // 2. Fetch messages when chatId is ready
  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/v1/marketplace/chats/${chatId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching messages', err);
      }
    };

    fetchMessages();
  }, [chatId]);

  const postMessageToDB = async (senderEmail: string, text: string) => {
    if (!chatId) return;
    await fetch(`/api/v1/marketplace/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': senderEmail
      },
      body: JSON.stringify({ text })
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !chatId) return;

    const userText = inputMessage;
    setInputMessage('');

    await postMessageToDB(currentUserEmail, userText);

    let res = await fetch(`/api/v1/marketplace/chats/${chatId}/messages`);
    if (res.ok) setMessages(await res.json());

    // AI Bot Auto-reply
    setTimeout(async () => {
      let aiReply = `Thanks for asking about "${listing.title}"! It's verified and ready for pickup on campus.`;
      const lower = userText.toLowerCase();
      if (lower.includes('price') || lower.includes('discount')) {
        aiReply = `I can keep it at $${Number(listing.price).toFixed(2)} since demand on campus is high right now!`;
      } else if (lower.includes('where') || lower.includes('spot')) {
        aiReply = `Let's meet at the ${selectedSpot}. You can lock it in using the confirmation card below!`;
      } else {
        aiReply = `Got it! "${userText}" sounds good. Let me know when you're ready to complete the transaction.`;
      }

      await postMessageToDB(sellerEmail, aiReply);
      const refreshRes = await fetch(`/api/v1/marketplace/chats/${chatId}/messages`);
      if (refreshRes.ok) setMessages(await refreshRes.json());
    }, 1000);
  };

  const handleConfirmSpot = async () => {
    setConfirmedSpot(true);
    if (!chatId) return;
    await postMessageToDB(currentUserEmail, `📍 Agreed Meetup Spot: ${selectedSpot}`);
    
    setTimeout(async () => {
      await postMessageToDB(sellerEmail, `Perfect! See you at the ${selectedSpot}. Click "Proceed to Checkout" above to securely complete your order.`);
      const res = await fetch(`/api/v1/marketplace/chats/${chatId}/messages`);
      if (res.ok) setMessages(await res.json());
    }, 800);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingPayment(true);

    setTimeout(async () => {
      setProcessingPayment(false);
      setViewState('success');
      alert('Secure payment successful! +50 Gamification points awarded.');

      if (chatId) {
        await postMessageToDB(currentUserEmail, `💳 Paid $${Number(listing.price).toFixed(2)} via Secure Checkout!`);
        await postMessageToDB(sellerEmail, `Payment confirmed! Thanks for using CSULB Campus Resource Finder.`);
      }
    }, 1500);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#4B5563' }}>Loading secure session...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '88vh', background: '#EFEAE2', maxWidth: '750px', margin: '20px auto', border: '1px solid #CBD5E1', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      
      {/* Professional Header */}
      <div style={{ background: '#002B49', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', borderBottom: '1px solid #001F35' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} style={{ border: 'none', background: '#00406B', color: '#FFF', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            ←
          </button>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💬 CSULB Verified Seller Chat</span>
              <span style={{ fontSize: '11px', background: '#10B981', color: '#FFF', padding: '2px 8px', borderRadius: '1rem', fontWeight: '600' }}>Active</span>
            </div>
            <div style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '2px' }}>
              Item: <strong style={{ color: '#FFC72C' }}>{listing.title}</strong> (${Number(listing.price).toFixed(2)}) • Seller: {sellerEmail}
            </div>
          </div>
        </div>

        {viewState === 'chat' && confirmedSpot && (
          <button 
            onClick={() => setViewState('checkout')}
            style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          >
            🔒 Proceed to Checkout
          </button>
        )}
      </div>

      {/* Main View Router */}
      {viewState === 'chat' && (
        <>
          {/* Chat Messages Body */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EFEAE2' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '14px', margin: 'auto', background: '#FFF3CD', padding: '12px 20px', borderRadius: '8px', border: '1px solid #FFEEBA' }}>
                <p style={{ fontWeight: '600', marginBottom: '4px' }}>Start a conversation with the seller.</p>
                <p style={{ fontSize: '13px' }}>Ask questions about condition, price, or meetup availability!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                // Check if the message sender is the current logged-in user
                const isMe = msg.sender_email === currentUserEmail;
                return (
                  <div key={msg.id || idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                    {!isMe && (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#002B49', color: '#FFC72C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>
                        🤖
                      </div>
                    )}
                    <div style={{ 
                      maxWidth: '70%', 
                      padding: '12px 16px', 
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', 
                      fontSize: '14px',
                      backgroundColor: isMe ? '#D9FDD3' : '#FFFFFF', /* Green for you, White for seller/bot */
                      color: '#111827',
                      border: isMe ? '1px solid #B4E8A8' : '1px solid #D1D5DB',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      lineHeight: '1.5',
                      textAlign: 'left'
                    }}>
                      <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px', fontWeight: '700' }}>{msg.sender_email}</div>
                      {msg.message_text}
                      <div style={{ fontSize: '9px', color: '#9CA3AF', textAlign: 'right', marginTop: '4px' }}>✓✓</div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Meetup Selector Card */}
            {!confirmedSpot && (
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', margin: '16px auto', width: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #CBD5E1' }}>
                <div style={{ fontSize: '14px', color: '#002B49', marginBottom: '12px', textAlign: 'center', fontWeight: '800' }}>📍 Choose Secure Campus Meetup Spot</div>
                {['University Student Union', 'Horn Center', 'CSULB University Bookstore'].map((spot) => (
                  <label key={spot} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#1F2937', fontWeight: '600', background: selectedSpot === spot ? '#F3F4F6' : 'transparent' }}>
                    <input 
                      type="radio" 
                      name="meetup" 
                      value={spot} 
                      checked={selectedSpot === spot} 
                      onChange={() => setSelectedSpot(spot)} 
                    />
                    {spot}
                  </label>
                ))}
                <button 
                  onClick={handleConfirmSpot} 
                  style={{ width: '100%', marginTop: '14px', background: '#FFC72C', color: '#002B49', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}
                >
                  Confirm Meetup Location
                </button>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} style={{ background: '#F0F2F5', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #D1D5DB' }}>
            <input 
              type="text" 
              placeholder="Type your message to seller..." 
              value={inputMessage} 
              onChange={(e) => setInputMessage(e.target.value)} 
              style={{ flex: 1, border: '1px solid #9CA3AF', borderRadius: '8px', outline: 'none', padding: '12px 16px', fontSize: '14px', background: '#FFFFFF' }} 
            />
            <button type="submit" style={{ background: '#002B49', color: '#FFC72C', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}>
              Send
            </button>
          </form>
        </>
      )}

      {/* Secure Checkout / Payment Screen */}
      {viewState === 'checkout' && (
        <div style={{ flex: 1, padding: '32px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0F172A', fontWeight: '800' }}>🔒 CSULB Secure Checkout</h3>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Complete your transaction for <strong>{listing.title}</strong></p>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#334151', fontWeight: '600' }}>Total Amount</span>
              <span style={{ fontSize: '20px', color: '#059669', fontWeight: '900' }}>${Number(listing.price).toFixed(2)}</span>
            </div>

            <form onSubmit={handleProcessPayment}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334151', marginBottom: '6px' }}>Card Number</label>
                <input type="text" placeholder="4242 4242 4242 4242" required value={cardNumber} onChange={e => setCardNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334151', marginBottom: '6px' }}>Expires (MM/YY)</label>
                  <input type="text" placeholder="12/28" required value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334151', marginBottom: '6px' }}>CVC / CVV</label>
                  <input type="password" placeholder="123" required value={cardCvc} onChange={e => setCardCvc(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setViewState('chat')} style={{ flex: 1, background: '#E2E8F0', color: '#334151', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                  Back to Chat
                </button>
                <button type="submit" disabled={processingPayment} style={{ flex: 2, background: '#059669', color: '#FFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
                  {processingPayment ? 'Processing Securely...' : `Pay $${Number(listing.price).toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success View */}
      {viewState === 'success' && (
        <div style={{ flex: 1, padding: '40px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ color: '#0F172A', fontWeight: '900', fontSize: '24px', margin: '0 0 8px 0' }}>Payment Successful!</h2>
          <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '400px', marginBottom: '24px' }}>
            Your transaction has been processed securely. <strong>+50 Gamification points</strong> have been added to your profile!
          </p>
          <button onClick={onBack} style={{ background: '#002B49', color: '#FFC72C', border: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
            Return to Marketplace
          </button>
        </div>
      )}

    </div>
  );
};