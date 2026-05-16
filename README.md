# 🤖 JARVIS: Bilingual AI Assistant

![JARVIS AI Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Built by [Aryan Ahirwar](https://viphacker100.com) — **VIPHACKER100**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-7C3AED?style=for-the-badge)](https://openrouter.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

---

**JARVIS** is a futuristic, voice-activated AI assistant designed for a high-performance bilingual experience. Operating on the **VIPHACKER100 OS**, it supports both **English** and **Hindi**, providing a natural and human-like interface for users in mixed-language environments. Inspired by the legendary Stark Tech, it features a stunning, mobile-optimized cyberpunk UI powered by a core **Arc Reactor** and backed by the **NVIDIA Nemotron** model via OpenRouter.

## ✨ Key Features

- 🎙️ **Bilingual Voice Recognition** — Seamlessly understands and processes commands in English and Hindi (including Hinglish).
- 🗣️ **Human-Like Interaction** — Natural speech patterns powered by `nvidia/nemotron-3-super-120b-a12b` via OpenRouter.
- 🔊 **Clear Natural Voice** — Optimized text-to-speech with high-quality voices and natural cadence.
- ⚡ **Interactive Cyberpunk UI** — Rotating Arc Reactor, real-time system stats, scanline effects.
- 🛠️ **System Controls** — Volume, web navigation, weather, time, date, and calculator via voice.
- 📜 **Command History** — Scrollable log of all interactions with dual-language support.
- 📱 **Mobile-First UX** — Fully responsive, touch-optimized across all viewports.
- 🛡️ **Security Protocol** — Built-in phishing detection and input sanitization.
- 🧠 **Creator Awareness** — Ask JARVIS about its creator and get a full briefing on Aryan Ahirwar / VIPHACKER.100.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- A modern browser with Speech Recognition (**Chrome or Edge recommended**)

### Installation

1. **Clone the project:**

   ```bash
   git clone https://github.com/VIPHACKER100/jarvis-bilingual-ai-assistant.git
   cd jarvis-bilingual-ai-assistant
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the project root:

   ```env
   # Primary AI Backend — OpenRouter (priority)
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   VITE_MODEL_NAME=nvidia/nemotron-3-super-120b-a12b:free

   # Fallback AI Backend — Google Gemini
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   > 💡 JARVIS uses **OpenRouter first** (if key present), then falls back to Gemini.  
   > Get a free OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys)  
   > Get a Gemini key at [aistudio.google.com](https://aistudio.google.com/)

4. **Run the development server:**

   ```bash
   npm run dev
   ```

---

## 🎮 How to Use

1. Click the **Arc Reactor** in the center to activate JARVIS.
2. Grant microphone permissions when prompted.
3. Use the **Language Toggle** (top right) to switch between English and Hindi.
4. Speak your command naturally:

| Command (English) | Command (Hindi) |
|---|---|
| *"Hey JARVIS, open YouTube"* | *"यूट्यूब खोलो"* |
| *"Increase volume"* | *"आवाज़ बढ़ाओ"* |
| *"Who are you?"* | *"तुम कौन हो?"* |
| *"Who made you?"* | *"तुम्हें किसने बनाया?"* |
| *"Tell me about Aryan Ahirwar"* | *"Aryan Ahirwar के बारे में बताओ"* |
| *"What's the weather in Delhi?"* | *"दिल्ली का मौसम कैसा है?"* |
| *"Calculate 25 plus 17"* | *"25 जोड़ो 17"* |
| *"Send message to Mom saying I'm home"* | *"मम्मी को मैसेज भेजो घर पहुँच गया"* |

---

## 🛠️ Built With

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev/) |
| Build Tool | [Vite 6.4](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + Custom Animations |
| Primary AI | [OpenRouter](https://openrouter.ai/) → `nvidia/nemotron-3-super-120b-a12b:free` |
| Fallback AI | [Google Gemini 1.5 Flash](https://ai.google.dev/) |
| Voice Stack | Web Speech Recognition + Speech Synthesis API |
| Typography | [Rajdhani](https://fonts.google.com/specimen/Rajdhani) |
| Language | TypeScript 5.8 |

---

## 👤 About the Creator

### Aryan Ahirwar — VIPHACKER100

> **Cybersecurity Expert | Ethical Hacker | Penetration Tester | Bug Bounty Hunter | Founder & CEO of VIPHACKER.100**

🔒 Passionate cybersecurity professional with extensive experience in ethical hacking, penetration testing, and vulnerability research. Building tools and systems that make the digital world safer.

**What I Do:**
- 🕸️ **Web Application Penetration Testing** — Identifying and exploiting vulnerabilities to secure digital assets
- 🐛 **Bug Bounty Hunting** — Discovering critical security flaws for leading organizations worldwide
- 🔍 **OSINT** — Leveraging publicly available information for security assessments
- 🏁 **CTF Challenges & Walkthroughs** — Solving complex capture-the-flag challenges
- 🔧 **Security Tool Development** — Custom tools and scripts for security testing and automation

**My Expertise:**
- ✅ Penetration Testing & Vulnerability Assessment
- ✅ Web Application Security (OWASP Top 10)
- ✅ Network Security & Infrastructure Testing
- ✅ Ethical Hacking & Red Team Operations
- ✅ OSINT & Security Automation

| Platform | Link |
|---|---|
| 🌐 Website | [viphacker100.com](https://viphacker100.com) |
| ⌨️ GitHub | [@VIPHACKER100](https://github.com/VIPHACKER100) |
| 💼 LinkedIn | [viphacker100](https://linkedin.com/in/viphacker100) |
| 📸 Instagram | [viphacker.100](https://instagram.com/viphacker.100) |

> 📧 Open to collaboration, consulting, and knowledge sharing — let's make cyberspace safer together.

---

> *"I'm JARVIS. Built to serve. Secured by design."*  
> **Part of the VIPHACKER100 Ecosystem — v3.9.0**
