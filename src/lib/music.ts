// Original instrumental arrangements of public-domain carols, synthesized live (no recordings, no vocals).
type Note = [number | null, number]; // midi (null = rest), beats

const M = (s: string): Note[] =>
  s.split(" ").map((t) => {
    const [n, d] = t.split(":");
    return [n === "r" ? null : Number(n), Number(d)];
  });

const SONGS: { bpm: number; melody: Note[]; bass: number[] }[] = [
  // Silent Night (Gruber, 1818)
  {
    bpm: 66,
    melody: M("67:1.5 69:0.5 67:1 64:3 67:1.5 69:0.5 67:1 64:3 74:2 74:1 71:3 72:2 72:1 67:3 69:2 69:1 72:1.5 71:0.5 69:1 67:1.5 69:0.5 67:1 64:3 69:2 69:1 72:1.5 71:0.5 69:1 67:1.5 69:0.5 67:1 64:3 74:2 74:1 77:1.5 74:0.5 71:1 72:3 76:3 72:1 67:1 64:1 67:1.5 65:0.5 62:1 60:6"),
    bass: [48, 48, 43, 48, 41, 48, 41, 48, 43, 48, 43, 48],
  },
  // O Tannenbaum (traditional)
  {
    bpm: 84,
    melody: M("60:1 65:0.75 65:0.25 65:1.5 67:0.5 69:0.75 69:0.25 69:1.5 69:0.5 67:0.5 69:0.5 70:1 64:1 67:1 65:2 r:1 72:0.5 72:0.5 69:0.5 74:1.5 72:0.5 72:0.5 70:0.5 70:1.5 70:0.5 70:0.5 67:0.5 72:1.5 70:0.5 70:0.5 69:0.5 69:2 60:1 65:0.75 65:0.25 65:1.5 67:0.5 69:0.75 69:0.25 69:1.5 69:0.5 67:0.5 69:0.5 70:1 64:1 67:1 65:3"),
    bass: [41, 41, 48, 41, 41, 46, 48, 41, 41, 41, 48, 41],
  },
  // Deck the Halls (traditional Welsh)
  {
    bpm: 108,
    melody: M("72:1.5 70:0.5 69:1 67:1 65:1 67:1 69:1 65:1 67:0.5 69:0.5 70:0.5 67:0.5 69:1.5 67:0.5 65:1 64:1 65:2 72:1.5 70:0.5 69:1 67:1 65:1 67:1 69:1 65:1 67:0.5 69:0.5 70:0.5 67:0.5 69:1.5 67:0.5 65:1 64:1 65:4"),
    bass: [41, 48, 41, 48, 46, 41, 48, 41, 41, 48, 41, 48, 46, 41, 48, 41],
  },
];

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class Music {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;
  private timer: number | null = null;
  private songIdx = Math.floor(Math.random() * SONGS.length);

  start() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.22, ctx.currentTime + 3);
    // gentle reverb
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 2.6;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    conv.buffer = buf;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    master.connect(ctx.destination);
    master.connect(conv).connect(wet).connect(ctx.destination);
    this.master = master;
    this.playSong(ctx.currentTime + 0.3);
    document.addEventListener("visibilitychange", this.onVis);
  }

  private onVis = () => {
    if (!this.ctx) return;
    if (document.hidden) this.ctx.suspend();
    else this.ctx.resume();
  };

  private voice(t: number, midi: number, dur: number, kind: "bell" | "pad", vol: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.connect(this.master!);
    const partials: [number, number][] = kind === "bell" ? [[1, 1], [2, 0.35], [3.01, 0.12], [4.2, 0.05]] : [[1, 1], [2, 0.2]];
    for (const [mul, a] of partials) {
      const o = ctx.createOscillator();
      o.type = kind === "bell" ? "sine" : "triangle";
      o.frequency.value = hz(midi) * mul;
      const og = ctx.createGain();
      og.gain.value = a;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur + 1.6);
    }
    g.gain.setValueAtTime(0, t);
    if (kind === "bell") {
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur + 1.4);
    } else {
      g.gain.linearRampToValueAtTime(vol, t + 0.4);
      g.gain.linearRampToValueAtTime(vol * 0.7, t + dur);
      g.gain.linearRampToValueAtTime(0, t + dur + 1.2);
    }
  }

  private playSong(start: number) {
    const song = SONGS[this.songIdx]!;
    const beat = 60 / song.bpm;
    let t = start;
    for (const [n, d] of song.melody) {
      if (n !== null) this.voice(t, n, d * beat, "bell", 0.28);
      t += d * beat;
    }
    const total = t - start;
    const step = total / song.bass.length;
    song.bass.forEach((b, i) => {
      this.voice(start + i * step, b, step, "pad", 0.12);
      this.voice(start + i * step, b + 7, step, "pad", 0.06);
    });
    this.songIdx = (this.songIdx + 1) % SONGS.length;
    const wait = (t + 2.5 - this.ctx!.currentTime) * 1000;
    this.timer = window.setTimeout(() => this.ctx && this.playSong(this.ctx.currentTime + 0.2), wait);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(m ? 0 : 0.22, now + 0.8);
    }
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    document.removeEventListener("visibilitychange", this.onVis);
    this.ctx?.close();
    this.ctx = null;
  }
}

export const music = typeof window !== "undefined" ? new Music() : (null as unknown as Music);
