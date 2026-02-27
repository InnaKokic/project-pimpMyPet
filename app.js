const navbar = document.getElementById("navbar-wrapper");
const gallery = document.getElementById("gallery");
const allBtn = document.getElementById("hero-btn");
const searchButton = document.querySelector("#search-button");
const searchBar = document.querySelector("#search-bar");

const API = "http://localhost:8080";

//Funktion med fetch som hämtar från /categories endpoint
async function loadCategories() {
  const res = await fetch(`${API}/categories`);
  const categories = await res.json();

  //Tömmer navbaren så inte kategorierna läggs på varandra varje gång fetchen görs
  navbar.innerHTML = "";

  //Loopar igenom objektet med kategorierna och för varje kategori skapar en knapp
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.classList.add("category-button");
    button.textContent = category.name;

    button.addEventListener("click", () => {
      loadProductsByCategory(category.category_id); // Här skickas ID direkt in till funktionen som fetchar produkterna från kategori
    });

    navbar.appendChild(button);
  });
}

//Funktion för att hämta in alla produkter till startsidans knapp
async function loadAllProducts() {
  const res = await fetch(`${API}/products`);
  const products = await res.json();

  renderProducts(products);
}

// Hämtar värdet på search input och tar bort överflödigt whitespace
searchButton.addEventListener("click", () => {
  const query = searchBar.value.trim();
  if (query === "") return;

  loadProducts(`http://127.0.0.1:8080/products?search=${encodeURIComponent(query)}`);
});

//Funktion med fetch till endpointen som hämtar in produkterna kopplade till varje kategori från /categories/:id
async function loadProductsByCategory(id) {
  const res = await fetch(`${API}/category/${id}`);
  const products = await res.json();

  renderProducts(products);
}

async function loadProducts(url) {
  const res = await fetch(url);
  const data = await res.json();

  renderProducts(data);
}

//Fetch för att hämta en specifik produkt
async function showProduct(id) {
  const res = await fetch(`${API}/products/${id}`);
  const data = await res.json();
  const product = data[0]; // backend returnerar array med objekt, där varje obejkt är hela produkten

  gallery.classList.remove("products-gallery"); //tar bort klassen som sätter grid på gallery
  gallery.innerHTML = `
    <div class="details-page">
      
      <img class="product-detail-img" src="assets/images/product-img.png" alt="${product.name}" />

      <div class = "details-wrapper"> 

      <div> 
      <h1>${product.name}</h1>
      
      <h2 class= "price">${product.price} kr</h2>
      </div>
      <div> 
      <p class = "produkt-besk">Produktbeskrivning:</p>
      <p>${product.description ?? ""}</p> 
      </div>
      <p><strong>Lagersaldo:</strong> ${
        product.stock === 0 ? "Slut i lager" : product.stock < 10 ? "Få i lager (<10)" : "Finns i lager (+10)"
      }</p>
      
      </div>
    </div>
  `;

  //--- En tillbaka-knapp ifall man vill ha  ---

  // <button id="back-btn">← Tillbaka</button>;

  // document.getElementById("back-btn").addEventListener("click", () => {
  //   loadAllProducts(); // eller loadProductsByCategory(currentCategory)
  // });
}

//Funktion som bygger produktkorten
const renderProducts = (products) => {
  gallery.innerHTML = "";
  gallery.classList.add("products-gallery");

  //Loopar igenom dem produkterna som hämtats i funktionen (loadAllProducts()) ovan och lägger till detaljerna till kortet
  products.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <img class="product-img" src="assets/images/product-img.png" alt="product img" />

     <div class="card-footer">
        <h3 class = "card-header">${product.name}</h3>
        <p class = "footer-price price">${product.price} kr</p>
         <button class="details-btn" type="button">Visa produkt</button>
      </div>
    `;
    //Ny
    card.querySelector(".details-btn").addEventListener("click", () => {
      showProduct(product.product_id);
    });

    gallery.appendChild(card);
  });
};

allBtn.addEventListener("click", () => {
  loadAllProducts();
});

loadCategories();

// const mainContent = document.querySelector("#main-content");
// const categoryList = document.querySelector("#category-list");
// const backToFrontpage = document.createElement("button");
// backToFrontpage.innerText = "Tillbaka till framsida";
// backToFrontpage.classList.add("back-button");

// async function loadCategory(categoryId) {
//   const res = await fetch(`http://127.0.0.1:8080/category/${categoryId}`);
//   const data = await res.json();

//   if (mainContent.contains(categoryList)) {
//     mainContent.removeChild(categoryList);
//   }

//   mainContent.innerHTML = ""; // Clear previous cards

//   data.forEach((product) => {
//     const cardContainer = document.createElement("div");
//     cardContainer.className = "card-container";

//     const cardHeader = document.createElement("h2");
//     cardHeader.className = "card-header";
//     cardHeader.innerText = product.name;

//     const cardBody = document.createElement("div");
//     cardBody.className = "card-body";
//     cardBody.innerText = product.description;

//     const cardFooter = document.createElement("div");
//     cardFooter.className = "card-footer";

//     const cardPrice = document.createElement("div");
//     cardPrice.className = "card-price";
//     cardPrice.innerText = "Price: " + product.price;

//     const cardStock = document.createElement("div");
//     cardStock.className = "card-stock";
//     cardStock.innerText = "Stock: " + product.stock;

//     mainContent.appendChild(cardContainer);
//     cardContainer.append(cardHeader, cardBody, cardFooter);
//     cardFooter.append(cardPrice, cardStock);
//   });
//   mainContent.appendChild(backToFrontpage);
// }

// backToFrontpage.addEventListener("click", () => {
//   mainContent.innerHTML = "";
//   mainContent.appendChild(categoryList);
// });

// // document.querySelectorAll(".category-button").forEach((button, index) => {
// //   button.addEventListener("click", () => {
// //     loadCategory(index + 1);
// //   });
// // });
// document.querySelectorAll(".category-button").forEach((button) => {
//   button.addEventListener("click", () => {
//     const categoryId = button.dataset.id;
//     loadCategory(categoryId);
//   });
// });
