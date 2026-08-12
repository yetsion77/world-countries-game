// State Management
let gameState = {
  currentLevel: "1", // "1", "2", "3", or "all"
  allQuestions: [],
  currentQuestionIndex: 0,
  score: 0,
  timerInterval: null,
  timeLeft: 15, // seconds per question
  maxTime: 15,
  isAnswered: false,
  roundHistory: [] // To store details of the current 10 questions
};

// User Stats Management
let userStats = {
  gamesPlayed: 0,
  correctAnswers: 0,
  totalQuestionsAnswered: 0,
  highScore: 0,
  discoveredCountries: [] // List of country codes flipped in Study Center
};

// Fun Geography Facts list
const GEOGRAPHY_FACTS = [
  "אוסטרליה רחבה יותר מהירח! קוטר הירח הוא כ-3,474 ק\"מ, בעוד שרוחבה של אוסטרליה ממזרח למערב הוא כ-4,000 ק\"מ.",
  "ברוסיה יש 11 אזורי זמן שונים! כשבצד אחד של המדינה מתחיל הבוקר, בצד השני מתחיל הלילה.",
  "קנדה היא המדינה בעלת מספר האגמים הגדול ביותר בעולם - יש בה יותר אגמים מאשר בכל שאר העולם יחד!",
  "טוקיו, עיר הבירה של יפן, היא המטרופולין המאוכלס ביותר בעולם עם מעל ל-37 מיליון תושבים.",
  "הדגל של נפאל הוא הדגל הלאומי היחיד בעולם שאינו בצורת מלבן או ריבוע, אלא מורכב משני משולשים.",
  "איסלנד היא המדינה היחידה בעולם שבה אין יתושים בכלל, ככל הנראה בשל שינויי הטמפרטורה הקיצוניים שלה.",
  "המטבע בעל הערך הגבוה ביותר בעולם הוא הדינר הכוויתי (KWD) ולא הליש\"ט או הדולר.",
  "במונגוליה יש יותר סוסים מאשר בני אדם! היחס הוא כמעט 3 סוסים על כל תושב.",
  "לוקסמבורג היא המדינה היחידה בעולם שבה כל התחבורה הציבורית (רכבות, חשמליות ואוטובוסים) היא חינמית לחלוטין לכולם.",
  "הפירמידה הגדולה של גיזה במצרים היא העתיקה ביותר מבין שבעת פלאי תבל של העולם העתיק והיחידה ששרדה כמעט בשלמותה.",
  "בשווייץ אין עיר בירה רשמית המוגדרת בחוק! ברן משמשת כבירה בפועל (de facto) מאחר שהיא מקום מושבה של הממשלה.",
  "המדינה עם השטח הקטן ביותר בעולם היא קריית הוותיקן, ששטחה הוא כ-0.49 קמ\"ר בלבד והיא מוקפת כולה בעיר רומא."
];

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  initDashboard();
  setupEventListeners();
  showFact();
});

// Load stats from localStorage
function loadStats() {
  const savedStats = localStorage.getItem("world_countries_stats");
  if (savedStats) {
    try {
      userStats = JSON.parse(savedStats);
      if (!userStats.discoveredCountries) userStats.discoveredCountries = [];
    } catch (e) {
      console.error("Error loading stats", e);
    }
  }
  updateStatsUI();
}

// Save stats to localStorage
function saveStats() {
  localStorage.setItem("world_countries_stats", JSON.stringify(userStats));
  updateStatsUI();
}

// Update the statistics shown in the UI
function updateStatsUI() {
  document.getElementById("high-score-val").textContent = userStats.highScore;
  document.getElementById("stats-games-played").textContent = userStats.gamesPlayed;
  
  // Discovered countries fraction
  const discoveredCount = userStats.discoveredCountries.length;
  document.getElementById("stats-countries-discovered").textContent = `${discoveredCount}/150`;
  
  // Correct answers percentage
  const pct = userStats.totalQuestionsAnswered > 0 
    ? Math.round((userStats.correctAnswers / userStats.totalQuestionsAnswered) * 100) 
    : 0;
  document.getElementById("stats-correct-pct").textContent = `${pct}%`;
}

