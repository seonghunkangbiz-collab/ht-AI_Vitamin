# HT AI Vitamin Reveal Day: Live Database Validation Report

- **Validation Date**: 2026-10-19 (KST)
- **Target Event**: HT사업본부 AI Vitamin Program – Reveal Day (2026-10-28 16:00~17:30 KST)
- **Database Endpoint**: `https://ofpyltfjwnnafvgeqcmk.supabase.co`
- **Validation Script**: `scripts/run-data-validation.mjs`

---

## 1. Summary of Database Integrity

| Entity | Live Count | Validation Rule | Status | Note |
| :--- | :--- | :--- | :--- | :--- |
| **Users** | 25 | 1 Admin + 24 Participants | **PASS** | Regular users: 24, Admin: 1 |
| **Praise Messages** | 41 | Cutoff (2026-10-27 23:59:59 KST) | **PASS** | 41 before/at cutoff, 0 after cutoff |
| **Private Notes** | 3 | Historical Observation Notes | **PASS** | `private_notes` preserved intact |
| **Mate Assignments** | 48 | Exactly 2 outbound per participant | **PASS** | 24 users × 2 targets = 48 rows |
| **Self-Assignments** | 0 | `user_id !== target_user_id` | **PASS** | No self-observation detected |
| **Duplicate Assignments**| 0 | Unique `(user_id, target_user_id)` | **PASS** | No duplicate edges detected |
| **App State** | 3 | `reveal_date` = `2026-10-28` | **PASS** | Unified from legacy `2026-10-23` |

---

## 2. Inbound vs Outbound Mate Analysis

### 2.1 Outbound (내가 관찰한 사람)
- **Distribution**: `{"2": 24}`
- **Verification**: All 24 participants were assigned exactly 2 mystery targets to observe and encourage.

### 2.2 Inbound (나를 관찰한 사람)
- **Sum of Inbounds**: $0 \times 4 + 1 \times 7 + 2 \times 4 + 3 \times 5 + 4 \times 3 + 6 \times 1 = 48$
- **Distribution Table**:
  - **0 Inbound Mates**: 4 participants
  - **1 Inbound Mate**: 7 participants
  - **2 Inbound Mates**: 4 participants
  - **3 Inbound Mates**: 5 participants
  - **4 Inbound Mates**: 3 participants
  - **6 Inbound Mates**: 1 participant

> [!NOTE]
> **Preflight Checklist Handling for 0-Inbound Participants**:
> The Preflight inspection (`lib/reveal-day/preflight.ts`) detects participants with 0 inbound assignments as a non-blocking warning. For the 4 participants with 0 inbound mates, the stage console and mobile `/live` app seamlessly present their Time Capsule and general praise messages so no attendee feels excluded on stage.

---

## 3. SQL Validation Queries Used

```sql
-- 1. Total User & Role Breakdown
SELECT role, count(*) FROM users GROUP BY role;

-- 2. Praise Messages Cutoff Filtering
SELECT 
  count(*) FILTER (WHERE created_at <= '2026-10-27T23:59:59+09:00') AS before_cutoff,
  count(*) FILTER (WHERE created_at > '2026-10-27T23:59:59+09:00') AS after_cutoff
FROM praise_messages;

-- 3. Mate Outbound Integrity Check
SELECT user_id, count(*) AS outbound_count
FROM mate_assignments
GROUP BY user_id;

-- 4. Mate Inbound Integrity Check
SELECT u.id, u.name, u.team, count(m.user_id) AS inbound_count
FROM users u
LEFT JOIN mate_assignments m ON m.target_user_id = u.id
WHERE u.role != 'admin'
GROUP BY u.id, u.name, u.team
ORDER BY inbound_count ASC;

-- 5. Self-assignment & Duplicate Validation
SELECT count(*) AS self_assigned 
FROM mate_assignments 
WHERE user_id = target_user_id;

SELECT user_id, target_user_id, count(*) 
FROM mate_assignments 
GROUP BY user_id, target_user_id 
HAVING count(*) > 1;
```
