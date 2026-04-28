# SpeakQuest — Speech Therapy Game for Children with Autism

> An interactive, gamified speech therapy tool designed to improve verbal engagement in children on the autism spectrum through voice-controlled games.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Understanding Autism & Speech Challenges](#understanding-autism--speech-challenges)
3. [Problem Statement](#problem-statement)
4. [Solution — SpeakQuest](#solution--speakquest)
5. [Features](#features)
6. [Technology Stack](#technology-stack)
7. [System Architecture](#system-architecture)
8. [Game Modules](#game-modules)
9. [Installation & Setup](#installation--setup)
10. [API Endpoints](#api-endpoints)
11. [Design System](#design-system)
12. [Project Structure](#project-structure)
13. [Future Enhancements](#future-enhancements)
14. [Team & Credits](#team--credits)
15. [References](#references)

---

## Project Overview

**SpeakQuest** is a web-based speech therapy application specifically designed for children diagnosed with Autism Spectrum Disorder (ASD). The application uses the **Web Audio API** and **Speech Recognition API** to create three gamified, voice-controlled modules that encourage verbal engagement in a fun, non-threatening environment.

The core philosophy of SpeakQuest is that **practice should feel like play**. Instead of traditional, often intimidating clinical exercises, children interact with colorful games that respond to their voice — rewarding louder speech, correct vowel pronunciation, and emotional tone expression.

---

## Understanding Autism & Speech Challenges

### What is Autism?

**Autism Spectrum Disorder (ASD)** is a neurodevelopmental condition that affects how a person perceives, interacts with, and communicates with the world. It is called a "spectrum" because the symptoms and their severity vary widely from one individual to another.

Key characteristics of ASD include:
- **Social communication challenges** — difficulty understanding and using verbal/non-verbal communication
- **Restricted or repetitive behaviors** — preference for routines, repetitive movements, or focused interests
- **Sensory sensitivities** — over- or under-responsiveness to sensory input (sound, light, touch)

### Prevalence — How Many Children Are Affected?

The statistics around autism are both significant and growing:

| Statistic | Data |
|---|---|
| **Global prevalence** | Approximately **1 in 100 children** worldwide has autism (WHO, 2023) |
| **United States** | **1 in 36 children** is diagnosed with ASD (CDC, 2023) |
| **Pakistan** | Estimated **350,000+ children** living with ASD, though many remain undiagnosed |
| **Gender ratio** | ASD is **4 times more common** in boys than girls |
| **Growth trend** | Diagnoses have increased by **over 150%** since the year 2000 |
| **Global estimate** | Approximately **78 million people** worldwide are on the autism spectrum |

### Speech & Communication in Autism

Speech and language difficulties are among the most common challenges faced by children with ASD:

- **25–30%** of children with autism are minimally verbal or non-verbal
- **Speech delay** is often the first concern that leads to an ASD diagnosis
- Difficulties include articulation, voice modulation, pitch control, and emotional expression
- Traditional speech therapy can be **intimidating and monotonous** for children
- Children with ASD respond exceptionally well to **gamified, visual, and interactive** learning methods

> **This is the gap SpeakQuest fills** — turning speech therapy into an engaging, reward-based game that children actually want to play.

---

## Problem Statement

Traditional speech therapy for children with autism faces several challenges:

1. **Limited engagement** — Children often find clinical exercises boring or stressful
2. **High cost** — Regular sessions with speech-language pathologists are expensive
3. **Accessibility** — Many families, particularly in developing countries, lack access to specialized therapists
4. **Inconsistent practice** — Children need daily practice, but therapy sessions are typically weekly
5. **Lack of tracking** — Parents and doctors often lack quantitative data on a child's progress

---

## Solution — SpeakQuest

SpeakQuest addresses these challenges by providing:

| Challenge | SpeakQuest Solution |
|---|---|
| Limited engagement | Three fun, voice-controlled game levels |
| High cost | Free, browser-based application |
| Accessibility | Works on any device with a microphone and browser |
| Inconsistent practice | Can be used daily at home |
| Lack of tracking | Built-in progress reports exportable for doctors/parents |

---

## Features

### Core Features
- **Three progressive game levels** targeting different speech skills
- **Real-time voice analysis** using Web Audio API
- **Browser-based speech recognition** for vowel identification
- **Visual feedback** with animations and score tracking
- **Progress tracking system** with exportable reports
- **Customizable settings** (mic sensitivity, game duration, sound effects)
- **Child-friendly, calming UI** with warm earth-tone color palette

### Technical Features
- **Django REST API backend** with JWT authentication
- **Local-first architecture** — works offline with localStorage
- **Remote sync** — data syncs to server when connected
- **Responsive design** — works on desktop, tablet, and mobile
- **No data collection** — voice data is processed locally, never stored

---

## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | Component-based UI framework |
| **Vite 8** | Build tool and development server |
| **Web Audio API** | Real-time microphone volume and pitch analysis |
| **SpeechRecognition API** | Browser-based vowel/speech recognition |
| **Canvas API** | Game rendering (Level 1 — Bird Flight) |
| **CSS3** | Styling with custom properties (design tokens) |

### Backend
| Technology | Purpose |
|---|---|
| **Python / Django** | Web framework |
| **Django REST Framework** | RESTful API |
| **Simple JWT** | Token-based authentication |
| **SQLite** | Database (development) |
| **django-cors-headers** | Cross-origin resource sharing |

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  React   │  │ Web Audio│  │ Speech Recognition│  │
│  │   App    │←→│   API    │  │       API         │  │
│  └────┬─────┘  └──────────┘  └──────────────────┘  │
│       │                                             │
│  ┌────┴─────┐                                       │
│  │ Local    │  (Offline-first: localStorage)        │
│  │ Storage  │                                       │
│  └────┬─────┘                                       │
│       │ (sync when online)                          │
└───────┼─────────────────────────────────────────────┘
        │  REST API (JWT Auth)
┌───────┴─────────────────────────────────────────────┐
│                 SERVER (Django)                       │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   Auth   │  │ Sessions │  │    Progress       │  │
│  │  (JWT)   │  │   API    │  │     Reports       │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              SQLite Database                  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Game Modules

### Level 1: Bird Flight (Volume Control)

**Skill targeted:** Voice volume modulation

- The child controls a bird's altitude by speaking into the microphone
- **Louder voice** = bird flies higher
- **Quieter voice** = bird descends
- Golden stars appear as collectibles for scoring
- Teaches volume awareness and sustained vocalization

**Technical implementation:**
- Canvas-based game rendering at 60 FPS
- RMS (Root Mean Square) volume calculation from audio buffer
- Adjustable sensitivity based on user settings

### Level 2: Vowel Finder (Articulation)

**Skill targeted:** Vowel pronunciation and articulation

- A target vowel is displayed (A, E, I, O, U)
- The child must say the correct vowel sound
- Browser Speech Recognition API identifies the spoken vowel
- Visual feedback shows correct/incorrect responses
- Includes phonetic hints and example words

**Technical implementation:**
- `SpeechRecognition` API with continuous listening
- Pattern matching for vowel identification
- Round-based progression with scoring

### Level 3: Emotion Match (Tone Expression)

**Skill targeted:** Emotional tone and expressiveness

- An emotion is displayed (Happy, Sad, Angry, Surprised, Calm)
- The child must speak in the matching emotional tone
- Audio energy band analysis detects emotional intensity
- Visual meter shows real-time energy levels
- Target zones indicate the expected energy range

**Technical implementation:**
- Frequency band analysis (low/mid/high)
- Pitch detection using autocorrelation algorithm
- Energy mapping to emotional categories

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (for backend)

### Frontend Setup

```bash
# Clone the repository
cd "Sp lec project"

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### Backend Setup

```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers

# Run migrations
python backend/manage.py migrate

# Start server
python backend/manage.py runserver
```

The API will be available at `http://localhost:8000/`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/login/` | Login and get JWT tokens |
| POST | `/api/auth/refresh/` | Refresh an expired access token |
| GET | `/api/profile/` | Get user profile |
| PUT | `/api/profile/` | Update user profile & settings |
| GET | `/api/sessions/` | List all game sessions |
| POST | `/api/sessions/` | Record a new game session |
| GET | `/api/stats/` | Get aggregated statistics |
| GET | `/api/report/` | Get formatted progress report |

---

## Design System

SpeakQuest uses a **warm, professional cream theme** specifically chosen for its calming, non-overstimulating qualities — important for children with sensory sensitivities.

### Color Palette

| Token | Color | Hex | Usage |
|---|---|---|---|
| Primary | Terracotta | `#B8784E` | Buttons, accents, interactive elements |
| Primary Light | Sand | `#D4976A` | Hover states, secondary accents |
| Secondary | Sage | `#7A8F6E` | Level 2 accent, success states |
| Accent | Warm Gold | `#C8A45A` | Highlights, achievements, Level 3 accent |
| Background | Cream | `#FAF6F1` | Page background |
| Card | White | `#FFFFFF` | Card surfaces |
| Text Primary | Espresso | `#2C2417` | Main text |
| Text Secondary | Walnut | `#6B5D4F` | Secondary text |

### Typography

- **Display:** DM Serif Display — Elegant serif for headings
- **Body:** DM Sans — Clean, readable sans-serif for content

### Design Principles

1. **Calming environment** — No harsh neon or flickering effects
2. **High contrast** — Ensures readability for all users
3. **Consistent warmth** — Earth tones create a welcoming, non-clinical feel
4. **Minimal cognitive load** — Clean layouts with clear visual hierarchy

---

## Project Structure

```
Sp lec project/
├── index.html                    # Entry HTML file
├── package.json                  # Node.js dependencies
├── vite.config.js                # Vite build configuration
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Root component with screen routing
│   ├── index.css                 # Global design system (CSS variables)
│   ├── components/
│   │   ├── LoadingScreen.jsx     # Animated loading screen
│   │   ├── MainMenu.jsx          # Main menu with level cards
│   │   ├── Level1BirdFlight.jsx  # Canvas-based voice-volume game
│   │   ├── Level2VowelFinder.jsx # Speech recognition vowel game
│   │   ├── Level3EmotionMatch.jsx# Tone/emotion matching game
│   │   ├── ResultsScreen.jsx     # Post-game results with stars
│   │   ├── ProgressReport.jsx    # Progress tracking dashboard
│   │   ├── Modals.jsx            # Settings, Help, Mic Permission
│   │   ├── Confetti.jsx          # Celebration effect
│   │   └── *.css                 # Component-specific styles
│   ├── hooks/
│   │   └── useAudioEngine.js     # Web Audio & Speech Recognition hooks
│   └── utils/
│       └── progressStore.js      # Local storage + API sync logic
└── backend/
    ├── manage.py                 # Django management script
    ├── db.sqlite3                # SQLite database
    ├── api/                      # Django REST API app
    └── speakquest_backend/       # Django project settings
```

---

## Future Enhancements

1. **Therapist Dashboard** — Web portal for speech-language pathologists to monitor multiple patients
2. **Multilingual Support** — Expand beyond English vowels to Urdu, Arabic, and other languages
3. **AI-Powered Feedback** — Use machine learning models for more precise speech assessment
4. **More Game Levels** — Word formation, sentence building, conversation practice
5. **Parent Mobile App** — React Native companion app for progress notifications
6. **Wearable Integration** — Connect with smartwatches for physiological data
7. **Leaderboards** — Optional social features to motivate children (opt-in only)

---

## References

1. World Health Organization (2023). *Autism Spectrum Disorders — Fact Sheet*. https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders
2. Centers for Disease Control and Prevention (2023). *Data & Statistics on Autism Spectrum Disorder*. https://www.cdc.gov/autism/data-research/
3. American Speech-Language-Hearing Association. *Autism — Speech and Language*. https://www.asha.org/public/speech/disorders/autism/
4. Web Audio API Documentation. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
5. SpeechRecognition API. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

---

*SpeakQuest — Because every child's voice deserves to be heard.*