// Initialize Dashboard View
function initDashboard() {
  // Difficulty levels buttons click
  const diffButtons = document.querySelectorAll(".diff-btn");
  diffButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      diffButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      gameState.currentLevel = btn.dataset.level;
    });
  });
}

// Setup Event Listeners for main actions
function setupEventListeners() {
  // Start Trivia Button
  document.getElementById("btn-start-trivia").addEventListener("click", () => {
    startTriviaGame();
  });

  // Start Study Button
  document.getElementById("btn-start-study").addEventListener("click", () => {
    switchView("study-view");
    initStudyCenter();
  });

  // Fact Cycler Button
  document.getElementById("btn-next-fact").addEventListener("click", showFact);

  // Logo Navigation to Home
  document.getElementById("header-logo").addEventListener("click", () => {
    if (confirmToQuitTrivia()) {
      switchView("dashboard-view");
    }
  });

  // Trivia Navigation buttons
  document.getElementById("btn-abort-trivia").addEventListener("click", () => {
    if (confirm("האם אתה בטוח שברצונך לעזוב את המשחק באמצע? ההתקדמות בסבב זה תימחק.")) {
      stopTimer();
      switchView("dashboard-view");
    }
  });

  document.getElementById("btn-replay-trivia").addEventListener("click", () => {
    startTriviaGame();
  });

  document.getElementById("btn-results-home").addEventListener("click", () => {
    switchView("dashboard-view");
  });

  // Study View Navigation
  document.getElementById("btn-study-home").addEventListener("click", () => {
    switchView("dashboard-view");
  });

  // Toggle study mode (cards vs rankings)
  const modeButtons = document.querySelectorAll(".toggle-mode-group .toggle-btn");
  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const mode = btn.dataset.mode;
      const cardsContainer = document.getElementById("study-cards-container");
      const rankingsContainer = document.getElementById("study-rankings-container");
      const filtersRow = document.getElementById("study-filters-row");
      
      if (mode === "cards") {
        cardsContainer.classList.add("active");
        rankingsContainer.classList.remove("active");
        filtersRow.style.display = "flex"; // Keep filters visible for cards
      } else {
        cardsContainer.classList.remove("active");
        rankingsContainer.classList.add("active");
        filtersRow.style.display = "none"; // Hide filters for rankings (rankings show global lists)
        renderRankings();
      }
    });
  });

  // Search & Filter event listeners
  document.getElementById("study-search").addEventListener("input", filterAndRenderCards);
  document.getElementById("study-filter-level").addEventListener("change", filterAndRenderCards);
  document.getElementById("study-sort").addEventListener("change", filterAndRenderCards);
}

// Confirmation helper when leaving trivia
function confirmToQuitTrivia() {
  const triviaView = document.getElementById("trivia-view");
  if (triviaView.classList.contains("active")) {
    if (!confirm("האם לצאת מהמשחק הפעיל?")) {
      return false;
    }
    stopTimer();
  }
  return true;
}

