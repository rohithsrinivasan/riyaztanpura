# Future Features & Improvements for My Riyaz

**Planning Document for Feature Expansion**  
**Ranked by Implementation Difficulty (Easy → Expert)**

---

## 📊 Feature Priority Matrix

```
Impact on User Experience (High/Medium/Low) vs Effort (Easy/Medium/Hard)

HIGH IMPACT, EASY:
- Recording practice sessions
- Practice timer
- Scale reference tones

HIGH IMPACT, MEDIUM:
- Tabla tehra (rhythmic percussion)
- Custom raag mode
- BPM tap tempo

HIGH IMPACT, HARD:
- Full tabla instrument
- AI practice feedback
- Raag theory knowledge base

MEDIUM IMPACT, EASY:
- Dark mode theme
- Transposition shortcuts
- Practice statistics

LOW IMPACT, EASY:
- Export session logs
- Settings export/import
```

---

## 🟩 TIER 1: Easy Improvements (0.5-1 day each)

### 1.1 🌙 Dark Mode Theme
**Difficulty**: 🟩 Easy  
**Time**: 2-3 hours  
**Impact**: Medium (user preference)

**What it is**:
- Dark and light theme toggle
- Automatic detection based on device settings
- Theme preference saved to localStorage

**Implementation**:
```typescript
// lib/useTheme.ts
export function useTheme() {
  const [isDark, setIsDark] = usePersistentState('myriyaz:theme:dark', false);
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  
  return { isDark, toggleTheme: () => setIsDark(!isDark) };
}
```

**Tailwind changes**:
```typescript
// tailwind.config.ts
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1a1a1a',
          card: '#2a2a2a',
          text: '#f0f0f0',
        }
      }
    }
  }
};
```

**Features**:
- ✅ Toggle button in UI
- ✅ Auto-follow system preference
- ✅ Persistent across sessions
- ✅ Smooth color transitions

**UI Changes**: Add theme toggle button in header area

---

### 1.2 ⏱️ Practice Timer
**Difficulty**: 🟩 Easy  
**Time**: 2-3 hours  
**Impact**: High (core riyaz need)

**What it is**:
- User sets practice duration (15 min, 30 min, 1 hour, custom)
- Visual countdown timer
- Notification when time is up (optional sound/vibration)
- Statistics: total practice time this week/month

**Implementation**:
```typescript
// components/PracticeTimer.tsx
export default function PracticeTimer() {
  const [duration, setDuration] = useState(30); // minutes
  const [remaining, setRemaining] = useState(duration * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          // Trigger notification/sound
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);
  
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-5xl font-mono">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}
```

**Features**:
- ✅ Preset durations (15, 30, 60 min)
- ✅ Custom duration input
- ✅ Pause/resume
- ✅ Sound + vibration notification
- ✅ Week/month statistics

**Storage**:
```typescript
type PracticeSession = {
  date: string; // YYYY-MM-DD
  duration: number; // seconds
  device: string; // 'tanpura' | 'major-pad' | 'minor-pad'
  pitches: string[]; // pitches practiced
};

// Store in localStorage
localStorage.setItem('myriyaz:sessions', JSON.stringify([...sessions]));
```

**UI Integration**: Add timer as overlay or sidebar in main page

---

### 1.3 🎵 Scale Reference Tones
**Difficulty**: 🟩 Easy  
**Time**: 3-4 hours  
**Impact**: High (learning aid)

**What it is**:
- Display a scale (Sa Re Ga Ma Pa Dha Ni) with individual tone buttons
- Click any tone to hear reference pitch
- Visual representation of the scale
- Common raag scales included

**Implementation**:
```typescript
// lib/scales.ts
export type Scale = {
  id: string;
  name: string;
  description: string;
  tones: Tone[];
};

export type Tone = {
  label: string; // 'Sa', 'Re', 'Ga', etc.
  pitch: string; // 'C', 'D', 'E', etc.
  isBhayu?: boolean; // "bent" note indicator
};

export const SCALES = [
  {
    id: 'sa-re-ga',
    name: 'Sa Re Ga',
    tones: [
      { label: 'Sa', pitch: 'C' },
      { label: 'Re', pitch: 'D' },
      { label: 'Ga', pitch: 'E' },
    ]
  },
  // ... more scales
];
```

