# 🏗️ JARVIS — System Architecture

> **Project:** JARVIS Bilingual AI Assistant  
> **Version:** v3.9.0  
> **Author:** Aryan Ahirwar (VIPHACKER100) — [viphacker100.com](https://viphacker100.com)

---

## 1. High-Level System Overview

```mermaid
graph TB
    USER["👤 User\n(Voice / Touch)"]

    subgraph BROWSER["Browser Environment"]
        subgraph UI["React UI Layer"]
            APP["App.tsx\n(Root Orchestrator)"]
            ARC["ArcReactor\n(Activation Button)"]
            HUD["HistoryLog\n(Command Feed)"]
            VOL["VolumeControl"]
            MODAL["PermissionModal"]
        end

        subgraph SERVICES["Service Layer"]
            VOICE["voiceService.ts\n(Speech I/O)"]
            CMD["commandProcessor.ts\n(Intent Engine)"]
            SEC["securityService.ts\n(Sanitizer + Threat Detection)"]
        end

        subgraph UTILS["Utils"]
            AUDIO["audioUtils.ts\n(SFX / Blips)"]
        end

        subgraph APIS["External API Layer"]
            OR["OpenRouter API\nnvidia/nemotron-3-super-120b"]
            GEM["Google Gemini API\ngemini-1.5-flash"]
        end
    end

    USER -->|"Tap"| ARC
    ARC -->|"Toggle"| APP
    APP -->|"startListening()"| VOICE
    VOICE -->|"transcript"| CMD
    CMD -->|"sanitize"| SEC
    SEC -->|"clean text"| CMD
    CMD -->|"LLM fallback"| OR
    OR -.->|"fallback"| GEM
    CMD -->|"ProcessedCommand"| APP
    APP -->|"speak()"| VOICE
    APP -->|"addToHistory()"| HUD
    APP -->|"SFX"| AUDIO
    APP -->|"window.open()"| BROWSER
```

---

## 2. Voice Pipeline

```mermaid
sequenceDiagram
    actor User
    participant ArcReactor
    participant App
    participant voiceService
    participant commandProcessor
    participant LLM as OpenRouter / Gemini

    User->>ArcReactor: Tap (activate)
    ArcReactor->>App: toggleActivation()
    App->>voiceService: startListening()
    App-->>User: Mode = LISTENING 🎙️

    voiceService-->>App: onResult(transcript, isFinal=false)
    App-->>User: Show live transcript

    voiceService-->>App: onResult(transcript, isFinal=true)
    App-->>User: Mode = PROCESSING ⚙️
    App->>commandProcessor: processTranscript(text)

    Note over commandProcessor: Security check → Language detect → Intent match

    alt Intent matched locally
        commandProcessor-->>App: ProcessedCommand (no API call)
    else No local match → LLM fallback
        commandProcessor->>LLM: POST /chat/completions
        LLM-->>commandProcessor: AI response
        commandProcessor-->>App: ProcessedCommand (CONVERSATION)
    end

    App-->>User: Mode = SPEAKING 🔊
    App->>voiceService: speak(response)
    voiceService-->>User: TTS audio playback

    App->>App: setTimeout(2s) → restart listening
    App-->>User: Mode = LISTENING 🎙️
```

---

## 3. Command Processing Flow

```mermaid
flowchart TD
    INPUT["📥 Raw Voice Input"]
    SANITIZE["🛡️ SecurityService.sanitizeCommand()"]
    PHISH{"⚠️ Phishing / Threat\nDetected?"}
    LANG["🌐 detectLanguage()\nDevanagari → Hindi\nKeyword scoring → En/Hi"]

    SECURITY_ALERT["🔴 SECURITY_ALERT\nResponse"]

    HELP{"help / madad?"}
    GREET{"greeting?"}
    IDENTITY{"who are you?"}
    CREATOR{"who made you /\nviphacker?"}
    NAV{"open / go to?"}
    YOUTUBE{"youtube?"}
    WHATSAPP{"whatsapp /\nmessage?"}
    TIME{"time / samay?"}
    DATE{"date / tareekh?"}
    WEATHER{"weather / mausam?"}
    CALC{"number + operator?"}
    VOL_UP{"volume up / badhao?"}
    VOL_DOWN{"volume down / kam?"}

    LLM["🧠 LLM Fallback\nOpenRouter → Gemini"]
    UNKNOWN["❓ UNKNOWN\nFallback Response"]

    INPUT --> SANITIZE --> PHISH
    PHISH -->|Yes| SECURITY_ALERT
    PHISH -->|No| LANG

    LANG --> HELP
    HELP -->|Yes| HELP_R["📋 HELP Response"]
    HELP -->|No| GREET
    GREET -->|Yes| GREET_R["👋 GREETING Response"]
    GREET -->|No| IDENTITY
    IDENTITY -->|Yes| ID_R["🤖 IDENTITY Response"]
    IDENTITY -->|No| CREATOR
    CREATOR -->|Yes| CR_R["👤 CREATOR_INFO Response"]
    CREATOR -->|No| NAV
    NAV -->|Yes| NAV_R["🌐 NAVIGATION + window.open()"]
    NAV -->|No| YOUTUBE
    YOUTUBE -->|Yes| YT_R["▶️ YOUTUBE + window.open()"]
    YOUTUBE -->|No| WHATSAPP
    WHATSAPP -->|Yes| WA_R["💬 WHATSAPP + window.open()"]
    WHATSAPP -->|No| TIME
    TIME -->|Yes| TIME_R["🕐 TIME Response"]
    TIME -->|No| DATE
    DATE -->|Yes| DATE_R["📅 DATE Response"]
    DATE -->|No| WEATHER
    WEATHER -->|Yes| WX_R["☁️ WEATHER Response"]
    WEATHER -->|No| CALC
    CALC -->|Yes| CALC_R["🔢 CALCULATOR Response"]
    CALC -->|No| VOL_UP
    VOL_UP -->|Yes| VU_R["🔊 VOLUME_UP"]
    VOL_UP -->|No| VOL_DOWN
    VOL_DOWN -->|Yes| VD_R["🔉 VOLUME_DOWN"]
    VOL_DOWN -->|No| LLM
    LLM -->|Response| CONV_R["💬 CONVERSATION Response"]
    LLM -->|No response| UNKNOWN
```

---

## 4. LLM Routing & Fallback Logic

```mermaid
flowchart LR
    INPUT["User Query\n(unrecognised intent)"]

    KEY_CHECK{"VITE_OPENROUTER_API_KEY\nset?"}
    OR_CALL["OpenRouter API\nPOST /chat/completions\nmodel: VITE_MODEL_NAME"]
    OR_OK{"HTTP 200?"}
    OR_RESP["Parse\nchoices[0].message.content"]

    GEM_CHECK{"VITE_GEMINI_API_KEY\nset?"}
    GEM_CALL["Gemini API\nPOST generateContent\nmodel: gemini-1.5-flash"]
    GEM_OK{"HTTP 200?"}
    GEM_RESP["Parse\ncandidates[0].content"]

    LOG_ERR["console.error\nHTTP status + body"]
    UNKNOWN["Return UNKNOWN\nfallback message"]
    RETURN["Return CONVERSATION\nresponse to App"]

    INPUT --> KEY_CHECK
    KEY_CHECK -->|Yes| OR_CALL
    KEY_CHECK -->|No| GEM_CHECK

    OR_CALL --> OR_OK
    OR_OK -->|Yes| OR_RESP --> RETURN
    OR_OK -->|No| LOG_ERR --> GEM_CHECK

    GEM_CHECK -->|Yes| GEM_CALL
    GEM_CHECK -->|No| UNKNOWN

    GEM_CALL --> GEM_OK
    GEM_OK -->|Yes| GEM_RESP --> RETURN
    GEM_OK -->|No| LOG_ERR --> UNKNOWN
```

---

## 5. React Component Tree

```mermaid
graph TD
    APP["App.tsx\n─────────────────\nstate: mode, transcript,\nhistory, volume, language\nrefs: processingRef, isActiveRef"]

    ARC["ArcReactor.tsx\n─────────────────\nprops: isActive, onClick,\nlanguage\nAnimated SVG reactor"]

    HIST["HistoryLog.tsx\n─────────────────\nprops: history[]\nAuto-scroll log\nDual-language colours"]

    VOL["VolumeControl.tsx\n─────────────────\nprops: level (0–100)\nVisual bar indicator"]

    PERM["PermissionModal.tsx\n─────────────────\nprops: isOpen, onClose,\nlanguage\nMic permission guide"]

    APP --> ARC
    APP --> HIST
    APP --> VOL
    APP --> PERM
```

---

## 6. Security Architecture

```mermaid
flowchart LR
    RAW["Raw User Input"]

    subgraph SEC["securityService.ts"]
        STRIP["Strip HTML / Script tags\nRemove control chars\nTrim whitespace"]
        LEN["Enforce max length\n500 chars"]
        PHISH["Phishing keyword scan\npassword, otp, pin,\ncredit card, bank..."]
        PHONE["WhatsApp number\nvalidation E.164"]
    end

    CLEAN["Clean Text → commandProcessor"]
    ALERT["🔴 SECURITY_ALERT\n(no further processing)"]
    ALLOW["✅ Safe number → wa.me link"]
    REJECT["❌ Invalid number → ERROR response"]

    RAW --> STRIP --> LEN --> PHISH
    PHISH -->|Threat detected| ALERT
    PHISH -->|Safe| CLEAN
    RAW -->|WhatsApp contact| PHONE
    PHONE -->|Valid E.164| ALLOW
    PHONE -->|Invalid| REJECT
```

---

## 7. File Structure

```
jarvis-bilingual-ai-assistant/
│
├── 📄 index.html              # Entry point, Tailwind CDN, Google Fonts, SEO meta
├── 📄 index.tsx               # React root mount
├── 📄 App.tsx                 # Root component — state, mode, voice loop
├── 📄 index.css               # Global styles, custom scrollbar
├── 📄 types.ts                # TypeScript interfaces & enums
├── 📄 constants.ts            # CONTACTS, GREETINGS, INITIAL_VOLUME
│
├── 📁 components/
│   ├── ArcReactor.tsx         # Central activation button (animated SVG)
│   ├── HistoryLog.tsx         # Scrollable interaction history
│   ├── VolumeControl.tsx      # Visual volume level display
│   └── PermissionModal.tsx    # Microphone permission dialog
│
├── 📁 services/
│   ├── commandProcessor.ts    # Intent engine + LLM fallback (main logic)
│   ├── voiceService.ts        # Web Speech API wrapper (STT + TTS)
│   └── securityService.ts     # Input sanitisation + threat detection
│
├── 📁 utils/
│   └── audioUtils.ts          # SFX (blip sounds)
│
├── 📄 .env                    # 🔒 Real keys — gitignored
├── 📄 .env.example            # ✅ Template — committed to repo
├── 📄 .gitignore
├── 📄 LICENSE                 # MIT — © Aryan Ahirwar (VIPHACKER100)
├── 📄 ARCHITECTURE.md         # This file
├── 📄 README.md
├── 📄 package.json
├── 📄 tsconfig.json
└── 📄 vite.config.ts
```

---

## 8. Tech Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | React 19 | Component-based UI |
| Build Tool | Vite 6.4 | Fast dev server & bundler |
| Styling | Tailwind CSS (CDN) | Utility-first CSS |
| Language | TypeScript 5.8 | Type safety |
| Voice Input | Web Speech API (`webkitSpeechRecognition`) | STT — browser native |
| Voice Output | Web Speech Synthesis API | TTS — browser native |
| Primary AI | OpenRouter → `nvidia/nemotron-3-super-120b-a12b:free` | Conversational LLM |
| Fallback AI | Google Gemini 1.5 Flash | Secondary LLM |
| Font | Rajdhani (Google Fonts) | Tactical HUD typography |
| Security | Custom `SecurityService` | Sanitisation + phishing detection |

---

> *"Architecture is not about what you build — it's about the decisions you make."*  
> **— Aryan Ahirwar (VIPHACKER100)** | [viphacker100.com](https://viphacker100.com)
