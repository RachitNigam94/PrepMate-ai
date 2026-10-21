import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Play, RefreshCw, Volume2, Info } from 'lucide-react';

interface SpeechRecorderProps {
  onTranscriptUpdate: (newText: string, append: boolean) => void;
  disabled?: boolean;
}

// Typing for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function SpeechRecorder({ onTranscriptUpdate, disabled }: SpeechRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [supported, setSupported] = useState(true);
  const [wordCount, setWordCount] = useState(0);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  function startRecording() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setIsPaused(false);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (finalChunk) {
          onTranscriptUpdate(finalChunk, true);
          setWordCount((prev) => prev + finalChunk.trim().split(/\s+/).length);
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        // If recording was not explicitly stopped and not paused, auto restart
        if (isRecording && !isPaused) {
          try {
            recognition.start();
          } catch {
            setIsRecording(false);
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setSeconds(0);
      setWordCount(0);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  }

  function pauseRecording() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsPaused(true);
  }

  function resumeRecording() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // ignore
      }
    }
    setIsPaused(false);
  }

  function stopRecording() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setInterimText('');
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Pace: Words per minute
  const wpm = seconds > 5 ? Math.round((wordCount / seconds) * 60) : 0;
  const paceFeedback =
    wpm === 0
      ? ''
      : wpm > 170
      ? 'A bit fast (aim for 120-150 WPM)'
      : wpm < 100
      ? 'A bit slow / pausing often'
      : 'Optimal placement pace (120-150 WPM)';

  if (!supported) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
        <Info className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Voice speech-to-text is supported in Chrome, Edge, and Safari. You can type in the box below!</span>
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-3.5 mb-4 shadow-xs text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              disabled={disabled}
              onClick={startRecording}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[3px] bg-red-600 hover:bg-red-700 text-white font-bold text-xs tracking-wide shadow-xs transition-colors"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Record Out Loud</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-blue-900 text-white font-bold text-xs shadow-xs"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Done Speaking</span>
              </button>

              {isPaused ? (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-600"
                >
                  <span>Pause</span>
                </button>
              )}
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono text-xs font-bold text-slate-900">{formatTime(seconds)}</span>
              {wpm > 0 && (
                <span className="text-xs font-mono text-slate-600 ml-1">
                  · {wpm} WPM <span className="hidden sm:inline font-sans text-[11px] text-blue-900 font-bold">({paceFeedback})</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-blue-800" />
          <span>Speak clearly as if talking to an interviewer</span>
        </div>
      </div>

      {interimText && (
        <div className="mt-2 text-xs text-slate-800 bg-slate-50 p-2.5 rounded border border-dashed border-slate-300">
          Listening: &ldquo;{interimText}&rdquo;
        </div>
      )}
    </div>
  );
}