```typescript
// components/ScaleReference.tsx
export default function ScaleReference() {
  const [selectedScale, setSelectedScale] = useState('sa-re-ga');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const scale = SCALES.find(s => s.id === selectedScale);
  
  const playTone = (pitch: string) => {
    if (audioRef.current) {
      audioRef.current.src = `/audio/${pitch}.webm`;
      audioRef.current.play();
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <select value={selectedScale} onChange={e => setSelectedScale(e.target.value)}>
        {SCALES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      
      <div className="flex gap-2">
        {scale?.tones.map(tone => (
          <button
            key={tone.label}
            onClick={() => playTone(tone.pitch)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded border"
          >
            <span className="font-bold">{tone.label}</span>
            <span className="text-xs">{tone.pitch}</span>
          </button>
        ))}
      </div>
      
      <audio ref={audioRef} preload="none" />
    </div>
  );
}
```

**Scales to include**:
- Arohana (ascending)
- Avarohana (descending)
- Common raags (Bhairav, Yaman, Kharaharapriya, etc.)
- Alternates for student learning

**UI Integration**: Modal or sidebar panel accessible from main page

---

### 1.4 📊 Weekly Statistics
**Difficulty**: 🟩 Easy  
**Time**: 2-3 hours  
**Impact**: Medium (motivation)

**What it is**:
- Show total practice time this week
- Show practice time by day
- Show most-practiced device/pitch
- Simple bar chart or progress ring

**Implementation**:
```typescript
// lib/stats.ts
export function getWeeklyStats() {
  const sessions = getPracticeSessions();
  const thisWeek = sessions.filter(s => isThisWeek(s.date));
  
  const totalMinutes = thisWeek.reduce((sum, s) => sum + s.duration / 60, 0);
  
  const byDevice = groupBy(thisWeek, 'device');
  const byDay = groupBy(thisWeek, 'date');
  
  return { totalMinutes, byDevice, byDay };
}
```

