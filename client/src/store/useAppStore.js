import { create } from "zustand";

export const useAppStore = create((set) => ({
  standard: null,
  subject: null,
  syllabus: [],
  currentChapter: null,
  lesson: null,
  notes: null,
  quiz: [],
  score: null,
  setStandard: (standard) => set({ standard }),
  setSubject: (subject) => set({ subject }),
  setSyllabus: (syllabus) => set({ syllabus }),
  setChapter: (chapter) => set({ currentChapter: chapter }),
  setLesson: (lesson) => set({ lesson }),
  setNotes: (notes) => set({ notes }),
  setQuiz: (quiz) => set({ quiz }),
  setScore: (score) => set({ score }),
  resetFlow: () =>
    set({
      lesson: null,
      notes: null,
      quiz: [],
      score: null,
    }),
  resetSelection: () =>
    set({
      standard: null,
      subject: null,
      syllabus: [],
      currentChapter: null,
      lesson: null,
      notes: null,
      quiz: [],
      score: null,
    }),
}));
