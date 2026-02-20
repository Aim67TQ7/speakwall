import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard() {
  const { user, sessionCount } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    async function load() {
      const { data } = await supabase
        .from('speakwall_sessions')
        .select('*, speakwall_analyses(*)')
        .order('started_at', { ascending: false });
      setSessions(data || []);
      setLoading(false);
    }
    load();
  }, [user, router]);

  return (
    <main>
      <h1>Dashboard</h1>
      <div className="card">
        <p>Welcome{user ? `, ${user.email}` : ''}.</p>
        <p>Free trial sessions used: {sessionCount} / 3</p>
        <div className="space" />
        <Link href="/record"><button disabled={sessionCount >= 3}>Start a new session</button></Link>
      </div>

      <h2 style={{ marginTop: 24 }}>Session History</h2>
      {loading ? (
        <p>Loading...</p>
      ) : sessions.length === 0 ? (
        <div className="card"><p>No sessions yet. Record your first speech to get started!</p></div>
      ) : (
        sessions.map((s) => {
          const analysis = s.speakwall_analyses?.[0];
          const fillers = analysis?.filler || [];
          const totalFillers = fillers.reduce((sum: number, f: any) => sum + f.count, 0);
          const date = new Date(s.started_at).toLocaleDateString();
          const mins = s.duration_sec ? Math.floor(s.duration_sec / 60) : 0;
          const secs = s.duration_sec ? s.duration_sec % 60 : 0;

          return (
            <div key={s.id} className="card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/results?session=${s.id}`)}>
              <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <strong>{date}</strong>
                <span style={{
                  padding: '2px 8px', borderRadius: 8, fontSize: 12,
                  background: s.status === 'completed' ? '#d1fae5' : s.status === 'failed' ? '#fee2e2' : '#e0e7ff',
                  color: s.status === 'completed' ? '#065f46' : s.status === 'failed' ? '#991b1b' : '#3730a3'
                }}>
                  {s.status}
                </span>
              </div>
              <div className="row" style={{ gap: 24, marginTop: 8 }}>
                <span>Duration: {s.duration_sec ? `${mins}:${String(secs).padStart(2, '0')}` : '--'}</span>
                <span>WPM: {analysis?.words_per_minute ?? '--'}</span>
                <span>Fillers: {analysis ? totalFillers : '--'}</span>
              </div>
            </div>
          );
        })
      )}
    </main>
  );
}

