'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import Link from 'next/link';

export default function RedeemPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redeemedInfo, setRedeemedInfo] = useState<{ tier: string, expiry: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setStatus({ type: 'error', message: 'You must be logged in to redeem a code.' });
      return;
    }

    if (!code.trim()) return;

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      // 1. Find the code in Firestore
      const q = query(collection(db, 'promo_codes'), where('code', '==', code.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setStatus({ type: 'error', message: '❌ Nope, invalid code.' });
        setIsSubmitting(false);
        return;
      }

      const codeDoc = querySnapshot.docs[0];
      const codeData = codeDoc.data();

      // 2. Check if already used
      if (codeData.isUsed) {
        setStatus({ type: 'error', message: '❌ This code has already been used.' });
        setIsSubmitting(false);
        return;
      }

      // 3. Mark code as used
      await updateDoc(doc(db, 'promo_codes', codeDoc.id), {
        isUsed: true,
        usedBy: user.uid,
        usedAt: serverTimestamp()
      });

      // 4. Update user's membership
      const tier = codeData.tier || 'plus';
      const durationDays = codeData.durationDays || 30;
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + durationDays);
      const expiryString = expiryDate.toISOString();

      const membershipValue = `PAJJI${tier.toUpperCase()}`;

      await setDoc(doc(db, 'users', user.uid), {
        membership: membershipValue,
        membershipExpiry: expiryString
      }, { merge: true });

      // 5. Show success
      setRedeemedInfo({
        tier: tier.charAt(0).toUpperCase() + tier.slice(1),
        expiry: expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      });
      setStatus({ type: 'success', message: '✅ Success!' });
      
    } catch (error) {
      console.error('Redemption error:', error);
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white', padding: '20px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Redeem Your Code</h1>
        <p style={{ marginBottom: '30px', opacity: 0.7 }}>Please login to your Pajji Learn account first.</p>
        <Link href="/" style={{ padding: '12px 24px', background: '#10b981', borderRadius: '8px', color: 'black', fontWeight: 'bold', textDecoration: 'none' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: '800', background: 'linear-gradient(to right, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Redeem Code
        </h1>
        <p style={{ marginBottom: '32px', opacity: 0.6 }}>Enter your special code to unlock premium features.</p>

        {status.type === 'success' ? (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{status.message}</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '4px' }}>You got <strong>Pajji {redeemedInfo?.tier}</strong></p>
            <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '30px' }}>Valid until {redeemedInfo?.expiry}</p>
            <Link href="/" style={{ 
              display: 'block',
              padding: '14px', 
              background: '#10b981', 
              borderRadius: '12px', 
              color: 'black', 
              fontWeight: 'bold', 
              textDecoration: 'none',
              transition: 'transform 0.2s'
            }}>
              Start Learning
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRedeem}>
            <input 
              type="text" 
              placeholder="PLUS-ABC123XYZ" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1.1rem',
                textAlign: 'center',
                letterSpacing: '2px',
                marginBottom: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />

            {status.type === 'error' && (
              <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem', fontWeight: '500' }}>
                {status.message}
              </p>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting || !code.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: isSubmitting ? '#065f46' : '#10b981',
                borderRadius: '12px',
                color: 'black',
                fontWeight: 'bold',
                fontSize: '1rem',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? 'Activating...' : 'Activate Now 🚀'}
            </button>
          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
