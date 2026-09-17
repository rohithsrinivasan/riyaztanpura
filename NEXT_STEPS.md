# Next Steps: Mobile Development Roadmap

**Last Updated**: September 17, 2026  
**Decision Point**: Review MOBILE_FEASIBILITY_ASSESSMENT.md before proceeding

---

## 🎯 Immediate Actions (This Week)

### Decision Checkpoint
- [ ] Review `MOBILE_FEASIBILITY_ASSESSMENT.md`
- [ ] Confirm team consensus on proceeding with Capacitor approach
- [ ] Allocate 1 developer for 3-5 day sprint

### Phase 0: Proof of Concept (4-6 hours)
**Goal**: Validate that audio and UI work in Capacitor

**Tasks**:
- [ ] Install Node.js (if not already present)
- [ ] Install Capacitor CLI: `npm install -g @capacitor/cli`
- [ ] Initialize Capacitor project alongside current Next.js app
- [ ] Copy React components into Capacitor project structure
- [ ] Test Tanpura audio playback in Android emulator
- [ ] Test Metronome in iOS simulator
- [ ] Verify localStorage persistence works
- [ ] Document any issues encountered

**Success Criteria**:
- ✅ Audio plays in both emulators
- ✅ Play/pause controls work
- ✅ Settings persist across app reopen
- ✅ No console errors

**Time**: 4-6 hours  
**Outcome**: Go/No-Go decision for Phase 1

---

## 📋 Phase 1: MVP Mobile App (3-4 Days)

### Build System Migration
**Duration**: 4-6 hours

**Tasks**:
- [ ] Create new Vite-based React project
- [ ] Copy all React components from current app
- [ ] Migrate CSS (Tailwind) to Vite setup
- [ ] Update `lib/` utilities (no changes needed, just copy)
- [ ] Test web version runs on `npm run dev`
- [ ] Build production bundle: `npm run build`
- [ ] Verify bundle size (~500KB JS + assets)

**Checklist**:
```bash
npm create vite@latest simpletanpura -- --template react
npm install
npm install -D tailwindcss @tailwindcss/postcss typescript
# Copy src/, lib/, components/, public/
npm run dev
# Verify at http://localhost:5173
```

### Audio Format Management
**Duration**: 6-8 hours

**Tasks**:
- [ ] Generate MP4 versions of all audio files using FFmpeg or online converter
  ```bash
  # Example for one file:
  ffmpeg -i audio/C.webm -c:a aac -b:a 192k audio-mp4/C.mp4
  ```
- [ ] Create platform detection utility in `lib/audioFormat.ts`
  ```typescript
  export function getAudioFormat(): 'webm' | 'mp4' {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return 'mp4';
    return 'webm';
  }
  ```
- [ ] Update `lib/pitches.ts` to use platform detection
- [ ] Update `lib/devices.ts` for pad files
- [ ] Test both formats on web
- [ ] Bundle MP4 files in `public/audio-mp4/`

**Output**:
- ~36 MP4 files (~3.2MB each)
- Platform-aware audio selection

### Capacitor Integration
**Duration**: 4-6 hours

**Tasks**:
- [ ] Install Capacitor packages:
  ```bash
  npm install @capacitor/core @capacitor/cli
  npm install -D @capacitor/ios @capacitor/android
  ```
- [ ] Initialize Capacitor:
  ```bash
  npx cap init
  ```
- [ ] Configure `capacitor.config.ts`:
  ```typescript
  const config: CapacitorConfig = {
    appId: 'com.myriyaz.tanpura',
    appName: 'My Riyaz',
    webDir: 'dist',
    server: { androidScheme: 'https' },
    plugins: {
      MediaSession: { enabled: true }
    }
  };
  ```
- [ ] Add Android platform: `npx cap add android`
- [ ] Add iOS platform: `npx cap add ios`
- [ ] Build and sync: `npm run build && npx cap sync`

### Device Testing (Android)
**Duration**: 4-6 hours

**Tasks**:
- [ ] Set up Android emulator (Android Studio or via Capacitor CLI)
- [ ] Deploy to emulator: `npx cap open android`
- [ ] Test in Android Studio (select device, click Run)
- [ ] Verify audio playback (Tanpura drone)
- [ ] Verify metronome click generation
- [ ] Test pitch switching, device switching
- [ ] Test volume control
- [ ] Check storage (settings persist after app close)
- [ ] Test background playback (press home button)
- [ ] Document issues in GitHub

**Target Issues to Watch For**:
- Audio stuttering
- Latency in metronome
- UI responsiveness on lower-end hardware

