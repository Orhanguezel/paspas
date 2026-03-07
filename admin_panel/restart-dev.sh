#!/bin/bash

echo "🛑 Stopping all Next.js processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

echo "🧹 Cleaning cache and build files..."
rm -rf .next
rm -rf node_modules/.cache
find . -name "*.sst" -type f -delete 2>/dev/null || true
find . -name "*.meta" -type f -delete 2>/dev/null || true

echo "✅ Cleanup complete!"
echo ""
echo "Now start the dev server WITHOUT Turbopack:"
echo "  npm run dev"
echo ""
echo "Or if you want to test Turbopack (not recommended):"
echo "  npm run dev:turbo"
