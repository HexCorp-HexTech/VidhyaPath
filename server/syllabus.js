// syllabus.js — Comprehensive syllabus data for CBSE, ICSE, and State Boards (Classes 1-10)

const syllabusData = {
  CBSE: {
    Math: {
      1: [ { name: "Numbers (1-100)", important: ["Counting","Comparing numbers","Addition basics"], weak_common: ["Writing numbers in words","Place value confusion"] },
           { name: "Addition & Subtraction", important: ["Single digit addition","Subtraction concept","Word problems"], weak_common: ["Borrowing errors","Carrying mistakes"] },
           { name: "Shapes & Patterns", important: ["Basic shapes","Pattern recognition","Symmetry"], weak_common: ["Shape naming","Pattern continuation"] } ],
      2: [ { name: "Numbers up to 1000", important: ["Place value","Expanded form","Number names"], weak_common: ["Place value confusion","Skip counting"] },
           { name: "Addition & Subtraction (3-digit)", important: ["With carrying","With borrowing","Word problems"], weak_common: ["Carrying errors","Story problem understanding"] },
           { name: "Multiplication Tables", important: ["Tables 2-5","Repeated addition","Arrays"], weak_common: ["Table memorization","Multiplication concept"] },
           { name: "Measurement", important: ["Length (cm/m)","Weight (g/kg)","Capacity (L/mL)"], weak_common: ["Unit conversion","Estimation"] } ],
      3: [ { name: "Numbers up to 10,000", important: ["Place value","Comparison","Ordering"], weak_common: ["Expanded form","Face vs Place value"] },
           { name: "Multiplication & Division", important: ["Tables 2-10","Long division basics","Word problems"], weak_common: ["Division concept","Remainder handling"] },
           { name: "Fractions", important: ["Half, Quarter, Third","Fraction of collection","Comparing fractions"], weak_common: ["Fraction visualization","Like fractions"] },
           { name: "Money & Measurement", important: ["Currency operations","Time reading","Perimeter basics"], weak_common: ["Clock reading","Mixed currency"] } ],
      4: [ { name: "Large Numbers", important: ["Lakhs place","Indian number system","Roman numerals"], weak_common: ["Comma placement","Period system"] },
           { name: "Multiplication & Division (Large)", important: ["Multi-digit multiplication","Long division","Factors & multiples"], weak_common: ["Multi-step division","Factor identification"] },
           { name: "Fractions & Decimals", important: ["Equivalent fractions","Decimal introduction","Fraction operations"], weak_common: ["Unlike fraction addition","Decimal place value"] },
           { name: "Geometry", important: ["Angles","Triangles","Perimeter & Area"], weak_common: ["Angle measurement","Area vs Perimeter confusion"] } ],
      5: [ { name: "Large Numbers & Operations", important: ["Crores","BODMAS","Estimation"], weak_common: ["BODMAS order","Estimation skills"] },
           { name: "HCF & LCM", important: ["Factor method","Prime factorization","Applications"], weak_common: ["HCF vs LCM confusion","Prime factorization"] },
           { name: "Fractions & Decimals", important: ["Mixed fractions","Decimal operations","Conversion"], weak_common: ["Mixed to improper","Decimal division"] },
           { name: "Geometry & Mensuration", important: ["Area of triangle","Volume of cuboid","Nets of 3D shapes"], weak_common: ["Formula confusion","Unit conversion in area"] },
           { name: "Data Handling", important: ["Bar graphs","Pie charts","Average"], weak_common: ["Scale reading","Average calculation"] } ],
      6: [ { name: "Knowing Our Numbers", important: ["Indian & International system","Estimation","Roman numerals"], weak_common: ["System conversion","Large number operations"] },
           { name: "Whole Numbers", important: ["Properties of operations","Number line","Patterns"], weak_common: ["Distributive property","Pattern identification"] },
           { name: "Playing with Numbers", important: ["Factors & Multiples","HCF & LCM","Divisibility rules"], weak_common: ["Prime factorization method","Divisibility by 7,11"] },
           { name: "Basic Geometrical Ideas", important: ["Points, Lines, Rays","Angles types","Polygons"], weak_common: ["Ray vs Line segment","Interior angles"] },
           { name: "Integers", important: ["Negative numbers","Number line","Addition & Subtraction"], weak_common: ["Sign rules","Ordering integers"] },
           { name: "Fractions", important: ["Types of fractions","Comparison","Operations"], weak_common: ["Unlike fraction operations","Mixed number conversion"] },
           { name: "Decimals", important: ["Place value","Operations","Conversion to fractions"], weak_common: ["Decimal division","Recurring decimals"] },
           { name: "Algebra Introduction", important: ["Variables","Expressions","Simple equations"], weak_common: ["Variable concept","Equation formation"] },
           { name: "Ratio & Proportion", important: ["Ratio simplification","Proportion","Unitary method"], weak_common: ["Ratio vs Fraction","Cross multiplication"] },
           { name: "Mensuration", important: ["Perimeter","Area of rectangle/triangle","Circle area intro"], weak_common: ["Formula application","Composite shapes"] } ],
      7: [ { name: "Integers", important: ["Properties","Multiplication & Division","Word problems"], weak_common: ["Sign rules in multiplication","Integer ordering"] },
           { name: "Fractions & Decimals", important: ["Operations on fractions","Decimal multiplication/division","Word problems"], weak_common: ["Fraction of fraction","Decimal long division"] },
           { name: "Data Handling", important: ["Mean, Median, Mode","Bar graphs","Probability intro"], weak_common: ["Mean vs Median","Probability understanding"] },
           { name: "Simple Equations", important: ["Solving equations","Transposition","Word problems to equations"], weak_common: ["Transposition sign errors","Equation formation"] },
           { name: "Lines & Angles", important: ["Complementary/Supplementary","Parallel lines","Transversal"], weak_common: ["Angle pair identification","Corresponding angles"] },
           { name: "Triangles", important: ["Properties","Congruence criteria","Pythagoras theorem intro"], weak_common: ["Congruence vs Similarity","Triangle inequality"] },
           { name: "Rational Numbers", important: ["Representation","Operations","Comparison"], weak_common: ["Negative rational operations","Number line placement"] },
           { name: "Algebraic Expressions", important: ["Terms & Coefficients","Like terms","Addition/Subtraction"], weak_common: ["Like vs Unlike terms","Sign handling"] },
           { name: "Exponents & Powers", important: ["Laws of exponents","Standard form","Negative exponents"], weak_common: ["Power of power","Negative base"] },
           { name: "Perimeter & Area", important: ["Circle circumference","Area formulas","Composite figures"], weak_common: ["π calculations","Composite area"] } ],
      8: [ { name: "Rational Numbers", important: ["Properties (closure, commutative, associative)","Rational between two numbers","Reciprocal"], weak_common: ["Density of rationals","Additive inverse"] },
           { name: "Linear Equations in One Variable", important: ["Solving equations","Cross multiplication","Word problems"], weak_common: ["Variable on both sides","Fraction equations"] },
           { name: "Understanding Quadrilaterals", important: ["Types","Angle sum property","Properties of parallelogram"], weak_common: ["Property confusion","Diagonal properties"] },
           { name: "Data Handling", important: ["Pie charts","Probability","Grouped data"], weak_common: ["Angle calculation in pie chart","Probability interpretation"] },
           { name: "Squares & Square Roots", important: ["Perfect squares","Square root methods","Patterns"], weak_common: ["Long division method","Estimation"] },
           { name: "Cubes & Cube Roots", important: ["Perfect cubes","Cube root by prime factorization","Patterns"], weak_common: ["Prime factorization method","Negative cube roots"] },
           { name: "Comparing Quantities", important: ["Percentage","Profit & Loss","Compound Interest"], weak_common: ["CI vs SI confusion","Successive discount"] },
           { name: "Algebraic Expressions & Identities", important: ["Identities: (a+b)², (a-b)², (a+b)(a-b)","Multiplication of polynomials","Factorisation"], weak_common: ["Identity application","Sign errors in expansion"] },
           { name: "Mensuration", important: ["Surface area","Volume of cube/cuboid/cylinder","Conversion"], weak_common: ["TSA vs CSA","Volume unit conversion"] },
           { name: "Exponents & Powers", important: ["Negative exponents","Laws","Standard form"], weak_common: ["Negative exponent meaning","Scientific notation"] },
           { name: "Direct & Inverse Proportions", important: ["Identification","Unitary method","Graph interpretation"], weak_common: ["Direct vs Inverse confusion","Proportionality constant"] } ],
      9: [ { name: "Number Systems", important: ["Real numbers","Irrational numbers","Rationalization","Laws of exponents for real numbers"], weak_common: ["Irrational identification","Rationalization of denominator"] },
           { name: "Polynomials", important: ["Zeroes","Remainder theorem","Factor theorem","Algebraic identities"], weak_common: ["Finding zeroes","Applying factor theorem"] },
           { name: "Coordinate Geometry", important: ["Cartesian plane","Plotting points","Quadrants"], weak_common: ["Sign convention","Distance formula"] },
           { name: "Linear Equations in Two Variables", important: ["Graph of linear equation","Solution of equation","x and y intercepts"], weak_common: ["Plotting lines","Finding solutions"] },
           { name: "Triangles", important: ["Congruence criteria (SSS,SAS,ASA,RHS)","Properties","Inequalities"], weak_common: ["Criteria application","CPCT usage"] },
           { name: "Quadrilaterals", important: ["Angle sum","Properties of parallelogram","Mid-point theorem"], weak_common: ["Theorem application","Proof writing"] },
           { name: "Areas of Parallelograms & Triangles", important: ["Same base same parallels","Area formulas","Median divides triangle"], weak_common: ["Theorem application","Area calculation"] },
           { name: "Circles", important: ["Chord properties","Arc","Cyclic quadrilateral"], weak_common: ["Theorem selection","Angle in semicircle"] },
           { name: "Heron's Formula", important: ["Semi-perimeter","Application","Quadrilateral area using triangles"], weak_common: ["Calculation errors","Square root simplification"] },
           { name: "Statistics", important: ["Mean, Median, Mode","Frequency distribution","Graphical representation"], weak_common: ["Grouped data mean","Cumulative frequency"] },
           { name: "Probability", important: ["Experimental probability","Events","Sample space"], weak_common: ["Event identification","Complementary events"] },
           { name: "Surface Areas & Volumes", important: ["Sphere, Cone, Cylinder formulas","Conversion between shapes","Hemisphere"], weak_common: ["Formula selection","Combined shapes"] } ],
      10: [ { name: "Real Numbers", important: ["Euclid's Division Lemma","Fundamental Theorem of Arithmetic","Decimal expansion of rationals","HCF & LCM using prime factorization"], weak_common: ["Euclid's algorithm application","Proving irrationality"] },
            { name: "Polynomials", important: ["Zeroes & Coefficients relationship","Division algorithm","Quadratic polynomials"], weak_common: ["Sum/Product of zeroes","Polynomial long division"] },
            { name: "Pair of Linear Equations in Two Variables", important: ["Graphical method","Substitution","Elimination","Cross-multiplication"], weak_common: ["Method selection","Word problem formation"] },
            { name: "Quadratic Equations", important: ["Factorization method","Completing square","Quadratic formula: x = (-b±√(b²-4ac))/2a","Discriminant"], weak_common: ["Discriminant interpretation","Complex factorization"] },
            { name: "Arithmetic Progressions", important: ["nth term formula: aₙ = a + (n-1)d","Sum formula: Sₙ = n/2[2a + (n-1)d]","Applications"], weak_common: ["Formula application","Finding n"] },
            { name: "Triangles (Similarity)", important: ["Similar triangles criteria (AA,SSS,SAS)","BPT theorem","Pythagoras theorem proof"], weak_common: ["Criteria application","Area ratio of similar triangles"] },
            { name: "Coordinate Geometry", important: ["Distance formula: √((x₂-x₁)²+(y₂-y₁)²)","Section formula","Area of triangle using coordinates","Midpoint formula"], weak_common: ["Formula application","Collinearity check"] },
            { name: "Introduction to Trigonometry", important: ["sin, cos, tan ratios","Trigonometric identities: sin²θ+cos²θ=1","Complementary angle formulas","Standard angle values"], weak_common: ["Identity application","Ratio confusion"] },
            { name: "Applications of Trigonometry", important: ["Height and Distance","Angle of elevation/depression","Practical problems"], weak_common: ["Diagram drawing","Angle identification"] },
            { name: "Circles", important: ["Tangent properties","Number of tangents from external point","Tangent-radius perpendicularity"], weak_common: ["Theorem application","Length calculation"] },
            { name: "Constructions", important: ["Division of line segment","Tangent to circle","Similar triangle construction"], weak_common: ["Step sequence","Accuracy"] },
            { name: "Areas Related to Circles", important: ["Area of sector: (θ/360)πr²","Area of segment","Combined figures"], weak_common: ["Sector vs Segment","Remaining area calculation"] },
            { name: "Surface Areas & Volumes", important: ["Combination of solids","Conversion of shapes","Frustum formulas"], weak_common: ["Shape combination","Frustum of cone"] },
            { name: "Statistics", important: ["Mean (direct, assumed, step-deviation)","Median formula","Mode formula","Ogive curves"], weak_common: ["Method selection","Cumulative frequency table"] },
            { name: "Probability", important: ["Classical probability","P(E) + P(not E) = 1","Compound events","Complementary events"], weak_common: ["Total outcomes counting","Conditional events"] } ]
    },
    Science: {
      1: [ { name: "My Body", important: ["Body parts","Sense organs","Healthy habits"], weak_common: ["Internal organs","Organ functions"] },
           { name: "Plants Around Us", important: ["Parts of plant","Types of plants","Plant needs"], weak_common: ["Root types","Photosynthesis concept"] },
           { name: "Animals Around Us", important: ["Domestic vs Wild","Pet animals","Animal homes"], weak_common: ["Animal classification","Habitats"] } ],
      5: [ { name: "Food", important: ["Nutrients","Balanced diet","Food preservation"], weak_common: ["Nutrient deficiency","Food groups"] },
           { name: "Materials", important: ["Properties","Soluble vs Insoluble","Transparent/Opaque"], weak_common: ["Material classification","Dissolving process"] },
           { name: "The World of the Living", important: ["Plant & Animal cells","Habitat","Adaptation"], weak_common: ["Cell structure","Adaptation types"] },
           { name: "How Things Work", important: ["Simple circuits","Magnets","Force"], weak_common: ["Circuit diagrams","Magnetic poles"] },
           { name: "Natural Resources", important: ["Water cycle","Air composition","Conservation"], weak_common: ["Water treatment","Air pollution causes"] } ],
      6: [ { name: "Food: Where Does It Come From", important: ["Food sources","Ingredients","Plant & animal products"], weak_common: ["Food chain concept","Producer vs Consumer"] },
           { name: "Components of Food", important: ["Nutrients","Tests for nutrients","Deficiency diseases"], weak_common: ["Starch test","Balanced diet concept"] },
           { name: "Fibre to Fabric", important: ["Natural vs Synthetic fibres","Spinning & Weaving","Cotton & Jute"], weak_common: ["Fabric making process","Fibre identification"] },
           { name: "Sorting Materials", important: ["Properties of materials","Transparency","Solubility"], weak_common: ["Property classification","Dissolved vs Suspended"] },
           { name: "Separation of Substances", important: ["Methods (filtration, evaporation, sedimentation)","Mixtures","Saturated solutions"], weak_common: ["Method selection","Saturation concept"] },
           { name: "Changes Around Us", important: ["Reversible vs Irreversible","Physical vs Chemical changes","Expansion & Contraction"], weak_common: ["Change classification","Examples distinction"] },
           { name: "Getting to Know Plants", important: ["Parts of plant","Types of roots & stems","Flower structure"], weak_common: ["Tap vs Fibrous root","Pistil parts"] },
           { name: "Body Movements", important: ["Joints types","Skeleton system","Movement in animals"], weak_common: ["Joint identification","Bone names"] },
           { name: "Living Organisms & Surroundings", important: ["Habitat","Adaptation","Biotic vs Abiotic"], weak_common: ["Adaptation examples","Habitat features"] },
           { name: "Motion & Measurement", important: ["Types of motion","Standard units","Measurement tools"], weak_common: ["Motion types","Non-standard to standard"] },
           { name: "Light, Shadows & Reflections", important: ["Light sources","Shadow formation","Reflection"], weak_common: ["Opaque/Transparent","Pinhole camera"] },
           { name: "Electricity & Circuits", important: ["Electric circuit","Conductors & Insulators","Switch"], weak_common: ["Circuit diagrams","Material classification"] },
           { name: "Magnets", important: ["Properties","Poles","Magnetic materials"], weak_common: ["Pole identification","Non-magnetic metals"] },
           { name: "Water", important: ["Water cycle","Conservation","Sources"], weak_common: ["Cycle steps","Groundwater"] },
           { name: "Air Around Us", important: ["Composition","Properties","Importance"], weak_common: ["Gas percentages","Air pollution"] } ],
      7: [ { name: "Nutrition in Plants", important: ["Photosynthesis","Autotrophs vs Heterotrophs","Parasitic plants"], weak_common: ["Photosynthesis equation","Insectivorous plants"] },
           { name: "Nutrition in Animals", important: ["Digestive system","Digestion process","Ruminants"], weak_common: ["Enzyme functions","Absorption process"] },
           { name: "Heat", important: ["Conduction, Convection, Radiation","Thermometer","Conductors & Insulators"], weak_common: ["Transfer modes","Clinical vs Lab thermometer"] },
           { name: "Acids, Bases & Indicators", important: ["Natural indicators","Neutralization","Acid-Base identification"], weak_common: ["pH concept","Neutralization products"] },
           { name: "Physical & Chemical Changes", important: ["Identification","Rusting","Crystallization"], weak_common: ["Change classification","Galvanization"] },
           { name: "Weather, Climate & Adaptation", important: ["Weather elements","Climate vs Weather","Animal adaptations"], weak_common: ["Instrument identification","Polar vs Desert"] },
           { name: "Respiration in Organisms", important: ["Aerobic vs Anaerobic","Breathing mechanism","Cellular respiration"], weak_common: ["Respiration vs Breathing","Anaerobic examples"] },
           { name: "Transportation in Animals & Plants", important: ["Circulatory system","Blood components","Transpiration"], weak_common: ["Heart structure","Xylem vs Phloem"] },
           { name: "Reproduction in Plants", important: ["Sexual vs Asexual","Pollination","Seed dispersal"], weak_common: ["Pollination types","Vegetative propagation"] },
           { name: "Motion & Time", important: ["Speed calculation","Distance-time graphs","Oscillatory motion"], weak_common: ["Graph interpretation","Speed formula"] },
           { name: "Electric Current & Its Effects", important: ["Heating effect","Magnetic effect","Electromagnet","Fuse"], weak_common: ["MCB function","Electromagnet making"] },
           { name: "Light", important: ["Reflection","Spherical mirrors","Dispersion"], weak_common: ["Image formation","Lens types"] } ],
      8: [ { name: "Crop Production & Management", important: ["Agricultural practices","Irrigation methods","Crop rotation"], weak_common: ["Practice sequence","Modern vs Traditional"] },
           { name: "Microorganisms: Friend & Foe", important: ["Types","Uses","Diseases caused","Food preservation"], weak_common: ["Microbe classification","Vaccine concept"] },
           { name: "Synthetic Fibres & Plastics", important: ["Types of synthetic fibres","Plastic types","Environmental impact"], weak_common: ["Fibre properties","Biodegradable vs Non-biodegradable"] },
           { name: "Materials: Metals & Non-Metals", important: ["Properties","Reactivity series","Displacement reactions"], weak_common: ["Physical vs Chemical properties","Reactivity order"] },
           { name: "Coal & Petroleum", important: ["Formation","Types of coal","Petroleum refining"], weak_common: ["Fossil fuel formation","Fractional distillation"] },
           { name: "Combustion & Flame", important: ["Types of combustion","Flame zones","Fire extinguisher"], weak_common: ["Ignition temperature","Flame structure"] },
           { name: "Conservation of Plants & Animals", important: ["Biodiversity","Endangered species","Wildlife sanctuaries"], weak_common: ["Conservation methods","Red Data Book"] },
           { name: "Cell: Structure & Functions", important: ["Cell organelles","Plant vs Animal cell","Cell theory"], weak_common: ["Organelle functions","Prokaryotic vs Eukaryotic"] },
           { name: "Reproduction in Animals", important: ["Sexual reproduction","Fertilization","Metamorphosis"], weak_common: ["Internal vs External fertilization","Development stages"] },
           { name: "Force & Pressure", important: ["Types of forces","Pressure formula: P=F/A","Atmospheric pressure"], weak_common: ["Force vs Pressure","Liquid pressure"] },
           { name: "Friction", important: ["Types","Advantages & Disadvantages","Methods to reduce"], weak_common: ["Friction types","Ball bearing concept"] },
           { name: "Sound", important: ["Vibration","Frequency & Amplitude","Human ear","Noise pollution"], weak_common: ["Sound properties","Loudness vs Pitch"] },
           { name: "Chemical Effects of Current", important: ["Electroplating","LED","Electrochemical cells"], weak_common: ["Electrolysis process","Conductor testing"] },
           { name: "Some Natural Phenomena", important: ["Lightning","Earthquake","Electroscope"], weak_common: ["Charging methods","Richter scale"] },
           { name: "Light", important: ["Reflection laws","Human eye","Braille system","Kaleidoscope"], weak_common: ["Image formation","Eye defects"] },
           { name: "Stars & Solar System", important: ["Celestial bodies","Planets","Constellations"], weak_common: ["Planet order","Satellite vs Planet"] },
           { name: "Pollution of Air & Water", important: ["Pollutants","Effects","Treatment methods"], weak_common: ["Pollution sources","Water treatment steps"] } ],
      9: [ { name: "Matter in Our Surroundings", important: ["States of matter","Interconversion","Evaporation factors","Latent heat"], weak_common: ["Latent heat concept","Sublimation examples"] },
           { name: "Is Matter Around Us Pure", important: ["Mixtures vs Pure substances","Solution, Suspension, Colloid","Separation techniques"], weak_common: ["Colloid identification","Chromatography"] },
           { name: "Atoms & Molecules", important: ["Dalton's theory","Atomic & Molecular mass","Mole concept: 1 mole = 6.022×10²³","Valency"], weak_common: ["Mole calculations","Molecular formula writing"] },
           { name: "Structure of Atom", important: ["Thomson, Rutherford, Bohr models","Electron configuration","Isotopes & Isobars"], weak_common: ["Shell filling order","Valence electrons"] },
           { name: "The Fundamental Unit of Life", important: ["Cell organelles","Plasma membrane","Nucleus","Endoplasmic reticulum"], weak_common: ["Organelle functions","Diffusion vs Osmosis"] },
           { name: "Tissues", important: ["Plant tissues (meristematic, permanent)","Animal tissues","Tissue functions"], weak_common: ["Tissue identification","Parenchyma vs Collenchyma"] },
           { name: "Diversity in Living Organisms", important: ["Classification hierarchy","Five kingdoms","Nomenclature"], weak_common: ["Kingdom characteristics","Binomial naming"] },
           { name: "Motion", important: ["Distance vs Displacement","Speed & Velocity","Acceleration","Equations: v=u+at, s=ut+½at², v²=u²+2as","Graphical representation"], weak_common: ["Equation selection","Graph interpretation"] },
           { name: "Force & Laws of Motion", important: ["Newton's 3 laws","F=ma","Conservation of momentum","Inertia"], weak_common: ["Law application","Momentum calculation"] },
           { name: "Gravitation", important: ["Universal law: F=Gm₁m₂/r²","g=9.8m/s²","Weight vs Mass","Free fall"], weak_common: ["g vs G","Buoyancy concept"] },
           { name: "Work & Energy", important: ["W=Fd","KE=½mv²","PE=mgh","Power=W/t","Conservation of energy"], weak_common: ["Work done conditions","Energy conversion"] },
           { name: "Sound", important: ["Wave properties","Speed of sound","Echo","Human ear"], weak_common: ["Wavelength calculation","Characteristics distinction"] },
           { name: "Why Do We Fall Ill", important: ["Infectious vs Non-infectious","Immune system","Prevention"], weak_common: ["Disease classification","Immunity types"] },
           { name: "Natural Resources", important: ["Biogeochemical cycles","Ozone layer","Water/Air pollution"], weak_common: ["Nitrogen cycle","Greenhouse effect"] },
           { name: "Improvement in Food Resources", important: ["Crop improvement","Animal husbandry","Green revolution"], weak_common: ["Hybridization","Composite fish culture"] } ],
      10: [ { name: "Chemical Reactions & Equations", important: ["Types of reactions","Balancing equations","Oxidation-Reduction","Corrosion & Rancidity"], weak_common: ["Balancing complex equations","Redox identification"] },
            { name: "Acids, Bases & Salts", important: ["pH scale","Indicators","Salt preparation","Neutralization"], weak_common: ["pH interpretation","Strong vs Weak acids"] },
            { name: "Metals & Non-Metals", important: ["Reactivity series","Ionic bonding","Extraction of metals","Corrosion"], weak_common: ["Reactivity order","Extraction methods"] },
            { name: "Carbon & Its Compounds", important: ["Covalent bonding","Homologous series","IUPAC naming","Functional groups","Soaps & Detergents"], weak_common: ["Isomerism","Nomenclature rules"] },
            { name: "Periodic Classification", important: ["Modern periodic table","Trends","Dobereiner, Newlands, Mendeleev"], weak_common: ["Period trends","Group properties"] },
            { name: "Life Processes", important: ["Nutrition","Respiration","Transportation","Excretion"], weak_common: ["Photosynthesis equation: 6CO₂+6H₂O→C₆H₁₂O₆+6O₂","Human excretory system"] },
            { name: "Control & Coordination", important: ["Nervous system","Hormones","Reflex arc","Plant hormones"], weak_common: ["Neuron structure","Endocrine vs Exocrine"] },
            { name: "How Do Organisms Reproduce", important: ["Asexual reproduction types","Sexual reproduction","Reproductive health"], weak_common: ["Fission types","Menstrual cycle"] },
            { name: "Heredity & Evolution", important: ["Mendel's laws","Dominant vs Recessive","Evolution evidence","Speciation"], weak_common: ["Punnett square","Analogy vs Homology"] },
            { name: "Light: Reflection & Refraction", important: ["Mirror formula: 1/v+1/u=1/f","Lens formula","Refractive index: n=sin i/sin r","Power of lens: P=1/f(m)"], weak_common: ["Sign convention","Ray diagrams"] },
            { name: "Human Eye & Colourful World", important: ["Eye defects & correction","Prism dispersion","Scattering","Tyndall effect"], weak_common: ["Lens selection for defects","Rainbow formation"] },
            { name: "Electricity", important: ["Ohm's law: V=IR","Series & Parallel circuits","Power: P=VI=I²R=V²/R","Resistance: R=ρl/A"], weak_common: ["Circuit analysis","Equivalent resistance"] },
            { name: "Magnetic Effects of Current", important: ["Oersted's experiment","Solenoid","Electromagnetic induction","Fleming's rules","Electric motor & Generator"], weak_common: ["Rule application","Generator vs Motor"] },
            { name: "Sources of Energy", important: ["Renewable vs Non-renewable","Solar cell","Nuclear fission & fusion"], weak_common: ["Energy source classification","Nuclear reactions"] },
            { name: "Our Environment", important: ["Ecosystem","Food chain & web","Ozone depletion","Biodegradable waste"], weak_common: ["Trophic levels","10% law"] },
            { name: "Management of Natural Resources", important: ["3R principle","Water management","Forest conservation","Coal & Petroleum conservation"], weak_common: ["Sustainable development","Chipko movement"] } ]
    },
    English: {
      1: [ { name: "Alphabet & Phonics", important: ["Letter sounds","CVC words","Sight words"], weak_common: ["Letter confusion","Sound blending"] } ],
      5: [ { name: "Grammar Basics", important: ["Nouns & Pronouns","Verbs & Tenses","Adjectives"], weak_common: ["Tense usage","Subject-verb agreement"] },
           { name: "Reading Comprehension", important: ["Main idea","Vocabulary","Inference"], weak_common: ["Finding main idea","Context clues"] },
           { name: "Creative Writing", important: ["Paragraph writing","Story writing","Letter writing"], weak_common: ["Paragraph structure","Punctuation"] } ],
      8: [ { name: "Grammar", important: ["Tenses (all 12)","Active-Passive Voice","Direct-Indirect Speech","Modals","Subject-Verb Agreement"], weak_common: ["Perfect tenses","Voice conversion rules"] },
           { name: "Writing Skills", important: ["Article writing","Story writing","Letter writing (formal/informal)","Diary entry"], weak_common: ["Format errors","Content organization"] },
           { name: "Reading Comprehension", important: ["Unseen passages","Note making","Summary writing"], weak_common: ["Inference questions","Vocabulary in context"] },
           { name: "Literature", important: ["Prose analysis","Poetry appreciation","Character study"], weak_common: ["Theme identification","Figurative language"] } ],
      9: [ { name: "Grammar", important: ["Tenses","Voice","Narration","Clauses","Determiners"], weak_common: ["Complex tenses","Relative clauses"] },
           { name: "Writing Skills", important: ["Article","Report","Letter","Story","Diary Entry"], weak_common: ["Format adherence","Coherent expression"] },
           { name: "Literature", important: ["Beehive prose & poetry","Moments supplementary","Character analysis"], weak_common: ["Textual interpretation","Extract-based answers"] } ],
      10: [ { name: "Grammar", important: ["Gap filling","Editing","Omission","Sentence reordering","Transformation"], weak_common: ["Article/Preposition errors","Tense consistency"] },
            { name: "Writing Skills", important: ["Formal & Informal letter","Article & Report","Analytical paragraph","Descriptive paragraph"], weak_common: ["Format marks","Content development"] },
            { name: "Literature", important: ["First Flight prose","First Flight poems","Footprints without Feet","Extract-based questions","Long answer questions"], weak_common: ["Character analysis depth","Theme interpretation"] } ]
    },
    Hindi: {
      5: [ { name: "व्याकरण (Grammar)", important: ["संज्ञा","सर्वनाम","विशेषण","क्रिया"], weak_common: ["संज्ञा के भेद","लिंग-वचन"] },
           { name: "रचनात्मक लेखन", important: ["अनुच्छेद","पत्र लेखन","कहानी"], weak_common: ["विचार क्रम","वर्तनी"] } ],
      8: [ { name: "व्याकरण", important: ["समास","उपसर्ग-प्रत्यय","संधि","अलंकार","वाक्य रचना"], weak_common: ["समास के भेद","संधि विच्छेद"] },
           { name: "रचनात्मक लेखन", important: ["निबंध","पत्र","अनुच्छेद","संवाद"], weak_common: ["विषय विस्तार","मुहावरे का प्रयोग"] },
           { name: "साहित्य", important: ["गद्य पाठ","पद्य पाठ","भाव समझ"], weak_common: ["कठिन शब्द अर्थ","भाव स्पष्टीकरण"] } ],
      10: [ { name: "व्याकरण", important: ["रचना के आधार पर वाक्य","वाच्य","पद परिचय","रस"], weak_common: ["वाच्य परिवर्तन","रस पहचान"] },
            { name: "लेखन", important: ["अनौपचारिक पत्र","सूचना","संदेश","विज्ञापन","लघुकथा"], weak_common: ["प्रारूप","विषय विस्तार"] },
            { name: "साहित्य", important: ["क्षितिज गद्य-पद्य","कृतिका","संचयन"], weak_common: ["अर्थग्रहण","चरित्र चित्रण"] } ]
    },
    "Social Science": {
      8: [ { name: "History: How, When & Where", important: ["Sources of history","Periodisation","British rule timeline"], weak_common: ["Date confusion","Source types"] },
           { name: "History: From Trade to Territory", important: ["East India Company","Battle of Plassey","Subsidiary Alliance"], weak_common: ["Chronology","Treaty details"] },
           { name: "Geography: Resources", important: ["Types of resources","Conservation","Sustainable development"], weak_common: ["Resource classification","Conservation methods"] },
           { name: "Geography: Land, Soil, Water", important: ["Landforms","Soil types","Water resources"], weak_common: ["Soil conservation","Water harvesting"] },
           { name: "Civics: Indian Constitution", important: ["Fundamental Rights","Directive Principles","Preamble"], weak_common: ["Rights vs Duties","Amendment process"] },
           { name: "Civics: Parliament & Law Making", important: ["Lok Sabha, Rajya Sabha","Law making process","Parliamentary committees"], weak_common: ["Bill types","Passing process"] } ],
      10: [ { name: "History: Rise of Nationalism in Europe", important: ["French Revolution impact","Unification of Italy & Germany","Nationalism movements"], weak_common: ["Leader identification","Timeline confusion"] },
            { name: "History: Nationalism in India", important: ["Gandhi's movements","Civil Disobedience","Salt March","Quit India"], weak_common: ["Movement chronology","Leader-movement linking"] },
            { name: "Geography: Resources & Development", important: ["Resource planning","Land degradation","Soil conservation","Resource types"], weak_common: ["Planning process","Conservation techniques"] },
            { name: "Geography: Manufacturing Industries", important: ["Industrial location factors","Types of industries","Environmental impact"], weak_common: ["Factor analysis","Industry classification"] },
            { name: "Economics: Development", important: ["GDP, Per Capita Income","Human Development Index","Comparison of states/countries"], weak_common: ["HDI calculation","Development indicators"] },
            { name: "Economics: Sectors of Economy", important: ["Primary, Secondary, Tertiary","GDP contribution","Employment trends"], weak_common: ["Sector classification","Organized vs Unorganized"] },
            { name: "Political Science: Power Sharing", important: ["Horizontal & Vertical distribution","Coalition government","Federalism"], weak_common: ["Distribution types","Belgium vs Sri Lanka"] },
            { name: "Political Science: Democracy & Diversity", important: ["Social divisions","Caste & Politics","Democracy outcomes"], weak_common: ["Division handling","Multiple identities"] } ]
    }
  },
  ICSE: {
    Math: {
      8: [ { name: "Rational Numbers", important: ["Properties","Operations","Number line"], weak_common: ["Multiplicative inverse","Between two rationals"] },
           { name: "Exponents & Powers", important: ["Laws","Standard form","Very large/small numbers"], weak_common: ["Negative exponents","Standard form conversion"] },
           { name: "Squares & Square Roots", important: ["Properties","Methods of finding","Estimation"], weak_common: ["Long division method","Perfect square identification"] },
           { name: "Cubes & Cube Roots", important: ["Perfect cubes","Estimation","Prime factorization method"], weak_common: ["Cube root of negative","Hardy-Ramanujan numbers"] },
           { name: "Playing with Numbers", important: ["Divisibility rules","Puzzles","Cryptarithmetic"], weak_common: ["Complex divisibility","Number puzzles"] },
           { name: "Sets", important: ["Types of sets","Venn diagrams","Operations on sets","Cardinal number"], weak_common: ["Set operations","De Morgan's laws"] },
           { name: "Percentage & Profit-Loss", important: ["Successive discounts","CI formula: A=P(1+r/100)ⁿ","Tax calculations"], weak_common: ["CI vs SI","Successive percentage"] },
           { name: "Algebraic Expressions", important: ["Identities","Factorization","Division of polynomials"], weak_common: ["Identity selection","Factorization methods"] },
           { name: "Linear Equations & Inequalities", important: ["Variables on both sides","Fraction equations","Set builder notation"], weak_common: ["Inequality rules","Solution set"] },
           { name: "Mensuration", important: ["TSA, CSA, Volume","Trapezium area: ½(a+b)h","Combined solids"], weak_common: ["Formula confusion","Area of cross-section shapes"] } ],
      10: [ { name: "GST (Goods & Services Tax)", important: ["CGST, SGST, IGST","Tax calculations","Input tax credit"], weak_common: ["Inter-state vs Intra-state","ITC calculation"] },
            { name: "Banking", important: ["Simple & Compound interest","Recurring deposits","EMI concept"], weak_common: ["RD maturity value","Interest on deposits"] },
            { name: "Shares & Dividends", important: ["Market value, Face value","Dividend calculation","Rate of return"], weak_common: ["MV vs FV","Return calculation"] },
            { name: "Ratio & Proportion", important: ["Componendo-Dividendo","Continued proportion","Mean proportional"], weak_common: ["Property application","K-method"] },
            { name: "Quadratic Equations", important: ["Factorization","Formula method","Nature of roots (Discriminant)"], weak_common: ["Complex factorization","Word problems"] },
            { name: "Matrices", important: ["Types","Operations","Determinant of 2×2: ad-bc","Inverse"], weak_common: ["Matrix multiplication order","Singular matrix"] },
            { name: "Coordinate Geometry", important: ["Section formula","Slope: m=(y₂-y₁)/(x₂-x₁)","Equation of line: y-y₁=m(x-x₁)","Parallel & Perpendicular lines"], weak_common: ["Internal vs External division","Perpendicularity condition m₁m₂=-1"] },
            { name: "Similarity", important: ["Criteria (AA, SSS, SAS)","Area theorem","Applications"], weak_common: ["Ratio of areas","BPT application"] },
            { name: "Mensuration", important: ["Cylinder, Cone, Sphere","Combined solids","Pipe problems"], weak_common: ["Frustum formulas","Conversion problems"] },
            { name: "Trigonometry", important: ["Identities","Heights & Distances","Standard angles","Complementary angles"], weak_common: ["Identity proving","Angle of depression"] },
            { name: "Statistics", important: ["Mean (step deviation)","Median using ogive","Quartiles","Inter-quartile range"], weak_common: ["Ogive construction","Quartile calculation"] },
            { name: "Probability", important: ["Addition theorem","P(A∪B)=P(A)+P(B)-P(A∩B)","Mutually exclusive events"], weak_common: ["Combined probability","Complement rule"] } ]
    },
    Science: {
      8: [ { name: "Matter", important: ["States of matter","Physical & Chemical changes","Elements, Compounds, Mixtures"], weak_common: ["Change classification","Mixture types"] },
           { name: "Physical Quantities & Measurement", important: ["SI units","Measuring instruments","Accuracy & Precision"], weak_common: ["Unit conversion","Significant figures"] },
           { name: "Force & Pressure", important: ["Types of forces","Pressure in fluids","Atmospheric pressure"], weak_common: ["Pressure calculation","Pascal's law"] },
           { name: "Energy", important: ["Forms","Transformation","Conservation","Renewable sources"], weak_common: ["Energy conversion examples","Conservation law"] },
           { name: "Light Energy", important: ["Reflection","Refraction","Dispersion","Human eye"], weak_common: ["Laws of reflection","Lens formula"] },
           { name: "Heat Transfer", important: ["Conduction","Convection","Radiation","Specific heat"], weak_common: ["Heat vs Temperature","Thermal conductivity"] },
           { name: "Sound", important: ["Production","Propagation","Reflection","Noise pollution"], weak_common: ["Speed calculation","Echo conditions"] },
           { name: "Electricity", important: ["Current","Resistance","Ohm's law","Circuits"], weak_common: ["Series vs Parallel","Power calculation"] },
           { name: "Cell Biology", important: ["Cell structure","Organelles","Cell division"], weak_common: ["Organelle functions","Mitosis stages"] },
           { name: "Human Body Systems", important: ["Digestive","Respiratory","Circulatory","Nervous"], weak_common: ["System integration","Organ functions"] },
           { name: "Health & Hygiene", important: ["Communicable diseases","Immunity","Vaccination"], weak_common: ["Disease classification","Immune response"] },
           { name: "Ecosystems", important: ["Food chains","Food webs","Energy flow","Biodiversity"], weak_common: ["Trophic levels","Energy pyramid"] } ],
      10: [ { name: "Chemical Bonding", important: ["Ionic bonding","Covalent bonding","Electrovalency","Coordinate bonding"], weak_common: ["Electron dot structures","Bond type identification"] },
            { name: "Acids, Bases & Salts", important: ["Arrhenius theory","pH scale","Buffer solutions","Salt hydrolysis"], weak_common: ["Strong vs Weak identification","pH calculations"] },
            { name: "Analytical Chemistry", important: ["Qualitative analysis","Flame test","Action of NaOH, NH₄OH"], weak_common: ["Salt analysis procedure","Confirmatory tests"] },
            { name: "Mole Concept", important: ["Molar mass","Avogadro number","Stoichiometry","Empirical formula"], weak_common: ["Mole-mass conversion","Limiting reagent"] },
            { name: "Electrolysis", important: ["Faraday's laws","Electrode reactions","Applications (electroplating)"], weak_common: ["Cathode vs Anode reactions","Quantity calculations"] },
            { name: "Metallurgy", important: ["Extraction methods","Alloys","Corrosion"], weak_common: ["Refining methods","Activity series application"] },
            { name: "Organic Chemistry", important: ["Hydrocarbons","Functional groups","IUPAC naming","Isomerism"], weak_common: ["Naming rules","Structural formulas"] },
            { name: "Physics: Force & Motion", important: ["Newton's laws","Momentum","Circular motion","Work-Energy theorem"], weak_common: ["Force diagrams","Energy conservation"] },
            { name: "Physics: Machines", important: ["Mechanical advantage","Velocity ratio","Efficiency","Types of levers"], weak_common: ["MA vs VR","Lever classification"] },
            { name: "Physics: Electricity & Magnetism", important: ["Ohm's law","Household wiring","Transformer","Electromagnetic induction"], weak_common: ["Circuit problems","Transformer calculations"] },
            { name: "Biology: Genetics", important: ["Mendel's laws","Monohybrid cross","Dihybrid cross","Sex determination"], weak_common: ["Punnett square","Genotype vs Phenotype"] },
            { name: "Biology: Human Anatomy", important: ["Nervous system","Endocrine system","Reproductive system","Excretory system"], weak_common: ["Hormone functions","Nephron structure"] } ]
    },
    English: {
      8: [ { name: "Grammar", important: ["Tenses","Voice","Narration","Conditionals","Phrasal verbs"], weak_common: ["Conditional clauses","Phrasal verb meanings"] },
           { name: "Composition", important: ["Essay","Letter","Notice","Email","Story"], weak_common: ["Format adherence","Expression quality"] },
           { name: "Comprehension", important: ["Unseen passage","Poetry comprehension","Note making"], weak_common: ["Inference skills","Vocabulary building"] } ],
      10: [ { name: "Grammar", important: ["Transformation","Synthesis","Analysis","Phrasal verbs","Prepositions","Question tags"], weak_common: ["Complex sentences","Tag formation"] },
            { name: "Composition", important: ["Argumentative essay","Formal/Informal letter","Notice/Email","Report","Short story"], weak_common: ["Argument structure","Formal tone"] },
            { name: "Literature", important: ["Merchant of Venice","Short stories analysis","Poetry appreciation","Character sketches"], weak_common: ["Theme analysis","Context questions"] } ]
    },
    Hindi: {
      10: [ { name: "व्याकरण", important: ["मुहावरे-लोकोक्तियाँ","अपठित गद्यांश","पत्र लेखन","निबंध"], weak_common: ["मुहावरों का प्रयोग","गद्यांश विश्लेषण"] },
            { name: "साहित्य", important: ["पद्य विश्लेषण","गद्य विश्लेषण","चरित्र चित्रण","केंद्रीय भाव"], weak_common: ["भाव स्पष्टीकरण","सन्दर्भ समझ"] } ]
    }
  },
  "State Board": {
    Math: {
      8: [ { name: "Rational Numbers", important: ["Properties","Operations","Representation"], weak_common: ["Density property","Operations with negatives"] },
           { name: "Algebra", important: ["Algebraic expressions","Factorization","Linear equations"], weak_common: ["Factorization methods","Variable manipulation"] },
           { name: "Geometry", important: ["Quadrilaterals","Circles","Construction"], weak_common: ["Theorem application","Construction steps"] },
           { name: "Mensuration", important: ["Area","Volume","Surface area"], weak_common: ["Formula selection","Unit conversion"] },
           { name: "Statistics", important: ["Data representation","Mean, Median, Mode","Probability"], weak_common: ["Graph interpretation","Probability calculation"] } ],
      10: [ { name: "Real Numbers", important: ["Euclid's algorithm","Fundamental Theorem","HCF & LCM by prime factorization"], weak_common: ["Algorithm steps","Irrational proofs"] },
            { name: "Polynomials", important: ["Zeroes","Relationship with coefficients","Division algorithm"], weak_common: ["Zeroes-coefficient relationship","Degree concept"] },
            { name: "Linear Equations", important: ["Graphical method","Algebraic methods","Consistent & Inconsistent"], weak_common: ["Infinite vs No solution","Word problems"] },
            { name: "Quadratic Equations", important: ["Factorization","Formula: x=(-b±√D)/2a where D=b²-4ac","Nature of roots"], weak_common: ["Complex factorization","Discriminant use"] },
            { name: "Arithmetic Progressions", important: ["nth term","Sum of n terms","Applications"], weak_common: ["Finding common difference","Sum formula"] },
            { name: "Triangles", important: ["Similarity criteria","BPT","Pythagoras theorem"], weak_common: ["Proof writing","Similar triangle identification"] },
            { name: "Coordinate Geometry", important: ["Distance formula","Section formula","Area of triangle"], weak_common: ["Sign errors","Collinearity"] },
            { name: "Trigonometry", important: ["Ratios","Identities","Heights & Distances"], weak_common: ["Identity proving","Application problems"] },
            { name: "Circles", important: ["Tangent properties","Chord theorems","Cyclic quadrilateral"], weak_common: ["Theorem selection","Length calculations"] },
            { name: "Mensuration", important: ["Circle area","Solid volumes","Combined shapes"], weak_common: ["Sector/Segment area","Frustum"] },
            { name: "Statistics & Probability", important: ["Mean methods","Median formula","Probability"], weak_common: ["Grouped data","Event counting"] } ]
    },
    Science: {
      8: [ { name: "Force & Pressure", important: ["Types of forces","Pressure formula","Atmospheric pressure"], weak_common: ["Force vs Pressure","Fluid pressure"] },
           { name: "Light", important: ["Reflection","Refraction","Dispersion","Eye"], weak_common: ["Image formation","Defect correction"] },
           { name: "Cell Structure", important: ["Organelles","Plant vs Animal cell","Cell division"], weak_common: ["Function identification","Division stages"] },
           { name: "Chemical Reactions", important: ["Physical vs Chemical change","Catalyst","Indicators"], weak_common: ["Change classification","Reaction types"] },
           { name: "Ecosystem", important: ["Food chain","Biodiversity","Conservation"], weak_common: ["Energy flow","Trophic levels"] } ],
      10: [ { name: "Chemical Reactions", important: ["Types","Balancing","Oxidation-Reduction"], weak_common: ["Equation balancing","Redox identification"] },
            { name: "Acids, Bases & Salts", important: ["pH","Indicators","Neutralization"], weak_common: ["pH concept","Salt formula"] },
            { name: "Metals & Non-Metals", important: ["Reactivity","Extraction","Corrosion"], weak_common: ["Reactivity series","Extraction steps"] },
            { name: "Life Processes", important: ["Photosynthesis","Respiration","Transportation","Excretion"], weak_common: ["Process details","Organ functions"] },
            { name: "Genetics & Evolution", important: ["Mendel's laws","DNA","Natural selection"], weak_common: ["Cross results","Evolution evidence"] },
            { name: "Light", important: ["Mirror/Lens formula","Ray diagrams","Eye defects"], weak_common: ["Sign convention","Numerical problems"] },
            { name: "Electricity", important: ["Ohm's law","Circuits","Power: P=VI"], weak_common: ["Equivalent resistance","Power calculation"] },
            { name: "Environment", important: ["Ecosystem","Ozone depletion","Waste management"], weak_common: ["Environmental impact","Conservation methods"] } ]
    },
    English: {
      8: [ { name: "Grammar", important: ["Tenses","Voice","Narration","Prepositions"], weak_common: ["Tense errors","Voice conversion"] },
           { name: "Writing", important: ["Essay","Letter","Paragraph"], weak_common: ["Structure","Expression"] },
           { name: "Comprehension", important: ["Unseen passage","Vocabulary","Summary"], weak_common: ["Main idea","Inference"] } ],
      10: [ { name: "Grammar", important: ["Tenses","Voice","Narration","Transformation","Error correction"], weak_common: ["Complex transformations","Tense consistency"] },
            { name: "Writing", important: ["Essay","Letter","Report","Notice","Article"], weak_common: ["Format","Content development"] },
            { name: "Literature", important: ["Prose","Poetry","Drama","Extract questions"], weak_common: ["Theme analysis","Character study"] } ]
    },
    Hindi: {
      10: [ { name: "व्याकरण", important: ["संधि","समास","अलंकार","छंद"], weak_common: ["संधि विच्छेद","छंद पहचान"] },
            { name: "लेखन", important: ["निबंध","पत्र","संवाद","कहानी"], weak_common: ["विषय विस्तार","भाषा शैली"] },
            { name: "साहित्य", important: ["गद्य","पद्य","कहानी","नाटक"], weak_common: ["भाव समझ","शब्दार्थ"] } ]
    }
  },
  "Maharashtra Board": {
    Math: {
      8: [ { name: "Rational & Irrational Numbers", important: ["Properties","Representation","Operations with surds"], weak_common: ["Irrational identification","Surd operations"] },
           { name: "Algebraic Expressions", important: ["Factorization","Identities","Polynomials"], weak_common: ["Identity application","Sign errors"] },
           { name: "Linear Equations", important: ["One variable","Word problems","Graph"], weak_common: ["Equation formation","Graph plotting"] },
           { name: "Quadrilaterals", important: ["Properties","Parallelogram","Trapezium"], weak_common: ["Property confusion","Theorem application"] },
           { name: "Area & Volume", important: ["Circle area: πr²","Cylinder volume: πr²h","Cone volume: ⅓πr²h"], weak_common: ["Formula confusion","Unit conversion"] },
           { name: "Statistics", important: ["Mean","Median","Mode","Frequency table"], weak_common: ["Grouped data","Method selection"] } ],
      10: [ { name: "Linear Equations in Two Variables", important: ["Graphical method","Substitution","Elimination","Cramer's Rule"], weak_common: ["Determinant method","Word problems"] },
            { name: "Quadratic Equations", important: ["Formula: x=(-b±√(b²-4ac))/2a","Nature of roots","Sum & Product of roots"], weak_common: ["Discriminant use","Complex factoring"] },
            { name: "Arithmetic Progression", important: ["aₙ = a+(n-1)d","Sₙ = n/2[2a+(n-1)d]","Applications"], weak_common: ["Term finding","Sum calculation"] },
            { name: "Financial Planning", important: ["GST calculation","Income tax","Shares & Dividends"], weak_common: ["Tax computation","Share value problems"] },
            { name: "Probability", important: ["Classical definition","Addition theorem","Complementary events"], weak_common: ["Event counting","Conditional probability"] },
            { name: "Statistics", important: ["Mean by deviation method","Median","Mode","Graphical representation"], weak_common: ["Ogive drawing","Histogram interpretation"] },
            { name: "Similarity", important: ["AA, SSS, SAS criteria","BPT","Areas of similar triangles"], weak_common: ["Criteria selection","Area ratio"] },
            { name: "Pythagoras Theorem", important: ["Proof","Converse","Applications","Apollonius theorem"], weak_common: ["Application in real problems","30-60-90 triangles"] },
            { name: "Circle", important: ["Tangent-secant theorem","Inscribed angle","Cyclic quadrilateral"], weak_common: ["Theorem identification","Arc-angle relationship"] },
            { name: "Coordinate Geometry", important: ["Distance formula","Section formula","Slope","Equation of line"], weak_common: ["Intercept form","Parallel/perpendicular lines"] },
            { name: "Trigonometry", important: ["Ratios","Identities: 1+tan²θ=sec²θ","Heights & Distances"], weak_common: ["Identity proving","Angle of elevation/depression"] },
            { name: "Mensuration", important: ["Frustum of cone","Sphere","Combined solids","Surface area"], weak_common: ["Frustum formula","Volume conversion"] } ]
    },
    Science: {
      8: [ { name: "Force & Pressure", important: ["Types of forces","Pressure in fluids","Atmospheric pressure"], weak_common: ["Force diagrams","Pascal's law"] },
           { name: "Inside the Atom", important: ["Atomic models","Electron configuration","Isotopes"], weak_common: ["Shell filling","Atomic/Mass number"] },
           { name: "Chemical Reactions", important: ["Types","Balancing","Catalyst"], weak_common: ["Equation writing","Catalyst vs Reactant"] },
           { name: "Cell & Cell Organelles", important: ["Structure","Plant vs Animal","Functions"], weak_common: ["Organelle roles","Cell division stages"] },
           { name: "Ecosystems", important: ["Food chain","Food web","Energy pyramid","Biodiversity"], weak_common: ["Trophic levels","Conservation methods"] } ],
      10: [ { name: "Gravitation", important: ["Newton's law","g vs G","Free fall","Escape velocity: v=√(2gR)"], weak_common: ["Weight vs Mass","g variation"] },
            { name: "Periodic Classification", important: ["Modern periodic table","Trends","Dobereiner to Moseley"], weak_common: ["Trend direction","Group/Period properties"] },
            { name: "Chemical Reactions", important: ["Types","Balancing","Oxidation-Reduction","Electrolysis"], weak_common: ["Redox identification","Electrode reactions"] },
            { name: "Effects of Electric Current", important: ["Ohm's law: V=IR","Resistance: R=ρl/A","Power: P=VI","Heating effect: H=I²Rt"], weak_common: ["Circuit analysis","Equivalent resistance"] },
            { name: "Light", important: ["Refraction: n=sin i/sin r","Lens formula: 1/f=1/v-1/u","Magnification","Power: P=1/f"], weak_common: ["Sign convention","Ray diagrams"] },
            { name: "Heredity & Variation", important: ["Mendel's laws","Monohybrid cross","Sex determination","DNA"], weak_common: ["Punnett square","Genotype/Phenotype"] },
            { name: "Life Processes", important: ["Photosynthesis","Respiration","Circulation","Excretion"], weak_common: ["Equation details","System diagrams"] },
            { name: "Space Missions", important: ["ISRO missions","Chandrayaan","Mangalyaan","Satellite types"], weak_common: ["Mission details","Orbit types"] } ]
    },
    English: {
      8: [ { name: "Grammar", important: ["Tenses","Voice","Narration","Prepositions","Conjunctions"], weak_common: ["Tense shifts","Voice rules"] },
           { name: "Writing", important: ["Essay","Letter (formal/informal)","Paragraph","Dialogue"], weak_common: ["Format","Content flow"] },
           { name: "Comprehension", important: ["Unseen passage","Vocabulary","Summary"], weak_common: ["Inference","Context clues"] } ],
      10: [ { name: "Grammar", important: ["Tenses","Voice","Narration","Transformation","Clauses","Error correction"], weak_common: ["Complex sentences","Transformation rules"] },
            { name: "Writing", important: ["Essay","Letter","Report","Notice","News Report","Summary"], weak_common: ["Format marks","Expression quality"] },
            { name: "Literature", important: ["Prose","Poetry","Rapid reader","Extract questions","Long answers"], weak_common: ["Theme understanding","Character analysis"] } ]
    },
    Marathi: {
      10: [ { name: "व्याकरण", important: ["समास","संधि","अलंकार","वृत्त","शब्दसिद्धी"], weak_common: ["समास ओळख","संधी विग्रह"] },
            { name: "लेखन", important: ["निबंध","पत्रलेखन","जाहिरात","बातमी","सारांश"], weak_common: ["मुद्दे मांडणी","भाषा शैली"] },
            { name: "साहित्य", important: ["गद्य पाठ","पद्य पाठ","उपयोजित लेखन","स्वमत"], weak_common: ["आशय समजणे","शब्दार्थ"] } ]
    },
    Hindi: {
      10: [ { name: "व्याकरण", important: ["संधि","समास","अलंकार","छंद","वाक्य रचना"], weak_common: ["संधि विच्छेद","छंद पहचान"] },
            { name: "लेखन", important: ["निबंध","पत्र","संवाद","कहानी","सूचना"], weak_common: ["विषय विस्तार","भाषा शैली"] },
            { name: "साहित्य", important: ["गद्य","पद्य","कहानी","नाटक"], weak_common: ["भाव समझ","शब्दार्थ"] } ]
    },
    "Social Science": {
      10: [ { name: "History: India & World (1918-2000)", important: ["World Wars impact","Indian freedom struggle","Cold War","Non-Aligned Movement"], weak_common: ["Timeline confusion","Leader-event linking"] },
            { name: "Geography: India", important: ["Climate","Natural vegetation","Agriculture","Industries"], weak_common: ["Map work","Factor analysis"] },
            { name: "Political Science", important: ["Indian Constitution","Legislature","Judiciary","Fundamental Rights & Duties"], weak_common: ["Amendment process","Power distribution"] },
            { name: "Economics", important: ["Development indicators","Sectors of economy","Financial planning","Globalization"], weak_common: ["HDI understanding","Sector classification"] } ]
    }
  },
  "State Board": {
    Math: {
      1: [ { name: "Counting basics", important: ["0 to 100", "Adding single digits"], weak_common: ["Counting backwards"] } ],
      5: [ { name: "Fractions & Decimals", important: ["Adding fractions", "Comparing decimals"], weak_common: ["Unlike fractions"] },
           { name: "Basic Geometry", important: ["Area of square/rectangle"], weak_common: ["Perimeter confusion"] } ],
      8: [ { name: "Algebraic Expressions", important: ["Variables", "Simplification"], weak_common: ["Sign errors"] },
           { name: "Commercial Math", important: ["Profit/Loss", "Simple Interest"], weak_common: ["Interest formula"] } ],
      10: [ { name: "Advanced Algebra", important: ["Quadratic equations", "Linear equations in two variables"], weak_common: ["Factorization", "Graphing"] },
            { name: "Trigonometry Heights & Distances", important: ["sin/cos/tan applications", "Angle of elevation"], weak_common: ["Identifying base/perpendicular"] } ]
    },
    Science: {
      1: [ { name: "Animals & Plants", important: ["Living vs Non-living", "Pet vs Wild animals"], weak_common: ["Identifying plants"] } ],
      5: [ { name: "Our Environment", important: ["Water cycle", "Types of pollution"], weak_common: ["Conservation steps"] },
           { name: "Human Body", important: ["Bones", "Senses"], weak_common: ["Internal organs"] } ],
      8: [ { name: "Force and Pressure", important: ["Types of forces", "Atmospheric pressure"], weak_common: ["Pascal's law details"] },
           { name: "Metals & Non-metals", important: ["Properties", "Reactivity"], weak_common: ["Displacement reactions"] } ],
      10: [ { name: "Carbon Compounds", important: ["Covalent bonds", "Hydrocarbons"], weak_common: ["Nomenclature rules"] },
            { name: "Control & Coordination", important: ["Nervous system", "Hormones"], weak_common: ["Reflex arc diagrams"] },
            { name: "Space Science", important: ["Satellites", "Orbital velocity"], weak_common: ["Escape velocity calculations"] } ]
    }
  }
};

