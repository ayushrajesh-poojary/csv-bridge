# Contributing to CSV Bridge

Thank you for your interest in contributing to **CSV Bridge**! As an open-source project, we welcome contributions of all kinds: bug fixes, new features, documentation improvements, and performance optimizations.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Git**

### 2. Fork and Clone
```bash
git clone https://github.com/ayushrajesh-poojary/csv-bridge.git
cd csv-bridge
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Running the Development Environment
- **Run the Next.js marketing & test app**:
  ```bash
  npm run dev:app
  ```
  Open [http://localhost:3000](http://localhost:3000) (landing page) or [http://localhost:3000/test-widget](http://localhost:3000/test-widget) (widget playground).

- **Build the npm package in watch mode**:
  ```bash
  npm run dev:package
  ```

---

## 🧪 Testing Your Changes

Before submitting a pull request, ensure all linting and build checks pass:

```bash
# 1. Lint checks
npm run lint

# 2. Build both the package and the web application
npm run build
```

---

## 🌿 Branch & Commit Guidelines

1. **Branch Naming**:
   - `fix/issue-description` for bug fixes
   - `feat/feature-name` for new features
   - `docs/update-guide` for documentation changes

2. **Commit Messages**:
   Follow conventional commits format:
   - `feat: add custom theme prop to CSVBridge`
   - `fix: resolve header trim error with empty values`
   - `docs: update installation instructions in README`

---

## 📬 Submitting a Pull Request

1. Push your branch to your forked repository.
2. Open a Pull Request against the `main` branch.
3. Fill out the PR template with a clear explanation of changes.
4. Ensure CI checks pass.

Thank you for helping make CSV importing better for everyone! 🚀
