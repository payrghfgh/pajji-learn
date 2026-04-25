'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { isAdmin } from '@/lib/admin';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<any[]>([]);
  const [newCodes, setNewCodes] = useState('');
  const [tier, setTier] = useState('plus');
  const [duration, setDuration] = useState(30);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAdmin(user.email)) {
      const q = query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodes.trim()) return;

    setIsAdding(true);
    const codesList = newCodes.split(/[\n,]+/).map(c => c.trim().toUpperCase()).filter(c => c);

    try {
      for (const code of codesList) {
        await addDoc(collection(db, 'promo_codes'), {
          code,
          tier,
          durationDays: duration,
          isUsed: false,
          usedBy: null,
          createdAt: serverTimestamp()
        });
      }
      setNewCodes('');
      alert(`Added ${codesList.length} codes!`);
    } catch (error) {
      console.error('Error adding codes:', error);
      alert('Failed to add codes.');
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;

  if (!user || !isAdmin(user.email)) {
    return (
      <div style={{ padding: '40px', color: 'white', textAlign: 'center', background: '#0a0a0a', minHeight: '100vh' }}>
        <h1 style={{ color: '#ef4444' }}>Unauthorized</h1>
        <p>You don't have permission to access this page.</p>
        <Link href="/" style={{ color: '#10b981', textDecoration: 'underline' }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      color: 'white', 
      padding: '40px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '4px' }}>Admin Dashboard</h1>
            <p style={{ opacity: 0.5 }}>Manage Redemption Codes</p>
          </div>
          <Link href="/" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
            Exit Admin
          </Link>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
          {/* Add Codes Form */}
          <section style={{ 
            background: 'rgba(255,255,255,0.03)', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid rgba(255,255,255,0.1)',
            height: 'fit-content'
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Add New Codes</h2>
            <form onSubmit={handleAddCodes}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.7 }}>Paste Codes (one per line or comma separated)</label>
                <textarea 
                  value={newCodes}
                  onChange={(e) => setNewCodes(e.target.value)}
                  placeholder="PLUS-123\nPRO-456"
                  style={{ 
                    width: '100%', 
                    height: '150px', 
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px', 
                    color: 'white', 
                    padding: '12px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.7 }}>Tier</label>
                  <select 
                    value={tier} 
                    onChange={(e) => setTier(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '10px' }}
                  >
                    <option value="plus">Plus</option>
                    <option value="pro">Pro</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.7 }}>Days</label>
                  <input 
                    type="number" 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '10px' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isAdding || !newCodes.trim()}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: '#10b981', 
                  borderRadius: '12px', 
                  color: 'black', 
                  fontWeight: 'bold', 
                  border: 'none', 
                  cursor: 'pointer' 
                }}
              >
                {isAdding ? 'Adding...' : 'Generate Codes'}
              </button>
            </form>
          </section>

          {/* List of Codes */}
          <section>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Existing Codes ({codes.length})</h2>
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '20px', 
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th style={{ padding: '16px', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.5 }}>Code</th>
                    <th style={{ padding: '16px', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.5 }}>Tier</th>
                    <th style={{ padding: '16px', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.5 }}>Status</th>
                    <th style={{ padding: '16px', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.5 }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => (
                    <tr key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{c.code}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          background: c.tier === 'ultra' ? '#f59e0b' : c.tier === 'pro' ? '#3b82f6' : '#10b981',
                          color: 'black',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase'
                        }}>
                          {c.tier}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {c.isUsed ? (
                          <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>Used</span>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '0.9rem' }}>Available</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.8rem', opacity: 0.5 }}>
                        {c.createdAt?.toDate?.() ? c.createdAt.toDate().toLocaleDateString() : '---'}
                      </td>
                    </tr>
                  ))}
                  {codes.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>No codes found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