// Switch between SPA views
function switchView(viewId) {
  const sections = document.querySelectorAll(".view-section");
  sections.forEach(sec => sec.classList.remove("active"));
  
  const targetSection = document.getElementById(viewId);
  if (targetSection) {
    targetSection.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Show random geography fact
function showFact() {
  const textEl = document.getElementById("fun-fact-text");
  textEl.style.opacity = 0;
  
  setTimeout(() => {
    const randIndex = Math.floor(Math.random() * GEOGRAPHY_FACTS.length);
    textEl.textContent = GEOGRAPHY_FACTS[randIndex];
    textEl.style.opacity = 1;
  }, 200);
}

// =========================================================================
// TRIVIA GAME ENGINE
// =========================================================================

function startTriviaGame() {
  // Get filtered countries based on level selection
  let availableCountries = [];
  if (gameState.currentLevel === "all") {
    availableCountries = [...COUNTRIES_DATA];
  } else {
    const lvl = parseInt(gameState.currentLevel);
    availableCountries = COUNTRIES_DATA.filter(c => c.level === lvl);
  }

  // Shuffle available countries
  shuffleArray(availableCountries);

  // Take first 10 countries as targets
  const roundCountries = availableCountries.slice(0, 10);
  
  // Generate questions
  gameState.allQuestions = roundCountries.map(country => generateQuestion(country, COUNTRIES_DATA));
  gameState.currentQuestionIndex = 0;
  gameState.score = 0;
  gameState.roundHistory = [];
  
  // Update Level Badge UI
  const levelText = gameState.currentLevel === "all" ? "רמה: משולב" : `רמה: ${gameState.currentLevel}`;
  document.getElementById("trivia-level-badge").textContent = levelText;
  
  // Switch to trivia screen
  switchView("trivia-view");
  showQuestion();
}

// Shuffle helper (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Select random items from array (excluding a specific value)
function getRandomElementsExcluding(array, excludeVal, key, count) {
  const filtered = array.filter(item => item[key] !== excludeVal);
  shuffleArray(filtered);
  return filtered.slice(0, count);
}

// Generate Question object dynamically
function generateQuestion(targetCountry, allCountries) {
  // Question types
  const questionTypes = [
    "capital", 
    "flag_to_name", 
    "name_to_flag", 
    "larger_area", 
    "larger_population", 
    "north", 
    "south", 
    "currency", 
    "language"
  ];
  
  // Select a random question type
  const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
  
  let text = "";
  let options = [];
  let flagUrl = null;
  let correctValue = "";

  switch (type) {
    case "capital":
      text = `מהי עיר הבירה של ${targetCountry.name}?`;
      correctValue = targetCountry.capital;
      
      options.push({ text: correctValue, isCorrect: true });
      getRandomElementsExcluding(allCountries, correctValue, "capital", 3).forEach(c => {
        options.push({ text: c.capital, isCorrect: false });
      });
      break;

    case "flag_to_name":
      text = "איזו מדינה מיוצגת על ידי הדגל הבא?";
      correctValue = targetCountry.name;
      flagUrl = `https://flagcdn.com/w320/${targetCountry.code}.png`;
      
      options.push({ text: correctValue, isCorrect: true });
      getRandomElementsExcluding(allCountries, correctValue, "name", 3).forEach(c => {
        options.push({ text: c.name, isCorrect: false });
      });
      break;

    case "name_to_flag":
      text = `איזה דגל שייך למדינת ${targetCountry.name}?`;
      correctValue = `https://flagcdn.com/w320/${targetCountry.code}.png`;
      
      options.push({ text: correctValue, isCorrect: true, isFlag: true });
      getRandomElementsExcluding(allCountries, targetCountry.code, "code", 3).forEach(c => {
        options.push({ text: `https://flagcdn.com/w320/${c.code}.png`, isCorrect: false, isFlag: true });
      });
      break;

    case "larger_area":
      // Select target + 3 random countries
      const areaGroup = [targetCountry, ...getRandomElementsExcluding(allCountries, targetCountry.name, "name", 3)];
      // Find the one with maximum area
      let maxAreaCountry = areaGroup[0];
      areaGroup.forEach(c => {
        if (c.area > maxAreaCountry.area) maxAreaCountry = c;
      });
      
      text = "איזו מדינה היא הגדולה ביותר בשטח מבין המדינות הבאות?";
      correctValue = maxAreaCountry.name;
      
      areaGroup.forEach(c => {
        options.push({ text: c.name, isCorrect: c.name === correctValue });
      });
      break;

    case "larger_population":
      // Select target + 3 random countries
      const popGroup = [targetCountry, ...getRandomElementsExcluding(allCountries, targetCountry.name, "name", 3)];
      // Find the one with maximum population
      let maxPopCountry = popGroup[0];
      popGroup.forEach(c => {
        if (c.population > maxPopCountry.population) maxPopCountry = c;
      });
      
      text = "באיזו מדינה יש את האוכלוסייה הגדולה ביותר מבין המדינות הבאות?";
      correctValue = maxPopCountry.name;
      
      popGroup.forEach(c => {
        options.push({ text: c.name, isCorrect: c.name === correctValue });
      });
      break;

    case "north":
      // Select target + 3 random countries
      const northGroup = [targetCountry, ...getRandomElementsExcluding(allCountries, targetCountry.name, "name", 3)];
      // Find the one with maximum latitude
      let northCountry = northGroup[0];
      northGroup.forEach(c => {
        if (c.lat > northCountry.lat) northCountry = c;
      });
      
      text = "איזו מדינה ממוקמת הצפונית ביותר מבין המדינות הבאות?";
      correctValue = northCountry.name;
      
      northGroup.forEach(c => {
        options.push({ text: c.name, isCorrect: c.name === correctValue });
      });
      break;

    case "south":
      // Select target + 3 random countries
      const southGroup = [targetCountry, ...getRandomElementsExcluding(allCountries, targetCountry.name, "name", 3)];
      // Find the one with minimum latitude (most southern)
      let southCountry = southGroup[0];
      southGroup.forEach(c => {
        if (c.lat < southCountry.lat) southCountry = c;
      });
      
      text = "איזו מדינה ממוקמת הדרומית ביותר מבין המדינות הבאות?";
      correctValue = southCountry.name;
      
      southGroup.forEach(c => {
        options.push({ text: c.name, isCorrect: c.name === correctValue });
      });
      break;

    case "currency":
      text = `מהו המטבע הרשמי של ${targetCountry.name}?`;
      correctValue = targetCountry.currency;
      
      options.push({ text: correctValue, isCorrect: true });
      // Get random unique currencies
      const usedCurrencies = new Set([correctValue]);
      while (usedCurrencies.size < 4) {
        const randC = allCountries[Math.floor(Math.random() * allCountries.length)];
        usedCurrencies.add(randC.currency);
      }
      Array.from(usedCurrencies).slice(1).forEach(curr => {
        options.push({ text: curr, isCorrect: false });
      });
      break;

    case "language":
      text = `מהי השפה הרשמית (או הנפוצה ביותר) ב-${targetCountry.name}?`;
      correctValue = targetCountry.language;
      
      options.push({ text: correctValue, isCorrect: true });
      // Get random unique languages
      const usedLanguages = new Set([correctValue]);
      while (usedLanguages.size < 4) {
        const randC = allCountries[Math.floor(Math.random() * allCountries.length)];
        usedLanguages.add(randC.language);
      }
      Array.from(usedLanguages).slice(1).forEach(lang => {
        options.push({ text: lang, isCorrect: false });
      });
      break;
  }

  // Shuffle options so correct isn't always first
  shuffleArray(options);

  return {
    text,
    type,
    options,
    flagUrl,
    target: targetCountry,
    correctValue
  };
}

// Show current question in UI
function showQuestion() {
  gameState.isAnswered = false;
  const question = gameState.allQuestions[gameState.currentQuestionIndex];
  
  // Set progress header
  document.getElementById("trivia-progress-text").textContent = `שאלה ${gameState.currentQuestionIndex + 1} מתוך 10`;
  document.getElementById("trivia-current-score").textContent = gameState.score;
  
  // Set question text
  document.getElementById("question-text").textContent = question.text;
  
  // Display Flag if available
  const flagImg = document.getElementById("question-flag-img");
  if (question.flagUrl) {
    flagImg.src = question.flagUrl;
    flagImg.classList.remove("hidden");
  } else {
    flagImg.classList.add("hidden");
    flagImg.src = "";
  }
  
  // Render options buttons
  const optionsGrid = document.getElementById("options-grid");
  optionsGrid.innerHTML = "";
  
  question.options.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    
    if (opt.isFlag) {
      btn.classList.add("flag-option");
      const img = document.createElement("img");
      img.src = opt.text;
      img.alt = "אפשרות דגל";
      btn.appendChild(img);
    } else {
      btn.textContent = opt.text;
    }
    
    btn.addEventListener("click", () => {
      handleAnswerSelect(index, btn);
    });
    
    optionsGrid.appendChild(btn);
  });
  
  // Start countdown timer
  startTimer();
}

