// ================= AUTH =================
let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("user") || null;

// ================= DATA =================
let transactions = [];
let currentView = "home";
let chart;

const categories = {
  food: "🍜 Ăn uống",
  transport: "🚗 Di chuyển",
  entertainment: "🎮 Giải trí",
  shopping: "🛍️ Mua sắm",
  bill: "💡 Hóa đơn",
  salary: "💼 Lương",
  overtime: "⏱️ Làm thêm"
};

// ================= INIT =================
if(currentUser){
  loadData();
  document.getElementById("authBox").style.display="none";
  document.getElementById("appSection").style.display="block";
}

// ================= PASSWORD =================
function togglePassword(id){
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

// ================= AUTH =================
function register(){
  let u = regUser.value.trim();
  let p = regPass.value;
  let p2 = regPass2.value;

  if(!u || !p) return alert("Nhập thiếu!");
  if(p !== p2) return alert("Mật khẩu không khớp!");
  if(users[u]) return alert("User đã tồn tại!");

  users[u] = p;
  localStorage.setItem("users", JSON.stringify(users));
  alert("Đăng ký thành công!");
}

function login(){
  let u = loginUser.value.trim();
  let p = loginPass.value;

  if(users[u] === p){
    localStorage.setItem("user", u);
    location.reload();
  } else {
    alert("Sai tài khoản!");
  }
}

function logout(){
  localStorage.removeItem("user");
  location.reload();
}

function showRegister(){
  loginForm.style.display="none";
  registerForm.style.display="block";
}

function showLogin(){
  loginForm.style.display="block";
  registerForm.style.display="none";
}

// ================= STORAGE =================
function loadData(){
  transactions = JSON.parse(localStorage.getItem("data_"+currentUser)) || [];
}

function save(){
  localStorage.setItem("data_"+currentUser, JSON.stringify(transactions));
}

// ================= FORMAT =================
function formatMoney(n){
  return n.toLocaleString("vi-VN") + " ₫";
}

// ================= INPUT =================
const amountInput = document.getElementById("amount");

amountInput?.addEventListener("input", function(){
  this.value = this.value.replace(/[^0-9]/g, "");
});

function setQuickAmount(v){
  amountInput.value = v;
}

// ================= FILTER =================
function getFiltered(){
  const date = document.getElementById("filterDate")?.value;
  const inc = document.getElementById("filterIncome")?.checked;
  const exp = document.getElementById("filterExpense")?.checked;

  return transactions.filter(t=>{
    if(date && t.date !== date) return false;
    if(inc && !exp && t.type !== "income") return false;
    if(!inc && exp && t.type !== "expense") return false;
    return true;
  });
}

// ================= ADD =================
function addTransaction(type){
  const amount = parseInt(amountInput.value) || 0;
  if(!amount) return alert("Số tiền không hợp lệ!");

  const now = new Date();

  transactions.unshift({
    id: Date.now(),
    amount,
    note: document.getElementById("note").value,
    category: document.getElementById("category").value,
    type,
    time: now.toLocaleString("vi-VN"),
    date: document.getElementById("date")?.value || now.toISOString().slice(0,10),
    month: now.getMonth()+1,
    year: now.getFullYear()
  });

  save();
  render();

  amountInput.value="";
  document.getElementById("note").value="";
}

// ================= RESET =================
function resetApp(){
  if(!confirm("Xoá toàn bộ dữ liệu?")) return;

  localStorage.removeItem("data_"+currentUser);
  transactions=[];
  render();
}

function resetMonth(){
  const now = new Date();

  transactions = transactions.filter(t =>
    !(t.month === now.getMonth()+1 && t.year === now.getFullYear())
  );

  save();
  render();
}

// ================= NAV =================
function showView(v){
  currentView = v;

  ["home","budget","history","profile"].forEach(x=>{
    const el = document.getElementById(x+"Section");
    if(el) el.style.display = x===v?"block":"none";
  });

  render();
}

// ================= MAIN =================
function render(){
  renderBalance();

  if(currentView==="home") renderTransactions();
  if(currentView==="budget"){
    renderBudget();
    renderChart();
  }
  if(currentView==="history") renderHistory();
  if(currentView==="profile") renderProfile();
}

// ================= BALANCE =================
function renderBalance(){
  let total = 0;
  getFiltered().forEach(t=>{
    total += t.type==="income" ? t.amount : -t.amount;
  });

  document.getElementById("balance").innerText = formatMoney(total);
}

// ================= HOME =================
function renderTransactions(){
  const el = document.getElementById("transactions");
  el.innerHTML="";

  getFiltered().slice(0,5).forEach(t=>{
    el.innerHTML += `
    <div class="transaction">
      <div>
        <strong>${t.note || "Khoản phí"}</strong><br>
        <small>${categories[t.category]} • ${t.time}</small>
      </div>
      <div class="${t.type==="income"?"income-text":"expense-text"}">
        ${t.type==="income"?"+":"-"}${formatMoney(t.amount)}
      </div>
    </div>`;
  });
}

// ================= HISTORY =================
function renderHistory(){
  const el = document.getElementById("historyList");
  el.innerHTML="";

  getFiltered().forEach((t,i)=>{
    el.innerHTML += `
    <div class="transaction">
      <div>
        <strong>${t.note}</strong><br>
        <small>${categories[t.category]} • ${t.time}</small>
      </div>
      <div class="${t.type==="income"?"income-text":"expense-text"}">
        ${formatMoney(t.amount)}
        <br><button onclick="deleteTx(${i})">❌</button>
      </div>
    </div>`;
  });
}

// ================= BUDGET =================
function renderBudget(){
  let income=0,expense=0;

  getFiltered().forEach(t=>{
    t.type==="income" ? income+=t.amount : expense+=t.amount;
  });

  document.getElementById("budgetBox").innerHTML = `
    <p>💰 Thu: ${formatMoney(income)}</p>
    <p>💸 Chi: ${formatMoney(expense)}</p>
    <p>📊 Còn lại: ${formatMoney(income-expense)}</p>
  `;
}

// ================= CHART =================
function renderChart(){
  let map={};

  getFiltered().forEach(t=>{
    if(t.type==="expense"){
      map[t.category]=(map[t.category]||0)+t.amount;
    }
  });

  if(chart) chart.destroy();

  chart = new Chart(document.getElementById("expenseChart"),{
    type:"pie",
    data:{
      labels:Object.keys(map).map(k=>categories[k]),
      datasets:[{data:Object.values(map)}]
    }
  });
}

// ================= DELETE =================
function deleteTx(i){
  transactions.splice(i,1);
  save();
  render();
}

// ================= PROFILE =================
function renderProfile(){
  const box = document.getElementById("profileBox");

  if(!currentUser) return;

  box.innerHTML = `
    <h3>👤 Trang cá nhân</h3>
    <p><strong>Tài khoản:</strong> ${currentUser}</p>
    <p><strong>Email:</strong> ${currentUser}@gmail.com</p>
    <button onclick="logout()" class="logout-btn">🚪 Đăng xuất</button>
  `;
}

// ================= START =================
render();