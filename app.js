let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let currentView = "home";
let chart;

const categories = {
  food: { name: "🍜 Ăn uống" },
  transport: { name: "🚗 Di chuyển" },
  entertainment: { name: "🎮 Giải trí" },
  shopping: { name: "🛍️ Mua sắm" },
  bill: { name: "💡 Hóa đơn" },
  salary: { name: "💼 Lương" },
  overtime: { name: "⏱️ Làm ngoài giờ" }
};

function formatMoney(n){ return n.toLocaleString("vi-VN")+" ₫"; }
function save(){ localStorage.setItem("transactions",JSON.stringify(transactions)); }

// INPUT FIX
const amountInput=document.getElementById("amount");

function getRaw(v){ return v.replace(/\D/g,""); }
function formatInput(v){ return v.replace(/\B(?=(\d{3})+(?!\d))/g,"."); }

amountInput.addEventListener("input",function(){
  let raw=getRaw(this.value);
  if(!raw){ this.value=""; return; }
  if(raw.length<=3){ this.value=raw; return; }

  let pos=this.selectionStart;
  let left=getRaw(this.value.slice(0,pos)).length;

  let f=formatInput(raw);
  this.value=f;

  let count=0,newPos=0;
  for(let i=0;i<f.length;i++){
    if(/\d/.test(f[i])) count++;
    if(count>=left){ newPos=i+1; break; }
  }
  this.setSelectionRange(newPos,newPos);
});

amountInput.addEventListener("keydown",function(e){
  if(e.key==="Backspace"){
    let pos=this.selectionStart;
    if(this.value[pos-1]==="."){
      e.preventDefault();
      this.setSelectionRange(pos-1,pos-1);
    }
  }
});

function setQuickAmount(v){
  amountInput.value=formatInput(v.toString());
}

// RESET
function resetApp(){
  if(!confirm("⚠️ Xoá toàn bộ dữ liệu?")) return;
  let check=prompt("Nhập 'OK' để xác nhận:");
  if(check!=="OK") return alert("❌ Đã huỷ");

  localStorage.removeItem("transactions");
  transactions=[];
  render();

  amountInput.value="";
  document.getElementById("note").value="";
}

function resetMonth(){
  if(!confirm("Reset tháng này?")) return;

  const now=new Date();
  transactions=transactions.filter(t=>
    !(t.month===now.getMonth()+1 && t.year===now.getFullYear())
  );

  save();
  render();
}

// NAV
function showView(v){
  currentView=v;
  ["home","budget","history"].forEach(x=>{
    document.getElementById(x+"Section").style.display=x===v?"block":"none";
  });
  render();
}

// MAIN
function render(){
  renderBalance();
  if(currentView==="home") renderTransactions();
  if(currentView==="budget"){ renderBudget(); renderChart(); }
  if(currentView==="history") renderHistory();
}

// BALANCE
function renderBalance(){
  let total=0;
  transactions.forEach(t=>{
    total+=t.type==="income"?t.amount:-t.amount;
  });
  document.getElementById("balance").innerText=formatMoney(total);
}

// ADD
function addTransaction(type){
  const amount=parseInt(getRaw(amountInput.value))||0;
  if(!amount) return alert("Số tiền không hợp lệ!");

  const now=new Date();

  transactions.unshift({
    id:Date.now(),
    amount,
    note:document.getElementById("note").value,
    category:document.getElementById("category").value,
    type,
    time: now.toLocaleString("vi-VN",{
      day:"2-digit",month:"2-digit",year:"numeric",
      hour:"2-digit",minute:"2-digit"
    }),
    month:now.getMonth()+1,
    year:now.getFullYear()
  });

  save(); render();
  amountInput.value="";
  document.getElementById("note").value="";
}

// HOME
function renderTransactions(){
  const el=document.getElementById("transactions");
  el.innerHTML="";
  transactions.slice(0,5).forEach(t=>{
    el.innerHTML+=`
    <div class="transaction">
      <div>
        <strong>${t.note||"Khoản phí"}</strong><br>
        <small>${categories[t.category]?.name} • ${t.time}</small>
      </div>
      <div class="${t.type==="income"?"income-text":"expense-text"}">
        ${t.type==="income"?"+":"-"}${formatMoney(t.amount)}
      </div>
    </div>`;
  });
}

// HISTORY
function renderHistory(){
  const el=document.getElementById("historyList");
  el.innerHTML="";
  transactions.forEach((t,i)=>{
    el.innerHTML+=`
    <div class="transaction">
      <div>
        <strong>${t.note}</strong><br>
        <small>${categories[t.category]?.name} • ${t.time}</small>
      </div>
      <div class="${t.type==="income"?"income-text":"expense-text"}">
        ${t.type==="income"?"+":"-"}${formatMoney(t.amount)}
        <br><button onclick="deleteTx(${i})">❌</button>
      </div>
    </div>`;
  });
}

// BUDGET
function renderBudget(){
  const el=document.getElementById("budgetBox");
  const now=new Date();

  let income=0,expense=0;
  transactions.forEach(t=>{
    if(t.month===now.getMonth()+1&&t.year===now.getFullYear()){
      t.type==="income"?income+=t.amount:expense+=t.amount;
    }
  });

  el.innerHTML=`
  <p>💰 Thu: ${formatMoney(income)}</p>
  <p>💸 Chi: ${formatMoney(expense)}</p>
  <p>📊 Còn lại: ${formatMoney(income-expense)}</p>`;
}

// CHART
function renderChart(){
  let map={};
  transactions.forEach(t=>{
    if(t.type==="expense"){
      map[t.category]=(map[t.category]||0)+t.amount;
    }
  });

  if(chart) chart.destroy();

  chart=new Chart(document.getElementById("expenseChart"),{
    type:"pie",
    data:{
      labels:Object.keys(map).map(k=>categories[k]?.name),
      datasets:[{data:Object.values(map)}]
    }
  });
}

// DELETE
function deleteTx(i){
  if(confirm("Xoá?")){
    transactions.splice(i,1);
    save();
    render();
  }
}

render();