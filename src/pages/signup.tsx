import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Signup() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signUp(email, password);
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
    }
  };

  return (
    <main>
      <h1>Create your account</h1>
      <form onSubmit={onSubmit} className="card" style={{ maxWidth: 420 }}>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <div className="space" />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <div className="space" />
        <button type="submit">Sign up</button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <p>Already have an account? <Link href="/login">Login</Link></p>
      </form>
    </main>
  );
}

