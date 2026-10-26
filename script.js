/**
 * PassGuard — script.js
 * Final Year Project: Web-Based Password Evaluation System
 *
 * This file handles:
 *  1. Show / Hide password toggle
 *  2. Real-time password strength evaluation
 *  3. Checklist updates
 *  4. Dynamic recommendations
 *  5. Strength meter & percentage
 *  6. Form validation on submit
 */

/* ================================================================
   SECTION 1 — COMMON PASSWORD LIST
   A small sample of frequently used / easily guessed passwords.
   In a real system, this list would be much larger.
   ================================================================ */
const COMMON_PASSWORDS = [
  "password", "123456", "123456789", "qwerty", "abc123",
  "password1", "111111", "iloveyou", "admin", "welcome",
  "monkey", "dragon", "master", "letmein", "login",
  "sunshine", "princess", "football", "charlie", "donald",
  "pass", "hello", "shadow", "superman", "michael",
  "ninja", "jessica", "thomas", "batman", "test123"
];


/* ================================================================
   SECTION 2 — ELEMENT REFERENCES
   Grab references to all HTML elements we need to interact with.
   ================================================================ */
const passwordInput  = document.getElementById("password");
const toggleBtn      = document.getElementById("toggleBtn");
const eyeOpen        = document.getElementById("eyeOpen");
const eyeClosed      = document.getElementById("eyeClosed");
const strengthPanel  = document.getElementById("strengthPanel");
const meterFill      = document.getElementById("meterFill");
const strengthLabel  = document.getElementById("strengthLabel");
const strengthPercent= document.getElementById("strengthPercent");
const strengthBadge  = document.getElementById("strengthBadge");
const checklist      = document.getElementById("checklist");
const recommendations= document.getElementById("recommendations");
const registrationForm = document.getElementById("registrationForm");
const successMessage = document.getElementById("successMessage");
const resetBtn       = document.getElementById("resetBtn");

// Checklist items
const chkLength   = document.getElementById("chk-length");
const chkUpper    = document.getElementById("chk-upper");
const chkLower    = document.getElementById("chk-lower");
const chkNumber   = document.getElementById("chk-number");
const chkSpecial  = document.getElementById("chk-special");
const chkCommon   = document.getElementById("chk-common");
const chkPersonal = document.getElementById("chk-personal");
const chkRepeat   = document.getElementById("chk-repeat");
const chkSequence = document.getElementById("chk-sequence");


/* ================================================================
   SECTION 3 — SHOW / HIDE PASSWORD TOGGLE
   ================================================================ */
toggleBtn.addEventListener("click", function () {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";

  // Swap icons
  eyeOpen.style.display   = isHidden ? "none"  : "inline";
  eyeClosed.style.display = isHidden ? "inline": "none";

  // Return focus to input field after clicking toggle
  passwordInput.focus();
});


/* ================================================================
   SECTION 4 — PASSWORD EVALUATION ENGINE
   This function runs every time the user types in the password field.
   It checks nine criteria and returns a score used to compute strength.
   ================================================================ */

/**
 * evaluatePassword(password, userData)
 * @param {string} password  - The password the user typed
 * @param {object} userData  - Object with firstName, lastName, username, email
 * @returns {object}         - Results of every check + total score
 */