### Device Testing (iOS)
**Duration**: 4-6 hours

**Tasks**:
- [ ] Set up iOS simulator (Xcode)
- [ ] Deploy to simulator: `npx cap open ios`
- [ ] Build in Xcode (Cmd+B, then Run)
- [ ] Verify audio playback (should use MP4)
- [ ] Verify metronome synthesis
- [ ] Test all controls
- [ ] Check background audio
- [ ] Document issues in GitHub

**Note**: Real iOS device testing requires Apple Developer account ($99/year)

### Bug Fixes & Iteration
**Duration**: 4-8 hours (ongoing)

**Common Issues to Fix**:
- [ ] Safe area insets (notch, home indicator) → update CSS
- [ ] Audio context resumption on iOS → add touch to resume
- [ ] LocalStorage quota exceeded → add error handling
- [ ] Back button behavior (Android) → add exit confirmation
- [ ] Screen brightness during long practice → add stay-awake plugin

---

## 🎨 Phase 2: Polish & Optimization (2-3 Days)

### App Icons & Branding
**Duration**: 2-3 hours

**Tasks**:
- [ ] Create app icon (512x512px, square, no rounded corners)
- [ ] Generate icon variants for all sizes (iOS + Android)
- [ ] Add splash screen artwork
- [ ] Update `capacitor.config.ts` with icon paths
- [ ] Test on both platforms

**Resources**:
- Icon generator: https://icon.kitchen
- Splash screen generator: AppIconGenerator

### Performance Optimization
**Duration**: 2-3 hours

**Tasks**:
- [ ] Profile JavaScript execution time (DevTools)
- [ ] Optimize bundle size (check unused dependencies)
- [ ] Lazy-load audio files if app becomes slow
- [ ] Test on low-memory device (Android emulator with 1GB RAM)
- [ ] Monitor battery drain during 1-hour playback

**Target Metrics**:
- App startup: < 2 seconds
- Audio load: < 1 second
- Metronome: ±10ms timing accuracy

### UI Polish for Mobile
**Duration**: 1-2 hours

**Tasks**:
- [ ] Test on various screen sizes (phone, tablet, landscape)
- [ ] Adjust padding/margins for touch targets (min 44x44px)
- [ ] Test on iOS notched devices (safe area insets)
- [ ] Verify text is readable (font size checks)
- [ ] Test in both light and dark modes (if applicable)
- [ ] Add haptic feedback on button press (optional Capacitor plugin)

### Documentation
**Duration**: 1-2 hours

**Tasks**:
- [ ] Create `MOBILE_DEV.md` with setup instructions
- [ ] Document build process for both platforms
- [ ] Add troubleshooting guide
- [ ] Document audio format strategy
- [ ] Create contributor guide

---

## 📲 Phase 3: App Store Preparation (1-2 Days)

### Apple App Store
**Duration**: 4-6 hours

**Prerequisites**:
- [ ] Apple Developer account ($99/year)
- [ ] Mac with Xcode (for building, signing, notarizing)

**Tasks**:
- [ ] Create App ID in Apple Developer Console
- [ ] Generate provisioning profiles and signing certificates
- [ ] Create 5+ App Store screenshots (3+ languages recommended)
- [ ] Write app description (150-170 chars)
- [ ] Write release notes ("Initial release")
- [ ] Set category: Music or Lifestyle
- [ ] Add privacy policy (simple: "No data collection")
- [ ] Build for iOS: `npm run build && npx cap sync && open ios/App/App.xcworkspace`
- [ ] Archive in Xcode (Product → Archive)
- [ ] Submit to App Store Connect (wait 1-3 days for review)

**App Store Listing Example**:
```
Title: My Riyaz - Tanpura & Metronome
Subtitle: Practice tool for Hindustani classical music

Description:
A calm, focused tanpura drone and metronome for 
daily riyaz (music practice). Includes:
- Seamless tanpura drone looping
- Adjustable metronome (30-300 BPM)
- Multiple pitch selections
- Works offline
- Minimal, distraction-free interface

Keywords: tanpura, metronome, riyaz, classical music, practice
```

### Google Play Store
**Duration**: 3-4 hours

**Prerequisites**:
- [ ] Google Play Developer account ($25 one-time)
- [ ] Android device or emulator for testing

**Tasks**:
- [ ] Create app signing key: `keytool -genkey -v -keystore ...`
- [ ] Create 5+ Play Store screenshots
- [ ] Write short description (80 chars max)
- [ ] Write app description (4000 chars max)
- [ ] Set category: Music or Lifestyle
- [ ] Add privacy policy
- [ ] Build signed APK: `npm run build && npx cap sync && gradlew build`
- [ ] Upload AAB (Android App Bundle) to Play Console
- [ ] Wait 2-4 hours for automated review

