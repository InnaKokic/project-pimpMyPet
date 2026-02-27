//Return button-funktion
function goBack() {
  location.reload();
}

//Page setup
function setupPage() {
  const main = document.querySelector("main");
  main.innerHTML = "";

  const backButton = document.createElement("button");
  backButton.innerText = "← Tillbaka";
  backButton.onclick = goBack;
  main.appendChild(backButton);

  return main;
}

// Skapa rubrik för varje knapp
function createTitle(main, text) {
  const title = document.createElement("h2");
  title.innerText = text;
  main.appendChild(title);
}

// Skapa input för varje knapp
function createInput(main, id, placeholder, type = "text") {
  const input = document.createElement("input");

  input.id = id;
  input.placeholder = placeholder;
  input.type = type;

  main.appendChild(input);
}

// Visa resultat efter input
async function showResult(response, containerId) {
  const container = document.getElementById(containerId);

  container.innerHTML = "";

  const text = await response.text();

  if (response.ok) {
    container.innerHTML = `<p style="color:green">${text}</p>`;
  } else {
    container.innerHTML = `<p style="color:red">${text}</p>`;
  }
}

// View all orders
async function getOrders() {
  const response = await fetch("http://localhost:8080/admin/orders");
  const orders = await response.json();

  const main = setupPage();

  createTitle(main, "Alla ordrar");

  const container = document.createElement("div");

  orders.forEach((order) => {
    const card = document.createElement("div");

    card.className = "card";

    card.innerHTML = `
            <h3>Order #${order.order_id}</h3>
            <p>Datum: ${order.date}</p>
            <p>Kund-ID: ${order.customer_id}</p>
        `;

    container.appendChild(card);
  });

  main.appendChild(container);
}

// View stock information
async function stockInfo() {
  const response = await fetch("http://localhost:8080/admin/products");
  const products = await response.json();

  const main = setupPage();

  createTitle(main, "Lagersaldo");

  const container = document.createElement("div");

  products.forEach((product) => {
    const card = document.createElement("div");

    card.className = "card";

    card.innerHTML = `
            <h3>Produkt: ${product.name}</h3>
            <p>Antal i lager: ${product.stock}</p>
        `;

    container.appendChild(card);
  });

  main.appendChild(container);
}

//Visa Add product - formulär
function showAddProduct() {
  const main = setupPage();

  createTitle(main, "Lägg till ny produkt");

  createInput(main, "productName", "Namn");
  createInput(main, "productPrice", "Pris", "number");
  createInput(main, "productStock", "Stock", "number");
  createInput(main, "productDesc", "Beskrivning (valfritt)");

  const addBtn = document.createElement("button");
  addBtn.innerText = "Lägg till produkt";
  addBtn.onclick = addProduct;
  main.appendChild(addBtn);

  const result = document.createElement("div");
  result.id = "addResult";
  main.appendChild(result);
}

// Add product till backend
async function addProduct() {
  const name = document.getElementById("productName").value;
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);
  const description = document.getElementById("productDesc").value;

  if (!name || isNaN(price) || isNaN(stock)) {
    alert("Fyll i alla obligatoriska fält: namn, pris, stock");
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/admin/add-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, price, stock, description }),
    });

    await showResult(response, "addResult");
  } catch (error) {
    console.error(error);
    document.getElementById("addResult").innerHTML = `<p style="color:red">Något gick fel</p>`;
  }
}

//Visa delete product-formulär
function showDeleteProduct() {
  const main = setupPage();

  createTitle(main, "Ta bort produkt");

  createInput(main, "deleteProductId", "Skriv in produkt-ID", "number");

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "Ta bort produkt";
  deleteBtn.onclick = deleteProduct;
  main.appendChild(deleteBtn);

  const result = document.createElement("div");
  result.id = "deleteResult";
  main.appendChild(result);
}

// Ta bort produkt från backend
async function deleteProduct() {
  const id = document.getElementById("deleteProductId").value;

  if (!id) {
    alert("Skriv in ett produkt-ID!");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/admin/products/${id}`, {
      method: "DELETE",
    });

    await showResult(response, "deleteResult");
  } catch (error) {
    console.error(error);
    document.getElementById("deleteResult").innerHTML = `<p style="color:red">Något gick fel</p>`;
  }
}

// Visa formulär för att redigera produkt
function showEditProduct() {
  const main = setupPage();

  createTitle(main, "Redigera produkt");

  createInput(main, "editProductId", "Produkt ID", "number");
  createInput(main, "editName", "Nytt namn");
  createInput(main, "editPrice", "Nytt pris", "number");
  createInput(main, "editStock", "Ny stock", "number");
  createInput(main, "editDesc", "Ny beskrivning");

  const updateBtn = document.createElement("button");
  updateBtn.innerText = "Uppdatera produkt";
  updateBtn.onclick = editProduct;
  main.appendChild(updateBtn);

  const result = document.createElement("div");
  result.id = "editResult";
  main.appendChild(result);
}

// Skicka redigering av produkt till backend
async function editProduct() {
  const id = document.getElementById("editProductId").value;
  const name = document.getElementById("editName").value;
  const price = parseFloat(document.getElementById("editPrice").value);
  const stock = parseInt(document.getElementById("editStock").value);
  const description = document.getElementById("editDesc").value;

  if (!id) {
    alert("Skriv in ett produkt-ID!");
    return;
  }

  const bodyData = {};

  if (name) bodyData.name = name;
  if (!isNaN(price)) bodyData.price = price;
  if (!isNaN(stock)) bodyData.stock = stock;
  if (description) bodyData.description = description;

  if (Object.keys(bodyData).length === 0) {
    alert("Fyll i minst ett fält att uppdatera");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/admin/edit-product/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    await showResult(response, "editResult");
  } catch (error) {
    console.error(error);
    document.getElementById("editResult").innerHTML = `<p style="color:red">Något gick fel</p>`;
  }
}