// Handle countdown timer
function startTimer() {
  stopTimer();
  gameState.timeLeft = gameState.maxTime;
  const timerBar = document.getElementById("trivia-timer-bar");
  timerBar.style.width = "100%";
  timerBar.style.backgroundColor = "var(--color-primary)";
  
  gameState.timerInterval = setInterval(() => {
    gameState.timeLeft -= 0.1;
    const pct = (gameState.timeLeft / gameState.maxTime) * 100;
    timerBar.style.width = `${pct}%`;
    
    // Change bar color as time runs out
    if (gameState.timeLeft < 5) {
      timerBar.style.backgroundColor = "var(--color-error)";
    }
    
    if (gameState.timeLeft <= 0) {
      stopTimer();
      handleTimeOut();
    }
  }, 100);
}

function stopTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

// Handle time out case (no answer selected in time)
function handleTimeOut() {
  if (gameState.isAnswered) return;
  gameState.isAnswered = true;
  
  // Lock all buttons
  const optionBtns = document.querySelectorAll(".option-btn");
  optionBtns.forEach(btn => btn.disabled = true);
  
  // Highlight correct answer in green
  const question = gameState.allQuestions[gameState.currentQuestionIndex];
  optionBtns.forEach((btn, idx) => {
    const opt = question.options[idx];
    if (opt.isCorrect) {
      btn.classList.add("correct");
    }
  });

  // Save progress details
  gameState.roundHistory.push({
    questionText: question.text,
    correctAnswer: getReadableAnswerText(question),
    userAnswer: "נגמר הזמן ⏰",
    isCorrect: false
  });

  // Update user stats
  userStats.totalQuestionsAnswered++;
  saveStats();

  // Progress to next question
  setTimeout(nextQuestion, 2000);
}

