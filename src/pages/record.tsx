import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Recorder from '@/components/Recorder';
import { useAuth } from '@/context/AuthContext';

export default function RecordPage() {
  const { sessionCount, user } = useAuth();
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const elapsedRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleStop(blob: Blob, elapsed: number) {
    blobRef.current = blob;
    elapsedRef.current = elapsed;
    setPreviewUrl(URL.createObjectURL(blob));
  }

  async function upload() {
    if (!previewUrl || !blobRef.current || !user) return;
    setUploading(true);
    setMessage(null);
    try {
      // Step 1: Get presigned upload URL
      setMessage('Preparing upload...');
      const presignRes = await fetch('/.netlify/functions/presign-upload', { method: 'POST' });
      const presign = await presignRes.json();
      if (!presignRes.ok) throw new Error(presign?.error || 'Presign failed');

      if (presign.mock) {
        setMessage('AWS not configured. Set env vars to enable uploads.');
        return;
      }

      // Step 2: Upload to S3
      setMessage('Uploading recording...');
      const form = new FormData();
      Object.entries(presign.fields).forEach(([k, v]) => form.append(k, String(v)));
      form.append('Content-Type', 'video/webm');
      form.append('file', blobRef.current, 'recording.webm');
      const s3Res = await fetch(presign.url, { method: 'POST', body: form });
      if (!s3Res.ok) throw new Error('S3 upload failed');

      // Step 3: Save metadata
      setMessage('Saving session...');
      const metaRes = await fetch('/.netlify/functions/recording-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recording_key: presign.key,
          duration_sec: elapsedRef.current,
          user_id: user.id
        })
      });
      const meta = await metaRes.json();
      if (!metaRes.ok) throw new Error(meta?.error || 'Failed to save session');
      const sessionId = meta.session_id;

      // Step 4: Analyze speech (Whisper transcription + metrics)
      setMessage('Analyzing your speech (this may take a minute)...');
      const analyzeRes = await fetch('/.netlify/functions/analyze-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, recording_key: presign.key })
      });
      const analysis = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analysis?.error || 'Analysis failed');

      // Step 5: Get GPT coaching recommendations
      setMessage('Generating coaching tips...');
      await fetch('/.netlify/functions/gpt-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          transcript: analysis.transcript,
          wpm: analysis.wpm,
          filler: analysis.filler
        })
      });

      // Navigate to results
      router.push(`/results?session=${sessionId}`);
    } catch (e: any) {
      setMessage(e?.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  const disabled = sessionCount >= 3;

  return (
    <main>
      <h1>Record your speech</h1>
      {disabled && (
        <div className="card" style={{ borderColor: '#f59e0b' }}>
          <strong>Trial limit reached.</strong> Please upgrade to continue.
        </div>
      )}
      <Recorder onStop={handleStop} />
      {previewUrl && (
        <div className="card">
          <h3>Preview</h3>
          <video src={previewUrl} controls style={{ width: '100%', borderRadius: 8 }} />
          <div className="space" />
          <button onClick={upload} disabled={uploading || disabled}>
            {uploading ? 'Processing...' : 'Upload & Analyze'}
          </button>
          {message && <p style={{ marginTop: 8 }}>{message}</p>}
        </div>
      )}
    </main>
  );
}
