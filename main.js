// Dashboard JS con soporte de Gráficos y Eliminación SQL
document.addEventListener('DOMContentLoaded', async () => {
  let salesChart = null;

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
      await db.runSQL(`INSERT INTO sales (client, amount, date) VALUES (?, ?, ?)`, ["Cliente Omega", 1500.00, "2026-05-20"]);
      await db.runSQL(`INSERT INTO sales (client, amount, date) VALUES (?, ?, ?)`, ["Corporación Beta", 3250.50, "2026-05-21"]);
      await db.runSQL(`INSERT INTO sales (client, amount, date) VALUES (?, ?, ?)`, ["Sistemas Gamma", 850.00, "2026-05-22"]);
      await db.runSQL(`INSERT INTO sales (client, amount, date) VALUES (?, ?, ?)`, ["Industrias Delta", 4120.00, "2026-05-23"]);
      await db.runSQL(`INSERT INTO sales (client, amount, date) VALUES (?, ?, ?)`, ["Tecnologías Epsilon", 2100.25, "2026-05-24"]);
    }
  } catch(e) {
    console.error("Dashboard SQL setup error", e);
  }

  // Inicializar Gráfico de Chart.js
  const initChart = (labels, data) => {
    const ctx = document.getElementById('salesChart').getContext('2d');
    if (salesChart) {
      salesChart.destroy();
    }
    salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ventas ($)',
          data: data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#a1a1aa', font: { family: 'Outfit' } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#a1a1aa', font: { family: 'Outfit' } }
          }
        }
      }
    });
  };

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

    // Ordenar para la tabla (más recientes primero)
    const sortedForTable = [...list].reverse();

    sortedForTable.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge-id">#${s.id ? s.id.substring(0, 6) : 'N/A'}</span></td>
        <td class="client-name">${s.client}</td>
        <td class="amount-cell">$${Number(s.amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td><span class="date-badge">${s.date}</span></td>
        <td style="text-align: right;">
          <button class="btn-delete" data-id="${s.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Configurar eventos de eliminación
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Estás seguro de eliminar esta transacción?')) {
          try {
            await db.runSQL(`DELETE FROM sales WHERE id = ?`, [id]);
            await renderDashboard();
          } catch (err) {
            alert("Error al eliminar el registro.");
          }
        }
      });
    });

    // Preparar datos para el gráfico (ordenados cronológicamente)
    const sortedForChart = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
    const chartLabels = sortedForChart.map(s => s.date);
    const chartData = sortedForChart.map(s => s.amount);
    initChart(chartLabels, chartData);
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