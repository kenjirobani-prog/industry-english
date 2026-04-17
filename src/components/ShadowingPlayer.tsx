'use client';

import { useEffect, useRef, useState } from 'react';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';
import { incrementShadowingCount } from '@/lib/storage';

type Props = {
  keywordId: string;
  sentence: string;
  translation: string;
};

type RecState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'recorded'
  | 'denied'
  | 'unsupported';

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  for (const type of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined; // browser default
}

export function ShadowingPlayer({ keywordId, sentence, translation }: Props) {
  const [recState, setRecState] = useState<RecState>('idle');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [autoPlayed, setAutoPlayed] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingUrlRef = useRef<string | null>(null);

  const ttsReady = isTTSAvailable();

  // Detect MediaRecorder support up front.
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setRecState('unsupported');
    }
  }, []);

  // Auto-play the example once on mount.
  useEffect(() => {
    if (autoPlayed || !ttsReady) return;
    const t = setTimeout(() => {
      speak(sentence, { rate: 0.95 });
      setAutoPlayed(true);
    }, 600);
    return () => clearTimeout(t);
  }, [autoPlayed, ttsReady, sentence]);

  // Cleanup on unmount: cancel speech, stop tracks, revoke any Blob URL.
  useEffect(() => {
    return () => {
      cancelSpeech();
      mediaRecorderRef.current?.stream
        .getTracks()
        .forEach((t) => t.stop());
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
        recordingUrlRef.current = null;
      }
    };
  }, []);

  const setUrl = (url: string | null) => {
    if (recordingUrlRef.current && recordingUrlRef.current !== url) {
      URL.revokeObjectURL(recordingUrlRef.current);
    }
    recordingUrlRef.current = url;
    setRecordingUrl(url);
  };

  const handleReplayExample = () => speak(sentence, { rate: 0.95 });

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const startRecording = async () => {
    if (recState === 'unsupported') return;
    setRecState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType ?? recorder.mimeType ?? 'audio/webm',
        });
        const url = URL.createObjectURL(blob);
        setUrl(url);
        setRecState('recorded');
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCount(incrementShadowingCount(keywordId));
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setRecState('idle');
      };

      recorder.start();
      setRecState('recording');
    } catch (err) {
      const name = (err as DOMException | undefined)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setRecState('denied');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setRecState('unsupported');
      } else {
        setRecState('idle');
      }
    }
  };

  const handlePlayRecording = () => {
    audioRef.current?.play().catch(() => {
      // Autoplay rejection — user can press the inline audio control instead.
    });
  };

  const handleResetRecording = () => {
    setUrl(null);
    setRecState('idle');
  };

  return (
    <section className="w-full max-w-xl mx-auto rounded-3xl border border-border-soft bg-surface-1/80 backdrop-blur p-6 sm:p-8">
      <div className="text-[10px] font-display tracking-widest uppercase text-gold mb-3">
        シャドウイング
      </div>
      <p className="text-lg sm:text-xl leading-relaxed text-amber-50 font-light mb-2">
        {sentence}
      </p>
      <p className="text-xs text-amber-100/60 leading-relaxed mb-6">
        {translation}
      </p>

      {/* Primary controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button
          type="button"
          onClick={handleReplayExample}
          disabled={!ttsReady}
          className="flex items-center gap-2 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-amber-500/30 transition"
        >
          <span aria-hidden>▶</span> お手本を再生
        </button>

        {recState === 'recording' ? (
          <button
            type="button"
            onClick={stopRecording}
            aria-pressed="true"
            className="flex items-center gap-2 rounded-full bg-red-500 text-white border border-red-400 px-4 py-2 text-sm font-semibold pulse-amber animate-pulse"
          >
            <span aria-hidden>⏹</span> 録音中... タップで停止
          </button>
        ) : recState === 'requesting' ? (
          <button
            type="button"
            disabled
            className="flex items-center gap-2 rounded-full bg-amber-500/30 text-amber-100 border border-amber-500/40 px-4 py-2 text-sm font-semibold cursor-wait"
          >
            <span aria-hidden>…</span> マイク許可待ち
          </button>
        ) : recState === 'recorded' ? (
          <>
            <button
              type="button"
              onClick={handlePlayRecording}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold px-4 py-2 text-sm hover:brightness-110 transition"
            >
              <span aria-hidden>▶</span> 再生
            </button>
            <button
              type="button"
              onClick={() => {
                handleResetRecording();
                startRecording();
              }}
              className="flex items-center gap-2 rounded-full bg-surface-2 text-amber-100 border border-border-soft px-4 py-2 text-sm font-semibold hover:bg-surface-3 transition"
            >
              <span aria-hidden>↻</span> もう一度録音
            </button>
          </>
        ) : recState === 'denied' || recState === 'unsupported' ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={recState === 'unsupported'}
            className="flex items-center gap-2 rounded-full bg-amber-500/10 text-amber-200/70 border border-amber-500/30 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-amber-500/20 transition"
          >
            <span aria-hidden>🎤</span> 再試行
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold px-4 py-2 text-sm hover:brightness-110 transition"
          >
            <span aria-hidden>🎤</span> 録音する
          </button>
        )}
      </div>

      {/* Recorded audio + controls */}
      {recState === 'recorded' && recordingUrl && (
        <div className="rounded-2xl bg-surface-2 border border-border-soft p-4">
          <div className="text-[10px] font-display tracking-widest uppercase text-gold mb-2">
            あなたの録音
          </div>
          <audio ref={audioRef} controls src={recordingUrl} className="w-full" />
          <p className="text-[11px] text-amber-100/60 mt-2">
            お手本と聴き比べてみましょう。
          </p>
        </div>
      )}

      {/* Error states */}
      {recState === 'denied' && (
        <div className="rounded-2xl border border-red-500/40 bg-red-700/15 p-4 text-sm text-red-100">
          🎤 マイクへのアクセスを許可してください。
          <p className="text-[11px] text-red-200/70 mt-1">
            ブラウザのアドレスバー横のサイト設定からマイクを許可した後、再試行してください。
          </p>
        </div>
      )}
      {recState === 'unsupported' && (
        <p className="text-[11px] text-amber-100/50">
          このブラウザでは録音機能をご利用いただけません。
        </p>
      )}

      {count > 0 && (
        <p className="text-[11px] text-amber-200/60 mt-4 font-display tracking-wider">
          通算シャドウイング回数: {count}
        </p>
      )}
    </section>
  );
}
