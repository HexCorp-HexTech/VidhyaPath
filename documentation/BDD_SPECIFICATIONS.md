# PathWise — Behavior-Driven Development (BDD) Specifications

This document defines the Behavior-Driven Development (BDD) specifications for PathWise across all three portal clients (Student, Teacher, and Parent). Each scenario outlines the expected behavior using the standard **Given-When-Then** format to cover every tab, feature, and usable section.

---

## 1. Onboarding & Authentication Flows

### Feature: Onboarding Wizard (Solo vs. Classroom Selection)
As a new student signing up for PathWise,
I want to select my learning style and setting,
So that my path is configured correctly.

#### Scenario: Solo Learner Signup
* **Given** a new user navigates to the registration page `/auth`
* **When** they click on the **Student** role card
* **And** they complete the basic information step (Name, Password)
* **And** they select **Solo Study** on the learning mode step
* **And** they choose their grade and board (e.g., CBSE Class 10)
* **Then** they should be guided to choose an avatar and set a security PIN
* **And** upon completion, they are logged in directly and redirected to `/student/dashboard`
* **And** their `StudentProfile` in IndexedDB has `learningMode` set to `'solo'` and `classCode` set to `undefined`.

#### Scenario: Classroom Learner Signup with Valid Code
* **Given** a new user navigates to the registration page `/auth`
* **When** they click on the **Student** role card
* **And** they select **Classroom Study** on the learning mode step
* **And** they enter a valid classroom code (e.g., `DPS-234M` which exists in `db.classrooms`)
* **Then** the input validates successfully (no error message)
* **And** they are allowed to complete the avatar selection and PIN setup
* **And** they are redirected to `/student/dashboard`
* **And** their `StudentProfile` in IndexedDB has `learningMode` set to `'classroom'` and `classCode` set to the entered classroom code.

#### Scenario: Classroom Learner Signup with Invalid Code
* **Given** a new user navigates to the registration page `/auth`
* **When** they select **Classroom Study** and type a non-existent classroom code `FAKE-999`
* **Then** the form displays a validation error: `"Classroom code not found. Please verify with your teacher."`
* **And** the "Next" button remains disabled, preventing them from finishing onboarding.

---

## 2. Student Portal BDD Specifications

### Tab: Dashboard Overview
As a Student,
I want to view my progress highlights, daily streaks, level, and active tasks,
So that I can plan my study session.

#### Scenario: Viewing Dashboard Stats and Streak
* **Given** a student is logged in and is on the `/student/dashboard` page
* **When** the page loads
* **Then** the app queries `db.studentProfiles` to retrieve their current level, streak, and total XP
* **And** the UI displays the progress bar for their level (scaled via `xpToLevel` utility)
* **And** the streak icon displays the correct streak count
* **And** the "Strengths & Weaknesses" summary card lists subjects computed from their actual BKT profiles.

---

### Tab: Subjects & Curriculum View
As a Student,
I want to navigate through my subjects and chapter lists,
So that I can read notes, view formulas, and study.

#### Scenario: Loading Custom AI Chapter Notes (Cache Hit)
* **Given** a student has previously opened the "Real Numbers" chapter notes
* **When** they click on "Real Numbers" in the chapters list
* **Then** the application queries `db.notes` for the chapter ID
* **And** it finds the cached note record
* **And** it renders the markdown text and parsed formula list instantly without sending any API network requests.

#### Scenario: Loading Custom AI Chapter Notes (Cache Miss - Online)
* **Given** a student is online and clicks on a custom chapter that has not been studied yet
* **When** they enter the chapter view
* **Then** the app checks that `navigator.onLine` is true
* **And** it makes a POST request to `/api/generate-chapter-content`
* **And** upon a successful `200` response, it caches the markdown notes in `db.notes` and populates the quiz questions and flashcards in their respective tables
* **And** the loading spinner disappears, displaying the newly generated content.