function evaluatePassword(password, userData) {

  // ── Criterion 1: Minimum Length ──────────────────────────────
  // A password should be at least 8 characters long.
  // Longer passwords (12+, 16+) are awarded more points.
  const length = password.length;
  let lengthScore = 0;
  if (length >= 16) lengthScore = 3;
  else if (length >= 12) lengthScore = 2;
  else if (length >= 8)  lengthScore = 1;
  const passLength = length >= 8;

  // ── Criterion 2: Uppercase Letters ───────────────────────────
  const passUpper = /[A-Z]/.test(password);

  // ── Criterion 3: Lowercase Letters ───────────────────────────
  const passLower = /[a-z]/.test(password);

  // ── Criterion 4: Numeric Digits ──────────────────────────────
  const passNumber = /[0-9]/.test(password);

  // ── Criterion 5: Special Characters ─────────────────────────
  // Common special characters: ! @ # $ % ^ & * etc.
  const passSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

  // ── Criterion 6: Common Password Check ───────────────────────
  // Compare the password (lowercased) against the list of known weak passwords.
  const passCommon = !COMMON_PASSWORDS.includes(password.toLowerCase());

  // ── Criterion 7: Personal Information Check ──────────────────
  // Warn the user if their password contains their name, username, or email prefix.
  const lowerPwd = password.toLowerCase();
  const { firstName, lastName, username, email } = userData;
  const emailPrefix = email.split("@")[0];            // e.g. "amina" from "amina@gmail.com"

  // We only check if the field is non-empty (avoid false positives)
  let containsPersonal = false;
  if (firstName.length > 2 && lowerPwd.includes(firstName.toLowerCase())) containsPersonal = true;
  if (lastName.length  > 2 && lowerPwd.includes(lastName.toLowerCase()))  containsPersonal = true;
  if (username.length  > 2 && lowerPwd.includes(username.toLowerCase()))  containsPersonal = true;
  if (emailPrefix.length > 2 && lowerPwd.includes(emailPrefix.toLowerCase())) containsPersonal = true;

  const passPersonal = !containsPersonal;

  // ── Criterion 8: Repeated Characters ─────────────────────────
  // Flags passwords that contain three or more identical consecutive characters.
  // Example: "aaabbb" → fails;  "aabc" → passes
  const passRepeat = !/(.)\1{2,}/.test(password);

  // ── Criterion 9: Sequential Characters ───────────────────────
  // Flags common keyboard / alphabet / numeric sequences.
  // We slide a 3-character window over the password and check each triplet.
  const passSequence = !hasSequential(password);

  // ── Score Calculation ─────────────────────────────────────────
  // Each criterion contributes points to the total score.
  // Weights are assigned based on security importance.
  const criteria = {
    length:   passLength,
    upper:    passUpper,
    lower:    passLower,
    number:   passNumber,
    special:  passSpecial,
    common:   passCommon,
    personal: passPersonal,
    repeat:   passRepeat,
    sequence: passSequence,
  };

  // Basic scoring: each criterion = 10 points; length bonus adds up to 20 more
  const baseScore = Object.values(criteria).filter(Boolean).length * 10;
  const bonus     = lengthScore * 5;          // 5, 10, or 15 bonus points
  let rawScore    = Math.min(baseScore + bonus, 100);

  // ── Critical-failure caps ─────────────────────────────────────
  // A common password, or one containing the user's own details, can be
  // guessed quickly however long or complex it looks, so it is capped at
  // "Very Weak". Repeated or sequential characters cap it at "Moderate".
  if (!passCommon || !passPersonal) rawScore = Math.min(rawScore, 20);
  else if (!passRepeat || !passSequence) rawScore = Math.min(rawScore, 60);

  return { criteria, rawScore, lengthScore };
}


/**
 * hasSequential(password)
 * Helper function to detect sequential characters:
 * - Alphabetic:  "abc", "xyz", "cba" (also reversed)
 * - Numeric:     "123", "987" (also reversed)
 * - Keyboard:    "qwerty", "asdf" — checked via sliding window
 */
function hasSequential(password) {
  const lower = password.toLowerCase();

  // Pre-defined keyboard rows (horizontal adjacency)
  const keyboardRows = [
    "qwertyuiop", "asdfghjkl", "zxcvbnm",
    "1234567890"
  ];

  // Check 3-character windows
  for (let i = 0; i < lower.length - 2; i++) {
    const a = lower.charCodeAt(i);
    const b = lower.charCodeAt(i + 1);
    const c = lower.charCodeAt(i + 2);

    // Alphabetic sequence: a→b→c (ascending) or c→b→a (descending)
    const ascAlpha  = (b === a + 1) && (c === b + 1);
    const descAlpha = (b === a - 1) && (c === b - 1);
    if (ascAlpha || descAlpha) return true;

    // Keyboard-row sequence (3 consecutive keys on a row)
    const triplet = lower.slice(i, i + 3);
    for (const row of keyboardRows) {
      if (row.includes(triplet)) return true;
      // Reverse check (e.g., "oiu" on qwerty row)
      if (row.includes(triplet.split("").reverse().join(""))) return true;
    }
  }
  return false;
}


/* ================================================================
   SECTION 5 — STRENGTH LEVEL RESOLVER
   Converts a numeric score (0-100) to a human-readable label and
   the colour class used by the UI.
   ================================================================ */
function getStrengthLevel(score) {
  if (score === 0)  return { label: "Enter a password", badge: "—",         cls: "" };
  if (score < 25)   return { label: "Very Weak",        badge: "Very Weak",  cls: "very-weak"   };
  if (score < 45)   return { label: "Weak",             badge: "Weak",       cls: "weak"        };
  if (score < 65)   return { label: "Moderate",         badge: "Moderate",   cls: "moderate"    };
  if (score < 85)   return { label: "Strong",           badge: "Strong",     cls: "strong"      };
  return              { label: "Very Strong",           badge: "Very Strong",cls: "very-strong" };
}

