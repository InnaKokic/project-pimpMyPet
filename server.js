const express = require("express");
const app = express();
const PORT = 8080;
const db = require("mysql2");
const cors = require("cors");
app.use(cors());
require("dotenv").config();

const cn = db.createConnection({
  host: "localhost",
  user: "root",
  database: "pimpmypet",
});

app.use(express.json());

/* --- ADMIN ENDPOINTS ----*/

//Admin se lagersaldo för varje produkt
app.get("/admin/products", (req, res) => {
  cn.query(
    `SELECT name, stock
    FROM products`,
    (err, data) => {
      if (err) {
        return res.status(500).send(err.sqlMessage);
      }
      res.send(data);
    },
  );
});

//Hämta en specifik produkt
app.get("/products/:id", (req, res) => {
  if (isNaN(req.params.id)) {
    return res.status(400).send("ID must be a number");
  }
  cn.query("SELECT * FROM products WHERE product_id = ?", req.params.id, (err, data) => {
    if (err) {
      return res.status(500).send(err.sqlMessage);
    }
    res.send(data);
  });
});

// Hämta alla ordrar
app.get("/admin/orders", (req, res) => {
  cn.query(`SELECT * FROM orders`, (err, data) => {
    if (err) {
      return res.status(500).send(err.sqlMessage);
    }
    res.send(data);
  });
});

//Lägga till en ny produkt
app.post("/admin/add-product", (req, res) => {
  // Validering
  if (!req.body.name || req.body.price === undefined || req.body.stock === undefined) {
    return res.status(400).send("Missing required fields: name, price, stock");
  }

  if (req.body.price < 0 || req.body.stock < 0) {
    return res.status(400).send("Price and stock must be >= 0");
  }

  cn.query(
    "INSERT INTO products (name, price, stock, description) VALUES (?, ?, ?, ?)",
    [req.body.name, req.body.price, req.body.stock, req.body.description],
    (err, result) => {
      if (err) {
        return res.status(500).send(err.sqlMessage);
      }

      res.send("Added product");
    },
  );
});

//Ta bort produkt
app.delete("/admin/products/:id", (req, res) => {
  const id = req.params.id;
  if (isNaN(id)) {
    return res.status(400).send("Product ID must be a number");
  }

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

//Uppdatera produktinformation på en viss produkt
app.patch("/admin/edit-product/:id", (req, res) => {
  if (isNaN(req.params.id)) {
    return res.status(400).send("Product ID must be a number");
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send("Missing data. No update can be made");
  }
  cn.query(
    `UPDATE products SET ?
        WHERE product_id = ?`,
    [req.body, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).send(err.sqlMessage);
      }

      if (result.affectedRows === 0) {
        return res.status(404).send("Product not found");
      }

      res.send("Edited product");
    },
  );
});

/* --- USER ENDPOINTS ----*/

//Hämta alla produkter & söka efter produkt
app.get("/products", (req, res) => {
  const search = req.query.search;
  if (search !== undefined && search === "") {
    return res.status(400).send("Search cannot be empty");
  }
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
        if (err) {
          return res.status(500).send(err.sqlMessage);
        }

        if (data.length === 0) {
          return res.status(404).send("No products found");
        }

        res.send(data);
      },
    );
  } else {
    cn.query(`SELECT * FROM products`, (err, data) => {
      if (err) {
        return res.status(500).send(err.sqlMessage);
      }
      res.send(data);
    });
  }
});

//Filtrera produkter efter kategori
app.get("/category/:id", (req, res) => {
  if (isNaN(req.params.id)) {
    return res.status(400).send("ID must be a number");
  }
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
      if (err) {
        return res.status(500).send(err.sqlMessage);
      }
      res.send(data);
    },
  );
});

//Hämta alla ordrar från en viss kund
app.get("/orders/customer/:id", (req, res) => {
  const customerId = req.params.id;
  if (isNaN(customerId)) {
    return res.status(400).send("ID must be a number");
  }
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
      if (err) {
        return res.status(500).send(err.sqlMessage);
      }
      res.send(data);
    },
  );
});

//Hämta info om en specifik order
app.get("/orders/:id", (req, res) => {
  const orderId = req.params.id;
  if (isNaN(orderId)) {
    return res.status(400).send("ID must be a number");
  }
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
      if (err) {
        return res.status(500).send(err.sqlMessage);
      }
      res.send(data);
    },
  );
});

// Slutföra köp / lägga order
app.post("/orders/checkout", (req, res) => {
  const { customer_id, items } = req.body;

  if (!customer_id || !items || items.length === 0) {
    return res.status(400).send("Missing customer_id or items");
  }

  cn.beginTransaction((err) => {
    if (err) return res.status(500).send(err.sqlMessage);

    // Kontrollera & minska lager
    const updateStock = (index) => {
      if (index >= items.length) {
        return createOrder(); // Alla lager OK
      }

      const item = items[index];

      cn.query(
        `UPDATE products
         SET stock = stock - ?
         WHERE product_id = ?
         AND stock >= ?`,
        [item.quantity, item.product_id, item.quantity],
        (err, result) => {
          if (err) {
            return cn.rollback(() => res.status(500).send(err.sqlMessage));
          }

          if (result.affectedRows === 0) {
            return cn.rollback(() => res.status(400).send(`Not enough stock for product ${item.product_id}`));
          }

          updateStock(index + 1);
        },
      );
    };

    // Skapa order
    const createOrder = () => {
      cn.query(`INSERT INTO orders (customer_id, date) VALUES (?, NOW())`, [customer_id], (err, orderResult) => {
        if (err) {
          return cn.rollback(() => res.status(500).send(err.sqlMessage));
        }

        const orderId = orderResult.insertId;
        const productIds = items.map((i) => i.product_id);

        // Hämta priser
        cn.query(`SELECT product_id, price FROM products WHERE product_id IN (?)`, [productIds], (err, priceRows) => {
          if (err) {
            return cn.rollback(() => res.status(500).send(err.sqlMessage));
          }

          const priceMap = {};
          priceRows.forEach((row) => {
            priceMap[row.product_id] = row.price;
          });

          const orderProducts = items.map((item) => [
            item.product_id,
            orderId,
            item.quantity,
            priceMap[item.product_id],
          ]);

          // Skapa orderrader
          cn.query(
            `INSERT INTO orders_products
                 (product_id, order_id, quantity, price_at_purchase)
                 VALUES ?`,
            [orderProducts],
            (err) => {
              if (err) {
                return cn.rollback(() => res.status(500).send(err.sqlMessage));
              }

              // Commit
              cn.commit((err) => {
                if (err) {
                  return cn.rollback(() => res.status(500).send(err.sqlMessage));
                }

                res.send({
                  message: "Order completed",
                  order_id: orderId,
                });
              });
            },
          );
        });
      });
    };

    updateStock(0);
  });
});

app.listen(PORT);