**UI Component**:
```typescript
// components/WeeklyStats.tsx
export default function WeeklyStats() {
  const { totalMinutes, byDevice, byDay } = getWeeklyStats();
  
  return (
    <div className="rounded-lg bg-card p-4 gap-4 flex flex-col">
      <div>
        <div className="text-3xl font-bold">{totalMinutes.toFixed(0)}</div>
        <div className="text-sm text-gray-600">minutes this week</div>
      </div>
      
      <div className="flex gap-1 h-24 items-end">
        {Object.entries(byDay).map(([day, sessions]) => (
          <div
            key={day}
            className="flex-1 bg-blue-500 rounded-t"
            style={{ height: `${(sessions.length / 10) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### 1.5 ↔️ Transposition Shortcuts
**Difficulty**: 🟩 Easy  
**Time**: 1-2 hours  
**Impact**: Low (convenience)

**What it is**:
- Keyboard shortcuts for pitch up/down (+1/-1 semitone)
- Keyboard shortcuts for device switching (left/right arrow)
- Shortcuts for BPM adjustment (up/down arrow)

**Implementation**:
```typescript
// lib/useKeyboardShortcuts.ts
export function useKeyboardShortcuts(handlers: {
  onPitchUp: () => void;
  onPitchDown: () => void;
  onBpmUp: () => void;
  onBpmDown: () => void;
  onDeviceNext: () => void;
  onDevicePrev: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        if (e.ctrlKey) handlers.onBpmUp();
        else handlers.onPitchUp();
      }
      if (e.key === 'ArrowDown') {
        if (e.ctrlKey) handlers.onBpmDown();
        else handlers.onPitchDown();
      }
      if (e.key === 'ArrowLeft') handlers.onDevicePrev();
      if (e.key === 'ArrowRight') handlers.onDeviceNext();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
```

**Shortcuts**:
| Key | Action |
|---|---|
| ↑ | Pitch up |
| ↓ | Pitch down |
| ← | Previous device |
| → | Next device |
| Ctrl+↑ | BPM +5 |
| Ctrl+↓ | BPM -5 |
| Space | Play/Pause |

---

## 🟨 TIER 2: Medium Improvements (1-3 days each)

### 2.1 🥁 Tabla Tehra (Basic Rhythmic Pattern)
**Difficulty**: 🟨 Medium  
**Time**: 8-12 hours  
**Impact**: High (essential for riyaz)

**What it is**:
- Pre-recorded tabla pattern (tehra) that plays along with tanpura
- Common tehra patterns: Tin Tal (16-beat), Ek Tal (12-beat), Jhap Tal (10-beat)
- Adjustable BPM that syncs across tanpura + tabla + metronome
- Visual beat indicator shows tabla pattern

**Why separate from metronome**:
- Tabla has complex rhythmic patterns (not just clicks)
- Multiple tones (bols): Ba, Dha, Ge, Kat, Ta, etc.
- Layered patterns (first time, second time)
- Players need to practice alap to tabla timing

**Pre-requisites**:
- Record 3-4 tabla tehra patterns (professional recordings)
- Each pattern at multiple tempos (or use audio stretching)
- High-quality samples

**Implementation Overview**:
```typescript
// lib/tehra.ts
export type Tehra = {
  id: string;
  name: string; // 'Tin Tal', 'Ek Tal', etc.
  beats: number; // 16, 12, 10, etc.
  description: string;
  audioFile: (bpm: number) => string;
};

export const TEHRAS: Tehra[] = [
  {
    id: 'tin-tal',
    name: 'Tin Tal (16-beat)',
    beats: 16,
    description: '3-clap, 1-tap, 3-clap, 1-tap (most common)',
    audioFile: (bpm) => `/audio-tabla/tin-tal-${bpm}.webm`,
  },
  // ...
];
```

```typescript
// components/TablaSection.tsx
export default function TablaSection() {
  const [tehra, setTehra] = useState('tin-tal');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const play = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  return (
    <section className="flex flex-col gap-4">
      <select value={tehra} onChange={e => setTehra(e.target.value)}>
        {TEHRAS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      
      <button onClick={play}>{isPlaying ? 'Stop' : 'Play'}</button>
      
      <audio
        ref={audioRef}
        src={`/audio-tabla/${tehra}-${currentBpm}.webm`}
        loop
        onPause={() => setIsPlaying(false)}
      />
    </section>
  );
}
```

**Assets Needed**:
- 3-4 tehra patterns × ~10 BPM ranges = 30-40 audio files
- ~2-3 hours professional recording + editing
- Audio conversion to WebM/MP4

**Challenges**:
- Recording high-quality tabla is difficult
- Syncing with tanpura/metronome at different tempos
- Alternative: Use existing royalty-free tabla recordings (Creative Commons)

**Benefits**:
- Dramatically increases app value for riyaz
- Makes it suitable for serious practitioners
- Keeps users in app longer

---

### 2.2 🎼 Custom Raag Mode
**Difficulty**: 🟨 Medium  
**Time**: 6-8 hours  
**Impact**: High (learning)

**What it is**:
- Select a raag (e.g., "Bhairav", "Yaman", "Kalyan")
- App shows:
  - Scale (aroha/avarohana)
  - Vadi/Samvadi (important notes)
  - Typical rasa/mood
  - Practice tips
- Tanpura automatically set to raag tonic (Sa)
- Scale reference shows only raag notes (not chromatic)
- Optional: Highlight "forbidden" note combinations

**Raag Database**:
```typescript
// lib/raags.ts
export type Raag = {
  id: string;
  name: string;
  aroha: string[]; // ascending pitches
  avarohana: string[]; // descending pitches
  vadi: string; // most important note
  samvadi: string; // second important note
  thaat: string; // classical thaat
  rasa: string[]; // mood/emotion
  season: string;
  time: string; // appropriate time to sing
  description: string;
};

export const RAAGS: Raag[] = [
  {
    id: 'bhairav',
    name: 'Bhairav',
    aroha: ['C', 'C#', 'E', 'F', 'G', 'A#', 'B'],
    avarohana: ['B', 'A#', 'G', 'F', 'E', 'C#', 'C'],
    vadi: 'G',
    samvadi: 'C',
    thaat: 'Bhairav',
    rasa: ['gravity', 'seriousness'],
    season: 'Winter',
    time: 'Early morning',
    description: 'Ancient raag with serious, devotional mood. Characterized by energetic movement.'
  },
  // ... 10-20 more raags
];
```

**UI Component**:
```typescript
// components/RaagMode.tsx
export default function RaagMode() {
  const [selectedRaag, setSelectedRaag] = useState('bhairav');
  const raag = RAAGS.find(r => r.id === selectedRaag);
  
  return (
    <div className="flex flex-col gap-4">
      <select value={selectedRaag} onChange={e => setSelectedRaag(e.target.value)}>
        {RAAGS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      
      <div className="bg-card p-4 rounded-lg">
        <h3 className="font-bold">{raag?.name}</h3>
        <p className="text-sm text-gray-600">{raag?.description}</p>
        
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <div>
            <strong>Aroha:</strong>
            <div>{raag?.aroha.join(' → ')}</div>
          </div>
          <div>
            <strong>Avarohana:</strong>
            <div>{raag?.avarohana.join(' → ')}</div>
          </div>
          <div>
            <strong>Vadi:</strong> {raag?.vadi}
          </div>
          <div>
            <strong>Samvadi:</strong> {raag?.samvadi}
          </div>
          <div>
            <strong>Rasa:</strong> {raag?.rasa.join(', ')}
          </div>
          <div>
            <strong>Time:</strong> {raag?.time}
          </div>
        </div>
      </div>
      
      {/* Scale reference showing only raag notes */}
      <ScaleReference pitches={raag?.aroha} />
    </div>
  );
}
```

**Integration**:
- Add "Raag Mode" toggle in settings
- When enabled, auto-select tanpura pitch to raag Sa
- Highlight scale notes in color
- Hide chromatic pitches from selection

---

### 2.3 🎯 BPM Tap Tempo
**Difficulty**: 🟨 Medium  
**Time**: 4-6 hours  
**Impact**: Medium (convenience for musicians)

**What it is**:
- User taps a button repeatedly to set BPM
- App calculates average BPM from tap intervals
- More natural than typing in numbers
- Used by professional musicians

**Implementation**:
```typescript
// lib/useTapTempo.ts
export function useTapTempo() {
  const tapsRef = useRef<number[]>([]);
  
  const tap = () => {
    const now = Date.now();
    tapsRef.current.push(now);
    
    // Keep only last 8 taps (for stability)
    if (tapsRef.current.length > 8) {
      tapsRef.current.shift();
    }
    
    // Calculate BPM if we have 2+ taps
    if (tapsRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapsRef.current.length; i++) {
        intervals.push(tapsRef.current[i] - tapsRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const bpm = Math.round(60000 / avgInterval); // Convert ms to BPM
      return bpm;
    }
    
    return null;
  };
  
  const reset = () => {
    tapsRef.current = [];
  };
  
  return { tap, reset };
}
```

```typescript
// components/TapTempoButton.tsx
export default function TapTempoButton({ onBpmDetected }: any) {
  const { tap, reset } = useTapTempo();
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  
  const handleTap = () => {
    const bpm = tap();
    if (bpm) {
      setDetectedBpm(bpm);
      onBpmDetected(bpm);
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleTap}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg"
      >
        Tap Tempo
      </button>
      
      {detectedBpm && (
        <div className="text-2xl font-bold">{detectedBpm} BPM</div>
      )}
      
      <button
        onClick={reset}
        className="text-sm text-gray-600"
      >
        Reset
      </button>
    </div>
  );
}
```

**UI Integration**: Add "Tap Tempo" mode toggle in metronome section

---

## 🔴 TIER 3: Hard/Expert Features (3-7 days each)

### 3.1 🥁 Full Tabla Instrument
**Difficulty**: 🔴 Hard  
**Time**: 40-60 hours  
**Impact**: Very High (professional tool)

**What it is**:
- Full tabla synthesizer/player
- User can tap individual tabla bols (Ba, Dha, Ge, Kat, Ta, Na)
- Play tabla patterns by clicking/tapping
- Record and loop custom patterns
- Sync with tanpura and metronome at same BPM
- Visual tabla pad display (like drum machine)

**Why it's hard**:
- Requires understanding of tabla technique
- Recording high-quality individual tabla sounds
- Building a full grid-based interface (like DAW)
- Synchronization complexity

**Architecture**:
```typescript
// lib/tablaEngine.ts (similar to metronomeEngine)
export class TablaEngine {
  private ctx: AudioContext;
  private samples: Map<string, AudioBuffer> = new Map();
  
  // Tabla bols
  private bols = ['Ba', 'Dha', 'Ge', 'Kat', 'Ta', 'Na'];
  
  async loadSamples() {
    for (const bol of this.bols) {
      const buffer = await fetchAndDecodeAudio(`/audio-tabla/${bol}.wav`);
      this.samples.set(bol, buffer);
    }
  }
  
  playBol(bol: string, time: number = 0) {
    const buffer = this.samples.get(bol);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start(this.ctx.currentTime + time);
  }
}
```

**UI (Grid-based Pattern Builder)**:
```typescript
// components/TablaPattern.tsx
export default function TablaPatternBuilder() {
  const [pattern, setPattern] = useState<string[][]>(
    Array(16).fill(Array(6).fill(null)) // 16 beats × 6 bols
  );
  const tableRef = useRef<TablaEngine | null>(null);
  
  const handleBolClick = (beat: number, bolIndex: number) => {
    const newPattern = [...pattern];
    newPattern[beat] = [...newPattern[beat]];
    newPattern[beat][bolIndex] = newPattern[beat][bolIndex] ? null : 'X';
    setPattern(newPattern);
  };
  
  const playPattern = () => {
    // Play each beat with its bols
    pattern.forEach((bols, beatIndex) => {
      const time = (beatIndex / 16) * 2; // Adjust for tempo
      bols.forEach((bol, bolIndex) => {
        if (bol) tableRef.current?.playBol(tableRef.current.bols[bolIndex], time);
      });
    });
  };
  
  return (
    <div className="flex flex-col gap-4">
      <table className="border-collapse border border-gray-300">
        <thead>
          <tr>
            {tableRef.current?.bols.map(bol => (
              <th key={bol} className="border border-gray-300 p-2">{bol}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pattern.map((bols, beatIndex) => (
            <tr key={beatIndex}>
              {bols.map((bol, bolIndex) => (
                <td
                  key={`${beatIndex}-${bolIndex}`}
                  onClick={() => handleBolClick(beatIndex, bolIndex)}
                  className={`border border-gray-300 p-4 cursor-pointer ${
                    bol ? 'bg-blue-500' : 'bg-white'
                  }`}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <button onClick={playPattern}>Play Pattern</button>
    </div>
  );
}
```

**Assets Required**:
- 6 individual tabla bol samples (high quality)
- Multiple dynamics (soft, medium, loud)
- Total: ~50-100 audio files

**Challenges**:
- Tabla is complex; hard to record convincingly
- Professional tabla samples are expensive
- Algorithm to sync tabla with tanpura precisely
- UX for pattern builder (learn from existing DAWs)

**Alternatives**:
- Use MIDI library (Tone.js) to synthesize tabla
- Partner with tabla player to record samples
- License existing tabla sample packs

---

### 3.2 🤖 AI Practice Feedback (Machine Learning)
**Difficulty**: 🔴 Hard  
**Time**: 60-100 hours  
**Impact**: Very High (game-changing)

**What it is**:
- App listens to user's voice while they practice
- AI analyzes pitch accuracy, rhythm, timing
- Provides real-time feedback:
  - "Pitch too high" / "Pitch too low"
  - "Rushing ahead" / "Dragging behind"
  - "Nice transition!" / "Raag note violation"
- Shows score/rating after practice session
- Tracks improvement over time

**Why it's hard**:
- Requires machine learning model training
- Real-time audio analysis is computationally heavy
- Building accurate pitch detection
- Handling room noise, microphone quality
- Training dataset of good/bad riyaz recordings

**High-level Architecture**:
```typescript
// lib/pitchDetector.ts
import Pitchfinder from 'pitchfinder'; // 3rd party library

export async function analyzePracticeSession(audioBuffer: AudioBuffer) {
  const pitchDetector = new Pitchfinder();
  const detectedPitches = pitchDetector.processPitches(audioBuffer);
  
  // Compare against expected raag notes
  const errors = detectedPitches.map((pitch, i) => {
    const expected = expectedPitches[i];
    const cents = 1200 * Math.log2(pitch / expected);
    return { pitch, expected, cents, isWrong: Math.abs(cents) > 50 };
  });
  
  const accuracy = (1 - errors.filter(e => e.isWrong).length / errors.length) * 100;
  return { accuracy, errors };
}

// Build a score
export function generateFeedback(analysis: any) {
  return {
    pitchAccuracy: analysis.accuracy,
    timing: analyzeRhythmicTiming(analysis),
    raagCompliance: checkRaagNotes(analysis),
    overallScore: weightedAverage([...]),
    suggestions: generateSuggestions(analysis)
  };
}
```

**ML Model Options**:
1. **TensorFlow.js** (in-browser model)
   - Pros: Privacy, offline capability
   - Cons: Limited accuracy, resource-heavy
   - Example: Use pre-trained CREPE pitch detection model

2. **Server-side API** (e.g., cloud ML)
   - Pros: Better accuracy, more sophisticated analysis
   - Cons: Requires internet, privacy concerns, costs
   - Example: Send audio to server, get feedback via API

3. **Hybrid**: Client-side pitch detection + server-side analysis

**UI for Feedback**:
```typescript
// components/PracticeScoreCard.tsx
export default function PracticeScoreCard({ feedback }: any) {
  return (
    <div className="rounded-lg bg-card p-6 flex flex-col gap-4">
      <div className="text-5xl font-bold text-center">{feedback.overallScore}/100</div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-3xl">{feedback.pitchAccuracy}%</div>
          <div className="text-xs text-gray-600">Pitch</div>
        </div>
        <div className="text-center">
          <div className="text-3xl">{feedback.timing}%</div>
          <div className="text-xs text-gray-600">Timing</div>
        </div>
        <div className="text-center">
          <div className="text-3xl">{feedback.raagCompliance}%</div>
          <div className="text-xs text-gray-600">Raag</div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded">
        {feedback.suggestions.map((s: string) => (
          <div key={s} className="flex gap-2 mb-2">
            <span className="text-yellow-600">💡</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Challenges**:
- Pitch detection accuracy varies with microphone quality
- Heavy computations needed (slow on low-end devices)
- Training data: need ~1000 hours of riyaz recordings
- Raag knowledge is complex; hard to codify
- Privacy: users may not want to send audio to servers

**Path Forward**:
1. **MVP**: Simple pitch accuracy check (use Tone.js pitch detection)
2. **V2**: Add rhythm analysis (compare to metronome BPM)
3. **V3**: Add raag knowledge (check against selected raag scale)
4. **V4**: Train ML model on real recordings (partner with teachers/musicians)

---

### 3.3 📚 Raag Theory Knowledge Base
**Difficulty**: 🔴 Hard  
**Time**: 40-80 hours  
**Impact**: High (educational)

**What it is**:
- Comprehensive guide to Indian classical music theory
- Explanation of each raag: history, characteristics, practice tips
- Video tutorials (embedded YouTube)
- Audio examples of famous singers performing each raag
- Practice exercises for each raag
- Glossary of musical terms (in English + Hindi/Sanskrit)

**Why it's hard**:
- Requires deep music knowledge (domain expertise)
- Lots of content creation (writing, video, audio)
- Localization (Hindi, Marathi, Bengali, Tamil, etc.)
- Keeping content accurate and up-to-date
- Licensing music/video content

**Content Structure**:
```typescript
// lib/raagGuide.ts
export type RaagGuide = {
  raag: Raag;
  history: string;
  characteristics: string;
  practiceExercises: Exercise[];
  famousSingers: Singer[];
  videoExamples: Video[];
  relatedRaags: string[];
  tips: string[];
};

export type Exercise = {
  id: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  steps: string[];
};

export const RAAG_GUIDES: Record<string, RaagGuide> = {
  bhairav: {
    raag: RAAGS.find(r => r.id === 'bhairav')!,
    history: 'Bhairav is one of the oldest raags in Hindustani classical music...',
    characteristics: 'Characterized by...',
    practiceExercises: [
      {
        id: 'bhairav-1',
        description: 'Learn the basic ascending scale',
        difficulty: 'beginner',
        duration: 15,
        steps: [
          'Sing Sa (do) slowly',
          'Move to Re (step 2)',
          'Continue with Ga, Ma, Pa, Dha, Ni, Sa(high)',
          'Focus on proper interval pronunciation',
        ]
      },
      // ...more exercises
    ],
    famousSingers: [
      { name: 'Ustad Amir Khan', era: '1912-1974' },
      { name: 'Pandit Kumar Gandharva', era: '1924-1992' },
    ],
    videoExamples: [
      { title: 'Bhairav by Ustad Amir Khan', youtubeId: 'xxx' },
    ],
    relatedRaags: ['Ahir Bhairav', 'Bhairav Bahar'],
    tips: [
      'Practice the vadi note (G) extensively',
      'Understand the gravity and seriousness of Bhairav',
      'Common in morning concerts',
    ]
  },
  // ...raag guides for all raags
};
```

**UI Implementation**:
```typescript
// components/RaagGuide.tsx
export default function RaagGuide({ raagId }: any) {
  const guide = RAAG_GUIDES[raagId];
  
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-bold">{guide.raag.name}</h1>
      
      <section>
        <h2 className="text-xl font-bold mb-2">History</h2>
        <p>{guide.history}</p>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-2">Characteristics</h2>
        <p>{guide.characteristics}</p>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-2">Practice Exercises</h2>
        <div className="flex flex-col gap-2">
          {guide.practiceExercises.map(ex => (
            <div key={ex.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-bold">{ex.description}</h3>
              <p className="text-sm text-gray-600">{ex.difficulty} • {ex.duration} min</p>
              <ol className="list-decimal list-inside text-sm mt-2">
                {ex.steps.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-2">Listen to Examples</h2>
        <div className="flex flex-col gap-2">
          {guide.videoExamples.map(vid => (
            <iframe
              key={vid.youtubeId}
              width="100%"
              height="300"
              src={`https://www.youtube.com/embed/${vid.youtubeId}`}
              title={vid.title}
            />
          ))}
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-2">Famous Singers</h2>
        <ul>
          {guide.famousSingers.map(singer => (
            <li key={singer.name}>{singer.name} ({singer.era})</li>
          ))}
        </ul>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-2">Tips for Practice</h2>
        <ul className="list-disc list-inside">
          {guide.tips.map(tip => <li key={tip}>{tip}</li>)}
        </ul>
      </section>
    </div>
  );
}
```

**Content Creation Plan**:
- Hire 1-2 musicians to write content
- Partner with YouTube creators for video examples
- Create ~50+ practice exercises across all raags
- Write glossary of 200+ terms
- **Estimated time**: 200-400 hours (outsource to domain experts)

**Challenges**:
- Finding accurate, accessible content
- Licensing music/video content (copyright)
- Keeping content current with changing traditions
- Balancing academic rigor with accessibility

---

## 📋 Implementation Priority Matrix

```
HIGH IMPACT, LOW EFFORT → Do First:
1. Dark Mode Theme (2-3h)
2. Practice Timer (2-3h)
3. Scale Reference Tones (3-4h)
4. Weekly Statistics (2-3h)

MEDIUM IMPACT, LOW EFFORT → Do Next:
5. Transposition Shortcuts (1-2h)
6. Tabla Tehra - Basic (8-12h)
7. BPM Tap Tempo (4-6h)

HIGH IMPACT, MEDIUM EFFORT → Plan & Execute:
8. Custom Raag Mode (6-8h)
9. Raag Theory Knowledge Base (40-80h) [outsource writing]

HIGH IMPACT, HIGH EFFORT → Long-term Vision:
10. Full Tabla Instrument (40-60h)
11. AI Practice Feedback (60-100h)
```

---

## 🚀 Recommended Rollout Plan

### Q1 2025 (Months 1-3)
- ✅ Complete mobile app (from NEXT_STEPS.md)
- 🎯 Implement Tier 1 features (dark mode, timer, stats)
- 🎯 Add Scale Reference Tones

### Q2 2025 (Months 4-6)
- 🎯 Tabla Tehra basic version
- 🎯 Custom Raag Mode
- 🎯 BPM Tap Tempo

### Q3-Q4 2025 (Months 7-12)
- 🎯 Raag Theory Knowledge Base (outsource)
- 🎯 Polish and optimize based on user feedback
- 🎯 Build community (Discord, Facebook group)

### 2026 (Year 2)
- 🎯 Full Tabla Instrument (if demand is high)
- 🎯 AI Practice Feedback (research + development)
- 🎯 Monetization strategy (freemium, subscriptions)

---

## 📞 Community & User Feedback Loop

Before building features:
1. **Survey users** (in-app or Reddit/Indian music forums)
2. **Talk to musicians** (get validation on importance)
3. **Prototype & test** with 5-10 power users
4. **Iterate based on feedback**

Example survey questions:
- "What would make this app essential for your daily practice?"
- "Which feature matters most: Tabla, Raag guide, or AI feedback?"
- "Would you pay a subscription for advanced features?"

---

## 🎓 Learning Resources for Building These Features

| Feature | Resources |
|---|---|
| **Dark Mode** | Tailwind dark mode docs, React Context |
| **Tabla/Percussion** | Web Audio API, recording techniques, musik theory books |
| **Raag Mode** | Indian classical music theory books, YouTube tutorials |
| **AI Feedback** | TensorFlow.js, Pitch detection algorithms, ML courses |
| **Knowledge Base** | WordPress/CMS, Markdown static site generators |
| **Tap Tempo** | Tone.js, audio timing patterns |

---

**End of Future Work Document**

Last updated: September 17, 2026  
Maintainer: @you  
Community input encouraged!
