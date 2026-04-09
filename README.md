# PathWise 🎓 — Adaptive Learning Platform

PathWise is an AI-powered adaptive learning application natively supporting CBSE, ICSE, and Indian State Boards curriculums. By dynamically tracking student strengths, weaknesses, and preferred learning styles, the system directly tailors their quizzes and chapter notes using Google Gemini 2.0 Flash context-aligned AI generation. 

## Key Features
* 🧠 **Omni-AI Study Path**: Detailed conceptual notes and dynamically scaling quizzes individually tailored against a student's previous missed questions.
* 🏫 **Teacher Dashboard Integration**: Instantly view individual statistics for scores, streak counts, and explicit weaknesses pinpointed by chapter limits.
* 📶 **Resilient Offline Architecture**: Pre-generated exhaustive, deep lesson modules fallback when offline without dropping learning momentum. Includes interactive Flashcards for formulas and key-concepts.
* 🗺️ **Full Class 1-10 Curriculum Maps**: Syllabus support mapped against the exact standards of the student. 

## Tech Stack
* **Frontend**: React.js (Vite), Pure CSS
* **Backend**: Express.js (Node.js) 
* **Database**: High-performance synchronous `better-sqlite3` file-storage mapping student analytics & teacher hierarchies.
* **AI Provider**: OpenRouter API (`google/gemini-2.0-flash-001`)

## Setup Instructions

1. Clone the repository down into a clean folder.
2. Build the Server & Setup env variables:
    ```bash
    cd server
    npm install
    # Setup .env containing your key (must start with sk-or-)
    echo "OPENROUTER_API_KEY=sk-or-your_key_here" > .env
    npm start
    ```
3. Run the UI / Development Studio
    ```bash
    # Open a secondary terminal instance
    cd client
    npm install
    npm run dev
    ```

## Development & Usage Notes
- The default host is set to `http://localhost:5173` pointing to API endpoints strictly at `:3001/api`.
- You can create your own Teacher Profile via the onboarding sequence and assign specific student groups distinct "Class Codes" (e.g. `MATH-CLASS-5A`).
- The entire `server/pathwise.db` is ephemeral but tracked locally for high-speed persistence across reloads. 