// Helper: Get chapters for a board/subject/grade
export function getChapters(board, subject, grade) {
  // Try exact board first, then fallback chain: Maharashtra → State Board → CBSE
  const boardData = syllabusData[board] || syllabusData['State Board'] || syllabusData['CBSE'];
  const subjectData = boardData?.[subject];
  if (!subjectData) {
    // Try CBSE fallback for the subject
    const cbseSubject = syllabusData['CBSE']?.[subject];
    if (!cbseSubject) return [];
    if (cbseSubject[grade]) return cbseSubject[grade];
    const grades = Object.keys(cbseSubject).map(Number).sort((a, b) => a - b);
    const closest = grades.filter(g => g <= grade).pop();
    return closest ? cbseSubject[closest] : (cbseSubject[grades[0]] || []);
  }
  
  // Find exact grade or closest lower grade
  if (subjectData[grade]) return subjectData[grade];
  
  const grades = Object.keys(subjectData).map(Number).sort((a, b) => a - b);
  const closest = grades.filter(g => g <= grade).pop();
  return closest ? subjectData[closest] : (subjectData[grades[0]] || []);
}

// Helper: Get all subjects for a board/grade
export function getSubjects(board, grade) {
  const boardData = syllabusData[board] || syllabusData['CBSE'];
  if (!boardData) return [];
  
  return Object.keys(boardData).filter(subject => {
    const subjectData = boardData[subject];
    const grades = Object.keys(subjectData).map(Number);
    return grades.some(g => g <= grade);
  });
}

// Helper: Get syllabus context string for AI prompts
export function getSyllabusContext(board, grade, goals) {
  const subjects = goals ? goals.split(',').map(s => s.trim()) : ['Math', 'Science', 'English'];
  let context = `Board: ${board}, Grade: ${grade}\n\n`;
  
  for (const subject of subjects) {
    const chapters = getChapters(board, subject, grade);
    if (chapters.length === 0) continue;
    
    context += `${subject} Chapters:\n`;
    chapters.forEach((ch, i) => {
      context += `  ${i+1}. ${ch.name}\n`;
      context += `     Key topics: ${ch.important.join(', ')}\n`;
      context += `     Common mistakes: ${ch.weak_common.join(', ')}\n`;
    });
    context += '\n';
  }
  
  return context;
}

export default syllabusData;