#### Scenario: Loading Custom AI Chapter Notes (Cache Miss - Offline)
* **Given** a student has no internet connection (`navigator.onLine` is false)
* **When** they click on a custom chapter that has no cached notes in `db.notes`
* **Then** the application skips the API network fetch entirely
* **And** it falls back to generating a local rule-based curriculum block using the local engine
* **And** it displays the generated notes to the user but does **not** store a skeleton "temporarily unavailable" error stub in `db.notes` so that it will retry the server generation once online.

---

### Feature: AI Tutor Chat & TTS Audio
As a Student,
I want to ask questions to the AI tutor and listen to explanations,
So that I can clarify complex math and science doubts.

#### Scenario: Asking the Tutor a Doubt
* **Given** a student is on the AI Tutor panel `/student/tutor`
* **When** they type a message `"Explain the quadratic formula"` and press send
* **Then** the message is appended to the chat window
* **And** the client calls the local mock AI response generator or pings the backend chat endpoint
* **And** the response with step-by-step Latex-formatted equations is streamed or rendered in the chat bubble.

#### Scenario: Text-To-Speech (TTS) offline behavior
* **Given** the student is offline
* **When** they click the "Listen" audio icon on a tutor chat response
* **Then** the app checks connection status via `networkManager`
* **And** it displays a non-blocking toast warning: `"Text-to-Speech is unavailable offline. Showing text instead."`
* **And** it does not freeze the interface or trigger blocking browser alerts.

---

### Tab: Flashcard reviews (SM-2 Scheduler)
As a Student,
I want to review smart flashcards,
So that I can reinforce facts via spaced repetition.

#### Scenario: Reviewing a Card and Rating Difficulty
* **Given** a student is in the flashcard review page
* **When** they flip a card to see the answer
* **And** they click one of the SM-2 feedback ratings: **"Again" (1)**, **"Good" (4)**, or **"Easy" (5)**
* **Then** the card's interval, easiness factor, and next review date are re-calculated in `db.sm2Cards` using the SM-2 algorithm
* **And** the card is scheduled for the computed number of days later
* **And** the student is awarded +5 XP for the review.

---

### Feature: Doubt Room
As a Student,
I want to post doubts and see teacher responses,
So that I can get help on homework.

#### Scenario: Posting a New Doubt
* **Given** a student is on the Doubt Room page `/student/doubts`
* **When** they fill in the form with a Title, Chapter selection, and Description, and click **Post Doubt**
* **Then** a new record is added to `db.doubtPosts` with `status: 'open'` and their `userId`
* **And** the post instantly appears in the student's personal doubt room feed.

---

### Tab: Adaptive Quizzes (BKT Integration)
As a Student,
I want to take adaptive quizzes,
So that I can verify my mastery and level up.

#### Scenario: Completing a Quiz and Updating BKT Mastery
* **Given** a student starts a quiz for "Polynomials"
* **When** they answer 5 questions in sequence
* **Then** for each correct answer, the BKT updates the probability of knowledge (`pKnow`) upwards in `db.bktMastery`
* **And** for each incorrect answer, BKT updates `pKnow` downwards
* **And** on submitting the quiz, a new `quizAttempts` record is stored with their final score
* **And** they are shown a results summary displaying earned XP, level updates, and a mastery percentage.

---

## 3. Teacher Portal BDD Specifications

### Tab: Overview Dashboard
As a Teacher,
I want to monitor my class performance, active students count, and recent events,
So that I can get an overview of my classroom.

#### Scenario: Loading the Overview Dashboard
* **Given** a teacher is logged in with active classroom code `DPS-234M`
* **When** they open `/teacher/dashboard`
* **Then** the app queries `db.studentProfiles` to find all student profiles matching `classCode === 'DPS-234M'`
* **And** it displays the total number of enrolled students
* **And** it computes the active student count based on the number of students who completed a `studySession` today
* **And** it computes the class average score dynamically from their attempts.
* **And** all cards fit cleanly within the viewport grid without overflow or layout bleed.

---

