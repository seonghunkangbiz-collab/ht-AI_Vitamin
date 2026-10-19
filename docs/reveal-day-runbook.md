# HT AI Vitamin Reveal Day: Operations & Disaster Recovery Runbook

- **Event Name**: HT사업본부 AI Vitamin Program – Reveal Day
- **Concept**: *Connecting People, Growing Together*
- **Date & Time**: 2026-10-28 (Wednesday) 16:00~17:30 KST
- **Console URL**: `/admin/reveal-day`
- **Display URL**: `/admin/reveal-day/display`
- **Mobile URL**: `/live` (Attendees) & `/reveal` (Personal Capsule/Card)
- **Official Cutoff**: 2026-10-27 23:59:59 KST

---

## 1. Pre-Event Operations Checklist (D-1 & D-Day 15:00)

### 1.1 Preflight Inspection
1. Log in to `/admin` using verified administrator credentials.
2. Click **"Reveal Day 운영 화면 열기"** to open `/admin/reveal-day` in full screen (or new tab).
3. Verify that the window is on a PC/display with resolution $\ge 1280\text{px}$ (1920×1080 recommended).
4. In the top bar, click the **"사전 점검"** (Preflight) button:
   - Check DB connectivity status (Supabase connected).
   - Check Snapshot status: Ensure the official snapshot (SHA-256 hash verified) was generated.
   - Check Time Capsules: Ensure all 24 capsules are in `approved` status.
   - Check Lucky Draw: Ensure prize pool has 4 rounds configured.
   - Check Audio Asset: Ensure `/audio/vitamin_song.mp3` loads correctly.
   - Check Mobile QR: Verify `NEXT_PUBLIC_APP_URL/live` QR code is displayed on stage.

### 1.2 Rehearsal Mode Test
1. Set the top-bar mode switch to **"리허설 모드"** (Rehearsal).
2. Step through each segment:
   - Opening $\to$ Vitamin Journey $\to$ Mystery Mate Reveal $\to$ AI Time Capsule $\to$ Lucky Draw $\to$ Suno Song $\to$ Closing $\to$ Pizza Party.
3. Test Lucky Draw generation and voiding in rehearsal mode.
4. Verify that no real production data is modified or revealed during rehearsal.
5. Switch mode back to **"라이브 모드"** (Live) prior to 15:50 KST.

---

## 2. Event Timeline & Operator Actions (16:00~17:30)

| Time | Segment | Operator Actions | MC / Stage Focus |
| :--- | :--- | :--- | :--- |
| **16:00~16:05** | **1. Opening** | Verify real-time checkin counter ($\approx 24$). Display `/live` QR code. | Welcome speech, program concept intro, announce mobile `/live` join. |
| **16:05~16:15** | **2. Vitamin Journey** | Advance to Journey. Present approved praise highlights, top positive keywords, total message statistics. | Celebrate the 2-month growth journey and peer appreciation. |
| **16:15~16:35** | **3. Mystery Mate Reveal** | Step through the 6 batches (4 users each). Use **"다음 공개"** (Space bar) or batch reveal. | Attendees guess on `/live`. Reveal inbound mystery mates on stage. |
| **16:35~16:45** | **4. AI Time Capsule** | Spotlight individual participant capsules. Show AI keywords and letter. | Personal reflection, invite 1~2 highlighted participants for impressions. |
| **16:45~17:00** | **5. AI Lucky Draw** | Execute rounds 1~4 using CSPRNG. Winners are automatically celebrated with confetti on stage and mobile popup. | Call winners to stage. If absent, use **"무효 처리 및 재추첨"** with reason log. |
| **17:00~17:05** | **6. Suno Vitamin Song** | Press Play on the Suno AI Vitamin Song visualizer. | Group listening, sing-along, celebration. |
| **17:05~17:10** | **7. Closing** | Present closing gratitude slide. Direct all participants to open their personal `/reveal` link. | Final group photo, director closing remarks. |
| **17:10~17:30** | **8. Pizza Party** | Switch to relaxing pizza party screen with background animation. | Social gathering, pizza & networking. |

---

## 3. Keyboard Shortcuts & Quick Controls

| Key | Action | Guard / Condition |
| :---: | :--- | :--- |
| **`Space`** | Advance to next mystery mate reveal or trigger stage animation | Suppressed when input/textarea is focused |
| **`→` / `↓`** | Transition to next segment in timeline | Suppressed when input/textarea is focused |
| **`←` / `↑`** | Return to previous segment | Suppressed when input/textarea is focused |
| **`F`** | Toggle Fullscreen on display / stage | Accessible anytime |
| **`B`** | **Immediate Blackout**: Blank screen instantly | Instant emergency blanking |
| **`H`** | **Holding / Standby Screen**: "잠시만 기다려 주세요" | Emergency standby screen |

---

## 4. Disaster Recovery & Failover Procedures

### 4.1 Supabase Realtime Disconnect / WebSocket Failure
- **Symptom**: Realtime status pill in top bar changes to orange `polling` or red `disconnected`.
- **System Behavior**: `useRevealDayRealtime` automatically activates 3.5s HTTP long-polling fallback with exponential backoff and automatic reconnect.
- **Operator Action**: No manual restart required. The stage will continue updating via polling. If needed, click the **"새로고침"** icon in the status bar.

### 4.2 Operator Console Crash / Page Refresh
- **Symptom**: Accidental browser tab close or reload.
- **System Behavior**: The current segment, revealed index, lucky draw winners, and blackout state are persisted in Supabase `reveal_public_state`.
- **Operator Action**: Re-open `/admin/reveal-day`. The system acquires a new lease and restores the exact state without losing progress.

### 4.3 Concurrent Operator Conflict (Version Mismatch 409)
- **Symptom**: Two administrators attempt to advance the stage simultaneously.
- **System Behavior**: Optimistic concurrency locking rejects the stale mutation with HTTP 409 conflict.
- **Operator Action**: The operator panel displays a warning and automatically syncs the latest state from the database.

### 4.4 Absent Lucky Draw Winner
- **Procedure**:
  1. Click **"추첨 내역 관리"** in the Lucky Draw operator panel.
  2. Select the void action on the drawn card.
  3. Enter the required audit reason (e.g. `부재 확인 후 재추첨`).
  4. Click Confirm. The system logs the void event in `reveal_audit_logs` and unlocks a new CSPRNG draw.

### 4.5 Audio Playback Error
- **Symptom**: Network issue or unsupported codec prevents audio element from playing.
- **System Behavior**: `SongSegment` catches the error, displays an on-screen warning card, and provides lyrics and visualizer without crashing the application.
