// Local AI Engine — offline fallback with syllabus-aware dynamic generation
import { getChapters } from './syllabus.js';

// ============= DYNAMIC QUIZ GENERATION =============
// Generates unique quizzes per student level using templates + randomization

const mathQuestionTemplates = {
  beginner: [
    // Arithmetic
    (vars) => ({ question: `What is ${vars.a} + ${vars.b}?`, options: [`A) ${vars.a+vars.b}`, `B) ${vars.a+vars.b+1}`, `C) ${vars.a+vars.b-1}`, `D) ${vars.a*2}`], correct_answer: "A", explanation: `${vars.a} + ${vars.b} = ${vars.a+vars.b}` }),
    (vars) => ({ question: `What is ${vars.c} - ${vars.d}?`, options: [`A) ${vars.c-vars.d+1}`, `B) ${vars.c-vars.d}`, `C) ${vars.c-vars.d-1}`, `D) ${vars.c+vars.d}`], correct_answer: "B", explanation: `${vars.c} - ${vars.d} = ${vars.c-vars.d}` }),
    (vars) => ({ question: `What is ${vars.a} × ${vars.e}?`, options: [`A) ${vars.a*vars.e+vars.e}`, `B) ${vars.a+vars.e}`, `C) ${vars.a*vars.e}`, `D) ${vars.a*vars.e-1}`], correct_answer: "C", explanation: `${vars.a} × ${vars.e} = ${vars.a*vars.e}` }),
    (vars) => ({ question: `${vars.f} ÷ ${vars.e} = ?`, options: [`A) ${vars.f/vars.e}`, `B) ${vars.f/vars.e+1}`, `C) ${vars.f*vars.e}`, `D) ${vars.f-vars.e}`], correct_answer: "A", explanation: `${vars.f} ÷ ${vars.e} = ${vars.f/vars.e}` }),
    (vars) => ({ question: `Which number is greater: ${vars.a*10+vars.b} or ${vars.b*10+vars.a}?`, options: [`A) ${vars.a*10+vars.b}`, `B) ${vars.b*10+vars.a}`, `C) Both are equal`, `D) Cannot determine`], correct_answer: vars.a*10+vars.b > vars.b*10+vars.a ? "A" : "B", explanation: `Compare: ${vars.a*10+vars.b} vs ${vars.b*10+vars.a}. The larger number is ${Math.max(vars.a*10+vars.b, vars.b*10+vars.a)}.` }),
    (vars) => ({ question: `You have ${vars.c} pencils and buy ${vars.a} more. How many now?`, options: [`A) ${vars.c+vars.a}`, `B) ${vars.c-vars.a}`, `C) ${vars.c*vars.a}`, `D) ${vars.a}`], correct_answer: "A", explanation: `${vars.c} + ${vars.a} = ${vars.c+vars.a} pencils` }),
    (vars) => ({ question: `What is the place value of ${vars.e} in ${vars.e}${vars.a}?`, options: [`A) ${vars.e}`, `B) ${vars.e*10}`, `C) ${vars.a}`, `D) ${vars.e+vars.a}`], correct_answer: "B", explanation: `${vars.e} is in the tens place, so its value is ${vars.e*10}.` }),
    (vars) => ({ question: `Count by 5: 5, 10, 15, ${20}, ___`, options: [`A) 22`, `B) 24`, `C) 25`, `D) 30`], correct_answer: "C", explanation: `Counting by 5s: 5, 10, 15, 20, 25` }),
  ],
  intermediate: [
    (vars) => ({ question: `What is ${vars.a*10+vars.b} × ${vars.e}?`, options: [`A) ${(vars.a*10+vars.b)*vars.e}`, `B) ${(vars.a*10+vars.b)*vars.e+10}`, `C) ${(vars.a*10+vars.b)+vars.e}`, `D) ${(vars.a*10+vars.b)*vars.e-5}`], correct_answer: "A", explanation: `${vars.a*10+vars.b} × ${vars.e} = ${(vars.a*10+vars.b)*vars.e}` }),
    (vars) => ({ question: `If x + ${vars.a} = ${vars.a+vars.b}, what is x?`, options: [`A) ${vars.b}`, `B) ${vars.a}`, `C) ${vars.a+vars.b}`, `D) ${vars.a-vars.b}`], correct_answer: "A", explanation: `x = ${vars.a+vars.b} - ${vars.a} = ${vars.b}` }),
    (vars) => ({ question: `What is ${vars.a*10}% of ${vars.c*10}?`, options: [`A) ${(vars.a*10*vars.c*10)/100}`, `B) ${vars.a*vars.c}`, `C) ${vars.a+vars.c}`, `D) ${vars.a*10+vars.c*10}`], correct_answer: "A", explanation: `${vars.a*10}% of ${vars.c*10} = (${vars.a*10} × ${vars.c*10}) / 100 = ${(vars.a*10*vars.c*10)/100}` }),
    (vars) => ({ question: `The ratio of boys to girls is ${vars.a}:${vars.e}. If there are ${vars.a*5} boys, how many girls?`, options: [`A) ${vars.e*5}`, `B) ${vars.e*vars.a}`, `C) ${vars.a*5}`, `D) ${(vars.a+vars.e)*5}`], correct_answer: "A", explanation: `Ratio ${vars.a}:${vars.e}, boys=${vars.a*5}. Multiply factor = ${5}. Girls = ${vars.e} × 5 = ${vars.e*5}` }),
    (vars) => ({ question: `A triangle has angles 60° and ${vars.a*10}°. What is the third angle?`, options: [`A) ${180-60-vars.a*10}°`, `B) ${vars.a*10}°`, `C) 90°`, `D) 60°`], correct_answer: "A", explanation: `Sum of angles = 180°. Third = 180 - 60 - ${vars.a*10} = ${180-60-vars.a*10}°` }),
    (vars) => ({ question: `Find the area of rectangle with length ${vars.c+3}cm and width ${vars.e}cm.`, options: [`A) ${(vars.c+3)*vars.e} cm²`, `B) ${2*((vars.c+3)+vars.e)} cm²`, `C) ${(vars.c+3)+vars.e} cm²`, `D) ${(vars.c+3)*vars.e+1} cm²`], correct_answer: "A", explanation: `Area = length × width = ${vars.c+3} × ${vars.e} = ${(vars.c+3)*vars.e} cm²` }),
    (vars) => ({ question: `Simplify: ${vars.a*2}/${vars.a*4}`, options: [`A) 1/2`, `B) 2/1`, `C) ${vars.a}/${vars.a*2}`, `D) 1/4`], correct_answer: "A", explanation: `${vars.a*2}/${vars.a*4} = 1/2 (divide both by ${vars.a*2})` }),
    (vars) => ({ question: `What is the HCF of ${vars.e*6} and ${vars.e*4}?`, options: [`A) ${vars.e*2}`, `B) ${vars.e}`, `C) ${vars.e*4}`, `D) ${vars.e*6}`], correct_answer: "A", explanation: `Factors of ${vars.e*6}: ${vars.e*2}×3. Factors of ${vars.e*4}: ${vars.e*2}×2. HCF = ${vars.e*2}` }),
  ],
  advanced: [
    (vars) => ({ question: `Solve: 2x + ${vars.a} = ${vars.a + vars.b*2}`, options: [`A) x = ${vars.b}`, `B) x = ${vars.a}`, `C) x = ${vars.b+1}`, `D) x = ${vars.b-1}`], correct_answer: "A", explanation: `2x = ${vars.a+vars.b*2} - ${vars.a} = ${vars.b*2}. x = ${vars.b}` }),
    (vars) => ({ question: `If sin θ = ${vars.e-1}/5 and θ is acute, what is cos θ?`, options: [`A) 4/5`, `B) 3/5`, `C) ${6-vars.e}/5`, `D) ${vars.e}/5`], correct_answer: "B", explanation: `Using sin²θ + cos²θ = 1: cos²θ = 1 - (${vars.e-1}/5)² = 9/25. cos θ = 3/5` }),
    (vars) => ({ question: `The ${vars.a}th term of AP: 3, 7, 11, ... is?`, options: [`A) ${3+(vars.a-1)*4}`, `B) ${3+vars.a*4}`, `C) ${vars.a*3}`, `D) ${3+(vars.a)*4-1}`], correct_answer: "A", explanation: `an = a + (n-1)d = 3 + ${vars.a-1}×4 = ${3+(vars.a-1)*4}` }),
    (vars) => ({ question: `Find discriminant of x² + ${vars.a}x + ${Math.floor(vars.a*vars.a/4)-1} = 0`, options: [`A) ${vars.a*vars.a - 4*(Math.floor(vars.a*vars.a/4)-1)}`, `B) 0`, `C) ${vars.a*vars.a}`, `D) -${vars.a}`], correct_answer: "A", explanation: `D = b² - 4ac = ${vars.a}² - 4(1)(${Math.floor(vars.a*vars.a/4)-1}) = ${vars.a*vars.a - 4*(Math.floor(vars.a*vars.a/4)-1)}` }),
    (vars) => ({ question: `Distance between points (${vars.a},${vars.b}) and (${vars.a+3},${vars.b+4}) is?`, options: [`A) 5`, `B) 7`, `C) ${vars.a+vars.b}`, `D) 25`], correct_answer: "A", explanation: `D = √((3)² + (4)²) = √(9+16) = √25 = 5` }),
    (vars) => ({ question: `Volume of cylinder with radius ${vars.e}cm and height ${vars.a+5}cm is? (π≈22/7)`, options: [`A) ${Math.round(22/7*vars.e*vars.e*(vars.a+5))} cm³`, `B) ${Math.round(22/7*2*vars.e*(vars.a+5))} cm³`, `C) ${vars.e*vars.e*(vars.a+5)} cm³`, `D) ${Math.round(22/7*vars.e*(vars.a+5))} cm³`], correct_answer: "A", explanation: `V = πr²h = 22/7 × ${vars.e}² × ${vars.a+5} ≈ ${Math.round(22/7*vars.e*vars.e*(vars.a+5))} cm³` }),
  ]
};

