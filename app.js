
'use strict';
const EXPENSE=['Housing','Groceries','Utilities','Transport','Health','Insurance','Entertainment','Shopping','Eating Out','Other'];
const INCOME=['Salary','Pension','Benefits','Side Income','Other'];
const KEY='elevor360d-budget-v1'; // Preserve V1 data automatically
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random();
const blank=()=>({transactions:[],budgets:{},bills:[],goals:[],debts:[]});
let data=blank();
try{const stored=JSON.parse(localStorage.getItem(KEY));if(valid(stored))data={...stored,debts:Array.isArray(stored.debts)?stored.debts:[]}}catch(e){alert('Saved data could not be read. Restore a backup if available.')}
function valid(d){return d&&typeof d==='object'&&Array.isArray(d.transactions)&&Array.isArray(d.bills)&&Array.isArray(d.goals)&&d.budgets&&typeof d.budgets==='object'&&!Array.isArray(d.budgets)&&d.transactions.every(t=>t&&typeof t.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.date)&&['income','expense'].includes(t.type)&&Number.isFinite(Number(t.amount))&&Number(t.amount)>0&&typeof t.category==='string')&&d.bills.every(b=>b&&typeof b.id==='string'&&typeof b.name==='string'&&Number(b.amount)>0&&Number.isInteger(Number(b.day))&&Number(b.day)>=1&&Number(b.day)<=31)&&d.goals.every(g=>g&&typeof g.id==='string'&&typeof g.name==='string'&&Number(g.target)>0&&Number(g.saved)>=0)&&(d.debts===undefined||(Array.isArray(d.debts)&&d.debts.every(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&Number(x.original)>0&&Number(x.remaining)>=0&&Number(x.payment)>=0)))}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){alert('Could not save. Browser storage may be full or unavailable.');return false}render();return true}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function options(){const type=$('txType').value;const old=$('txCategory').value;$('txCategory').innerHTML=(type==='income'?INCOME:EXPENSE).map(c=>`<option>${safe(c)}</option>`).join('');if([...$('txCategory').options].some(o=>o.value===old))$('txCategory').value=old}
function show(page){$('tabs').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');$('currentSection').textContent=tabs.find(x=>x[0]===page)?.[1]||'Overview';document.querySelectorAll('.page').forEach(e=>e.classList.toggle('hidden',e.id!==page));document.querySelectorAll('#tabs button').forEach(e=>e.classList.toggle('active',e.dataset.page===page));render();window.scrollTo(0,0)}
const tabs=[['dashboard','Overview'],['transactions','Transactions'],['budgets','Budgets'],['bills','Bills'],['goals','Savings Goals'],['debts','Debts'],['settings','Backup & Install']];
$('tabs').innerHTML=tabs.map(([id,label])=>`<button data-page="${id}">${label}</button>`).join('');
$('menuToggle').addEventListener('click',()=>{const open=$('tabs').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open))});
$('tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(b)show(b.dataset.page)});
$('month').value=today().slice(0,7);$('reportYear').value=Number(today().slice(0,4));$('txDate').value=today();$('txType').addEventListener('change',options);options();
function currentTx(){return data.transactions.filter(t=>t.date.slice(0,7)===$('month').value)}
function render(){
const tx=currentTx(),inc=tx.filter(t=>t.type==='income').reduce((a,t)=>a+Number(t.amount),0),out=tx.filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount),0);
$('metrics').innerHTML=[['Income',inc,'positive'],['Expenses',out,'negative'],['Remaining',inc-out,inc-out>=0?'positive':'negative'],['Transactions',tx.length,'']].map(([label,val,cls])=>`<div class="metric">${label}<strong class="${cls}">${label==='Transactions'?val:money(val)}</strong></div>`).join('');
const prevDate=new Date(Number($('month').value.slice(0,4)),Number($('month').value.slice(5,7))-2,1);
const prevKey=prevDate.getFullYear()+'-'+String(prevDate.getMonth()+1).padStart(2,'0');
const prevExpenses=data.transactions.filter(t=>t.type==='expense'&&t.date.slice(0,7)===prevKey).reduce((n,t)=>n+Number(t.amount),0);
const delta=out-prevExpenses;
const maxCategory=EXPENSE.map(c=>({category:c,total:tx.filter(t=>t.type==='expense'&&t.category===c).reduce((n,t)=>n+Number(t.amount),0)})).sort((a,b)=>b.total-a.total)[0];
$('insights').innerHTML=`<div class="grid"><div class="metric">Compared with previous month<strong class="${delta>0?'negative':'positive'}">${delta>0?'+':''}${money(delta)}</strong><span class="muted">${prevExpenses===0?'Previous month has no recorded expenses.':delta>0?'More spent than last month':delta<0?'Less spent than last month':'Same spending as last month'}</span></div><div class="metric">Largest expense category<strong>${maxCategory&&maxCategory.total? safe(maxCategory.category):'None yet'}</strong><span class="muted">${money(maxCategory?.total||0)}</span></div></div>`;
const reportYear=Number($('reportYear').value)||new Date().getFullYear();
const annual=Array.from({length:12},(_,i)=>{const k=reportYear+'-'+String(i+1).padStart(2,'0');const rows=data.transactions.filter(t=>t.date.slice(0,7)===k);return {month:new Date(reportYear,i,1).toLocaleDateString('en-GB',{month:'long'}),income:rows.filter(t=>t.type==='income').reduce((n,t)=>n+Number(t.amount),0),expenses:rows.filter(t=>t.type==='expense').reduce((n,t)=>n+Number(t.amount),0)}});
const totals=annual.reduce((a,r)=>({income:a.income+r.income,expenses:a.expenses+r.expenses}),{income:0,expenses:0});
$('annualReport').innerHTML=`<table><thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Remaining</th></tr></thead><tbody>${annual.map(r=>`<tr><td>${r.month}</td><td>${money(r.income)}</td><td>${money(r.expenses)}</td><td>${money(r.income-r.expenses)}</td></tr>`).join('')}<tr><th>Total</th><th>${money(totals.income)}</th><th>${money(totals.expenses)}</th><th>${money(totals.income-totals.expenses)}</th></tr></tbody></table>`;
const limits=EXPENSE.reduce((a,c)=>a+Number(data.budgets[c]||0),0);
const tracked=EXPENSE.filter(c=>Number(data.budgets[c]||0)>0);
const trackedSpent=tx.filter(t=>t.type==='expense'&&tracked.includes(t.category)).reduce((a,t)=>a+Number(t.amount),0);
$('budgetHealth').innerHTML=tracked.length?`<div class="grid"><div class="metric">Budgeted categories<strong>${tracked.length}</strong></div><div class="metric">Total allocated<strong>${money(limits)}</strong></div><div class="metric">Spent in budgeted categories<strong>${money(trackedSpent)}</strong></div><div class="metric">Remaining budget<strong class="${limits-trackedSpent<0?'negative':'positive'}">${money(limits-trackedSpent)}</strong></div></div><p class="muted">Only categories with a budget above £0 are counted. Unbudgeted spending is excluded from this comparison.</p>`:'<p class="muted">No category budgets set yet. Open Budgets to add monthly spending limits.</p>';
$('categorySummary').innerHTML=EXPENSE.map(c=>{const sum=tx.filter(t=>t.type==='expense'&&t.category===c).reduce((a,t)=>a+Number(t.amount),0);return sum?`<p>${safe(c)} <strong style="float:right">${money(sum)}</strong></p><div class="bar"><span style="width:${out?sum/out*100:0}%"></span></div>`:''}).join('')||'<p class="muted">No expenses recorded for this month.</p>';
const chosen=$('month').value;
const [yy,mm]=chosen.split('-').map(Number);
const trends=Array.from({length:6},(_,i)=>{const dt=new Date(yy,mm-6+i,1);const key=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');const a=data.transactions.filter(t=>t.date.slice(0,7)===key);return {label:dt.toLocaleDateString('en-GB',{month:'short',year:'2-digit'}),income:a.filter(t=>t.type==='income').reduce((n,t)=>n+Number(t.amount),0),expense:a.filter(t=>t.type==='expense').reduce((n,t)=>n+Number(t.amount),0)}}); 
const high=Math.max(1,...trends.flatMap(t=>[t.income,t.expense]));
$('trendChart').innerHTML='<div class="muted">Income (teal) • Expenses (orange)</div>'+trends.map(t=>`<div style="display:grid;grid-template-columns:58px 1fr;gap:9px;align-items:center;margin:10px 0"><span class="muted">${t.label}</span><div><div title="Income ${money(t.income)}" style="background:#148b91;width:${t.income/high*100}%;min-height:10px;border-radius:4px"></div><div title="Expenses ${money(t.expense)}" style="background:#dc9444;width:${t.expense/high*100}%;min-height:10px;border-radius:4px;margin-top:3px"></div><small>${money(t.income)} / ${money(t.expense)}</small></div></div>`).join('');
$('upcoming').innerHTML=data.bills.length?data.bills.slice().sort((a,b)=>a.day-b.day).map(b=>`<p>${safe(b.name)} — day ${b.day} <strong>${money(b.amount)}</strong></p>`).join(''):'<p class="muted">No recurring bills saved.</p>';
const search=$('txSearch').value.toLowerCase(),filter=$('txFilter').value,monthFilter=$('txMonthFilter').value;
const filtered=data.transactions.filter(t=>(filter==='all'||t.type===filter)&&(monthFilter==='all'||t.date.slice(0,7)===$('month').value)&&((t.note||'').toLowerCase().includes(search)||t.category.toLowerCase().includes(search))).sort((a,b)=>b.date.localeCompare(a.date));
$('txList').innerHTML=filtered.length?`<table><thead><tr><th>Date</th><th>Details</th><th>Amount</th><th>Actions</th></tr></thead><tbody>${filtered.map(t=>`<tr><td>${safe(t.date)}</td><td>${safe(t.category)}<br><span class="muted">${safe(t.note||'')}</span></td><td class="${t.type==='income'?'positive':'negative'}">${t.type==='income'?'+':'−'}${money(t.amount)}</td><td><button data-edit-tx="${safe(t.id)}">Edit</button> <button class="danger" data-delete-tx="${safe(t.id)}">Delete</button></td></tr>`).join('')}</tbody></table>`:'<p class="muted">No matching transactions.</p>';
$('budgetFields').innerHTML=EXPENSE.map(c=>`<div class="row"><label style="flex:2">${safe(c)}</label><input aria-label="Budget for ${safe(c)}" data-budget="${safe(c)}" type="number" min="0" step=".01" value="${Number(data.budgets[c]||0)}"></div>`).join('');
$('budgetProgress').innerHTML=EXPENSE.map(c=>{const spent=tx.filter(t=>t.type==='expense'&&t.category===c).reduce((a,t)=>a+Number(t.amount),0),limit=Number(data.budgets[c]||0);return limit?`<p>${safe(c)}: ${money(spent)} of ${money(limit)} ${spent>limit?'<strong class="negative">Over budget</strong>':''}</p><div class="bar"><span style="width:${Math.min(100,spent/limit*100)}%;background:${spent>limit?'#b03c45':'#1b8793'}"></span></div>`:''}).join('')||'<p class="muted">Set a budget above to see progress.</p>';
$('billList').innerHTML=data.bills.length?data.bills.map(b=>`<p><strong>${safe(b.name)}</strong> — ${money(b.amount)} • day ${b.day}<br><button data-edit-bill="${safe(b.id)}">Edit</button> <button class="danger" data-delete-bill="${safe(b.id)}">Delete</button></p>`).join(''):'<p class="muted">No bills yet.</p>';
const debtTotal=data.debts.reduce((n,d)=>n+Number(d.remaining),0);
$('debtSummary').innerHTML=`<div class="metric">Total remaining debt<strong>${money(debtTotal)}</strong></div>`;
$('debtList').innerHTML=data.debts.length?data.debts.map(d=>{const progress=Math.max(0,Math.min(100,(1-d.remaining/d.original)*100));return `<p><strong>${safe(d.name)}</strong> — ${money(d.remaining)} remaining of ${money(d.original)}<br><span class="muted">Planned monthly payment: ${money(d.payment)}</span></p><div class="bar"><span style="width:${progress}%"></span></div><p><button data-edit-debt="${safe(d.id)}">Edit</button> <button class="danger" data-delete-debt="${safe(d.id)}">Delete</button></p>`}).join(''):'<p class="muted">No debts recorded.</p>';
$('goalList').innerHTML=data.goals.length?data.goals.map(g=>`<p><strong>${safe(g.name)}</strong> — ${money(g.saved)} / ${money(g.target)} (${Math.round(g.saved/g.target*100)}%)</p><div class="bar"><span style="width:${Math.min(100,g.saved/g.target*100)}%"></span></div><p><button data-edit-goal="${safe(g.id)}">Edit</button> <button class="danger" data-delete-goal="${safe(g.id)}">Delete</button></p>`).join(''):'<p class="muted">No savings goals yet.</p>';
}
function changeMonth(n){const [y,m]=$('month').value.split('-').map(Number);const d=new Date(y,m-1+n,1);$('month').value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');render()}
$('prevMonth').onclick=()=>changeMonth(-1);$('nextMonth').onclick=()=>changeMonth(1);
$('month').addEventListener('change',render);
$('quickExpense').onclick=()=>{clearTx();$('txType').value='expense';options();$('txDate').value=($('month').value===today().slice(0,7)?today():$('month').value+'-01');show('transactions');$('txAmount').focus()};
$('quickIncome').onclick=()=>{clearTx();$('txType').value='income';options();$('txDate').value=($('month').value===today().slice(0,7)?today():$('month').value+'-01');show('transactions');$('txAmount').focus()};$('reportYear').addEventListener('change',render);
$('printReport').onclick=()=>{
const year=Number($('reportYear').value);
if(!Number.isInteger(year)||year<2000||year>2100)return alert('Select a valid year.');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Budget Report ${year}</title><style>body{font-family:Arial,sans-serif;margin:30px;color:#173447}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ccc;padding:9px;text-align:left}h1{font-size:22px}</style></head><body><h1>Elevor360D Annual Budget Report — ${year}</h1>${$('annualReport').innerHTML}<p>Figures are based on transactions recorded in the app. This report is not a bank statement.</p></body></html>`;
const w=window.open('','_blank');if(!w){alert('Please allow pop-ups to print your report.');return;}w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),350);
};$('txSearch').addEventListener('input',render);$('txFilter').addEventListener('change',render);$('txMonthFilter').addEventListener('change',render);
function clearTx(){$('transactionForm').reset();$('txId').value='';$('txDate').value=today();options();$('transactionHeading').textContent='Add transaction'}
$('clearTx').onclick=clearTx;
$('transactionForm').onsubmit=e=>{e.preventDefault();const id=$('txId').value||uid(),t={id,date:$('txDate').value,type:$('txType').value,amount:Number($('txAmount').value),category:$('txCategory').value,note:$('txNote').value.trim()};if(!t.date||!(t.amount>0))return alert('Enter a valid date and amount.');data.transactions=data.transactions.filter(x=>x.id!==id);data.transactions.push(t);if(save())clearTx()};
$('txList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.editTx||b.dataset.deleteTx,t=data.transactions.find(x=>x.id===id);if(!t)return;if(b.dataset.deleteTx){if(confirm('Delete this transaction?')){data.transactions=data.transactions.filter(x=>x.id!==id);save()}}else{$('txId').value=t.id;$('txDate').value=t.date;$('txType').value=t.type;options();$('txCategory').value=t.category;$('txAmount').value=t.amount;$('txNote').value=t.note||'';$('transactionHeading').textContent='Edit transaction';window.scrollTo(0,0)}};
$('saveBudgets').onclick=()=>{document.querySelectorAll('[data-budget]').forEach(el=>data.budgets[el.dataset.budget]=Math.max(0,Number(el.value)||0));save();alert('Budgets saved.')};
function clearBill(){$('billForm').reset();$('billId').value=''}$('clearBill').onclick=clearBill;
$('billForm').onsubmit=e=>{e.preventDefault();const b={id:$('billId').value||uid(),name:$('billName').value.trim(),amount:Number($('billAmount').value),day:Number($('billDay').value)};if(!b.name||!(b.amount>0)||!Number.isInteger(b.day)||b.day<1||b.day>31)return alert('Check the bill details.');data.bills=data.bills.filter(x=>x.id!==b.id);data.bills.push(b);if(save())clearBill()};
$('billList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.editBill||b.dataset.deleteBill,x=data.bills.find(v=>v.id===id);if(!x)return;if(b.dataset.deleteBill){if(confirm('Delete this bill reminder?')){data.bills=data.bills.filter(v=>v.id!==id);save()}}else{$('billId').value=x.id;$('billName').value=x.name;$('billAmount').value=x.amount;$('billDay').value=x.day;window.scrollTo(0,0)}};
function clearGoal(){$('goalForm').reset();$('goalId').value=''}$('clearGoal').onclick=clearGoal;
$('goalForm').onsubmit=e=>{e.preventDefault();const g={id:$('goalId').value||uid(),name:$('goalName').value.trim(),target:Number($('goalTarget').value),saved:Number($('goalSaved').value)};if(!g.name||!(g.target>0)||!Number.isFinite(g.saved)||g.saved<0)return alert('Check the goal details.');data.goals=data.goals.filter(x=>x.id!==g.id);data.goals.push(g);if(save())clearGoal()};
$('goalList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.editGoal||b.dataset.deleteGoal,g=data.goals.find(v=>v.id===id);if(!g)return;if(b.dataset.deleteGoal){if(confirm('Delete this savings goal?')){data.goals=data.goals.filter(v=>v.id!==id);save()}}else{$('goalId').value=g.id;$('goalName').value=g.name;$('goalTarget').value=g.target;$('goalSaved').value=g.saved;window.scrollTo(0,0)}};
function clearDebt(){$('debtForm').reset();$('debtId').value=''}
$('clearDebt').onclick=clearDebt;
$('debtForm').onsubmit=e=>{e.preventDefault();const d={id:$('debtId').value||uid(),name:$('debtName').value.trim(),original:Number($('debtOriginal').value),remaining:Number($('debtRemaining').value),payment:Number($('debtPayment').value)};if(!d.name||!(d.original>0)||!Number.isFinite(d.remaining)||d.remaining<0||!Number.isFinite(d.payment)||d.payment<0)return alert('Check the debt details.');data.debts=data.debts.filter(x=>x.id!==d.id);data.debts.push(d);if(save())clearDebt()};
$('debtList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.editDebt||b.dataset.deleteDebt,d=data.debts.find(x=>x.id===id);if(!d)return;if(b.dataset.deleteDebt){if(confirm('Delete this debt?')){data.debts=data.debts.filter(x=>x.id!==id);save()}}else{$('debtId').value=d.id;$('debtName').value=d.name;$('debtOriginal').value=d.original;$('debtRemaining').value=d.remaining;$('debtPayment').value=d.payment;window.scrollTo(0,0)}};
function backupObject(){return {app:'Elevor360D Personal Budget Manager',version:7,...data}}
function backupNow(prefix='elevor360d-budget-backup'){download(prefix+'-'+today()+'.json',JSON.stringify(backupObject(),null,2),'application/json')}
function dataCounts(d){return `${d.transactions.length} transactions, ${d.bills.length} bills, ${d.goals.length} savings goals and ${(d.debts||[]).length} debts`}
function download(filename,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('exportJson').onclick=()=>{backupNow();$('dataStatus').textContent='Backup requested: '+dataCounts(data)+'. Check your Downloads folder.'};
$('exportCsv').onclick=()=>{const rows=[['Date','Type','Category','Description','Amount GBP'],...data.transactions.map(t=>[t.date,t.type,t.category,t.note||'',t.amount])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');download('budget-transactions-'+today()+'.csv','\uFEFF'+csv,'text/csv;charset=utf-8')};
$('restoreFile').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  if(file.size>5e6)throw Error('File too large (maximum 5 MB)');
  const d=JSON.parse(await file.text());if(!valid(d))throw Error('Invalid or incompatible backup');
  const message=`Backup: ${file.name}\nContains: ${dataCounts(d)}.\n\nCurrent device: ${dataCounts(data)}.\n\nRestore will REPLACE all current records. Continue?`;
  if(!confirm(message))return;
  if(confirm('Download a safety backup of your CURRENT records before replacing them?')){backupNow('elevor360d-before-restore');alert('Safety backup requested. Please check your Downloads folder before continuing.');}
  if(!confirm('Final confirmation: replace current records with the selected backup?'))return;
  const previous=data;
  data={transactions:d.transactions,budgets:d.budgets,bills:d.bills,goals:d.goals,debts:d.debts||[]};
  if(!save()){data=previous;render();throw Error('Device storage could not be updated; existing records have been retained')}
  clearTx();clearBill();clearGoal();clearDebt();
  $('dataStatus').textContent='Restored '+dataCounts(data)+'.';alert('Backup restored successfully.');
 }catch(err){alert('Restore failed: '+err.message)}finally{e.target.value=''}
};
$('wipe').onclick=()=>{if(confirm('Permanently delete ALL saved budget data on this device?')&&confirm('Are you absolutely sure? This cannot be undone without a backup.')){data=blank();save();clearTx();clearBill();clearGoal();clearDebt();alert('Data deleted.')}};
let deferredPrompt=null;
const installPanel=$('installPanel'),installButton=$('installBtn'),installHelp=$('installHelp');
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function showInstallHelp(message){installHelp.textContent=message;installHelp.classList.remove('hidden')}
function refreshInstall(){
 const installed=isStandalone();
 installPanel.classList.toggle('hidden',installed);
 if(installed){deferredPrompt=null;installHelp.classList.add('hidden')}
}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();
 deferredPrompt=event;
 installHelp.classList.add('hidden');
 refreshInstall();
});
installButton.addEventListener('click',async()=>{
 if(isStandalone()){refreshInstall();return}
 if(deferredPrompt){
  const event=deferredPrompt;
  deferredPrompt=null;
  try{
   await event.prompt();
   const choice=await event.userChoice;
   if(choice&&choice.outcome==='accepted')showInstallHelp('Installation accepted. When it finishes, open the app from your home screen or apps list.');
   else showInstallHelp('Installation was cancelled. To retry, use the browser menu and choose Install app.');
  }catch(err){showInstallHelp('The install prompt is unavailable. Open the Chrome or Edge browser menu and choose Install app or Add to Home screen.')}
  return;
 }
 if(location.protocol==='file:'){showInstallHelp('To install, upload the app files to GitHub Pages and open its HTTPS address in Chrome or Edge. Opening index.html directly from a ZIP or folder cannot install the app.');return}
 if(!window.isSecureContext){showInstallHelp('Installation requires an HTTPS website. Open the secure GitHub Pages link.');return}
 if(/iPad|iPhone|iPod/.test(navigator.userAgent)){showInstallHelp('On iPhone or iPad: open this page in Safari, tap Share, then Add to Home Screen.');return}
 if(/Android/i.test(navigator.userAgent)){showInstallHelp('In Chrome on Android: tap the three-dot menu (⋮), then Install app or Add to Home screen. If already installed, open the app from your home screen.');return}
 showInstallHelp('In Chrome or Edge: use the install icon in the address bar, or open the three-dot menu and select Install app. If already installed, launch it from your apps list.');
});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;installPanel.classList.add('hidden')});
const displayMode=window.matchMedia('(display-mode: standalone)');
if(displayMode.addEventListener)displayMode.addEventListener('change',refreshInstall);
window.addEventListener('pageshow',refreshInstall);
refreshInstall();
if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
show('dashboard');
