# 🚀 Deployment Guide: GitHub Pages + Chrome Extension

## Part 1: Deploy Web App to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named: `squat-to-scroll`
3. Make it **Public** (required for free GitHub Pages)
4. Do NOT initialize with README (we'll push existing code)

### Step 2: Push Code to GitHub

Open terminal in `C:\Users\admin\Downloads\squat-to-scroll-v2-ok` and run:

```powershell
git init
git add .
git commit -m "Initial commit - Squat to Scroll"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/squat-to-scroll.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your GitHub username!

### Step 3: Enable GitHub Pages

1. Go to your repo: `https://github.com/YOUR_USERNAME/squat-to-scroll`
2. Click **Settings** tab
3. Scroll down to **Pages** in the left sidebar
4. Under "Build and deployment":
   - Source: **GitHub Actions**
5. The workflow will run automatically on push

### Step 4: Wait for Deployment

1. Go to **Actions** tab in your repo
2. Wait for the "Deploy to GitHub Pages" workflow to complete (green check)
3. Your app will be live at: `https://YOUR_USERNAME.github.io/squat-to-scroll/`

---

## Part 2: Update Chrome Extension

### Step 1: Update background.js

Open `public/background.js` and change line 9:

```javascript
// FROM:
const SQUAT_APP_URL = "https://YOUR_GITHUB_USERNAME.github.io/squat-to-scroll/";

// TO (use your actual username):
const SQUAT_APP_URL = "https://your-actual-username.github.io/squat-to-scroll/";
```

### Step 2: Rebuild & Reload Extension

```powershell
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Click 🔄 (reload) on "Squat to Scroll"
3. Test by visiting instagram.com!

---

## ✅ Verification Checklist

- [ ] GitHub repo created at `github.com/YOUR_USERNAME/squat-to-scroll`
- [ ] Code pushed to `main` branch
- [ ] GitHub Pages enabled with "GitHub Actions" source
- [ ] Workflow completed successfully (green check in Actions tab)
- [ ] Web app accessible at `https://YOUR_USERNAME.github.io/squat-to-scroll/`
- [ ] Camera works on the hosted site
- [ ] `background.js` updated with correct GitHub Pages URL
- [ ] Extension rebuilt and reloaded
- [ ] Visiting blocked sites redirects to GitHub Pages app

---

## 🔧 Troubleshooting

### "404 Not Found" on GitHub Pages
- Wait 2-3 minutes for first deployment
- Check Actions tab for errors
- Ensure repo is public

### Camera not working
- GitHub Pages uses HTTPS, so camera should work
- Make sure to "Allow" camera permission in browser

### Still getting WASM error on GitHub Pages
- Clear browser cache (Ctrl+Shift+Delete)
- Make sure you're on the GitHub Pages URL, not the extension URL