// Handle answer selection by user
function handleAnswerSelect(selectedIdx, clickedBtn) {
  if (gameState.isAnswered) return;
  gameState.isAnswered = true;
  stopTimer();
  
  const question = gameState.allQuestions[gameState.currentQuestionIndex];
  const optionBtns = document.querySelectorAll(".option-btn");
  
  // Lock buttons
  optionBtns.forEach(btn => btn.disabled = true);
  
  const selectedOpt = question.options[selectedIdx];
  const isCorrect = selectedOpt.isCorrect;
  
  if (isCorrect) {
    gameState.score++;
    clickedBtn.classList.add("correct");
  } else {
    clickedBtn.classList.add("incorrect");
    // Show correct answer in green
    optionBtns.forEach((btn, idx) => {
      if (question.options[idx].isCorrect) {
        btn.classList.add("correct");
      }
    });
  }

  // Save history item
  gameState.roundHistory.push({
    questionText: question.text,
    correctAnswer: getReadableAnswerText(question),
    userAnswer: getOptionText(selectedOpt),
    isCorrect: isCorrect
  });

  // Update stats
  userStats.totalQuestionsAnswered++;
  if (isCorrect) userStats.correctAnswers++;
  saveStats();

  // Progress to next question
  setTimeout(nextQuestion, 2000);
}

// Helper: Get human readable string of the correct answer
function getReadableAnswerText(question) {
  const correctOpt = question.options.find(o => o.isCorrect);
  if (correctOpt.isFlag) {
    return `${question.target.name} (דגל)`;
  }
  return correctOpt.text;
}

