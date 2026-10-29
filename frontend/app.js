const API = ""; // same origin (served by the Python backend)

const el = (id) => document.getElementById(id);
const screens = {
  auth: el("auth-screen"),
  appSelection: el("app-selection-screen"),
  subjects: el("subjects-screen"), // shown after choosing quiz
  start: el("start-screen"), // scores & settings
  quiz: el("quiz-screen"),
  result: el("result-screen"),
};

/* ---------- auth token helpers ---------- */
const TOKEN_KEY = "sq_token";
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

function authHeaders(extra = {}) {
  return getToken()
    ? { ...extra, Authorization: `Bearer ${getToken()}` }
    : { ...extra };
}

/* ---------- sound engine (WebAudio, no files needed) ---------- */
const AudioFX = (() => {
  const MUTE_KEY = "sq_muted";
  let ctx = null, master = null, bgTimer = null;
  const muted = () => localStorage.getItem(MUTE_KEY) === "1";
  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = muted() ? 0 : 0.5;
        master.connect(ctx.destination);
      } catch { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    return !!ctx;
  }
  function tone(freq, dur, type, gainVal, when) {
    if (!ensure()) return; // browsers may block audio before first gesture
    const t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gainVal || 0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  return {
    welcome() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, "triangle", 0.18, i * 0.12)); },
    blip() { tone(880, 0.08, "sine", 0.08); },
    warn() { tone(220, 0.18, "square", 0.1); tone(160, 0.25, "square", 0.08, 0.15); },
    tick(urgent) { urgent ? tone(1400, 0.05, "sine", 0.1) : tone(1000, 0.04, "sine", 0.06); },
    startBackground() {
      this.stopBackground();
      if (!ensure()) return;
      const pad = () => {
        [130.81, 196.0, 261.63].forEach((f) => { // soft C-major pad
          const t = ctx.currentTime;
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = "sine"; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.035, t + 1.6);
          g.gain.linearRampToValueAtTime(0.0001, t + 4.4);
          o.connect(g); g.connect(master);
          o.start(t); o.stop(t + 4.5);
        });
      };
      pad();
      bgTimer = setInterval(pad, 4500);
    },
    stopBackground() { if (bgTimer) { clearInterval(bgTimer); bgTimer = null; } },
    toggleMute() {
      const m = !muted();
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      if (master) master.gain.value = m ? 0 : 0.5;
      return m;
    },
    muted,
  };
})();

let state = {
  quizId: null,
  questions: [],
  secondsPer: 20,
  index: 0,
  timerId: null,
  secondsLeft: 0,
  locked: false,
  finished: false,
};

/* ---------- screen switching ---------- */
function show(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

/* ---------- start screen ---------- */
document.querySelectorAll("#subjects .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    chip.classList.toggle("active"); // multi-select subjects
    AudioFX.blip();
  });
});

el("start-btn").addEventListener("click", startQuiz);
el("start-topic-btn").addEventListener("click", startTopicQuiz);
el("stats-btn").addEventListener("click", () => {
  loadHistory();
  refreshLeaderboard();
  show("start");
});
el("back-btn").addEventListener("click", () => {
  el("start-error").classList.add("hidden");
  show("subjects");
});
if (el("back-to-apps")) {
  el("back-to-apps").addEventListener("click", () => {
    show("appSelection");
  });
}
el("again-btn").addEventListener("click", () => {
  refreshLeaderboard();
  show("appSelection"); // Play Again returns to app selection
});
el("save-btn").addEventListener("click", saveScore);

if (el("choose-quiz-btn")) {
  el("choose-quiz-btn").addEventListener("click", () => {
    show("subjects");
  });
}
if (el("choose-quran-btn")) {
  el("choose-quran-btn").addEventListener("click", () => {
    window.location.href = 'quran/index.html';
  });
}
if (el("choose-photo-btn")) {
  el("choose-photo-btn").addEventListener("click", () => {
    window.location.href = '../photo store/index.html';
  });
}

refreshLeaderboard();

