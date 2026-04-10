export const generateLesson = (chapter) => {
  return `Lesson for ${chapter}: This explains the concept in simple terms. You will learn the foundation, where the chapter is used, and the ideas you need before moving into practice.`;
};

export const generateNotes = (chapter) => {
  return [
    `${chapter} - Key Point 1`,
    `${chapter} - Key Point 2`,
    `${chapter} - Key Point 3`,
  ];
};

export const generateQuiz = (chapter) => {
  return [
    {
      question: `What is ${chapter}?`,
      options: ["Concept", "Animal", "City", "Food"],
      answer: "Concept",
    },
    {
      question: `${chapter} belongs to?`,
      options: ["Math", "Science", "History", "Art"],
      answer: "Math",
    },
  ];
};