**Play Store Listing Example**:
```
Title: My Riyaz - Tanpura & Metronome
Short description: Tanpura drone + metronome for riyaz

Full description: [Same as above]
```

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Tanpura playback works on both platforms
- [ ] Metronome generates clicks accurately
- [ ] Pitch switching works seamlessly (no audio glitch)
- [ ] Device switching (Tanpura, Major, Minor) works
- [ ] Volume slider works (0-100%)
- [ ] BPM adjustment works (30-300)
- [ ] Time signature dropdown works
- [ ] Settings persist after app close & reopen
- [ ] Background audio continues when app is backgrounded
- [ ] Audio stops when incoming call arrives

### Platform-Specific Testing
**Android**:
- [ ] WebM audio plays
- [ ] Storage accessible
- [ ] Back button closes app
- [ ] Volume buttons work (control audio volume)
- [ ] Sleep screen locks don't interrupt audio

**iOS**:
- [ ] MP4 audio plays (or falls back to WebM)
- [ ] Audio continues in background
- [ ] Lock screen shows media controls
- [ ] AirPods/Bluetooth headsets work
- [ ] iPhone notch doesn't cut off UI

### Edge Cases
- [ ] Low storage space (<100MB free)
- [ ] Very low RAM device
- [ ] App backgrounded for 1+ hour
- [ ] Switching between WiFi and cellular
- [ ] Switching audio output (headphones → speaker)
- [ ] App crashes and is reopened

### Performance Testing
- [ ] Startup time < 2 seconds
- [ ] No frame drops during audio playback
- [ ] Metronome timing within ±10ms
- [ ] Battery drain: acceptable for 3-4 hour session

---

## 📅 Timeline Summary

```
Week 1:
├─ Day 1: Phase 0 (PoC) - 4-6h
├─ Day 2-3: Phase 1 (MVP) - 3-4 days
└─ Day 4: Phase 1 continued + initial fixes

Week 2:
├─ Day 1-2: Phase 1 testing, bug fixes - 2-3 days
├─ Day 3-4: Phase 2 (Polish) - 2-3 days
└─ Day 5: Phase 2 continued

Week 3:
├─ Day 1: Phase 3 (Store prep) - 1-2 days
├─ Day 2-3: App Store submissions
├─ Day 4-5: Wait for app store reviews (external)
└─ Final: Apps go live!
```

**Total**: 2-3 weeks (1 developer, full-time)

---

## 🚀 Success Criteria

### MVP (Phase 1)
- ✅ App installs on Android & iOS
- ✅ Audio plays without errors
- ✅ All controls work as expected
- ✅ Settings persist
- ✅ No major crashes or hangs

### Production Ready (Phase 3)
- ✅ Both app stores accept and publish the app
- ✅ 4.5+ star rating (based on user reviews)
- ✅ Zero critical bugs in first week
- ✅ Load time < 2 seconds
- ✅ Positive user feedback on Reddit/Twitter

---

## ⚠️ Risks & Mitigations

| Risk | Mitigation |
|---|---|
| App store rejection | Follow guidelines; test with real builds early |
| Audio stuttering on Android | Profile with Android Studio; optimize bundle size |
| iOS background audio not working | Test thoroughly in Phase 1; use MediaSession properly |
| Bundle size too large | Consider streaming audio option as fallback |
| Low ratings due to UI issues | Extensive device testing in Phase 2 |

---

## 📞 Support & Resources

### Learning Resources
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Audio Guide](https://capacitorjs.com/docs/guides/background-tasks#audio)
- [React + Vite Setup](https://vitejs.dev/guide/#scaffolding-your-first-vite-project)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### Tools
- Android Studio (emulator)
- Xcode (iOS simulator)
- FFmpeg (audio conversion)
- Chrome DevTools (debugging)

### Community
- Capacitor Discord: https://discord.gg/capacitorjs
- Stack Overflow: Tag `capacitor` or `web-audio-api`
- GitHub Issues: For project-specific problems

---

## Final Notes

This roadmap assumes:
- ✅ 1 full-time developer
- ✅ Basic React/Web knowledge already present
- ✅ Willing to spend time on testing & app store processes
- ✅ Audio file conversion already completed

If you have questions about any phase, refer to the detailed feasibility assessment or reach out to the Capacitor community.

**Good luck! 🎵**