const scienceQuestions = {
  beginner: [
    { question: "What gas do plants take in during photosynthesis?", options: ["A) Oxygen", "B) Carbon Dioxide", "C) Nitrogen", "D) Hydrogen"], correct_answer: "B", explanation: "Plants absorb CO₂ and release O₂ during photosynthesis." },
    { question: "Which organ pumps blood in the human body?", options: ["A) Lungs", "B) Brain", "C) Heart", "D) Liver"], correct_answer: "C", explanation: "The heart pumps blood through the circulatory system." },
    { question: "Water boils at what temperature (°C)?", options: ["A) 50°C", "B) 100°C", "C) 200°C", "D) 0°C"], correct_answer: "B", explanation: "Water boils at 100°C at standard atmospheric pressure." },
    { question: "Which is NOT a state of matter?", options: ["A) Solid", "B) Liquid", "C) Energy", "D) Gas"], correct_answer: "C", explanation: "The three common states are solid, liquid, and gas. Energy is not a state of matter." },
    { question: "What do we call animals that eat only plants?", options: ["A) Carnivores", "B) Omnivores", "C) Herbivores", "D) Decomposers"], correct_answer: "C", explanation: "Herbivores eat only plants. Examples: cow, deer, rabbit." },
    { question: "Which part of the plant makes food?", options: ["A) Root", "B) Stem", "C) Leaf", "D) Flower"], correct_answer: "C", explanation: "Leaves contain chlorophyll and perform photosynthesis to make food." },
    { question: "Iron objects left in rain get covered with a reddish layer called:", options: ["A) Dust", "B) Rust", "C) Mould", "D) Moss"], correct_answer: "B", explanation: "Rust (iron oxide) forms when iron reacts with oxygen and moisture." },
  ],
  intermediate: [
    { question: "The pH of a neutral solution is:", options: ["A) 0", "B) 7", "C) 14", "D) 1"], correct_answer: "B", explanation: "pH 7 is neutral. Below 7 is acidic, above 7 is basic." },
    { question: "Which organelle is the powerhouse of the cell?", options: ["A) Nucleus", "B) Ribosome", "C) Mitochondria", "D) Golgi body"], correct_answer: "C", explanation: "Mitochondria produce ATP (energy) through cellular respiration." },
    { question: "Newton's first law is also called the law of:", options: ["A) Acceleration", "B) Inertia", "C) Gravity", "D) Action-Reaction"], correct_answer: "B", explanation: "Newton's 1st law: objects at rest stay at rest (inertia) unless acted on by a force." },
    { question: "Which type of bond is formed by sharing electrons?", options: ["A) Ionic", "B) Metallic", "C) Covalent", "D) Hydrogen"], correct_answer: "C", explanation: "Covalent bonds form when atoms share electron pairs." },
    { question: "Sound cannot travel through:", options: ["A) Air", "B) Water", "C) Steel", "D) Vacuum"], correct_answer: "D", explanation: "Sound needs a medium. It cannot travel through vacuum (empty space)." },
    { question: "The SI unit of force is:", options: ["A) Joule", "B) Watt", "C) Newton", "D) Pascal"], correct_answer: "C", explanation: "Force is measured in Newtons (N). F = ma." },
    { question: "Which gas is known as laughing gas?", options: ["A) NO", "B) N₂O", "C) NO₂", "D) N₂O₅"], correct_answer: "B", explanation: "Nitrous oxide (N₂O) is called laughing gas." },
  ],
  advanced: [
    { question: "The equivalent resistance of two 4Ω resistors in parallel is:", options: ["A) 8Ω", "B) 4Ω", "C) 2Ω", "D) 1Ω"], correct_answer: "C", explanation: "1/R = 1/4 + 1/4 = 1/2. R = 2Ω" },
    { question: "In Mendel's monohybrid cross, the F2 ratio is:", options: ["A) 1:1", "B) 3:1", "C) 9:3:3:1", "D) 1:2:1"], correct_answer: "B", explanation: "F2 phenotypic ratio is 3:1 (3 dominant : 1 recessive)." },
    { question: "The functional group -COOH represents:", options: ["A) Alcohol", "B) Aldehyde", "C) Ketone", "D) Carboxylic acid"], correct_answer: "D", explanation: "-COOH is the carboxylic acid group (e.g., acetic acid CH₃COOH)." },
    { question: "Power of a lens with focal length 25cm is:", options: ["A) +4D", "B) -4D", "C) +25D", "D) +0.25D"], correct_answer: "A", explanation: "P = 100/f(cm) = 100/25 = +4 diopters" },
    { question: "Ozone layer is found in which layer of atmosphere?", options: ["A) Troposphere", "B) Stratosphere", "C) Mesosphere", "D) Thermosphere"], correct_answer: "B", explanation: "Ozone (O₃) layer in the stratosphere protects us from UV radiation." },
    { question: "Which Fleming's rule gives direction of induced current?", options: ["A) Left hand", "B) Right hand", "C) Both", "D) Neither"], correct_answer: "B", explanation: "Fleming's Right Hand Rule gives direction of induced current (generator)." },
  ]
};