// Colour map for the meter fill bar
const METER_COLORS = {
  "very-weak":   "#ff3b3b",
  "weak":        "#ff8c00",
  "moderate":    "#f0d000",
  "strong":      "#39d353",
  "very-strong": "#00d4ff",
  "":            "#1c2e4a",   // empty state
};


/* ================================================================
   SECTION 6 — RECOMMENDATION ENGINE
   Builds a list of friendly, actionable tips based on failed checks.
   ================================================================ */
function buildRecommendations(criteria, score, password) {
  const tips = [];

  // Always put positive feedback first if password is decent
  if (score >= 65) {
    tips.push({ text: "Great job! Your password is strong.", cls: "tip-ok" });
  }

  if (!criteria.length) {
    tips.push({ text: "Use at least 8 characters. Aim for 12 or more.", cls: "tip-bad" });
  } else if (password.length < 12) {
    tips.push({ text: "Increasing length to 12+ characters adds significant security.", cls: "tip-warn" });
  }

  if (!criteria.upper && !criteria.lower) {
    tips.push({ text: "Mix uppercase and lowercase letters (e.g., 'PassWord').", cls: "tip-bad" });
  } else if (!criteria.upper) {
    tips.push({ text: "Add at least one uppercase letter (A–Z).", cls: "tip-warn" });
  } else if (!criteria.lower) {
    tips.push({ text: "Add at least one lowercase letter (a–z).", cls: "tip-warn" });
  }

  if (!criteria.number) {
    tips.push({ text: "Include at least one number (0–9).", cls: "tip-warn" });
  }

  if (!criteria.special) {
    tips.push({ text: "Add a special character like !, @, #, $, or %.", cls: "tip-warn" });
  }

  if (!criteria.common) {
    tips.push({ text: "This is a very common password. Please choose something unique.", cls: "tip-bad" });
  }

  if (!criteria.personal) {
    tips.push({ text: "Avoid using your name, username, or email in your password.", cls: "tip-bad" });
  }

  if (!criteria.repeat) {
    tips.push({ text: "Avoid repeating the same character three or more times (e.g., 'aaa').", cls: "tip-warn" });
  }

  if (!criteria.sequence) {
    tips.push({ text: "Avoid keyboard or alphabet sequences like 'qwerty', '1234', or 'abc'.", cls: "tip-warn" });
  }

  // Bonus tip for very strong passwords
  if (score >= 85) {
    tips.push({ text: "Tip: Use a password manager to store complex passwords safely.", cls: "tip-ok" });
  }

  return tips;
}


/* ================================================================
   SECTION 7 — UI UPDATER
   Reads evaluation results and pushes every change into the DOM.
   ================================================================ */
function updateUI(password, userData) {
  const hasInput = password.length > 0;

  // Show/hide the strength panel
  if (hasInput) {
    strengthPanel.classList.add("visible");
  } else {
    strengthPanel.classList.remove("visible");
    return;   // nothing more to do when field is empty
  }

  // Run the evaluation
  const { criteria, rawScore } = evaluatePassword(password, userData);
  const level = getStrengthLevel(rawScore);

  // ── Percentage & Label ───────────────────────────────────────
  strengthPercent.textContent = rawScore + "%";
  strengthLabel.textContent   = level.label;

  // Apply colour class to the percentage number
  strengthPercent.className   = "strength-percent " + level.cls;

  // ── Badge ────────────────────────────────────────────────────
  strengthBadge.textContent = level.badge;
  strengthBadge.className   = "strength-level-badge " + level.cls;

  // ── Meter Fill ───────────────────────────────────────────────
  meterFill.style.width      = rawScore + "%";
  meterFill.style.background = METER_COLORS[level.cls] || METER_COLORS[""];

  // ── Checklist ────────────────────────────────────────────────
  function setCheck(el, passed) {
    el.classList.toggle("pass", passed);
    el.classList.toggle("fail", !passed);
  }

  setCheck(chkLength,   criteria.length);
  setCheck(chkUpper,    criteria.upper);
  setCheck(chkLower,    criteria.lower);
  setCheck(chkNumber,   criteria.number);
  setCheck(chkSpecial,  criteria.special);
  setCheck(chkCommon,   criteria.common);
  setCheck(chkPersonal, criteria.personal);
  setCheck(chkRepeat,   criteria.repeat);
  setCheck(chkSequence, criteria.sequence);

  // ── Recommendations ──────────────────────────────────────────
  const tips = buildRecommendations(criteria, rawScore, password);
  recommendations.innerHTML = "";

  if (tips.length === 0) {
    recommendations.innerHTML = '<li class="rec-placeholder">No issues found — excellent password!</li>';
  } else {
    tips.forEach(function (tip) {
      const li = document.createElement("li");
      li.textContent = tip.text;
      li.classList.add(tip.cls);
      recommendations.appendChild(li);
    });
  }
}


