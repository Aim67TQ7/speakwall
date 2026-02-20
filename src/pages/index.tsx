import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, signOut } = useAuth();
  return (
    <main>
      <header className="row">
        <h1 style={{ margin: 0 }}>PublicSpeakingSim</h1>
        <div style={{ marginLeft: 'auto' }}>
          {user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <button onClick={signOut}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup">Sign up</Link>
            </>
          )}
        </div>
      </header>
      <section className="card">
        <h2>AI-powered public speaking coach</h2>
        <p>Record a 2-5 minute practice speech and get instant feedback on filler words, pacing, volume, and eye contact.</p>
        <div className="space" />
        <Link href={user ? '/record' : '/signup'}>
          <button>{user ? 'Start Recording' : 'Get Started (Free Trial)'}</button>
        </Link>
      </section>
      <section className="card">
        <h3>Free Trial</h3>
        <p>Try 3 sessions free. Upgrade anytime to unlock full analytics and history.</p>
      </section>
    </main>
  );
}

