# Troubleshooting Guide

## Dependency Issues

### Error: ERESOLVE unable to resolve dependency tree

**Cause**: ESLint version conflict between your project and Next.js 16

**Solution**:
1. Delete node_modules and package-lock.json
2. Run npm install again
3. If still fails, run: `npm install --legacy-peer-deps`

**Commands**:
```bash
# Option 1: Manual cleanup
rm -rf node_modules package-lock.json
npm install

# Option 2: Use provided scripts
bash fix-deps.sh              # macOS/Linux
fix-deps.bat                  # Windows

# Option 3: Force install
npm install --force
```

### Error: Module not found after installation

**Solution**:
```bash
npm install
npm run build
```

### Error: ESLint version mismatch

**Verify correct version**:
```bash
npm list eslint
# Should show: eslint@9.0.0 or higher
```

**If showing version 8.x**:
```bash
# Check package.json has correct version
cat package.json | grep eslint

# Should show: "eslint": "^9.0.0"
```

---

## Build Issues

### Error: next build fails

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Error: TypeScript compilation errors

**Solution**:
```bash
# Check for type errors
npx tsc --noEmit

# Fix ESLint issues
npm run lint -- --fix

# Rebuild
npm run build
```

---

## Development Server Issues

### Error: Port 3000 already in use

**Solution**:
```bash
# Use different port
npm run dev -- -p 3001

# Or kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Error: Module not found during dev

**Solution**:
```bash
# Stop dev server
# Clear cache
rm -rf .next node_modules/.cache

# Restart dev server
npm run dev
```

---

## Common Issues

### Issue: Slow build times

**Optimization**:
- Close other applications
- Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`
- Check disk space

### Issue: Hot reload not working

**Solution**:
```bash
# Stop dev server
# Clear cache
rm -rf .next

# Restart
npm run dev
```

### Issue: Tailwind CSS not applying

**Solution**:
1. Verify tailwind.config.ts has correct paths
2. Restart dev server
3. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)

### Issue: TypeScript strict mode errors

**Solution**:
```bash
# If not needed, temporarily disable in tsconfig.json:
"strict": false

# Or fix type issues:
npm run lint -- --fix
```

---

## API/Network Issues

### Error: Cannot fetch from API

**Check**:
1. Is backend server running?
2. Is NEXT_PUBLIC_API_URL correct in .env.local?
3. Check browser console for CORS errors
4. Verify API endpoint exists

**Fix**:
```bash
# Check env variables
cat .env.local

# Should show:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Error: CORS error in browser

**Cause**: Backend not allowing requests from frontend

**Backend fix needed**:
```
Add Frontend URL to CORS whitelist
Enable Access-Control-Allow-* headers
```

---

## Performance Issues

### Slow page load

**Check**:
1. Use Lighthouse (DevTools → Lighthouse)
2. Check images - use next/image
3. Check bundle size: `npm run build` and check .next/static

**Optimize**:
```bash
# Analyze bundle
npm install -D @next/bundle-analyzer

# Add to next.config.js and run
npm run build
```

### High memory usage

**Solution**:
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run dev
```

---

## Environment Setup

### Missing .env.local file

**Create it**:
```bash
cp .env.example .env.local
```

**Edit .env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Git/Version Control Issues

### Error: Git not initialized

**Solution**:
```bash
git init
git add .
git commit -m "Initial commit"
```

### Error: node_modules too large for commit

**Solution**: Add to .gitignore (already included)
```
node_modules/
.next/
```

---

## System Requirements

Verify you have:
- Node.js 18 or higher: `node --version`
- npm 8 or higher: `npm --version`
- 500MB+ disk space free
- Modern browser (Chrome, Firefox, Safari, Edge)

**Update Node.js**:
```bash
# macOS (using Homebrew)
brew install node

# Windows (using Chocolatey)
choco install nodejs

# Or download from https://nodejs.org
```

---

## Complete System Refresh

If nothing works, try a complete refresh:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clean everything
rm -rf node_modules package-lock.json .next

# 3. Clear npm cache
npm cache clean --force

# 4. Reinstall
npm install

# 5. Rebuild
npm run build

# 6. Start fresh
npm run dev
```

---

## Getting Help

1. Check this troubleshooting guide
2. Check README.md for setup instructions
3. Check DEPENDENCY_FIX.md for dependency issues
4. Review error message in browser console
5. Check Next.js docs: https://nextjs.org/docs
6. Check ESLint docs: https://eslint.org/docs

---

## Quick Reference

| Issue | Command |
|-------|---------|
| Dependencies fail | `rm -rf node_modules && npm install` |
| Port in use | `npm run dev -- -p 3001` |
| Tailwind not working | Restart dev server + clear browser cache |
| TypeScript errors | `npm run lint -- --fix` |
| Build slow | Close other apps |
| Clear cache | `rm -rf .next node_modules/.cache` |
| Check versions | `npm list` |
| Update deps | `npm update` |

---

**Last updated**: March 30, 2026
