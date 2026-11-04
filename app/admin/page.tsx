'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  where,
  limit
} from 'firebase/firestore';
import { isAdmin } from '@/lib/admin';
import Link from 'next/link';
import { Search, Users, Ticket, Award, Star, ShieldAlert, ChevronRight, Zap, Gift, Bot, Settings, Save } from 'lucide-react';

export default function AdminPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'codes' | 'users' | 'ai'>('codes');
  
  // AI Management State
  const [aiConfig, setAiConfig] = useState({
    systemPrompt: "You are Pajji Learn AI, an ai for a learning platform made by Pajji Services. Answer clearly and concisely using the provided context. Be helpful but brief to save time.Sometimes, act fun",
    model: "llama-3.3-70b-versatile",
    maxTokens: 300
  });
  const [isSavingAI, setIsSavingAI] = useState(false);
  
  // Promo Codes State
  const [codes, setCodes] = useState<any[]>([]);
  const [newCodes, setNewCodes] = useState('');
  const [tier, setTier] = useState('plus');
  const [duration, setDuration] = useState(30);
  const [isAdding, setIsAdding] = useState(false);

  // User Management State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAdmin(user.email)) {
      // Promo Codes Subscription
      const qCodes = query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc'));
      const unsubCodes = onSnapshot(qCodes, (snapshot) => {
        setCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // Users Subscription (Limit to 50 for performance, or use search)
      const qUsers = query(collection(db, 'users'), limit(50));
      const unsubUsers = onSnapshot(qUsers, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // AI Config Subscription
      const unsubAI = onSnapshot(doc(db, 'settings', 'ai_config'), (docSnap) => {
        if (docSnap.exists()) {
          setAiConfig(docSnap.data() as any);
        }
      });

      return () => {
        unsubCodes();
        unsubUsers();
        unsubAI();
      };
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
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleGiftXP = async (userId: string, currentXP: number) => {
    if (isUpdatingUser) return;
    setIsUpdatingUser(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        xp: (currentXP || 0) + 500
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const handleSetTier = async (userId: string, newTier: string) => {
    if (isUpdatingUser) return;
    setIsUpdatingUser(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        membership: newTier,
        membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const handleSaveAIConfig = async () => {
    setIsSavingAI(true);
    try {
      await updateDoc(doc(db, 'settings', 'ai_config'), aiConfig);
      alert('AI Configuration Saved Globally!');
    } catch (error) {
      // If document doesn't exist, try setting it
      try {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'ai_config'), aiConfig);
        alert('AI Configuration Created & Saved!');
      } catch (e) {
        console.error(e);
        alert('Failed to save AI config.');
      }
    } finally {
      setIsSavingAI(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white">Loading...</div>;

  if (!user || !isAdmin(user.email)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-10 text-center text-white">
        <ShieldAlert size={64} className="mb-4 text-red-500" />
        <h1 className="text-4xl font-black text-red-500">ACCESS DENIED</h1>
        <p className="mt-2 opacity-50">You do not have administrative privileges.</p>
        <Link href="/" className="mt-8 text-emerald-500 underline">Return to Pajji Learn</Link>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(u => 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--ink-0)] p-4 text-[var(--text)] md:p-10" style={{ fontFamily: 'var(--disp)' }}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-[var(--text)] md:text-6xl">ADMIN<span className="text-[var(--jade)]">HUB</span></h1>
            <p className="mt-2 text-lg font-bold opacity-40">System Management & User Control</p>
          </div>
          <Link href="/" className="group flex items-center gap-2 rounded-2xl border border-[var(--line-2)] bg-[var(--ink-2)] px-6 py-3 font-bold hover:bg-[var(--ink-3)]">
            Exit Dashboard <ChevronRight size={18} />
          </Link>
        </header>

        {/* Tabs */}
        <div className="mb-10 flex gap-2 rounded-3xl bg-[var(--ink-2)] p-2 backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab('codes')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-black ${activeTab === 'codes' ? 'bg-[var(--jade)] text-[var(--ink-on-accent)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]' : 'hover:bg-[var(--ink-2)] text-[var(--dim)]'}`}
          >
            <Ticket size={20} /> PROMO CODES
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-black ${activeTab === 'users' ? 'bg-[var(--jade)] text-[var(--ink-on-accent)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]' : 'hover:bg-[var(--ink-2)] text-[var(--dim)]'}`}
          >
            <Users size={20} /> USER MANAGEMENT
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-black ${activeTab === 'ai' ? 'bg-[var(--jade)] text-[var(--ink-on-accent)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]' : 'hover:bg-[var(--ink-2)] text-[var(--dim)]'}`}
          >
            <Bot size={20} /> AI ENGINE
          </button>
        </div>

        {activeTab === 'codes' && (
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="rounded-3xl border border-[var(--line-2)] bg-[var(--ink-2)] p-8 backdrop-blur-xl">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-black">
                <Zap size={20} className="text-[var(--amber)]" /> GENERATE CODES
              </h2>
              <form onSubmit={handleAddCodes}>
                <div className="mb-6">
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest opacity-40">Codes (comma or line separated)</label>
                  <textarea 
                    value={newCodes}
                    onChange={(e) => setNewCodes(e.target.value)}
                    placeholder="PAJJI-2026-X\nPROMO-123-Y"
                    className="h-40 w-full rounded-2xl border border-[var(--line-2)] bg-[var(--input-bg)] p-4 font-mono text-[var(--text)] outline-none focus:border-[var(--jade)]"
                  />
                </div>
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest opacity-40">Tier</label>
                    <select 
                      value={tier} 
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--input-bg)] p-3 font-bold outline-none"
                    >
                      <option value="plus">Plus</option>
                      <option value="pro">Pro</option>
                      <option value="ultra">Ultra</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest opacity-40">Days</label>
                    <input 
                      type="number" 
                      value={duration} 
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--input-bg)] p-3 font-bold outline-none"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isAdding || !newCodes.trim()}
                  className="w-full rounded-2xl bg-[var(--jade)] py-4 font-black text-[var(--ink-on-accent)] hover:bg-[var(--jade-light)] disabled:opacity-30"
                >
                  {isAdding ? 'Adding...' : 'GENERATE CODES'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-black">
                <Award size={20} className="text-[var(--jade)]" /> ACTIVE PROMO INVENTORY ({codes.length})
              </h2>
              <div className="overflow-hidden rounded-3xl border border-[var(--line-2)] bg-[var(--ink-2)] backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--ink-3)] text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">
                      <tr>
                        <th className="p-6">Code</th>
                        <th className="p-6">Tier</th>
                        <th className="p-6">Status</th>
                        <th className="p-6">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {codes.map(c => (
                        <tr key={c.id} className="group hover:bg-[var(--ink-3)]">
                          <td className="p-6 font-mono font-black">{c.code}</td>
                          <td className="p-6">
                            <span className={`rounded-lg px-2 py-1 text-[11px] font-black uppercase ${c.tier === 'ultra' ? 'bg-[var(--amber)] text-[var(--ink-on-accent)]' : c.tier === 'pro' ? 'bg-[var(--azure)] text-[var(--ink-on-accent)]' : 'bg-[var(--jade)] text-[var(--ink-on-accent)]'}`}>
                              {c.tier}
                            </span>
                          </td>
                          <td className="p-6">
                            {c.isUsed ? (
                              <span className="flex items-center gap-2 text-xs font-bold text-[var(--coral)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--coral)]" /> Used</span>
                            ) : (
                              <span className="flex items-center gap-2 text-xs font-bold text-[var(--jade)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--jade)] animate-pulse" /> Available</span>
                            )}
                          </td>
                          <td className="p-6 text-xs font-bold text-[var(--faint)]">
                            {c.createdAt?.toDate?.() ? c.createdAt.toDate().toLocaleDateString() : '---'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                <Users size={20} className="text-[var(--jade)]" /> Database Users ({allUsers.length})
              </h2>
              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--faint)]" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--line-2)] bg-[var(--ink-2)] py-4 pl-12 pr-4 font-bold outline-none focus:border-[var(--jade)]"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredUsers.map(u => (
                <div key={u.id} className="group relative rounded-3xl border border-[var(--line-2)] bg-[var(--ink-2)] p-6 backdrop-blur-xl hover:border-[var(--jade)] hover:bg-[var(--ink-3)]">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--jade)] text-xl font-black text-[var(--ink-on-accent)]">
                        {u.displayName?.[0] || u.email?.[0] || '?'}
                      </div>
                      <div>
                        <h3 className="font-black leading-tight text-[var(--text)]">{u.displayName || 'Unnamed Student'}</h3>
                        <p className="text-xs font-bold opacity-30">{u.email}</p>
                      </div>
                    </div>
                    <span className={`rounded-lg px-2 py-1 text-[11px] font-black uppercase ${u.membership === 'ultra' ? 'bg-[var(--amber)] text-[var(--ink-on-accent)]' : u.membership === 'pro' ? 'bg-[var(--azure)] text-[var(--ink-on-accent)]' : 'bg-[var(--jade)] text-[var(--ink-on-accent)]'}`}>
                      {u.membership || 'Free'}
                    </span>
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-[var(--input-bg)] p-3">
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-30">Current XP</p>
                      <p className="text-lg font-black text-[var(--jade)]">{u.xp || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--input-bg)] p-3">
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-30">Level</p>
                      <p className="text-lg font-black text-[var(--amber)]">{Math.floor((u.xp || 0) / 500) + 1}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleGiftXP(u.id, u.xp)}
                      disabled={isUpdatingUser === u.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--jade)] py-2 text-xs font-black text-[var(--ink-on-accent)] hover:bg-[var(--jade-light)] disabled:opacity-30"
                    >
                      <Gift size={14} /> +500 XP
                    </button>
                    <button 
                      onClick={() => handleSetTier(u.id, 'ultra')}
                      disabled={isUpdatingUser === u.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--amber)] py-2 text-xs font-black text-[var(--ink-on-accent)] hover:opacity-90 disabled:opacity-30"
                    >
                      <Star size={14} /> ULTRA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="rounded-3xl border border-[var(--line-2)] bg-[var(--ink-2)] p-10 backdrop-blur-xl">
              <h2 className="mb-8 flex items-center gap-3 text-2xl font-black">
                <Bot size={32} className="text-[var(--jade)]" /> AI ENGINE CONTROL
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest opacity-40">System Instruction (Persona)</label>
                  {/* TODO(data): settings/ai_config is written by this screen but
                      never read anywhere else in the repo -- grep for it and the
                      only hits are the three lines in this file. So systemPrompt,
                      model and maxTokens below are stored and ignored: the real
                      calls live in lib/ai-backend.ts, which hardcodes
                      llama-3.1-8b-instant, llama-3.3-70b-versatile and
                      meta-llama/llama-4-scout-17b-16e-instruct with max_tokens: 300,
                      plus a genkit flow on gemini15Flash. Not correcting the
                      labels to match the code, or the reverse, until the wiring
                      is decided. */}
                  <textarea 
                    value={aiConfig.systemPrompt}
                    onChange={(e) => setAiConfig({...aiConfig, systemPrompt: e.target.value})}
                    className="h-48 w-full rounded-2xl border border-[var(--line-2)] bg-[var(--input-bg)] p-5 font-bold text-[var(--text)] outline-none focus:border-[var(--jade)]"
                    placeholder="Enter instructions for the AI..."
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest opacity-40">LLM Model</label>
                    <select 
                      value={aiConfig.model}
                      onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                      className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--input-bg)] p-4 font-black outline-none focus:border-[var(--jade)]"
                    >
                      <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Versatile)</option>
                      <option value="llama-3.1-8b-instant">Llama 3.1 8B (Instant/Cheap)</option>
                      {/* TODO(data): no code path uses mixtral-8x7b-32768, and the
                          backend's third model, meta-llama/llama-4-scout-17b-16e-instruct,
                          is not offered here. The list and the code disagree in
                          both directions. */}
                      <option value="mixtral-8x7b-32768">Mixtral 8x7b</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest opacity-40">Response Cap (Max Tokens)</label>
                    <input 
                      type="number"
                      value={aiConfig.maxTokens}
                      onChange={(e) => setAiConfig({...aiConfig, maxTokens: parseInt(e.target.value)})}
                      className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--input-bg)] p-4 font-black outline-none focus:border-[var(--jade)]"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSaveAIConfig}
                  disabled={isSavingAI}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--jade)] py-5 text-lg font-black text-[var(--ink-on-accent)] hover:bg-[var(--jade-light)] disabled:opacity-30"
                >
                  <Save size={20} /> {isSavingAI ? 'Saving Settings...' : 'PUBLISH AI UPDATES'}
                </button>
              </div>
            </div>

            {/* TODO(data): the sentence below is false today. Nothing reads
                ai_config, so saving changes nothing for any user. Left as-is
                rather than rewritten, because what the copy should say depends
                on whether the read path gets built. */}
            <div className="rounded-3xl border border-dashed border-[var(--line-2)] p-8 text-center">
              <Settings size={32} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-bold opacity-30">
                These settings take effect globally for all users instantly upon saving.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