const englishQuestions = {
  beginner: [
    { question: "Which is a noun in: 'The cat sat on the mat'?", options: ["A) sat", "B) on", "C) cat", "D) the"], correct_answer: "C", explanation: "Cat (and mat) are nouns — they name things." },
    { question: "What is the past tense of 'go'?", options: ["A) goed", "B) gone", "C) went", "D) goes"], correct_answer: "C", explanation: "'Go' is irregular. Past tense: went. Past participle: gone." },
    { question: "Choose the correct sentence:", options: ["A) She go to school", "B) She goes to school", "C) She going to school", "D) She to school goes"], correct_answer: "B", explanation: "With 'she' (3rd person singular), we add 's' to the verb: goes." },
    { question: "Which word is an adjective: 'The tall boy ran fast'?", options: ["A) boy", "B) ran", "C) tall", "D) fast"], correct_answer: "C", explanation: "Tall describes the boy — it's an adjective." },
    { question: "The plural of 'child' is:", options: ["A) childs", "B) childrens", "C) children", "D) child's"], correct_answer: "C", explanation: "Child → Children (irregular plural)." },
  ],
  intermediate: [
    { question: "Convert to passive: 'She writes a letter'", options: ["A) A letter is written by her", "B) A letter was written by her", "C) A letter written by her", "D) She is written by a letter"], correct_answer: "A", explanation: "Present simple passive: is/am/are + past participle." },
    { question: "Reported speech: He said, 'I am happy'", options: ["A) He said that I am happy", "B) He said that he was happy", "C) He said that he is happy", "D) He says that he was happy"], correct_answer: "B", explanation: "Indirect: change pronoun (I→he), tense back-shift (am→was)." },
    { question: "Which sentence has correct subject-verb agreement?", options: ["A) The team are winning", "B) The dogs runs fast", "C) She don't know", "D) The students have finished"], correct_answer: "D", explanation: "Plural subject 'students' takes 'have' (not 'has')." },
    { question: "Identify the conjunction: 'I like tea but not coffee'", options: ["A) like", "B) not", "C) but", "D) tea"], correct_answer: "C", explanation: "'But' joins two contrasting ideas — it's a conjunction." },
    { question: "The correct format for a formal letter starts with:", options: ["A) Hey there!", "B) Dear Sir/Madam", "C) What's up?", "D) Hi friend"], correct_answer: "B", explanation: "Formal letters begin with 'Dear Sir/Madam' or the person's title." },
  ],
  advanced: [
    { question: "Identify the figure of speech: 'The world is a stage'", options: ["A) Simile", "B) Metaphor", "C) Personification", "D) Alliteration"], correct_answer: "B", explanation: "Metaphor directly compares without 'like' or 'as'." },
    { question: "Which sentence uses the subjunctive mood?", options: ["A) If I was rich", "B) If I were rich", "C) If I am rich", "D) If I will be rich"], correct_answer: "B", explanation: "'If I were' uses subjunctive mood for hypothetical situations." },
    { question: "The phrasal verb 'put up with' means:", options: ["A) to construct", "B) to tolerate", "C) to postpone", "D) to display"], correct_answer: "B", explanation: "'Put up with' means to tolerate or endure something." },
    { question: "Identify the clause type: 'when the rain stopped'", options: ["A) Independent", "B) Relative", "C) Subordinate/Dependent", "D) Main"], correct_answer: "C", explanation: "'When the rain stopped' is a subordinate clause — it can't stand alone." },
    { question: "An analytical paragraph should:", options: ["A) Tell a story", "B) Present data-based analysis objectively", "C) Be written as a poem", "D) Include personal opinions only"], correct_answer: "B", explanation: "Analytical paragraphs present objective analysis based on given data." },
  ]
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateDynamicMathQuiz(level) {
  const vars = {
    a: getRandomInt(2, 9), b: getRandomInt(2, 9),
    c: getRandomInt(10, 25), d: getRandomInt(2, 9),
    e: getRandomInt(2, 7), f: getRandomInt(1, 5) * getRandomInt(2, 7)
  };
  // Make f divisible by e
  vars.f = vars.e * getRandomInt(2, 8);

  const templates = mathQuestionTemplates[level] || mathQuestionTemplates.beginner;
  const shuffled = shuffleArray(templates);
  return shuffled.slice(0, 5).map(fn => fn(vars));
}

function generateSubjectQuiz(subject, level) {
  const bank = subject === 'science' ? scienceQuestions : subject === 'english' ? englishQuestions : null;
  if (!bank) return null;
  
  const questions = bank[level] || bank.beginner;
  return shuffleArray(questions).slice(0, 5);
}

// ============= PATH GENERATION (syllabus-aware) =============

const contentBank = {
  math: {
    beginner: [
      { topic: "Number Basics & Counting", why_it_matters: "Numbers are the foundation of all math.", duration_minutes: 25, difficulty: 1, resource_description: "Practice counting 1-100. Group items in tens." },
      { topic: "Addition & Subtraction", why_it_matters: "Used every day — buying, sharing, measuring.", duration_minutes: 30, difficulty: 1, resource_description: "Use real objects. Practice single and double digits." },
      { topic: "Multiplication Tables (1-5)", why_it_matters: "Fast addition for quick calculations.", duration_minutes: 30, difficulty: 2, resource_description: "Learn by skip counting. Practice daily." },
      { topic: "Multiplication Tables (6-10)", why_it_matters: "Makes division and fractions easier.", duration_minutes: 30, difficulty: 2, resource_description: "Use patterns like the 9s trick." },
      { topic: "Basic Division", why_it_matters: "Helps you share equally and understand fractions.", duration_minutes: 30, difficulty: 2, resource_description: "Start by sharing objects equally." },
      { topic: "Fractions Introduction", why_it_matters: "Understand parts — half roti, quarter day.", duration_minutes: 35, difficulty: 2, resource_description: "Cut paper into halves, quarters." },
      { topic: "Measurement & Units", why_it_matters: "Cooking, building, distances.", duration_minutes: 25, difficulty: 2, resource_description: "Measure with ruler. Learn cm, m, kg." },
      { topic: "Basic Geometry - Shapes", why_it_matters: "Shapes are everywhere in the world.", duration_minutes: 30, difficulty: 2, resource_description: "Identify and draw shapes. Count sides." },
      { topic: "Word Problems", why_it_matters: "Apply math to real situations.", duration_minutes: 35, difficulty: 3, resource_description: "Read stories with math problems." },
      { topic: "Patterns & Sequences", why_it_matters: "Predict what comes next.", duration_minutes: 25, difficulty: 2, resource_description: "Find patterns: 2,4,6,8..." }
    ],
    intermediate: [
      { topic: "Decimals & Place Value", why_it_matters: "Used in money and measurements.", duration_minutes: 30, difficulty: 3, resource_description: "Understand tenths using money." },
      { topic: "Percentage Basics", why_it_matters: "Discounts, scores, statistics.", duration_minutes: 30, difficulty: 3, resource_description: "Percent means per 100." },
      { topic: "Ratio & Proportion", why_it_matters: "Recipes, maps, comparisons.", duration_minutes: 35, difficulty: 3, resource_description: "Compare quantities as ratios." },
      { topic: "Algebra Introduction", why_it_matters: "Find unknowns — like puzzles.", duration_minutes: 35, difficulty: 3, resource_description: "Use letters for unknowns." },
      { topic: "Linear Equations", why_it_matters: "Solve distance, speed, cost problems.", duration_minutes: 40, difficulty: 3, resource_description: "Balance both sides." },
      { topic: "Geometry - Angles & Triangles", why_it_matters: "Construction, navigation, design.", duration_minutes: 35, difficulty: 3, resource_description: "Types of angles. Triangle sum = 180°." },
      { topic: "Area & Perimeter", why_it_matters: "Paint walls, fence gardens, tile floors.", duration_minutes: 30, difficulty: 3, resource_description: "Area = l×w. Perimeter = sum of sides." },
      { topic: "Data Handling & Graphs", why_it_matters: "Read news reports and data.", duration_minutes: 30, difficulty: 3, resource_description: "Make bar graphs. Calculate mean." },
      { topic: "Exponents & Powers", why_it_matters: "Shortcuts for repeated multiplication.", duration_minutes: 30, difficulty: 4, resource_description: "2³ = 8. Scientific notation." },
      { topic: "HCF & LCM", why_it_matters: "Essential for fractions and number theory.", duration_minutes: 30, difficulty: 3, resource_description: "Finding HCF/LCM by prime factorization." }
    ],
    advanced: [
      { topic: "Quadratic Equations", why_it_matters: "Models projectile motion, optimization.", duration_minutes: 40, difficulty: 4, resource_description: "Solve using factoring and formula." },
      { topic: "Coordinate Geometry", why_it_matters: "GPS, maps, computer graphics.", duration_minutes: 40, difficulty: 4, resource_description: "Plot points. Distance formula." },
      { topic: "Trigonometry Basics", why_it_matters: "Architecture, astronomy, engineering.", duration_minutes: 45, difficulty: 4, resource_description: "Sin, Cos, Tan. SOH-CAH-TOA." },
      { topic: "Statistics & Probability", why_it_matters: "Better decisions and risk assessment.", duration_minutes: 35, difficulty: 4, resource_description: "Mean, median, mode. Probability." },
      { topic: "Polynomials", why_it_matters: "Building blocks of advanced math.", duration_minutes: 40, difficulty: 5, resource_description: "Factor theorem. Zeroes of polynomials." },
      { topic: "Surface Area & Volume", why_it_matters: "Engineering and manufacturing.", duration_minutes: 35, difficulty: 4, resource_description: "Cube, cylinder, cone, sphere formulas." },
      { topic: "Arithmetic Progressions", why_it_matters: "Patterns in nature and finance.", duration_minutes: 35, difficulty: 4, resource_description: "nth term = a+(n-1)d. Sum formula." },
      { topic: "Real Numbers", why_it_matters: "Foundation of all number systems.", duration_minutes: 35, difficulty: 5, resource_description: "Rational, irrational. Euclid's lemma." },
      { topic: "Circles & Tangents", why_it_matters: "Wheels, gears, optics.", duration_minutes: 35, difficulty: 4, resource_description: "Tangent properties. Arc angles." },
      { topic: "Linear Inequalities", why_it_matters: "Optimization and budgeting.", duration_minutes: 35, difficulty: 4, resource_description: "Solve and graph inequalities." }
    ]
  },
  science: {
    beginner: [
      { topic: "Living vs Non-Living Things", why_it_matters: "Understand life processes.", duration_minutes: 25, difficulty: 1, resource_description: "Classify things around you." },
      { topic: "Parts of a Plant", why_it_matters: "Farming and gardening.", duration_minutes: 25, difficulty: 1, resource_description: "Observe and draw plant parts." },
      { topic: "Food & Nutrition", why_it_matters: "Healthy eating habits.", duration_minutes: 25, difficulty: 1, resource_description: "Food groups and balanced diet." },
      { topic: "Water & Its Importance", why_it_matters: "Conservation and survival.", duration_minutes: 25, difficulty: 1, resource_description: "Water cycle. Purification." },
      { topic: "Materials Around Us", why_it_matters: "Making good choices.", duration_minutes: 25, difficulty: 2, resource_description: "Properties of different materials." }
    ],
    intermediate: [
      { topic: "Cell Structure", why_it_matters: "Building blocks of life.", duration_minutes: 30, difficulty: 3, resource_description: "Cell parts. Plant vs animal cell." },
      { topic: "Atoms & Molecules", why_it_matters: "Foundation of chemistry.", duration_minutes: 35, difficulty: 3, resource_description: "Atomic structure. Elements." },
      { topic: "Force & Motion", why_it_matters: "How everything moves.", duration_minutes: 35, difficulty: 3, resource_description: "Newton's laws. Experiments." },
      { topic: "Acids, Bases & Salts", why_it_matters: "Chemistry everywhere.", duration_minutes: 30, difficulty: 3, resource_description: "pH scale. Neutralization." },
      { topic: "Electricity Basics", why_it_matters: "Powers our world.", duration_minutes: 35, difficulty: 3, resource_description: "Circuits. Series vs Parallel." }
    ],
    advanced: [
      { topic: "Chemical Reactions & Equations", why_it_matters: "Everything from food to fuels.", duration_minutes: 40, difficulty: 4, resource_description: "Balancing equations. Types." },
      { topic: "Genetics & Heredity", why_it_matters: "How traits pass down.", duration_minutes: 40, difficulty: 4, resource_description: "Mendel's laws. Punnett squares." },
      { topic: "Light & Optics", why_it_matters: "Cameras, glasses, microscopes.", duration_minutes: 35, difficulty: 4, resource_description: "Reflection, refraction, lenses." },
      { topic: "Electricity & Magnetism", why_it_matters: "Motors, generators, electronics.", duration_minutes: 40, difficulty: 4, resource_description: "Ohm's law. Fleming's rules." },
      { topic: "Carbon & Organic Chemistry", why_it_matters: "Basis of life and fuels.", duration_minutes: 40, difficulty: 5, resource_description: "Carbon bonding. Hydrocarbons." }
    ]
  },
  english: {
    beginner: [
      { topic: "Simple Sentences", why_it_matters: "Express your thoughts.", duration_minutes: 30, difficulty: 1, resource_description: "Subject + Verb + Object." },
      { topic: "Present & Past Tense", why_it_matters: "Most common speaking forms.", duration_minutes: 30, difficulty: 2, resource_description: "Practice daily routine in both tenses." },
      { topic: "Basic Vocabulary", why_it_matters: "Building communication skills.", duration_minutes: 25, difficulty: 1, resource_description: "Learn 20 words daily. Use flashcards." },
      { topic: "Reading Short Stories", why_it_matters: "Build vocabulary and comprehension.", duration_minutes: 30, difficulty: 2, resource_description: "Read and answer who/what/where." },
      { topic: "Writing Paragraphs", why_it_matters: "Building block of essays.", duration_minutes: 35, difficulty: 2, resource_description: "Topic + 3 supporting + closing." }
    ],
    intermediate: [
      { topic: "All Tenses", why_it_matters: "Sound natural and professional.", duration_minutes: 35, difficulty: 3, resource_description: "Past, present, future × simple, continuous, perfect." },
      { topic: "Active & Passive Voice", why_it_matters: "Used in formal writing.", duration_minutes: 30, difficulty: 3, resource_description: "Convert sentences both ways." },
      { topic: "Direct & Indirect Speech", why_it_matters: "Storytelling and reporting.", duration_minutes: 30, difficulty: 3, resource_description: "Pronoun and tense changes." },
      { topic: "Essay & Letter Writing", why_it_matters: "Exams and professional life.", duration_minutes: 40, difficulty: 3, resource_description: "Proper format and structure." },
      { topic: "Reading Comprehension", why_it_matters: "Key skill for all learning.", duration_minutes: 35, difficulty: 3, resource_description: "Read passages. Find main ideas." }
    ],
    advanced: [
      { topic: "Advanced Grammar - Clauses", why_it_matters: "Sophisticated writing.", duration_minutes: 35, difficulty: 4, resource_description: "Independent/dependent clauses. Conditionals." },
      { topic: "Literary Analysis", why_it_matters: "Critical thinking about texts.", duration_minutes: 40, difficulty: 4, resource_description: "Metaphor, simile, irony, themes." },
      { topic: "Formal vs Informal Register", why_it_matters: "Professional communication.", duration_minutes: 30, difficulty: 4, resource_description: "When to use each style." },
      { topic: "Analytical & Descriptive Writing", why_it_matters: "Board exam preparation.", duration_minutes: 40, difficulty: 4, resource_description: "Data-based analysis. Show don't tell." },
      { topic: "Speech & Presentation", why_it_matters: "Confidence and leadership.", duration_minutes: 35, difficulty: 4, resource_description: "Structure, hooks, voice modulation." }
    ]
  }
};

function getSubjectKey(goals) {
  const g = (goals || '').toLowerCase();
  if (g.includes('math')) return 'math';
  if (g.includes('science') || g.includes('sci')) return 'science';
  if (g.includes('english') || g.includes('eng')) return 'english';
  return 'math';
}

function getLevelKey(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('adv')) return 'advanced';
  if (l.includes('inter')) return 'intermediate';
  return 'beginner';
}