### Tab: Student Directory
As a Teacher,
I want to check on my student profiles and view their individual analytics,
So that I can identify who needs intervention.

#### Scenario: Viewing a Student Profile Detail
* **Given** a teacher is on the student directory page `/teacher/students`
* **When** they click on a student's card (e.g., "Vivaan Rao")
* **Then** the student detail panel mounts
* **And** the app queries `db.studentProfiles` for Vivaan's record to display their grade and board
* **And** it queries `db.bktMastery` and `db.quizAttempts` for Vivaan to render his real subject scores
* **And** it lists his strong concepts (BKT mastery >= 75%) and weak concepts (BKT mastery < 60%) dynamically.

---

### Tab: Content & Syllabus Generator
As a Teacher,
I want to generate custom learning resources for my class,
So that I can cover topics outside the default curriculum.

#### Scenario: Creating a Custom Chapter
* **Given** a teacher is on `/teacher/content`
* **When** they input a custom chapter title `"Quantum Mechanics Basics"` and click **Generate**
* **Then** the client sends a payload to the content generation endpoint
* **And** on success, a new chapter record is added to `db.chapters`
* **And** the new chapter immediately becomes available for all students enrolled under the teacher's classroom code.

---

### Tab: Assignments View
As a Teacher,
I want to assign quizzes to my class and track who completed them,
So that I can manage homework compliance.

#### Scenario: Assigning a Chapter Quiz
* **Given** a teacher is on `/teacher/assignments`
* **When** they select a chapter, set a due date, and click **Create Assignment**
* **Then** a new record is created in `db.assignments` linked to their `activeClassroomCode`
* **And** this assignment is instantly visible on the dashboards of all students in that class.

---

### Tab: AI Insights Panel
As a Teacher,
I want to view automated AI suggestions for my classroom,
So that I can target revision sessions.

#### Scenario: Viewing Dynamic Roadblocks and Doubts
* **Given** a teacher is on `/teacher/insights`
* **When** the page queries classroom metrics
* **Then** it scans student records to identify the chapter with the lowest average score
* **And** if the average score is under 70%, it displays a **Concept Block Detected** warning recommending revision
* **And** it scans open doubts from classroom students and displays a **Doubt Room Active Queries** card listing how many questions are unresolved.

---

## 4. Parent Portal BDD Specifications

### Tab: Link Account Flow
As a Parent,
I want to enter my child's access code,
So that I can link our accounts.

#### Scenario: Linking Account with Valid Access Code
* **Given** a parent is on the parent login page `/auth/parent/login`
* **When** they enter their child's student user ID (e.g., `student-aarav-001`)
* **And** they click **Access Dashboard**
* **Then** the client queries `db.users` to confirm the user exists and has the `'student'` role
* **And** it stores the linked ID in `localStorage.setItem('parent_active_child_id', 'student-aarav-001')`
* **And** it redirects them to the parent dashboard.

#### Scenario: Linking Account with Invalid Access Code
* **Given** a parent is on `/auth/parent/login`
* **When** they enter a non-existent code `BADCODE99`
* **Then** the form displays a validation error: `"Invalid access code. Please check your child's student dashboard."`

---

### Tab: Progress Dashboard
As a Parent,
I want to view my child's learning statistics, study time, and achievements,
So that I can stay updated on their progress.

#### Scenario: Viewing Dashboard with Linked Child
* **Given** a parent has a linked child ID in `localStorage`
* **When** they open `/parent/dashboard`
* **Then** the app queries `db.users` and `db.studentProfiles` for that child
* **And** it displays the child's real name, current streak, study hours (summed from `db.studySessions`), and completed quizzes
* **And** it displays their daily study time chart.

#### Scenario: Viewing Dashboard with No Child Linked
* **Given** a parent clears their browser cache or visits `/parent/dashboard` without entering a code
* **When** the page loads
* **Then** the app detects that no child ID exists in `localStorage`
* **And** it displays a **No Child Linked** empty state with a button directing them to link their child's account.
