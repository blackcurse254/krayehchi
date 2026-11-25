export function triggerHaptic(pattern: number | number[] = 25): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported browsers
    }
  }
}

export function playPaymentSuccessChime(): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Pleasant ascending C5 -> E5 -> G5 -> C6 warm payment chime
    const notes = [
      { freq: 523.25, start: 0, duration: 0.24, gain: 0.14 },
      { freq: 659.25, start: 0.09, duration: 0.28, gain: 0.14 },
      { freq: 783.99, start: 0.18, duration: 0.36, gain: 0.15 },
      { freq: 1046.5, start: 0.28, duration: 0.55, gain: 0.16 },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gainNode.gain.setValueAtTime(0.0001, now + note.start);
      gainNode.gain.exponentialRampToValueAtTime(note.gain, now + note.start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.02);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch {
    // Gracefully ignore audio restriction errors
  }
}
