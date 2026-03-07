# 🚨 QUICK FIX FOR TURBOPACK ERRORS

## The Problem
You're getting Turbopack crashes because you're running Next.js with the `--turbo` flag.

## The Solution (3 Steps)

### 1️⃣ STOP the current dev server
Press `Ctrl+C` in your terminal, or run:
```bash
pkill -f "next dev"
```

### 2️⃣ CLEAN the corrupted cache
```bash
cd admin_panel
./restart-dev.sh
```

Or manually:
```bash
cd admin_panel
rm -rf .next
rm -rf node_modules/.cache
```

### 3️⃣ START without Turbopack
```bash
cd admin_panel
npm run dev
```

**DO NOT USE:**
- ❌ `npm run dev:turbo`
- ❌ `next dev --turbo`
- ❌ Any command with `--turbo` flag

## Why This Happens

Turbopack is experimental and has bugs. The errors you're seeing:
- `Next.js package not found`
- `Failed to restore task data (corrupted database)`
- `Unable to open static sorted file *.sst`

These are all Turbopack cache corruption issues.

## Verification

After starting with `npm run dev`, check your terminal output.
You should see:
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

You should NOT see:
```
⚡ Turbopack (beta)
```

If you see "Turbopack", you're still using it. Stop and restart with `npm run dev`.

## Need More Help?

See [`TURBOPACK_FIX.md`](TURBOPACK_FIX.md) for detailed troubleshooting.