// Helper: Get option text (or country name if flag)
function getOptionText(opt) {
  if (opt.isFlag) {
    // Extract country name from code if flag
    const code = opt.text.split("/").pop().split(".")[0];
    const country = COUNTRIES_DATA.find(c => c.code === code);
    return country ? `דגל של ${country.name}` : "דגל";
  }
  return opt.text;
}

// Progress to the next question or show results
function nextQuestion() {
  gameState.currentQuestionIndex++;
  
  if (gameState.currentQuestionIndex < 10) {
    showQuestion();
  } else {
    showResults();
  }
}

// Show Trivia results dashboard
function showResults() {
  stopTimer();
  switchView("results-view");
  
  userStats.gamesPlayed++;
  
  const finalScorePct = Math.round((gameState.score / 10) * 100);
  
  // Beat high score?
  if (gameState.score > userStats.highScore) {
    userStats.highScore = gameState.score;
  }
  saveStats();
  
  // Render results values
  document.getElementById("results-score-pct").textContent = `${finalScorePct}%`;
  document.getElementById("results-score-fraction").textContent = `${gameState.score}/10`;
  
  // Customize title & emoji
  const titleEl = document.getElementById("results-title");
  const subtitleEl = document.getElementById("results-subtitle");
  const emojiEl = document.getElementById("results-emoji");
  
  if (gameState.score === 10) {
    titleEl.textContent = "מושלם! אלוף עולם! 👑";
    subtitleEl.textContent = "ענית נכון על כל השאלות בסבב!";
    emojiEl.textContent = "👑";
    triggerConfetti(true);
  } else if (gameState.score >= 8) {
    titleEl.textContent = "כל הכבוד! הישג מצוין! 🌟";
    subtitleEl.textContent = "יש לך ידע מעולה במדינות העולם.";
    emojiEl.textContent = "🌟";
    triggerConfetti(false);
  } else if (gameState.score >= 5) {
    titleEl.textContent = "עבודה טובה! 👍";
    subtitleEl.textContent = "תוצאה נחמדה, תמיד אפשר להשתפר.";
    emojiEl.textContent = "👍";
  } else {
    titleEl.textContent = "לא נורא, נסה שוב! 💪";
    subtitleEl.textContent = "מומלץ להיכנס למרכז הלימוד ולרענן את הידע.";
    emojiEl.textContent = "📚";
  }
  
  // Render questions breakdown review
  const breakdownList = document.getElementById("results-breakdown-list");
  breakdownList.innerHTML = "";
  
  gameState.roundHistory.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "breakdown-item";
    
    const icon = item.isCorrect ? "✅" : "❌";
    const statusClass = item.isCorrect ? "success" : "failure";
    
    row.innerHTML = `
      <div class="breakdown-question-text">
        <div><strong>שאלה ${index + 1}:</strong> ${item.questionText}</div>
        <div class="breakdown-item-details">
          תשובה נכונה: <span style="color: var(--color-success)">${item.correctAnswer}</span> 
          ${!item.isCorrect ? ` | תשובתך: <span style="color: var(--color-error)">${item.userAnswer}</span>` : ""}
        </div>
      </div>
      <div class="breakdown-status ${statusClass}">
        ${icon}
      </div>
    `;
    
    breakdownList.appendChild(row);
  });
}