export function localGeneratePath(student) {
  const board = student.board || 'CBSE';
  const grade = parseInt(student.grade) || 6;
  const subjects = (student.goals || 'math').toLowerCase().split(',').map(s => s.trim());
  const levelKey = getLevelKey(student.level);
  let topics = [];

  // Try syllabus-based generation first
  for (const subjectRaw of subjects) {
    const subjectKey = getSubjectKey(subjectRaw);
    const syllabusChapters = getChapters(board, subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1), grade);
    
    if (syllabusChapters.length > 0) {
      // Create topics from actual syllabus
      const difficultyMap = { beginner: 2, intermediate: 3, advanced: 4 };
      const baseDifficulty = difficultyMap[levelKey] || 2;
      
      for (const ch of syllabusChapters) {
        topics.push({
          topic: ch.name,
          chapter: ch.name,
          why_it_matters: `Important for ${board} Class ${grade}. Key concepts: ${ch.important.slice(0, 2).join(', ')}. Students often struggle with: ${ch.weak_common[0]}.`,
          duration_minutes: 30,
          difficulty: Math.min(baseDifficulty, 5),
          resource_description: `Focus on: ${ch.important.join(', ')}. Common mistake to avoid: ${ch.weak_common.join(', ')}.`,
          is_weak_area: true
        });
      }
    } else {
      // Fallback to content bank
      const bank = contentBank[subjectKey];
      if (bank && bank[levelKey]) {
        topics = topics.concat(bank[levelKey]);
      }
    }
  }

  if (topics.length === 0) topics = contentBank.math.beginner;
  return topics.slice(0, 10);
}

