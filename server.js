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

app.get("/products", (req, res) => {
  cn.query(`SELECT * FROM products`, (err, data) => {
    res.send(data);
  });
});

//Hämta en specifik produkt
app.get("/products/:id", (req, res) => {
  cn.query("SELECT * FROM products WHERE product_id = ?", req.params.id, (err, data) => {
    res.send(data);
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

app.listen(PORT);
