# Kinetic

**Kinetic** is a gamified workout tracker built to make long-term fitness consistent, rewarding, and enjoyable.

Rather than simply logging workouts, Kinetic transforms exercise into a progression system inspired by games. Every completed workout advances your roadmap, builds your streak, unlocks progression levels, and earns milestone rewards designed to encourage consistency over months and years.

Kinetic is part of the **HADO Nexus** ecosystem — a collection of productivity and self-improvement applications that share a common philosophy of turning real-life habits into rewarding progression systems.

---

# Features

## Adaptive Workout Roadmap

* Structured 7-node weekly workout roadmap
* Push / Pull / Legs & Core split
* Automatic workout progression
* Built-in recovery days
* Visual roadmap showing completed, active, and upcoming workouts

---

## Guided Workout Wizard

Each workout session guides the user through every stage of the workout.

* Warm-up preparation
* Exercise tracking
* Cool-down routine
* Session completion
* Performance feedback

---

## Intelligent Progression System

Instead of fixed workouts forever, Kinetic adapts as you improve.

* Independent progression levels for:

  * Push
  * Pull
  * Legs & Core
* Adaptive workload scaling
* Calibration phase
* Infinite progression system

---

# Streak & Reward System

Consistency is the core of Kinetic.

Daily workouts increase your streak while milestone achievements unlock progressively stronger rewards.

| Milestone        | Reward                                                     |
| ---------------- | ---------------------------------------------------------- |
| Daily completion | Small celebration animation with confetti                  |
| 7-Day Streak     | Bronze Shield (protects 1 missed workout day)              |
| 28-Day Streak    | Silver Shield (protects up to 3 missed workout days)       |
| 365-Day Streak   | Gold Shield (protects approximately 2 weeks of inactivity) |

### Shield System

Shields are emergency streak protection.

If life gets in the way, shields prevent your streak from breaking.

* **Bronze Shield**

  * Earned every weekly milestone
  * Protects **1 missed workout day**

* **Silver Shield**

  * Earned every monthly milestone
  * Protects **up to 3 missed workout days**
  * Only one Silver Shield can be active at a time, encouraging users to return before earning another

* **Gold Shield**

  * Earned after maintaining a full-year streak
  * Designed for extended breaks such as vacations
  * Protects roughly **two weeks** of inactivity

Each reward milestone is accompanied by increasingly elaborate celebration animations, making long-term consistency feel meaningful rather than repetitive.

---

# Dashboard

The dashboard provides an overview of your fitness journey.

Features include:

* Workout statistics
* Progression levels
* Weight tracking
* Workout completion calendar
* Shield inventory
* Equipment management
* Current training phase

---

# Authentication

* Google Sign-In with Firebase Authentication
* Secure cloud synchronization using Firestore

---

# Responsive Design

Kinetic is designed with a responsive interface that adapts naturally to different devices.

### Mobile

* Optimized for one-handed usage
* Bottom navigation
* Touch-friendly interactions

### Desktop

* Expands into a spacious dashboard layout
* Better use of widescreen displays
* Larger analytics panels
* Multi-column interface

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion

## Backend & Services

* Firebase Authentication
* Cloud Firestore

## Libraries

* date-fns
* Lucide React
* Canvas Confetti

---

# Screenshots

## Login

> **Placeholder:** Google Sign-In screen

<!-- login.png -->

---

## Workout Roadmap

> **Placeholder:** Weekly roadmap with seven workout nodes

<!-- roadmap.png -->

---

## Dashboard

> **Placeholder:** Analytics dashboard

<!-- dashboard.png -->

---

## Workout Wizard

> **Placeholder:** Guided workout session

<!-- workout-wizard.png -->

---

## Mobile Experience

> **Placeholder:** Mobile-responsive layout

<!-- mobile-layout.png -->

---

# Project Structure

```text
src/
│
├── app/
│   ├── roadmap/
│   ├── workout/
│   └── dashboard/
│
├── components/
├── context/
├── hooks/
├── core/
└── assets/
```

---

# Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Configure your Firebase credentials inside a `.env` file.

Start the development server

```bash
npm run dev
```

Create a production build

```bash
npm run build
```

---

# HADO Nexus

Kinetic is one application within the **HADO Nexus** ecosystem, a growing collection of habit-building applications that share progression systems, streak mechanics, and long-term self-improvement principles.

### Current Applications

### Kinetic

Gamified workout tracker focused on consistency, adaptive progression, and long-term fitness.

### Thartheel

Quran recitation and memorization tracker featuring streaks, progress tracking, and habit-building mechanics.

**Live Demo:** https://thartheel-sand.vercel.app

Future HADO Nexus applications will integrate into a shared ecosystem where maintaining multiple habits contributes toward broader long-term progression.

---

# Future Plans

* Personal records (PRs)
* Exercise history
* Achievement collection
* More workout programs
* Advanced analytics
* Cloud backup improvements
* Cross-app progression within HADO Nexus
* Unified HADO Nexus dashboard

---

# License

This project is intended for educational and personal use unless otherwise specified.
