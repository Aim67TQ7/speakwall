import { useEffect, useRef, useState } from 'react';

type Props = {
  onStop: (blob: Blob, elapsed: number) => void;
  maxSeconds?: number; // default 300 (5 min)
  minSeconds?: number; // default 120 (2 min)
};

export default function Recorder({ onStop, maxSeconds = 300, minSeconds = 120 }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (recording) {
      timer = setInterval(() => setElapsed((e) => { elapsedRef.current = e + 1; return e + 1; }), 1000);
    }
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (elapsed >= maxSeconds && recording) {
      stop();
    }
  }, [elapsed, maxSeconds, recording]);

  async function init() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to access camera/microphone');
    }
  }

  function start() {
    if (!stream) return;
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    setElapsed(0);
    elapsedRef.current = 0;
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      onStop(blob, elapsedRef.current);
    };
    mr.start(1000);
    setRecording(true);
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function cleanup() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>Timer:</strong>
        <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} (min 2:00, max 5:00)</span>
      </div>
      <div className="space" />
      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 8, background: '#000' }} />
      <div className="space" />
      {!stream ? (
        <button onClick={init}>Enable Camera & Mic</button>
      ) : !recording ? (
        <button onClick={start}>Start Recording</button>
      ) : (
        <button onClick={stop} disabled={elapsed < minSeconds}>Stop Recording</button>
      )}
      <button style={{ marginLeft: 8 }} onClick={cleanup} disabled={!stream}>
        Disable Devices
      </button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}