export function localUpdatePath(student, completedTopics, weakAreas, strongAreas) {
  const basePath = localGeneratePath(student);
  const updated = [];

  for (const weak of weakAreas) {
    updated.push({
      topic: `Review: ${weak}`,
      why_it_matters: "You found this challenging. Let's revisit with simpler approach.",
      duration_minutes: 20, difficulty: 1,
      resource_description: `Go back to basics of ${weak}. Focus on core concept.`,
      is_review: true
    });
  }

  for (const topic of basePath) {
    if (!completedTopics.includes(topic.topic) && !strongAreas.includes(topic.topic)) {
      updated.push(topic);
    }
  }

  return updated.slice(0, 10);
}

export function localGenerateQuiz(topicName, grade, level) {
  const lvl = getLevelKey(level);
  
  // Detect subject from topic name
  const topicLower = topicName.toLowerCase();
  let subject = 'math';
  const scienceKeywords = ['cell', 'atom', 'force', 'light', 'sound', 'plant', 'animal', 'reaction', 'acid', 'base', 'electric', 'magnet', 'nutrition', 'living', 'water', 'material', 'micro', 'organ', 'reprod', 'genet', 'carbon', 'metal', 'friction', 'heat', 'ozone', 'ecosystem', 'rust'];
  const englishKeywords = ['tense', 'grammar', 'noun', 'verb', 'sentence', 'speech', 'voice', 'active', 'passive', 'essay', 'letter', 'comprehension', 'vocabulary', 'story', 'poem', 'reading', 'writing', 'clause', 'idiom', 'paragraph'];
  
  if (scienceKeywords.some(k => topicLower.includes(k))) subject = 'science';
  else if (englishKeywords.some(k => topicLower.includes(k))) subject = 'english';
  
  // Use dynamic generation for math, banks for others
  if (subject === 'math') {
    return generateDynamicMathQuiz(lvl);
  }
  
  const result = generateSubjectQuiz(subject, lvl);
  if (result) return result;
  
  // Ultimate fallback — generic conceptual quiz
  return shuffleArray([
    { question: `What is the most important concept in "${topicName}"?`, options: ["A) It is a building block of the subject", "B) It is not important", "C) Only for advanced students", "D) No real-world use"], correct_answer: "A", explanation: `${topicName} is a fundamental concept.` },
    { question: `Best way to study "${topicName}"?`, options: ["A) Read once", "B) Practice with examples regularly", "C) Memorize only", "D) Skip it"], correct_answer: "B", explanation: "Regular practice with examples is most effective." },
    { question: `"${topicName}" is useful because:`, options: ["A) Only for exams", "B) Has real-world applications", "C) Teachers say so", "D) Not useful"], correct_answer: "B", explanation: "Every topic has practical applications." },
    { question: `If you struggle with "${topicName}", you should:`, options: ["A) Give up", "B) Skip it", "C) Start with basics and practice", "D) Ignore it"], correct_answer: "C", explanation: "Starting simple and building up is the best strategy." },
    { question: `"${topicName}" connects to other topics by:`, options: ["A) It doesn't", "B) Building foundation for advanced topics", "C) Replacing them", "D) Being isolated"], correct_answer: "B", explanation: "Topics build on each other for deeper understanding." }
  ]).slice(0, 5);
}

