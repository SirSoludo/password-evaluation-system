# Password Evaluation System

A web app that checks password strength in real time as you type, with a signup form that only accepts strong passwords. It runs entirely in the browser using HTML, CSS and JavaScript.

## Features

- **Strength meter** (weak to strong) that updates as you type
- **Validation checklist:** length, uppercase, lowercase, numbers and special characters
- Flags weak patterns such as sequential characters (`abc`, `123`)
- **Recommendations** for making the password stronger
- Form field validation, with an "Account Created!" confirmation once all checks pass

## Run

Open `index.html` in any modern browser. No install or build step needed.

## Files

| Path | What it does |
|---|---|
| `index.html` | Signup form, strength meter, checklist and recommendations panel |
| `style.css` | Styling |
| `script.js` | `evaluatePassword`, `hasSequential`, `getStrengthLevel`, `buildRecommendations`, `updateUI`, `validateField` |