/* ================================================================
   SECTION 8 — REAL-TIME LISTENER
   Fires updateUI on every keystroke in the password field.
   ================================================================ */
passwordInput.addEventListener("input", function () {
  const userData = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName:  document.getElementById("lastName").value.trim(),
    username:  document.getElementById("username").value.trim(),
    email:     document.getElementById("email").value.trim(),
  };

  updateUI(this.value, userData);
});

// Re-evaluate if user updates personal fields AFTER typing the password
["firstName", "lastName", "username", "email"].forEach(function (id) {
  document.getElementById(id).addEventListener("input", function () {
    if (passwordInput.value.length > 0) {
      const userData = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName:  document.getElementById("lastName").value.trim(),
        username:  document.getElementById("username").value.trim(),
        email:     document.getElementById("email").value.trim(),
      };
      updateUI(passwordInput.value, userData);
    }
  });
});


/* ================================================================
   SECTION 9 — FORM VALIDATION ON SUBMIT
   ================================================================ */

/** Validate a single field and display an error message if invalid */
function validateField(inputId, errorId, validationFn, errorMsg) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  const value = input.value.trim();

  if (!validationFn(value)) {
    input.classList.add("invalid");
    input.classList.remove("valid");
    error.textContent = errorMsg;
    return false;
  } else {
    input.classList.remove("invalid");
    input.classList.add("valid");
    error.textContent = "";
    return true;
  }
}

registrationForm.addEventListener("submit", function (e) {
  e.preventDefault();   // Prevent default page reload

  let allValid = true;

  // ── Validate First Name ─────────────────────────────────────
  if (!validateField("firstName", "firstNameError",
    v => v.length >= 2,
    "First name must be at least 2 characters.")) allValid = false;

  // ── Validate Last Name ──────────────────────────────────────
  if (!validateField("lastName", "lastNameError",
    v => v.length >= 2,
    "Last name must be at least 2 characters.")) allValid = false;

  // ── Validate Username ───────────────────────────────────────
  if (!validateField("username", "usernameError",
    v => /^[a-zA-Z0-9_]{3,}$/.test(v),
    "Username must be 3+ characters (letters, numbers, underscore).")) allValid = false;

  // ── Validate Email ──────────────────────────────────────────
  if (!validateField("email", "emailError",
    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Please enter a valid email address.")) allValid = false;

  // ── Validate Password ───────────────────────────────────────
  const password = passwordInput.value;
  const userData = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName:  document.getElementById("lastName").value.trim(),
    username:  document.getElementById("username").value.trim(),
    email:     document.getElementById("email").value.trim(),
  };

  const { criteria, rawScore } = evaluatePassword(password, userData);

  if (password.length === 0) {
    passwordInput.classList.add("invalid");
    allValid = false;
  } else if (rawScore < 45) {
    // Require at least "Moderate" strength before allowing submission
    passwordInput.classList.add("invalid");
    // Flash the strength panel to draw attention
    strengthPanel.style.outline = "1px solid #ff3b3b";
    setTimeout(() => { strengthPanel.style.outline = ""; }, 1200);
    allValid = false;
  } else {
    passwordInput.classList.remove("invalid");
    passwordInput.classList.add("valid");
  }

  // ── Show Success if all valid ───────────────────────────────
  if (allValid) {
    registrationForm.style.display = "none";
    successMessage.classList.add("visible");
  }
});


/* ================================================================
   SECTION 10 — RESET BUTTON
   Clears the form and restores initial state.
   ================================================================ */
resetBtn.addEventListener("click", function () {
  registrationForm.reset();
  registrationForm.style.display = "block";
  successMessage.classList.remove("visible");
  strengthPanel.classList.remove("visible");

  // Clear validation states
  document.querySelectorAll("input").forEach(function (input) {
    input.classList.remove("valid", "invalid");
  });
  document.querySelectorAll(".field-error").forEach(function (el) {
    el.textContent = "";
  });

  // Reset eye icon
  passwordInput.type    = "password";
  eyeOpen.style.display  = "inline";
  eyeClosed.style.display = "none";

  // Reset checklist state
  [chkLength, chkUpper, chkLower, chkNumber, chkSpecial,
   chkCommon, chkPersonal, chkRepeat, chkSequence].forEach(function (li) {
    li.classList.remove("pass", "fail");
  });
});