export function localGenerateFeedback(score, topicName, weakAreas, language) {
  const isHindi = language === 'hi';
  if (score >= 4) {
    return {
      encouragement: isHindi ? `बहुत बढ़िया! "${topicName}" में शानदार काम किया!` : `Great job on "${topicName}"! You clearly understand this topic!`,
      focus_next: isHindi ? "अगले विषय पर बढ़ें — आप तैयार हैं!" : "Move on to the next topic — you're ready!"
    };
  } else if (score >= 3) {
    return {
      encouragement: isHindi ? `अच्छा प्रयास! थोड़ा और अभ्यास से और बेहतर होंगे।` : `Good effort on "${topicName}"! More practice will make you better.`,
      focus_next: isHindi ? "कठिन हिस्सों को दोबारा पढ़ें।" : "Review the tricky parts before moving on."
    };
  } else {
    return {
      encouragement: isHindi ? `कोई बात नहीं! अभ्यास से सब आसान हो जाता है। हार मत मानिए!` : `Don't worry! "${topicName}" is tough, but practice makes it easier!`,
      focus_next: isHindi ? "मूल बातों पर वापस जाएँ। सरल उदाहरणों से शुरू करें।" : "Go back to basics. Start with simpler examples."
    };
  }
}

export function localGenerateReEngagement(student, lastTopic) {
  const isHindi = student.language === 'hi';
  return {
    motivation: isHindi ? `${student.name}, आपकी याद आ रही थी! चलिए आज फिर शुरू करते हैं!` : `${student.name}, we missed you! Let's pick up where you left off!`,
    recap: isHindi ? `आप "${lastTopic}" पढ़ रहे थे।` : `You were working on "${lastTopic}".`,
    quick_tip: isHindi ? "बस 10 मिनट से शुरू करें!" : "Start with just 10 minutes — small steps lead to big progress!"
  };
}
