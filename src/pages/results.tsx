import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Results() {
  const router = useRouter();
  const sessionId = router.query.session as string;
  const [session, setSession] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    async function load() {
      const { data: sess } = await supabase
        .from('speakwall_sessions').select('*').eq('id', sessionId).single();
      const { data: anal } = await supabase
        .from('speakwall_analyses').select('*').eq('session_id', sessionId).single();
      setSession(sess);
      setAnalysis(anal);
      setLoading(false);
    }
    load();
  }, [sessionId]);

  if (loading) return <main><p>Loading results...</p></main>;
  if (!session) return <main><p>Session not found.</p><Link href="/dashboard">Back to Dashboard</Link></main>;

  const fillers = analysis?.filler || [];
  const totalFillers = fillers.reduce((sum: number, f: any) => sum + f.count, 0);
  const duration = session?.duration_sec;
  const mins = duration ? Math.floor(duration / 60) : 0;
  const secs = duration ? duration % 60 : 0;

  return (
    <main>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Speech Analysis</h1>
        <Link href="/dashboard"><button>Back to Dashboard</button></Link>
      </div>

      <div className="card">
        <h3>Metrics</h3>
        <div className="row" style={{ flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{analysis?.words_per_minute ?? '--'}</div>
            <div style={{ color: '#6b7280' }}>Words/min</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{totalFillers}</div>
            <div style={{ color: '#6b7280' }}>Filler words</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{duration ? `${mins}:${String(secs).padStart(2, '0')}` : '--'}</div>
            <div style={{ color: '#6b7280' }}>Duration</div>
          </div>
        </div>
        {fillers.length > 0 && (
          <>
            <div className="space" />
            <p style={{ color: '#6b7280', marginBottom: 4 }}>Filler breakdown:</p>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {fillers.map((f: any) => (
                <span key={f.word} style={{
                  background: '#fef3c7', color: '#92400e', padding: '2px 10px',
                  borderRadius: 12, fontSize: 14
                }}>
                  &ldquo;{f.word}&rdquo; x{f.count}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {analysis?.recommendations && (
        <div className="card">
          <h3>Coaching Recommendations</h3>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{analysis.recommendations}</div>
        </div>
      )}

      <div className="card">
        <h3>Transcript</h3>
        <p style={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.7 }}>
          {analysis?.transcript || 'No transcript available.'}
        </p>
      </div>
    </main>
  );
}
