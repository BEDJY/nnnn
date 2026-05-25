// Dashboard JS
document.addEventListener('DOMContentLoaded', async () => {
  // DB initialize
  try {
    await db.runSQL(`CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      client TEXT,
      amount REAL,
      date TEXT
    )`);

    const sales = await db.runSQL(`SELECT * FROM sales`);
    if (sales.length === 0) {
      await db.runSQL(`INSERT INTO sales (client, amount, date) VALUES (?, ?, ?)`, ["Cliente Omega", 1500.00, "2026-05-24"]);
      await db.runSQL(`INSERT INTO sales (client, amount, date) VALUES (?, ?, ?)`, ["Corporación Beta", 3250.50, "2026-05-24"]);
    }
  } catch(e) {
    console.error("Dashboard SQL setup error", e);
  }

  // Calculate & render dashboard data
  const renderDashboard = async () => {
    const list = await db.runSQL(`SELECT * FROM sales`);
    
    // UI statistics calculations
    let total = 0;
    list.forEach(sale => total += Number(sale.amount));
    const count = list.length;
    const avg = count > 0 ? (total / count) : 0;

    document.getElementById('total-sales').innerText = `$${total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
    document.getElementById('total-transactions').innerText = count;
    document.getElementById('avg-sale').innerText = `$${avg.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;

    // Render Table Rows
    const tbody = document.getElementById('sales-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    list.reverse().forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.id || 'N/A'}</td>
        <td>${s.client}</td>
        <td>$${Number(s.amount).toFixed(2)}</td>
        <td>${s.date}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  await renderDashboard();

  // Form handle
  const form = document.getElementById('sales-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const client = document.getElementById('client').value;
      const amount = parseFloat(document.getElementById('amount').value);
      const date = new Date().toISOString().split('T')[0];

      try {
        await db.runSQL(`INSERT INTO sales (client, amount, date) VALUES (?, ?, ?)`, [client, amount, date]);
        document.getElementById('client').value = '';
        document.getElementById('amount').value = '';
        await renderDashboard();
      } catch(err) {
        alert("Fallo al guardar la transacción.");
      }
    });
  }
});