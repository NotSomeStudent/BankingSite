// --- Data Persistence via localStorage ---
let transactions = JSON.parse(localStorage.getItem('mtb_trans')) || [
  {date:'2025-05-14', desc:'Salary Deposit (TechCo)', type:'Credit', amount:4250.00},
  {date:'2025-05-13', desc:'Starbucks', type:'Debit', amount:-5.75},
  {date:'2025-05-12', desc:'Spotify Premium', type:'Debit', amount:-9.99},
  {date:'2025-05-10', desc:'Sold 1 TSTR @ $35,000.00', type:'Credit', amount:35000.00},
  {date:'2025-05-09', desc:'Amazon Purchase', type:'Debit', amount:-120.45}
];
let portfolio = JSON.parse(localStorage.getItem('mtb_port')) || [
  {ticker:'TSTR', shares:1, price:35000},
  {ticker:'MAPL', shares:50, price:120},
  {ticker:'TECHF', shares:10, price:450.25}
];
function saveAll(){
  localStorage.setItem('mtb_trans', JSON.stringify(transactions));
  localStorage.setItem('mtb_port', JSON.stringify(portfolio));
}
saveAll();

// --- Utility: generate past dates ---
function getPastDates(days){
  const d=[], now=new Date();
  for(let i=days-1;i>=0;i--){
    const x=new Date(now);
    x.setDate(x.getDate()-i);
    d.push(x.toISOString().slice(0,10));
  }
  return d;
}

// --- Dashboard Chart ---
const dashCtx = document.getElementById('dashboardChart');
if(dashCtx){
  const labels = getPastDates(30);
  const dataPoints = labels.map((_,i)=>20000 + i*(15000/29) + (Math.random()*500-250));
  new Chart(dashCtx,{
    type:'line',
    data:{ labels, datasets:[{ data:dataPoints, fill:true, tension:0.2 }]},
    options:{ scales:{ x:{display:false}, y:{beginAtZero:false} }, plugins:{ legend:{ display:false } } }
  });
}

// --- Portfolio Chart (investments.html) & Table ---
const portCtx = document.getElementById('portfolioChart');
const portBody = document.getElementById('portfolioBody');
if(portBody){
  portfolio.forEach(item=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${item.ticker}</td>
      <td>${item.shares}</td>
      <td>${item.price.toLocaleString('en-CA',{style:'currency',currency:'CAD'})}</td>
      <td>${item.ticker==='TSTR'&&item.shares>0?'<button id="sell-btn">Sell Now</button>':'—'}</td>
    `;
    portBody.appendChild(tr);
  });
}
if(portCtx){
  const labels=portfolio.map(i=>i.ticker),
        data=portfolio.map(i=>i.price*i.shares);
  new Chart(portCtx,{ type:'doughnut', data:{ labels, datasets:[{ data, hoverOffset:4 }]}, options:{ plugins:{ legend:{ position:'bottom' }}}});
}

// --- Transactions Table (transactions.html) ---
const transBody = document.getElementById('transTableBody');
if(transBody){
  transactions.forEach(tx=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${tx.date}</td>
      <td>${tx.desc}</td>
      <td>${tx.type}</td>
      <td>${tx.amount<0? '–'+Math.abs(tx.amount).toLocaleString('en-CA',{style:'currency',currency:'CAD'}):tx.amount.toLocaleString('en-CA',{style:'currency',currency:'CAD'})}</td>
    `;
    transBody.appendChild(tr);
  });
}

// --- Sell TSTR Logic ---
document.addEventListener('click', e=>{
  if(e.target && e.target.id==='sell-btn'){
    const today=new Date().toISOString().slice(0,10);
    const saleAmt = portfolio.find(p=>p.ticker==='TSTR').price;
    // update portfolio & transactions
    portfolio = portfolio.map(p=>p.ticker==='TSTR'?{...p,shares:0}:p);
    transactions.unshift({ date: today, desc:`Sold 1 TSTR @ ${saleAmt.toLocaleString('en-CA',{style:'currency',currency:'CAD'})}`, type:'Credit', amount:saleAmt });
    saveAll();
    alert(`You sold 1 share of TSTR at ${saleAmt.toLocaleString('en-CA',{style:'currency',currency:'CAD'})}`);
    location.reload();
  }
});

// --- Transfer Funds Modal & Logic ---
const modal = document.getElementById('transferModal'),
      btn   = document.getElementById('transferBtn'),
      span  = modal?.querySelector('.close'),
      form  = document.getElementById('transferForm');
if(btn){
  btn.onclick = ()=> modal.style.display='block';
  span.onclick = ()=> modal.style.display='none';
  window.onclick = e=>{ if(e.target===modal) modal.style.display='none'; };
  form.onsubmit = e=>{
    e.preventDefault();
    const toAcc = form.toAccount.value;
    const amt   = parseFloat(form.transferAmount.value);
    const today = new Date().toISOString().slice(0,10);
    // deduct from checking
    const chkElem = document.getElementById('checkingBalance');
    let chkVal = parseFloat(chkElem.innerText.replace(/[$,]/g,'')) - amt;
    chkElem.innerText = chkVal.toLocaleString('en-CA',{style:'currency',currency:'CAD'});
    // record transaction
    transactions.unshift({ date:today, desc:`Transfer to ${toAcc}`, type:'Debit', amount:-amt });
    saveAll();
    alert(`Successfully transferred ${amt.toLocaleString('en-CA',{style:'currency',currency:'CAD'})} to account ${toAcc}.`);
    modal.style.display='none';
  };
}

// --- Download PDF Statement ---
const pdfBtn = document.getElementById('downloadStatementBtn');
if(pdfBtn){
  pdfBtn.onclick = ()=> {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('MapleTrust Bank Statement', 14, 20);
    doc.setFontSize(12);
    doc.text(`Account: 123456789012`, 14, 30);
    doc.text(`Date: ${new Date().toISOString().slice(0,10)}`, 14, 37);
    const rows = transactions.slice(0,10).map(tx=>[
      tx.date, tx.desc, tx.type,
      tx.amount.toLocaleString('en-CA',{style:'currency',currency:'CAD'})
    ]);
    doc.autoTable({
      head: [['Date','Description','Type','Amount']],
      body: rows,
      startY: 45,
      styles: { fontSize: 10 }
    });
    doc.save('statement.pdf');
  };
}

