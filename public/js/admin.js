/*
 * admin.js
 * Fetches orders from the backend and displays them in a table.
 * Allows updating order status through a select dropdown.
 */

// Load orders from API and render
async function loadOrders() {
  try {
    const res = await fetch('/api/orders');
    const orders = await res.json();
    renderOrders(orders);
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

// Render orders in the table body
function renderOrders(orders) {
  const tbody = document.getElementById('ordersBody');
  tbody.innerHTML = '';
  orders
    .sort((a, b) => b.id - a.id) // newest first
    .forEach(order => {
      const tr = document.createElement('tr');
      const date = new Date(order.id).toLocaleString('en-GB');
      tr.innerHTML = `
        <td>${order.id}</td>
        <td>${date}</td>
        <td>${order.productName || ''}</td>
        <td>${order.quantity || 1}</td>
        <td>${order.size || ''}</td>
        <td>${order.name || ''}</td>
        <td>${order.phone || ''}</td>
        <td>${order.deliveryArea === 'inside' ? 'Dhaka' : order.deliveryArea === 'outside' ? 'Outside Dhaka' : ''}</td>
        <td>৳${order.deliveryCharge || 0}</td>
        <td>৳${order.total || ''}</td>
        <td>
          <select class="status-select" data-order-id="${order.id}">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
  // Attach change handlers to status selects
  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const id = e.target.dataset.orderId;
      const status = e.target.value;
      try {
        await fetch(`/api/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        // Optionally show a toast or confirmation
      } catch (err) {
        console.error('Failed to update order status:', err);
      }
    });
  });
}

// Bind refresh button
document.getElementById('refreshOrders').addEventListener('click', () => {
  loadOrders();
});

// Initial load
loadOrders();