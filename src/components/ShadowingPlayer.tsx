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
  return undefined;
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

  useEffect(() => {
    if (autoPlayed || !ttsReady) return;
    const t = setTimeout(() => {
      speak(sentence, { rate: 0.95 });
      setAutoPlayed(true);
    }, 600);
    return () => clearTimeout(t);
  }, [autoPlayed, ttsReady, sentence]);

  useEffect(() => {
    return () => {
      cancelSpeech();
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
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
    if (recorder && recorder.state !== 'inactive') recorder.stop();
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
    audioRef.current?.play().catch(() => undefined);
  };

  const handleResetRecording = () => {
    setUrl(null);
    setRecState('idle');
  };

  return (
    <section className="w-full rounded-[18px] bg-apple-black text-apple-fg-on-dark px-7 sm:px-10 py-10 sm:py-12 fade-up">
      <div className="t-eyebrow text-[var(--accent-on-dark)] mb-3">
        Shadowing
      </div>
      <p className="t-subtitle leading-snug text-white mb-3 font-normal">
        {sentence}
      </p>
      <p className="t-small text-apple-fg-on-dark-2 mb-8">{translation}</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={handleReplayExample}
          disabled={!ttsReady}
          className="btn btn-on-dark-secondary"
        >
          ▶ お手本を再生
        </button>

        {recState === 'recording' ? (
          <button
            type="button"
            onClick={stopRecording}
            aria-pressed="true"
            className="btn btn-on-dark-primary"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-white rec-blink" />
            録音中… タップで停止
          </button>
        ) : recState === 'requesting' ? (
          <button type="button" disabled className="btn btn-on-dark-secondary">
            … マイク許可待ち
          </button>
        ) : recState === 'recorded' ? (
          <>
            <button
              type="button"
              onClick={handlePlayRecording}
              className="btn btn-on-dark-primary"
            >
              ▶ 再生
            </button>
            <button
              type="button"
              onClick={() => {
                handleResetRecording();
                startRecording();
              }}
              className="btn btn-on-dark-secondary"
            >
              ↻ もう一度録音
            </button>
          </>
        ) : recState === 'denied' || recState === 'unsupported' ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={recState === 'unsupported'}
            className="btn btn-on-dark-secondary"
          >
            🎤 再試行
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="btn btn-on-dark-primary"
          >
            🎤 録音する
          </button>
        )}
      </div>

      {recState === 'recorded' && recordingUrl && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="t-eyebrow text-apple-fg-on-dark-2 mb-2">
            あなたの録音
          </div>
          <audio ref={audioRef} controls src={recordingUrl} className="w-full" />
          <p className="t-caption text-apple-fg-on-dark-2 mt-2">
            お手本と聴き比べてみましょう。
          </p>
        </div>
      )}

      {recState === 'denied' && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 t-body text-white">
          🎤 マイクへのアクセスを許可してください。
          <p className="t-small text-apple-fg-on-dark-2 mt-1">
            ブラウザのアドレスバー横のサイト設定からマイクを許可した後、再試行してください。
          </p>
        </div>
      )}
      {recState === 'unsupported' && (
        <p className="t-small text-apple-fg-on-dark-2">
          このブラウザでは録音機能をご利用いただけません。
        </p>
      )}

      {count > 0 && (
        <p className="t-caption text-apple-fg-on-dark-2 mt-6">
          通算シャドウイング回数: {count}
        </p>
      )}
    </section>
  );
}