async function refreshLeaderboard() {
  try {
    const res = await fetch(`${API}/api/leaderboard`);
    if (!res.ok) return; // leaderboard is a bonus feature; keep old content
    const data = await res.json();
    const list = el("leaderboard");
    list.innerHTML = "";
    if (!data.leaderboard.length) {
      list.innerHTML = '<li class="empty">No scores yet — be the first!</li>';
      return;
    }
    data.leaderboard.forEach((e, i) => {
      const li = document.createElement("li");
      li.innerHTML =
        `<span class="pos">${i + 1}.</span>` +
        `<span class="nm">${escapeHtml(e.name)} <small class="dt">${escapeHtml(e.topic)} · ${escapeHtml(e.ts ?? "")}</small></span>` +
        `<span class="sc">${e.score} pts</span>`;
      list.appendChild(li);
    });
  } catch {
    // leaderboard is a bonus feature; leave whatever is rendered as is
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text === undefined || text === null ? "" : String(text);
  return div.innerHTML;
}

/* ---------- auth screen: tabs + login + signup ---------- */
document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.id === "tab-login";
    el("login-form").classList.toggle("hidden", !isLogin);
    el("signup-form").classList.toggle("hidden", isLogin);
  });
});

function setAuthError(form, message) {
  const p = el(form + "-error");
  p.textContent = message;
  p.classList.remove("hidden");
}

async function submitAuth(kind) {
  const btn = el(kind + "-form").querySelector("button");
  const username = el(kind + "-username").value.trim();
  const password = el(kind + "-password").value;
  const errEl = el(kind + "-error");
  errEl.classList.add("hidden");
  btn.disabled = true;
  try {
    const res = await fetch(`${API}/api/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`);
    setToken(data.token);
    afterLogin(data.username);
  } catch (err) {
    setAuthError(kind, err.message);
  } finally {
    btn.disabled = false;
  }
}

el("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  submitAuth("login");
});
el("signup-form").addEventListener("submit", (e) => {
  e.preventDefault();
  submitAuth("signup");
});

el("sound-btn").textContent = AudioFX.muted() ? "🔇" : "🔊";
el("sound-btn").addEventListener("click", () => {
  const m = AudioFX.toggleMute();
  el("sound-btn").textContent = m ? "🔇" : "🔊";
});

const doLogout = async () => {
  try {
    await fetch(`${API}/api/logout`, { method: "POST", headers: authHeaders() });
  } catch {
    /* still clear the local token */
  }
  clearToken();
  if (el("login-password")) el("login-password").value = "";
  if (el("signup-password")) el("signup-password").value = "";
  if (el("history-list")) el("history-list").innerHTML = "";
  AudioFX.stopBackground();
  show("auth");
};

if (el("logout-btn")) el("logout-btn").addEventListener("click", doLogout);
if (el("logout-btn2")) el("logout-btn2").addEventListener("click", doLogout);

async function afterLogin(username) {
  window.currentUser = username; // used to prefill the leaderboard name
  el("user-name").textContent = username;
  if (el("user-name-subj")) el("user-name-subj").textContent = username;
  el("welcome-user").textContent = username;
  if (el("welcome-msg")) el("welcome-msg").classList.remove("hidden");
  document.querySelectorAll("#subjects .chip").forEach((c) => c.classList.remove("active")); // fresh chooser
  show("appSelection"); // show app selection first after login
  loadHistory();
  AudioFX.welcome(); // welcome sound (blocked silently if no user gesture yet)
}