// Trigger Confetti Celebration (using canvas-confetti script)
function triggerConfetti(isPerfect) {
  if (typeof confetti === "function") {
    if (isPerfect) {
      // Massive explosion
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    } else {
      // Single blast
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
}

// =========================================================================
// STUDY CENTER ENGINE
// =========================================================================

function initStudyCenter() {
  // Sync select dropdown filters on start
  document.getElementById("study-search").value = "";
  document.getElementById("study-filter-level").value = "all";
  document.getElementById("study-sort").value = "name-asc";
  
  // Set toggle mode to cards
  document.getElementById("btn-mode-cards").click();
  
  filterAndRenderCards();
}

// Filter, Sort and Render Country Flip Cards
function filterAndRenderCards() {
  const searchQuery = document.getElementById("study-search").value.trim().toLowerCase();
  const selectedLevel = document.getElementById("study-filter-level").value;
  const sortOption = document.getElementById("study-sort").value;
  
  // Filter countries
  let filtered = COUNTRIES_DATA.filter(country => {
    // Level filter
    if (selectedLevel !== "all" && country.level !== parseInt(selectedLevel)) {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const matchName = country.name.toLowerCase().includes(searchQuery);
      const matchCapital = country.capital.toLowerCase().includes(searchQuery);
      const matchLang = country.language.toLowerCase().includes(searchQuery);
      const matchCurr = country.currency.toLowerCase().includes(searchQuery);
      
      return matchName || matchCapital || matchLang || matchCurr;
    }
    
    return true;
  });
  
  // Sort countries
  filtered.sort((a, b) => {
    switch (sortOption) {
      case "name-asc":
        return a.name.localeCompare(b.name, "he");
      case "name-desc":
        return b.name.localeCompare(a.name, "he");
      case "area-desc":
        return b.area - a.area;
      case "area-asc":
        return a.area - b.area;
      case "pop-desc":
        return b.population - a.population;
      case "pop-asc":
        return a.population - b.population;
      default:
        return 0;
    }
  });
  
  // Render cards
  const grid = document.getElementById("study-grid");
  const noResults = document.getElementById("study-no-results");
  grid.innerHTML = "";
  
  if (filtered.length === 0) {
    noResults.classList.remove("hidden");
  } else {
    noResults.classList.add("hidden");
    
    filtered.forEach(country => {
      const cardContainer = document.createElement("div");
      cardContainer.className = "card-container";
      cardContainer.dataset.code = country.code;
      
      // Check if already discovered
      const isDiscovered = userStats.discoveredCountries.includes(country.code);
      const discoveredMark = isDiscovered ? "🌟 נלמד" : "👁️ לחץ לפרטים";
      
      cardContainer.innerHTML = `
        <div class="country-card-inner">
          <!-- FRONT FACE -->
          <div class="card-face card-front">
            <span class="badge level-badge">רמה ${country.level}</span>
            <img class="card-front-flag" src="https://flagcdn.com/w320/${country.code}.png" alt="דגל ${country.name}">
            <h4 class="card-front-name">${country.name}</h4>
            <span class="card-front-capital">בירה: ${country.capital}</span>
            <span class="card-flip-prompt">${discoveredMark}</span>
          </div>
          
          <!-- BACK FACE -->
          <div class="card-face card-back">
            <h4 class="card-back-title">
              <img class="card-back-flag-mini" src="https://flagcdn.com/w320/${country.code}.png" alt="דגל">
              ${country.name}
            </h4>
            
            <div class="card-details-list">
              <div class="card-detail-item">
                <span class="detail-label">עיר בירה:</span>
                <span class="detail-val">${country.capital}</span>
              </div>
              <div class="card-detail-item">
                <span class="detail-label">שטח (קמ"ר):</span>
                <span class="detail-val">${formatNumber(country.area)} קמ"ר</span>
              </div>
              <div class="card-detail-item">
                <span class="detail-label">אוכלוסייה:</span>
                <span class="detail-val">${formatPopulation(country.population)}</span>
              </div>
              <div class="card-detail-item">
                <span class="detail-label">שפה רשמית:</span>
                <span class="detail-val">${country.language}</span>
              </div>
              <div class="card-detail-item">
                <span class="detail-label">מטבע רשמי:</span>
                <span class="detail-val">${country.currency}</span>
              </div>
            </div>
            
            <div class="card-back-footer">
              קואורדינטות: ${country.lat}°, ${country.lng}°
            </div>
          </div>
        </div>
      `;
      
      // Flip logic + mark as discovered
      cardContainer.addEventListener("click", () => {
        cardContainer.classList.toggle("flipped");
        
        // Mark as discovered when flipped for the first time
        if (cardContainer.classList.contains("flipped")) {
          if (!userStats.discoveredCountries.includes(country.code)) {
            userStats.discoveredCountries.push(country.code);
            saveStats();
            
            // Update the card front badge indicator if it flips back
            const promptEl = cardContainer.querySelector(".card-flip-prompt");
            if (promptEl) promptEl.textContent = "🌟 נלמד";
          }
        }
      });
      
      grid.appendChild(cardContainer);
    });
  }
}

// Render Rankings & detailed comparison list
function renderRankings() {
  // Sort copy of countries by Area for Top 10
  const areaSorted = [...COUNTRIES_DATA].sort((a, b) => b.area - a.area).slice(0, 10);
  // Sort copy of countries by Population for Top 10
  const popSorted = [...COUNTRIES_DATA].sort((a, b) => b.population - a.population).slice(0, 10);
  
  const maxArea = areaSorted[0].area;
  const maxPop = popSorted[0].population;
  
  // Render Area list
  const areaListEl = document.getElementById("rank-area-list");
  areaListEl.innerHTML = "";
  areaSorted.forEach((c, index) => {
    const pct = (c.area / maxArea) * 100;
    const item = document.createElement("div");
    item.className = "rank-item";
    item.innerHTML = `
      <div class="rank-item-header">
        <div class="rank-country-info">
          <span class="rank-index">#${index + 1}</span>
          <img class="rank-flag" src="https://flagcdn.com/w320/${c.code}.png" alt="דגל">
          <span class="rank-name">${c.name}</span>
        </div>
        <span class="rank-val">${formatNumber(c.area)} קמ"ר</span>
      </div>
      <div class="rank-bar-bg">
        <div class="rank-bar-fill rank-area-fill" style="width: ${pct}%"></div>
      </div>
    `;
    areaListEl.appendChild(item);
  });
  
  // Render Population list
  const popListEl = document.getElementById("rank-pop-list");
  popListEl.innerHTML = "";
  popSorted.forEach((c, index) => {
    const pct = (c.population / maxPop) * 100;
    const item = document.createElement("div");
    item.className = "rank-item";
    item.innerHTML = `
      <div class="rank-item-header">
        <div class="rank-country-info">
          <span class="rank-index">#${index + 1}</span>
          <img class="rank-flag" src="https://flagcdn.com/w320/${c.code}.png" alt="דגל">
          <span class="rank-name">${c.name}</span>
        </div>
        <span class="rank-val">${formatPopulation(c.population)}</span>
      </div>
      <div class="rank-bar-bg">
        <div class="rank-bar-fill rank-pop-fill" style="width: ${pct}%"></div>
      </div>
    `;
    popListEl.appendChild(item);
  });
  
  // Render Detailed Comparison Table (All 150)
  const tableBody = document.querySelector("#rankings-comparison-table tbody");
  tableBody.innerHTML = "";
  
  // Sort alphabetically by default for the big table
  const tableSorted = [...COUNTRIES_DATA].sort((a,b) => a.name.localeCompare(b.name, "he"));
  
  tableSorted.forEach((c, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><img class="table-flag" src="https://flagcdn.com/w320/${c.code}.png" alt="דגל"></td>
      <td><strong>${c.name}</strong></td>
      <td><span class="badge" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border)">${c.level}</span></td>
      <td>${c.capital}</td>
      <td>${formatPopulation(c.population)}</td>
      <td>${formatNumber(c.area)}</td>
      <td>${c.currency}</td>
      <td>${c.language}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// Formatting helpers
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatPopulation(num) {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(2)} מיליארד`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} מיליון`;
  }
  return formatNumber(num);
}
