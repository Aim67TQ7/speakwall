import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Recorder from '@/components/Recorder';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

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
      // Step 1: Upload to Supabase Storage
      setMessage('Uploading recording...');
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
      const recordingKey = `${datePrefix}/${crypto.randomUUID()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('speakwall-recordings')
        .upload(recordingKey, blobRef.current, { contentType: 'video/webm' });
      if (uploadError) throw new Error(uploadError.message);

      // Step 2: Save metadata
      setMessage('Saving session...');
      const metaRes = await fetch('/.netlify/functions/recording-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recording_key: recordingKey,
          duration_sec: elapsedRef.current,
          user_id: user.id
        })
      });
      const meta = await metaRes.json();
      if (!metaRes.ok) throw new Error(meta?.error || 'Failed to save session');
      const sessionId = meta.session_id;

      // Step 3: Analyze speech (Whisper transcription + metrics)
      setMessage('Analyzing your speech (this may take a minute)...');
      const analyzeRes = await fetch('/.netlify/functions/analyze-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, recording_key: recordingKey })
      });
      const analysis = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analysis?.error || 'Analysis failed');

      // Step 4: Get GPT coaching recommendations
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
