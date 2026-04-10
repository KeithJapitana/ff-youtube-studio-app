# Skills Setup — Run This First
## FranchiseFilming YouTube Content Studio

Before writing any code, install the following skills into Claude Code. These give the agent the best procedural knowledge for building this specific project.

---

## Install Command

Skills are installed via `npx skillsadd`. Run each line in your terminal from the project root.

---

## Required Skills

### 1. Frontend Design
Teaches the agent how to build polished, production-grade UI. Critical for the 5-step workflow interface.
```bash
npx skillsadd anthropics/skills/frontend-design
```

### 2. React Best Practices (Vercel)
Best practices for structuring React components, hooks, and state — directly relevant to our Vite + React setup.
```bash
npx skillsadd vercel-labs/agent-skills/vercel-react-best-practices
```

### 3. Node.js Backend Patterns
Covers Express route structure, middleware chaining, service layers — mirrors the exact backend architecture in this project.
```bash
npx skillsadd wshobson/agents/nodejs-backend-patterns
```

### 4. API Design Principles
Covers REST conventions, request/response shaping, and error handling patterns — used across both `/api/generate` and `/api/sheets`.
```bash
npx skillsadd wshobson/agents/api-design-principles
```

### 5. Tailwind Design System
Best practices for using Tailwind utility classes consistently across components — our frontend uses Tailwind.
```bash
npx skillsadd wshobson/agents/tailwind-design-system
```

### 6. Web App Testing
Covers how to write and run tests for web apps — useful for validating the Claude API response parsing and export logic.
```bash
npx skillsadd anthropics/skills/webapp-testing
```

### 7. Systematic Debugging
Gives the agent a structured process for diagnosing and fixing issues — helpful when the Claude API or Google Sheets integration misbehaves.
```bash
npx skillsadd obra/superpowers/systematic-debugging
```

### 8. Verification Before Completion
Instructs the agent to verify its work before declaring a task done — prevents half-finished files and missed edge cases.
```bash
npx skillsadd obra/superpowers/verification-before-completion
```

---

## Optional But Recommended

### TypeScript Advanced Types
If you decide to add TypeScript to the project later (recommended for production), this gives the agent strong typing patterns.
```bash
npx skillsadd wshobson/agents/typescript-advanced-types
```

### Shadcn/UI
If you want to swap plain Tailwind components for a shadcn/ui component library (cleaner forms, dialogs, etc.).
```bash
npx skillsadd shadcn/ui/shadcn
```

### Content Strategy
Since this tool generates YouTube content, this skill helps the agent understand content optimization logic when refining prompts.
```bash
npx skillsadd coreyhaines31/marketingskills/content-strategy
```

---

## Install All Required Skills at Once

Copy and paste this block to install everything in one go:

```bash
npx skillsadd anthropics/skills/frontend-design && \
npx skillsadd vercel-labs/agent-skills/vercel-react-best-practices && \
npx skillsadd wshobson/agents/nodejs-backend-patterns && \
npx skillsadd wshobson/agents/api-design-principles && \
npx skillsadd wshobson/agents/tailwind-design-system && \
npx skillsadd anthropics/skills/webapp-testing && \
npx skillsadd obra/superpowers/systematic-debugging && \
npx skillsadd obra/superpowers/verification-before-completion
```

---

## After Installing Skills

Once all skills are installed, proceed to build in this order:

1. Read `01-frontend-spec.md` — full frontend spec (React + Vite)
2. Read `02-backend-spec.md` — full backend + middleware spec (Express)

Start with the backend first so the API is ready before wiring up the frontend.
