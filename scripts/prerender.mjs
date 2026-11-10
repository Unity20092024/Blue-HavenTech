import { readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';
// The page renderer is shared with the browser. Prerender at build time so
// readable page content and navigation do not depend on JavaScript or a server.
const source=await readFile('src/render.ts','utf8');
const { outputText }=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
const { renderPage }=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
for (const name of ['index','about','services','how-it-works','contact','privacy','terms']) {
 const file=`dist/${name}.html`;
 const html=await readFile(file,'utf8');
 await writeFile(file,html.replace('<div id="app"></div>',`<div id="app">${renderPage(name==='index'?'/':'/'+name)}</div>`));
}
// Vite emits scripts in <head>; use a clean source shell for the 404 page.
const index=await readFile('dist/index.html','utf8');
const bodyStart=index.indexOf('<div id="app">');
const bodyEnd=index.lastIndexOf('</div>');
await writeFile('dist/404.html',index.slice(0,bodyStart)+`<div id="app">${renderPage('/404')}</div>`+index.slice(bodyEnd+6));
const errorPage=await readFile('dist/404.html','utf8');
await writeFile('dist/404.html',errorPage.replace(/<title>.*?<\/title>/,'<title>Page not found — Haven BlueTech</title>').replace('</head>','<meta name="robots" content="noindex"/></head>'));
console.log('Prerendered 7 pages and the 404 page.');
