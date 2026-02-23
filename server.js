const express = require("express");
const app = express();
const PORT = 8080;
const db = require("mysql2");
require("dotenv").config();

const cn = db.createConnection({
  host: "localhost",
  user: "root",
  database: "pimpmypet",
});

app.use(express.json());

/* --- GET endpoints ----- */

//Hämta alla produkter & söka efter produkt
app.get("/products", (req, res) => {
  const search = req.query.search;
  if (search) {
    cn.query(
      `SELECT 
        p.product_id,
        p.name AS product,
        p.price,
        p.stock,
        p.description,
        c.name AS category
     FROM products p
     LEFT JOIN categories_products cp 
        ON p.product_id = cp.product_id
     LEFT JOIN categories c 
        ON cp.category_id = c.category_id
     WHERE p.name LIKE ?
     OR p.description LIKE ?`,
      [`%${search}%`, `%${search}%`],
      (err, data) => {
        res.send(data);
      },
    );
  } else {
    cn.query(`SELECT * FROM products`, (err, data) => {
      res.send(data);
    });
  }
});

//Admin se lagersaldo för varje produkt
app.get("/admin/products", (req, res) => {
  cn.query(
    `SELECT name, stock
    FROM products`,
    (err, data) => {
      res.send(data);
    },
  );
});

//Hämta en specifik produkt
app.get("/products/:id", (req, res) => {
  cn.query("SELECT * FROM products WHERE product_id = ?", req.params.id, (err, data) => {
    res.send(data);
  });
});

//Filtrera produkter efter kategori
app.get("/category/:id", (req, res) => {
  cn.query(
    `SELECT
  p.product_id,
  p.name,
  p.price,
  p.stock,
  p.description
FROM products p
JOIN categories_products cp ON p.product_id = cp.product_id
WHERE cp.category_id = ?;`,
    req.params.id,
    (err, data) => {
      res.send(data);
    },
  );
});

//Hämta alla ordrar från en viss kund
app.get("/orders/customer/:id", (req, res) => {
  const customerId = req.params.id;
  cn.query(
    `SELECT o.order_id, o.date, c.customer_id 
    FROM orders o
    JOIN customers c 
    ON o.customer_id = c.customer_id
    WHERE c.customer_id = ?`,
    [req.params.id],
    (err, data) => {
      if (!customerId) {
        return res.status(400).send("Missing customer_id");
      }
      res.send(data);
    },
  );
});

//Hämta info om en specifik order
app.get("/orders/:id", (req, res) => {
  const orderId = req.params.id;
  cn.query(
    `SELECT p.name, op.price_at_purchase, op.quantity 
    FROM orders o
    JOIN orders_products op ON op.order_id = o.order_id
    JOIN products p ON op.product_id = p.product_id 
    WHERE o.order_id = ?`,
    [req.params.id],
    (err, data) => {
      if (!orderId) {
        return res.status(400).send("Missing order_id");
      }
      res.send(data);
    },
  );
});

// Hämta alla ordrar
app.get("/admin/orders", (req, res) => {
  cn.query(`SELECT * FROM orders`, (err, data) => {
    if (err) return res.status(500).send(err);
    res.send(data);
  });
});

/* --- POST endpoints ----- */

// Slutföra köp / lägga order
app.post("/orders/checkout", (req, res) => {
  const { customer_id, items } = req.body;

  if (!customer_id || !items || items.length === 0) {
    return res.status(400).send("Missing customer_id or items");
  }

  // 1. Skapa order
  cn.query(`INSERT INTO orders (customer_id, date) VALUES (?, NOW())`, [customer_id], (err, orderResult) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err.sqlMessage);
    }

    const orderId = orderResult.insertId;

    // 2. Hämta priser för alla produkter
    const productIds = items.map((i) => i.product_id);

    cn.query(`SELECT product_id, price FROM products WHERE product_id IN (?)`, [productIds], (err, priceRows) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.sqlMessage);
      }

      // Skapa en map: product_id → price
      const priceMap = {};
      priceRows.forEach((row) => {
        priceMap[row.product_id] = row.price;
      });

      // 3. Förbered orderrader
      const orderProducts = items.map((item) => [
        item.product_id,
        orderId,
        item.quantity,
        priceMap[item.product_id], // price_at_purchase
      ]);

      // 4. Lägg in orderrader
      cn.query(
        `INSERT INTO orders_products (product_id, order_id, quantity, price_at_purchase) VALUES ?`,
        [orderProducts],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send(err.sqlMessage);
          }

          // 5. Minska lagersaldo
          items.forEach((item) => {
            cn.query(`UPDATE products SET stock = stock - ? WHERE product_id = ?`, [item.quantity, item.product_id]);
          });

          // 6. Klart!
          res.send({
            message: "Order completed",
            order_id: orderId,
          });
        },
      );
    });
  });
});

//Lägga till en ny produkt
app.post("/admin/add-product", (req, res) => {
  cn.query(
    "INSERT INTO products (name, price, stock, description) VALUES (?, ?, ?, ?)",
    [req.body.name, req.body.price, req.body.stock, req.body.description],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.sqlMessage);
      }

      res.send("Added product");
    },
  );
});

/* --- PATCH endpoints ----- */

//Uppdatera produktinformation på en viss produkt
app.patch("/admin/edit-product/:id", (req, res) => {
  cn.query(
    `UPDATE products SET ?
        WHERE product_id = ?`,
    [req.body, req.params.id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.sqlMessage);
      }

      res.send("Edited product");
    },
  );
});

/* --- DELETE endpoints ----- */

//Ta bort produkt
app.delete("/admin/products/:id", (req, res) => {
  const id = req.params.id;

  cn.query("DELETE FROM products WHERE product_id = ?", [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err.sqlMessage);
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("Product not found");
    }

    res.send("Product deleted");
  });
});

app.listen(PORT);
