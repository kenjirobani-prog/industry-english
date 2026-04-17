'use client';

import { useEffect, useRef, useState } from 'react';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';
import { incrementShadowingCount } from '@/lib/storage';

type Props = {
  keywordId: string;
  sentence: string;
  translation: string;
};

type RecState = 'idle' | 'recording' | 'recorded' | 'unsupported';

export function ShadowingPlayer({ keywordId, sentence, translation }: Props) {
  const [recState, setRecState] = useState<RecState>('idle');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [autoPlayed, setAutoPlayed] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ttsReady = isTTSAvailable();

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
      setRecState('unsupported');
    }
  }, []);

  // Auto-play once on mount
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
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, [recordingUrl]);

  const handleReplay = () => speak(sentence, { rate: 0.95 });

  const handleRecord = async () => {
    if (recState === 'recording') {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(url);
        setRecState('recorded');
        stream.getTracks().forEach((t) => t.stop());
        setCount(incrementShadowingCount(keywordId));
      };
      recorder.start();
      setRecState('recording');
    } catch {
      setRecState('unsupported');
    }
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

      <div className="flex flex-wrap gap-3 mb-5">
        <button
          type="button"
          onClick={handleReplay}
          disabled={!ttsReady}
          className="flex items-center gap-2 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-amber-500/30 transition"
        >
          <span aria-hidden>▶</span> お手本を再生
        </button>

        {recState !== 'unsupported' && (
          <button
            type="button"
            onClick={handleRecord}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              recState === 'recording'
                ? 'bg-red-500 text-white pulse-amber'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:brightness-110'
            }`}
          >
            <span aria-hidden>{recState === 'recording' ? '⏹' : '🎤'}</span>
            {recState === 'recording' ? '録音停止' : '録音する'}
          </button>
        )}
      </div>

      {recState === 'recorded' && recordingUrl && (
        <div className="rounded-2xl bg-surface-2 border border-border-soft p-4">
          <div className="text-[10px] font-display tracking-widest uppercase text-gold mb-2">
            あなたの録音
          </div>
          <audio controls src={recordingUrl} className="w-full" />
          <p className="text-[11px] text-amber-100/60 mt-2">
            お手本と聴き比べてみましょう。
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
