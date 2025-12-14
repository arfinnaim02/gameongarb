const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Use JSON body parser
app.use(bodyParser.json());

// Enable CORS for all routes (useful for local testing)
app.use(cors());

// Define paths
const dataDir = __dirname;
const ordersFile = path.join(dataDir, 'orders.json');

// Helper to read orders
function readOrders() {
  try {
    const raw = fs.readFileSync(ordersFile, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading orders file:', err);
    return [];
  }
}

// Helper to write orders
function writeOrders(orders) {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
}

// Static products data. Each product contains an id, name, regularPrice (original price), offerPrice (discounted price), image URL, and link.
const products = [
  {
    id: 144,
    name: 'Argentina Player Version World Cup 2026 Jersey (Full Sleeve)',
    regularPrice: 1350,
    offerPrice: 1300,
    image: 'https://gameongarb.com/public/uploads/product/1765346289-argentina-player-version-full-sleeve-worldcup-26,-size--m,-l,-xl,-2xl-price--1300-bdt.webp',
    link: 'https://gameongarb.com/product/argentina-player-version-world-cup-2026-jersey-%28full-sleeve%29-144',
    edition: 'Player'
  },
  {
    id: 161,
    name: 'Argentina Fan Version World Cup 2026 Jersey (Half Sleeve)',
    regularPrice: 900,
    offerPrice: 850,
    image: 'https://gameongarb.com/public/uploads/product/1765346083-argentina-fan-version-half-sleeve-worldcup-26,-size--m,-l,-xl,-2xl-price--850-bdt..webp',
    link: 'https://gameongarb.com/product/argentina-fan-version-world-cup-2026-jersey-%28half-sleeve%29-161',
    edition: 'Fan'
  },
  {
    id: 162,
    name: 'Portugal Fan Version World Cup 2026 Jersey (Half Sleeve)',
    regularPrice: 900,
    offerPrice: 850,
    image: 'https://gameongarb.com/public/uploads/product/1765345849-portugal-fan-version-half-sleeve-worldcup-26,-size--m,-l,-xl,-2xl-price--850-bdt.webp',
    link: 'https://gameongarb.com/product/portugal-fan-version-world-cup-2026-jersey-%28half-sleeve%29-161',
    edition: 'Fan'
  },
  {
    id: 114,
    name: 'Spain Player Version Home Jersey – World Cup 2026',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764838789-spain-player-version-home-jersey-world-cup-26-size--m,-l,-xl,-2xl.webp',
    link: 'https://gameongarb.com/product/spain-player-version-home-jersey-%E2%80%93-world-cup-2026-114',
    edition: 'Player'
  },
  {
    id: 113,
    name: 'Portugal Player Version Home Jersey – World Cup 2026',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764838696-portugal-player-version-home-jersey-world-cup-26-size--m,-l,-xl,-2xl.webp',
    link: 'https://gameongarb.com/product/portugal-player-version-home-jersey-%E2%80%93-world-cup-2026-113',
    edition: 'Player'
  },
  {
    id: 112,
    name: 'Portugal Player Version Away Jersey – World Cup 2026',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764838625-portugal-player-version-away-jersey-world-cup-26-size--m,-l,-xl,-2xl.webp',
    link: 'https://gameongarb.com/product/portugal-player-version-away-jersey-%E2%80%93-world-cup-2026-112',
    edition: 'Player'
  },
  {
    id: 111,
    name: 'Mexico Player Version Home Jersey – World Cup 2026',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764838493-mexico-player-version-world-cup-jersey-26.jpg',
    link: 'https://gameongarb.com/product/mexico-player-version-home-jersey-%E2%80%93-world-cup-2026-111',
    edition: 'Player'
  },
  {
    id: 110,
    name: 'Mexico Full Sleeve Player Version Home Jersey – World Cup 2026',
    regularPrice: 1300,
    offerPrice: 1250,
    image: 'https://gameongarb.com/public/uploads/product/1764838340-mexico-full-sleeve-player-version-home-jersey-world-cup-26-size--m,-l,-xl,-2xl.webp',
    link: 'https://gameongarb.com/product/mexico-full-sleeve-player-version-home-jersey-%E2%80%93-world-cup-2026-110',
    edition: 'Player'
  },
  {
    id: 109,
    name: 'Japan Player Version Home Jersey – World Cup 2026',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764838198-japan.webp',
    link: 'https://gameongarb.com/product/japan-player-version-home-jersey-%E2%80%93-world-cup-2026-109',
    edition: 'Player'
  },
  {
    id: 108,
    name: 'Germany Player Version Home Jersey – World Cup 2026',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764838072-germany-player-version-home-jersey-world-cup-26-size--m,-l,-xl,-2xl.webp',
    link: 'https://gameongarb.com/product/germany-player-version-home-jersey-%E2%80%93-world-cup-2026-108',
    edition: 'Player'
  },
  {
    id: 107,
    name: 'Germany Full Sleeve Player Version Home Jersey – World Cup 2026',
    regularPrice: 1300,
    offerPrice: 1250,
    image: 'https://gameongarb.com/public/uploads/product/1764837872-germany-full-sleeve-player-version-home-jersey-world-cup-26-size--m,-l,-xl,-2xl.webp',
    link: 'https://gameongarb.com/product/germany-full-sleeve-player-version-home-jersey-%E2%80%93-world-cup-2026-107',
    edition: 'Player'
  },
  {
    id: 106,
    name: 'England Player Version Home Jersey – World Cup 2026',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764837096-england-player-version-home-jersey-world-cup-26-size--m,-l,-xl,-2xl.webp',
    link: 'https://gameongarb.com/product/england-player-version-home-jersey-%E2%80%93-world-cup-2026-106',
    edition: 'Player'
  },
  {
    id: 105,
    name: 'Brazil Player Version Away Jersey – World Cup 2026',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764836976-brzil-player-version-away-jersey-2026-world-cup-size--m,-l,-xl,-2xl-1050-bdt.webp',
    link: 'https://gameongarb.com/product/brazil-player-version-away-jersey-%E2%80%93-world-cup-2026-105',
    edition: 'Player'
  },
  {
    id: 104,
    name: 'Belgium Player Version Home Jersey world Cup-26',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764836901-belgium-player-version-home-jersey-world-cup-26-size--m,-l,-xl,-2xl.webp',
    link: 'https://gameongarb.com/product/belgium-player-version-home-jersey-world-cup-26-104',
    edition: 'Player'
  },
  {
    id: 103,
    name: 'Argentina Home Jersey 2026 – Player Edition',
    regularPrice: 1100,
    offerPrice: 1050,
    image: 'https://gameongarb.com/public/uploads/product/1764836782-argentina-player-version-home-jersey-world-cup-26-size--m,-l,-xl,-2xl.jpg',
    link: 'https://gameongarb.com/product/argentina-home-jersey-2026-%E2%80%93-player-edition-103',
    edition: 'Player'
  }
];

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API route to fetch products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// API route to fetch all orders
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// API route to place a new order
app.post('/api/orders', (req, res) => {
  const orders = readOrders();
  const order = req.body;
  // Ensure required fields are present
  // Assign a unique id based on timestamp
  order.id = Date.now();
  // Default status for new orders
  order.status = 'Pending';
  orders.push(order);
  writeOrders(orders);
  res.json({ success: true });
});

// API route to update an existing order (e.g. status)
app.put('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  const orders = readOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  // Update only provided fields
  const updates = req.body || {};
  orders[index] = { ...orders[index], ...updates };
  writeOrders(orders);
  res.json({ success: true, order: orders[index] });
});

// Catch-all: serve index.html for unknown routes (for SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});