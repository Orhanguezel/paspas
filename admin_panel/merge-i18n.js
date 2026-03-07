// Merge categories i18n keys into existing locale files
const fs = require('fs');
const path = require('path');

function mergeDeep(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Read existing locale files
const trPath = path.join(__dirname, 'src/locale/tr.json');
const enPath = path.join(__dirname, 'src/locale/en.json');
const dePath = path.join(__dirname, 'src/locale/de.json');

// Read new categories i18n
const categoriesTrPath = path.join(__dirname, 'CATEGORIES_I18N.json');
const categoriesEnPath = path.join(__dirname, 'CATEGORIES_I18N_EN.json');
const categoriesDePath = path.join(__dirname, 'CATEGORIES_I18N_DE.json');

try {
  // Turkish
  const trExisting = JSON.parse(fs.readFileSync(trPath, 'utf8'));
  const trCategories = JSON.parse(fs.readFileSync(categoriesTrPath, 'utf8'));
  const trMerged = mergeDeep(trExisting, trCategories);
  fs.writeFileSync(trPath, JSON.stringify(trMerged, null, 2), 'utf8');
  console.log('✅ tr.json updated');

  // English
  const enExisting = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const enCategories = JSON.parse(fs.readFileSync(categoriesEnPath, 'utf8'));
  const enMerged = mergeDeep(enExisting, enCategories);
  fs.writeFileSync(enPath, JSON.stringify(enMerged, null, 2), 'utf8');
  console.log('✅ en.json updated');

  // German
  const deExisting = JSON.parse(fs.readFileSync(dePath, 'utf8'));
  const deCategories = JSON.parse(fs.readFileSync(categoriesDePath, 'utf8'));
  const deMerged = mergeDeep(deExisting, deCategories);
  fs.writeFileSync(dePath, JSON.stringify(deMerged, null, 2), 'utf8');
  console.log('✅ de.json updated');

  console.log('\n✨ All locale files merged successfully!');
} catch (error) {
  console.error('❌ Error merging i18n files:', error.message);
  process.exit(1);
}
