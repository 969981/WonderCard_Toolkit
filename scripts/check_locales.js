'use strict';
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync('web/i18n.js', 'utf8');
const window = {};
vm.runInNewContext(source, {
  window,
  navigator: { language: 'en' },
  document: { readyState: 'loading', addEventListener() {} },
}, { filename: 'web/i18n.js' });
const catalog = window.WC_I18N.catalog;
const base = catalog['zh-CN'];
const all = Object.keys(base);
let errors = 0;
const slots = s => [...s.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(x=>x[1]).sort().join(',');
for (const [lang, translations] of Object.entries(catalog)) {
  for (const key of all) {
    if (!Object.hasOwn(translations,key)) { console.error(lang,'missing',key); errors++; continue; }
    if (slots(translations[key])!==slots(base[key])) { console.error(lang,'placeholders',key); errors++; }
  }
  for(const key of Object.keys(translations))if(!Object.hasOwn(base,key)){console.error(lang,'unexpected',key);errors++;}
}
if(errors){console.error(errors,'locale problems');process.exitCode=1;}
else console.log('PASS:',Object.keys(catalog).length,'locales,',all.length,'keys each');