async function loadHistory() {
  const card = el("history-card");
  const list = el("history-list");
  try {
    const res = await fetch(`${API}/api/history`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    const data = await res.json();
    card.classList.remove("hidden");
    list.innerHTML = "";
    if (data.games_played > 0) {
      el("hist-games").textContent = data.games_played;
      el("hist-best").textContent = data.best_score;
      el("hist-avg").textContent = data.avg_accuracy + "%";
      el("history-summary").classList.remove("hidden");
      el("history-empty").classList.add("hidden");
    } else {
      el("history-summary").classList.add("hidden");
      el("history-empty").classList.remove("hidden");
    }
    data.games.forEach((g) => {
      const li = document.createElement("li");
      li.innerHTML =
        `<span class="hist-score">${g.score} pts</span>` +
        `<span class="hist-detail">${g.correct}/${g.total} correct · ${g.accuracy}% · best streak ${g.best_streak}🔥</span>` +
        `<span class="hist-date">${new Date(g.created_at).toLocaleDateString()} ${g.rank_name}</span>`;
      list.appendChild(li);
    });
  } catch {
    card.classList.add("hidden");
  }
}

/* ---------- initial auth check ---------- */
(async function checkToken() {
  if (!getToken()) {
    show("auth");
    return;
  }
  try {
    const res = await fetch(`${API}/api/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    const data = await res.json();
    afterLogin(data.username);
  } catch {
    clearToken();
    show("auth");
  }
})();

async function startQuiz() {
  el("start-error").classList.add("hidden");

  // chosen subjects = tapped chips on the subjects tab
  const subjects = [...new Set([...document.querySelectorAll("#subjects .chip.active")]
    .map((c) => c.dataset.topic))];
  if (!subjects.length) {
    AudioFX.warn(); // "please choose the subject first"
    el("start-error").textContent = "Please choose a subject first! 👆";
    el("start-error").classList.remove("hidden");
    return;
  }

  el("start-btn").disabled = true;
  el("start-btn").textContent = "Generating questions...";
  try {
    const data = await createQuizRequest({
      subjects,
      seconds_per_question: Number(el("seconds").value),
    });
    beginQuiz(data);
  } catch (err) {
    AudioFX.stopBackground();
    el("start-error").textContent =
      "Couldn't start the quiz: " + err.message + ". Is the backend running?";
    el("start-error").classList.remove("hidden");
  } finally {
    el("start-btn").disabled = false;
    el("start-btn").textContent = "Start Quiz 🚀";
  }
}

async function startTopicQuiz() {
  // single-topic mode from the settings screen: one topic, `count` questions
  el("start-error2").classList.add("hidden");
  const topic = el("topic").value.trim();
  if (!topic) {
    el("start-error2").textContent = "Type a topic first, or pick subjects on the other tab.";
    el("start-error2").classList.remove("hidden");
    return;
  }
  el("start-topic-btn").disabled = true;
  el("start-topic-btn").textContent = "Generating questions...";
  try {
    const data = await createQuizRequest({
      topic,
      count: Number(el("count").value),
      seconds_per_question: Number(el("seconds").value),
    });
    beginQuiz(data);
  } catch (err) {
    AudioFX.stopBackground();
    el("start-error2").textContent =
      "Couldn't start the quiz: " + err.message + ". Is the backend running?";
    el("start-error2").classList.remove("hidden");
  } finally {
    el("start-topic-btn").disabled = false;
    el("start-topic-btn").textContent = "Start single-topic quiz 🎯";
  }
}

async function createQuizRequest(body) {
  const res = await fetch(`${API}/api/quiz`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

function beginQuiz(data) {
  state = {
    quizId: data.quiz_id,
    questions: data.questions,
    secondsPer: data.seconds_per_question,
    index: 0,
    timerId: null,
    secondsLeft: 0,
    locked: false,
    finished: false,
  };
  el("q-total").textContent = data.questions.length;
  show("quiz");
  AudioFX.startBackground(); // ambient music while playing
  renderQuestion();
}

/* ---------- quiz screen ---------- */
function renderQuestion() {
  clearInterval(state.timerId);
  state.locked = false;
  const q = state.questions[state.index];
  el("q-num").textContent = state.index + 1;
  el("question-text").textContent = q.question;
  const tag = el("subject-tag");
  tag.textContent = (q.subject || "general").toUpperCase();
  tag.classList.remove("hidden");
  el("score").textContent = document.getElementById("score").textContent;
  el("streak").textContent = "0";
  el("feedback").classList.add("hidden");
  el("next-btn").classList.add("hidden");

  const box = el("options");
  box.innerHTML = "";
  [...q.options]
    .sort(() => Math.random() - 0.5) // client-side shuffle (answers checked server-side)
    .forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = opt;
      btn.addEventListener("click", () => submitAnswer(opt));
      box.appendChild(btn);
    });

  startTimer();
}

function startTimer() {
  state.secondsLeft = state.secondsPer;
  state.lastTickSecond = null;
  updateTimerUI();
  const startedAt = Date.now();
  state.timerId = setInterval(() => {
    const elapsed = (Date.now() - startedAt) / 1000;
    state.secondsLeft = Math.max(0, state.secondsPer - elapsed);
    updateTimerUI();
    if (state.secondsLeft <= 0 && !state.locked) {
      submitAnswer(""); // timeout -> counts as wrong
    }
  }, 100);
}

function updateTimerUI() {
  const pct = (state.secondsLeft / state.secondsPer) * 100;
  const bar = el("timer-bar");
  bar.style.width = pct + "%";
  bar.className = "timer-bar" + (pct < 20 ? " danger" : pct < 45 ? " warning" : "");
  el("timer-text").textContent = Math.ceil(state.secondsLeft) + "s";
  // timer ticking sound every second for the last 10 seconds
  const second = Math.ceil(state.secondsLeft);
  if (second !== state.lastTickSecond) {
    state.lastTickSecond = second;
    if (!state.locked && second <= 10 && second > 0) AudioFX.tick(second <= 5);
  }
}

async function submitAnswer(choice) {
  if (state.locked) return;
  state.locked = true;
  clearInterval(state.timerId);

  const q = state.questions[state.index];
  try {
    const res = await fetch(`${API}/api/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: state.quizId,
        question_id: q.id,
        choice,
        seconds_left: Number(state.secondsLeft.toFixed(2)),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || res.status);

    // highlight buttons
    document.querySelectorAll(".option").forEach((btn) => {
      btn.disabled = true;
      if (btn.textContent === data.correct_answer) btn.classList.add("correct");
      else if (btn.textContent === choice && choice) btn.classList.add("wrong");
    });

    el("score").textContent = data.running_score;
    el("streak").textContent = data.streak;
    const fb = el("feedback");
    if (data.correct) {
      fb.textContent = `✅ Correct! +${data.points} pts`;
      fb.className = "feedback good";
    } else if (!choice) {
      fb.textContent = `⏰ Time's up! Answer was: ${data.correct_answer}`;
      fb.className = "feedback bad";
    } else {
      fb.textContent = `❌ Wrong! Answer was: ${data.correct_answer}`;
      fb.className = "feedback bad";
    }
    fb.classList.remove("hidden");

    const next = el("next-btn");
    next.textContent =
      state.index + 1 < state.questions.length ? "Next ➜" : "See Results 🏁";
    next.classList.remove("hidden");
  } catch (err) {
    state.locked = false;
    const fb = el("feedback");
    fb.textContent = "Error submitting: " + err.message;
    fb.className = "feedback bad";
    fb.classList.remove("hidden");
  }
}

el("next-btn").addEventListener("click", () => {
  state.index += 1;
  if (state.index < state.questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
});

async function saveScore() {
  const name = el("player-name").value.trim();
  if (!name) {
    el("player-name").focus();
    return;
  }
  el("save-btn").disabled = true;
  try {
    const res = await fetch(`${API}/api/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz_id: state.quizId, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || res.status);
    const status = el("save-status");
    status.textContent = `Saved! You're #${data.rank} on the leaderboard 🏆`;
    status.classList.remove("hidden");
    el("save-row").classList.add("hidden");
  } catch (err) {
    el("save-btn").disabled = false;
    const status = el("save-status");
    status.textContent = "Couldn't save: " + err.message;
    status.classList.remove("hidden");
  }
}

/* ---------- result screen ---------- */
async function showResults() {
  try {
    const res = await fetch(`${API}/api/results?quiz_id=${encodeURIComponent(state.quizId)}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || res.status);
    el("rank").textContent = data.rank;
    el("final-score").textContent = data.score;
    el("stat-correct").textContent = data.correct;
    el("stat-total").textContent = data.total;
    el("stat-accuracy").textContent = data.accuracy + "%";
    el("stat-streak").textContent = data.best_streak;
    // fresh form each game; prefill with the logged-in name
    el("player-name").value = window.currentUser || "";
    el("save-status").classList.add("hidden");
    el("save-row").classList.remove("hidden");
    el("save-btn").disabled = false;
    AudioFX.stopBackground();
    show("result");
  } catch (err) {
    // fallback: jump to start with an error message
    el("start-error").textContent = "Couldn't load results: " + err.message;
    el("start-error").classList.remove("hidden");
    show("start");
  }
}
