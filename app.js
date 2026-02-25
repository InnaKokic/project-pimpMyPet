const mainContent = document.querySelector("#main-content");
const categoryList = document.querySelector("#category-list");
const backToFrontpage = document.createElement("button");
backToFrontpage.innerText = "Tillbaka till framsida";
backToFrontpage.classList.add("back-button");

async function loadCategory(categoryId) {
  const res = await fetch(`http://127.0.0.1:8080/category/${categoryId}`);
  const data = await res.json();

  if (mainContent.contains(categoryList)) {
    mainContent.removeChild(categoryList);
  }

  mainContent.innerHTML = ""; // Clear previous cards

  data.forEach((product) => {
    const cardContainer = document.createElement("div");
    cardContainer.className = "card-container";

    const cardHeader = document.createElement("h2");
    cardHeader.className = "card-header";
    cardHeader.innerText = product.name;

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.innerText = product.description;

    const cardFooter = document.createElement("div");
    cardFooter.className = "card-footer";

    const cardPrice = document.createElement("div");
    cardPrice.className = "card-price";
    cardPrice.innerText = "Price: " + product.price;

    const cardStock = document.createElement("div");
    cardStock.className = "card-stock";
    cardStock.innerText = "Stock: " + product.stock;

    mainContent.appendChild(cardContainer);
    cardContainer.append(cardHeader, cardBody, cardFooter);
    cardFooter.append(cardPrice, cardStock);
  });
  mainContent.appendChild(backToFrontpage);
}

backToFrontpage.addEventListener("click", () => {
  mainContent.innerHTML = "";
  mainContent.appendChild(categoryList);
});

// document.querySelectorAll(".category-button").forEach((button, index) => {
//   button.addEventListener("click", () => {
//     loadCategory(index + 1);
//   });
// });
document.querySelectorAll(".category-button").forEach((button) => {
  button.addEventListener("click", () => {
    const categoryId = button.dataset.id;
    loadCategory(categoryId);
  });
});
