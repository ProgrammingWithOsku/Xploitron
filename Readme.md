## 🛡️ Xploitron

**Xploitron** is a modular, AI-powered security scanning tool. It uses a local LLaMA language model to generate attack payloads (e.g. XSS), executes them via Playwright, and produces clean HTML reports with screenshots and LLM suggestions.

---

## 🚀 Features

- ✅ AI-generated payloads via local LLaMA
- ✅ Automated browser-based scanning using Playwright
- ✅ HTML report with results, screenshots, and LLM suggestions
- ✅ Modular structure for adding new attack types (e.g. SQLi, CSRF)
- ✅ Type-safe and scalable codebase (TypeScript)
- ✅ Prompt-driven payload generation per module
- ✅ Easy configuration via centralized `config.ts`

---

## 📁 Project Structure

```
Xploitron/
│
├── src/
│   ├── index.ts                # Entry point
│
│   ├── core/                   # Core logic
│   │   ├── engine.ts           # Scan coordinator + report generator
│   │   ├── llama.ts            # LLaMA integration
│   │   ├── config.ts           # Centralized settings
│   │   └── types.ts            # Shared interfaces
│
│   ├── modules/                # Attack modules
│   │   ├── xss.ts              # XSS scanning logic
│   │   └── sqli.ts             # (optional) SQLi module
│
│   ├── payloads/               # Prompt definitions per attack type
│   │   └── xss.prompt.ts       # LLM prompt for XSS
│
│   ├── layout/                 # HTML report template
│   │   ├── layout.html
│   │   └── layout.css
│
├── results/                    # Output folder
│   ├── report.html
│   ├── xss_screenshot.png
│   └── report.json
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧠 Requirements

- Node.js ≥ 18
- [Ollama](https://ollama.com) installed locally
- LLaMA model pulled via:

```bash
ollama pull llama3
```

---

## 🧪 How It Works

1. `index.ts` loads a prompt from `payloads/xss.prompt.ts`
2. Sends the prompt to LLaMA via `queryLocalLLM()`
3. Parses the response into payloads
4. Executes each payload using Playwright
5. Generates a report with results, screenshots, and LLM suggestions

---

## ▶️ Run the Scanner

```bash
npm install
npm run start
```

> Make sure Ollama is running locally before starting:
```bash
ollama run llama3
```

---

## 🧩 Add New Attack Modules

To add a new attack type (e.g. SQLi):

1. Create `src/modules/sqli.ts` and export `runSQLiScan()`
2. Create `src/payloads/sqli.prompt.ts` with a custom prompt
3. Update `index.ts` to use the new module and prompt
4. Extend `engine.ts` to handle the new type

---

## 📄 Report Example

- Target: `http://localhost:4000/`
- Payloads: AI-generated via LLaMA
- Status: ✅ or ⚠️
- Screenshot: `results/xss_screenshot.png`
- LLM Suggestions: shown in report

---

## 📌 Notes

- All payloads are sanitized before rendering in HTML
- Prompts are modular and customizable per attack type
- Reports are overwritten unless archived manually
- You can extend the engine to support multiple targets or batch scanning

---

## 📬 Author

Made with ❤️ by **Osamah (Osku)**  
Location: Finland  
Date: 19 October 2025