const assert=require('node:assert/strict'),C=require('../chart-controls.js');
const rows=[{name:'Model 10',date:'2026-02-01'},{name:'Model 2',date:'2026-01-01'},{name:'Alpha',date:'2026-01-01'},{name:'Unavailable',date:null}];
assert.deepEqual(C.sortRows(rows,'date-asc').map(r=>r.name),['Alpha','Model 2','Model 10','Unavailable']);
assert.deepEqual(C.sortRows(rows,'date-desc').map(r=>r.name),['Model 10','Alpha','Model 2','Unavailable']);
assert.deepEqual(C.sortRows(rows,'name-asc').map(r=>r.name),['Alpha','Model 2','Model 10','Unavailable']);
assert.deepEqual(C.sortRows(rows,'name-desc').map(r=>r.name),['Unavailable','Model 10','Model 2','Alpha']);
assert.equal(rows[0].name,'Model 10');
console.log('Chart control tests passed: date/name sorting, both directions, stable ties, unavailable dates last, and immutable input.');
