const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // ảnh QR

// Template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ====== Dữ liệu (copy từ Flask) ======
const warehouse_layout = {
  name: "Kho hàng chính",
  dimensions: { width: 200, height: 290 }
};


// --- Vị trí các kệ ---
const shelf_positions = {
  "shelf_1": { left: 0.18, top: 0.2, ratio: "25:150", label: "Kệ D1" }, 
  "shelf_2": { left: 0.2, top: 0.1, ratio: "200:25", label: "Kệ N1" }, 
  "shelf_3": { left: 0.52, top: 0.1, ratio: "200:25", label: "Kệ N2" }, 
  "shelf_4": { left: 0.2, top: 0.7, ratio: "200:25", label: "Kệ D2" }, 
  "shelf_5": { left: 0.3, top: 0.4, ratio: "200:25", label: "Kệ D3" }, 
  "shelf_6": { left: 0.8, top: 0.2, ratio: "25:150", label: "Kệ D4" }, 
};

const warehouse_data = {
  "shelf_1": [
    { id: 1, name: "Máy tính Dell XPS", qr: "qr1.png", quantity: 15, category: "Electronics" },
    { id: 2, name: "Bàn phím cơ", qr: "qr2.png", quantity: 32, category: "Accessories" },
    { id: 3, name: "Chuột gaming", qr: "qr3.png", quantity: 28, category: "Accessories" },
    { id: 4, name: "Màn hình 24 inch", qr: "qr4.png", quantity: 19, category: "Electronics" }
  ],
  "shelf_2": [
    { id: 5, name: "Quần jean nam", qr: "qr5.png", quantity: 45, category: "Fashion" },
    { id: 6, name: "Áo thun nữ", qr: "qr6.png", quantity: 67, category: "Fashion" },
    { id: 7, name: "Giày thể thao", qr: "qr7.png", quantity: 23, category: "Fashion" },
    { id: 8, name: "Túi xách da", qr: "qr8.png", quantity: 18, category: "Fashion" },
    { id: 9, name: "Túi xách da", qr: "qr8.png", quantity: 18, category: "Fashion" }

  ],
  "shelf_3": [
    { id: 1, name: "Máy tính Dell XPS", qr: "qr1.png", quantity: 15, category: "Electronics" },
    { id: 2, name: "Bàn phím cơ", qr: "qr2.png", quantity: 32, category: "Accessories" },
    { id: 3, name: "Chuột gaming", qr: "qr3.png", quantity: 28, category: "Accessories" },
    { id: 4, name: "Màn hình 24 inch", qr: "qr4.png", quantity: 19, category: "Electronics" }
  ],
  "shelf_4": [
    { id: 5, name: "Quần jean nam", qr: "qr5.png", quantity: 45, category: "Fashion" },
    { id: 6, name: "Áo thun nữ", qr: "qr6.png", quantity: 67, category: "Fashion" },
    { id: 7, name: "Giày thể thao", qr: "qr7.png", quantity: 23, category: "Fashion" },
    { id: 8, name: "Túi xách da", qr: "qr8.png", quantity: 18, category: "Fashion" }
  ],
  "shelf_5": [
    { id: 1, name: "Máy tính Dell XPS", qr: "qr1.png", quantity: 15, category: "Electronics" },
    { id: 2, name: "Bàn phím cơ", qr: "qr2.png", quantity: 32, category: "Accessories" },
    { id: 3, name: "Chuột gaming", qr: "qr3.png", quantity: 28, category: "Accessories" },
    { id: 4, name: "Màn hình 24 inch", qr: "qr4.png", quantity: 19, category: "Electronics" }
  ],
  "shelf_6": [
    { id: 5, name: "Quần jean nam", qr: "qr5.png", quantity: 45, category: "Fashion" },
    { id: 6, name: "Áo thun nữ", qr: "qr6.png", quantity: 67, category: "Fashion" },
    { id: 7, name: "Giày thể thao", qr: "qr7.png", quantity: 23, category: "Fashion" },
    { id: 8, name: "Túi xách da", qr: "qr8.png", quantity: 18, category: "Fashion" }
  ]
  
};

// Helper
function calculate_total_products() {
  return Object.values(warehouse_data).reduce((sum, products) => sum + products.length, 0);
}
function calculate_total_quantity() {
  return Object.values(warehouse_data).reduce((sum, products) =>
    sum + products.reduce((s, p) => s + p.quantity, 0), 0
  );
}

// ====== ROUTES ======
app.get("/", (req, res) => {
  res.render("index", {
    shelf_positions,
    warehouse_data,
    warehouse_layout,
    total_products: calculate_total_products(),
    total_quantity: calculate_total_quantity(),
  });
});

app.get("/api/warehouse-data", (req, res) => res.json(warehouse_data));

app.get("/api/shelf/:shelf_id", (req, res) => {
  const shelf = warehouse_data[req.params.shelf_id];
  if (shelf) res.json(shelf);
  else res.status(404).json({ error: "Shelf not found" });
});

app.post("/api/shelf/:shelf_id", (req, res) => {
  try {
    warehouse_data[req.params.shelf_id] = req.body;
    res.json({ success: true, message: `Đã cập nhật ${req.params.shelf_id}` });
  } catch (e) {
    res.status(400).json({ error: e.toString() });
  }
});

app.get("/api/product/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  for (const [shelfId, products] of Object.entries(warehouse_data)) {
    for (const product of products) {
      if (product.id === productId) {
        return res.json({
          product,
          shelf_id: shelfId,
          shelf_label: shelf_positions[shelfId]?.label,
        });
      }
    }
  }
  res.status(404).json({ error: "Product not found" });
});

app.get("/search", (req, res) => {
  const query = (req.query.q || "").toLowerCase();
  const results = [];
  for (const [shelfId, products] of Object.entries(warehouse_data)) {
    for (const product of products) {
      if (product.name.toLowerCase().includes(query)) {
        results.push({ ...product, shelf_id: shelfId, shelf_label: shelf_positions[shelfId]?.label });
      }
    }
  }
  res.json(results);
});

app.get("/stats", (req, res) => {
  const stats = {
    total_shelves: Object.keys(shelf_positions).length,
    total_products: calculate_total_products(),
    total_quantity: calculate_total_quantity(),
    categories: {}
  };
  for (const products of Object.values(warehouse_data)) {
    for (const product of products) {
      if (!stats.categories[product.category]) {
        stats.categories[product.category] = { count: 0, quantity: 0 };
      }
      stats.categories[product.category].count++;
      stats.categories[product.category].quantity += product.quantity;
    }
  }
  res.json(stats);
});

// Khởi động
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
