/* 
================= 
INDEX HTML PAGE
=================
*/

async function fetchWithErrorHandling(...args) {
  try {
    const res = await fetch(...args);

    if (!res.ok) {
      switch (res.status) {
        case 400:
          throw new Error("400, Something went wrong with your request.");
        case 401:
          throw new Error("401, You are unauthorized.");
        case 404:
          throw new Error("404, Resource not found");
        case 500:
          throw new Error("500, Internal Server Error.");
        default:
          throw new Error(res.status);
      }
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Fetch", error);
  }
}

async function loadData(url) {
  const PAYLOAD = {
    method: "GET",
    headers: {
      Authorization: MY_API_KEY,
    },
  };

  const body = await fetchWithErrorHandling(url, PAYLOAD);
  return body;
}

async function loadCards(cardsElement) {
  const cardList = await loadData(STRIVE_ENDPOINT);

  if (cardList) {
    cardsElement.innerHTML = "";
    cardList.forEach((card) => {
      cardsElement.innerHTML += renderCard(card);
      const cardData = {
        id: card._id,
        name: card.name,
        description: card.description,
        brand: card.brand,
        imageUrl: card.imageUrl,
        price: card.price,
      };
      cardArr.push(cardData);
    });

    localStorage.setItem("cardList", JSON.stringify(cardArr));
  } else {
    errorHandlingBox(cardsElement);
  }
}

function errorHandlingBox(element) {
  element.innerHTML = "";

  const errorHandlingDiv = document.createElement("div");
  errorHandlingDiv.classList.add(
    "bg-danger-subtle",
    "border",
    "border-danger",
    "border-4",
    "my-4",
    "p-3",
    "rounded",
    "d-flex",
    "align-items-center",
    "justify-content-center",
    "gap-3",
    "w-100"
  );
  errorHandlingDiv.innerHTML = `
  <img src="../assets/svg/bug-fill.svg" height="50px" width="50px">
  <div>
  <h2>There was an error</h2>
  <p>We are unable to load the data requested.</p>
</div>
  `;
  element.appendChild(errorHandlingDiv);
}

function renderCard(cardData) {
  return `<!-- card -->
  <div class="col mb-4 d-flex align-items-stretch">
  <div class="card border-warning" data-id="${cardData._id}" >
      <img src="${cardData.imageUrl}" class="card-img-top" alt="Item Picture">
      <div class="card-body d-flex flex-column justify-content-space-between">
          <h5 class="card-title">${cardData.name}</h5>
          <p class="card-text flex-grow-1">${cardData.price}€</p>
          <a href="./pages/details.html?id=${cardData._id}" class="btn btn-outline-dark mb-2">Detalis</a>
          <a href =
          "./pages/newItem.html?modify=true&id=${cardData._id}" class="btn btn-outline-warning text-dark modify-btn">Modify</a>
      </div>
  </div>
</div>
<!-- end of card -->`;
}

async function createData(item) {
  const PAYLOAD = {
    method: "POST",
    headers: {
      Authorization: MY_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(item),
  };

  const response = await fetch(STRIVE_ENDPOINT, PAYLOAD);
  const data = await response.json();

  return data;
}

// variables and DOM selectors
const MY_API_KEY =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTcxZmYzNDBkOGEyMDAwMThhNDhiNDQiLCJpYXQiOjE3MDE5Njk3MTYsImV4cCI6MTcwMzE3OTMxNn0.5_oa--6z6w4Aq79-5uXNafYJq213OKyZCsAYn0F3d_Q";

const STRIVE_ENDPOINT = "https://striveschool-api.herokuapp.com/api/product/";

const cardsContainer = document.querySelector("#cards-container");

let cardArr = [];

if (cardsContainer) {
  loadCards(cardsContainer);
}

/* 
================= 
NEWITEM HTML PAGE
=================
*/

async function isModifyPage() {
  const form = document.querySelector("#create-item-form");

  let params = new URLSearchParams(document.location.search);

  const isModify = params.get("modify");

  const productName = document.querySelector("#name");
  const productDesc = document.querySelector("#description");
  const productBrand = document.querySelector("#brand");
  const productImgUrl = document.querySelector("#url");
  const productPrice = document.querySelector("#price");
  const formResetBtn = document.querySelector("#form-reset-btn");

  if (!isModify) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const cardList = JSON.parse(localStorage.getItem("cardList"));
      const result = cardList.find((card) => productName.value === card.name);

      // if same name as already existent obj, prevent error
      if (result) {
        const pWarning = document.createElement("p");
        pWarning.classList.add("text-danger");
        pWarning.innerText =
          "WARNING: An Item with this name already exists. Change name please.";
        productName.after(pWarning);

        setTimeout(() => {
          pWarning.remove();
        }, 3000);
        return;
      }

      const newItem = {
        name: productName.value,
        description: productDesc.value,
        brand: productBrand.value,
        imageUrl: productImgUrl.value,
        price: productPrice.value,
      };

      const isCreated = await createData(newItem);

      if (isCreated) {
        renderSuccessBox();
      }
    });
  } else {
    const formCreateBtn = document.querySelector("#form-create-btn");
    const formModifyBtn = document.querySelector("#form-modify-btn");
    const formDeleteBtn = document.querySelector("#form-delete-btn");

    formCreateBtn.disabled = true;
    formCreateBtn.classList.add("d-none");
    formModifyBtn.classList.remove("d-none");
    formDeleteBtn.classList.remove("d-none");

    const ID = params.get("id");

    const savedCardArr = JSON.parse(localStorage.getItem("cardList"));

    const foundCard = savedCardArr.find((cardData) => cardData.id === ID);

    productName.value = foundCard.name;
    productDesc.value = foundCard.description;
    productBrand.value = foundCard.brand;
    productImgUrl.value = foundCard.imageUrl;
    productPrice.value = foundCard.price;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newItem = {
        name: productName.value,
        description: productDesc.value,
        brand: productBrand.value,
        imageUrl: productImgUrl.value,
        price: productPrice.value,
      };

      const isUpdated = await updateItem(newItem, ID);
      if (isUpdated) {
        renderSuccessBox();
      }
    });

    formDeleteBtn.addEventListener("click", () => {
      confirmAction(formDeleteBtn, ID);
    });
  }

  // reset works in every case
  formResetBtn.addEventListener("click", () => {
    confirmAction(formResetBtn);
  });
}

function confirmAction(element, idItem = null) {
  const confirmBox = document.querySelector("#confirm-box");
  const h3ConfirmBox = document.querySelector("#confirm-box h3");
  const pConfirmBox = document.querySelector("#confirm-box p");
  const continueBtn = document.querySelector("#continue-btn");
  const cancelBtn = document.querySelector("#cancel-btn");

  confirmBox.classList.remove("d-none");
  confirmBox.scrollIntoView();

  const deleteText = "Delete Item";
  if (element.innerText.toLowerCase() === deleteText.toLowerCase()) {
    h3ConfirmBox.innerText = "Delete";
    pConfirmBox.innerText = "Do you want to delete this item?";

    continueBtn.addEventListener("click", async () => {
      const isDeleted = await deleteItem(idItem);

      if (isDeleted) {
        confirmBox.classList.add("d-none");
        renderSuccessBox();
      }
    });
  } else {
    const productName = document.querySelector("#name");
    const productDesc = document.querySelector("#description");
    const productBrand = document.querySelector("#brand");
    const productImgUrl = document.querySelector("#url");
    const productPrice = document.querySelector("#price");

    h3ConfirmBox.innerText = "Reset";
    pConfirmBox.innerText = "Do you want to reset ALL fields?";

    continueBtn.addEventListener("click", () => {
      productName.value = "";
      productDesc.value = "";
      productBrand.value = "";
      productImgUrl.value = "";
      productPrice.value = "";

      confirmBox.classList.add("d-none");
    });
  }

  cancelBtn.addEventListener("click", () => {
    confirmBox.classList.add("d-none");
  });
}

function renderSuccessBox() {
  const main = document.querySelector("main");
  const successDiv = document.createElement("div");
  successDiv.setAttribute("id", "success-div");
  successDiv.classList.add(
    "bg-success-subtle",
    "border",
    "border-success",
    "my-4",
    "p-3",
    "border-4",
    "rounded",
    "d-flex",
    "align-items-center",
    "justify-content-start",
    "gap-4"
  );

  successDiv.innerHTML = `<img src="../assets/svg/check2-circle.svg" height="50px" width="50px" alt="item creation success">

<div>
    <h3>SUCCESS!</h3>
    <p>You will be redirected to Hompage in <span id="seconds">5</span>...</p>
</div>
</div>
`;

  main.appendChild(successDiv);
  successDiv.scrollIntoView();
  const secondsSpan = document.querySelector("#seconds");
  let counter = 5;
  setInterval(() => {
    counter--;
    secondsSpan.innerText = counter;
  }, 1000);
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 5000);
}

async function deleteItem(id) {
  const PAYLOAD = {
    method: "DELETE",
    headers: {
      Authorization: MY_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  const urlItem = `${STRIVE_ENDPOINT}${id}`;
  const response = await fetch(urlItem, PAYLOAD);
  const data = response.json();

  return data;
}

async function updateItem(item, id) {
  const PAYLOAD = {
    method: "PUT",
    headers: {
      Authorization: MY_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(item),
  };

  const urlItem = `${STRIVE_ENDPOINT}${id}`;

  const response = await fetch(urlItem, PAYLOAD);
  const data = response.json();

  return data;
}

// variables and DOM selectors
const newItemPage = document.querySelector("#new-item-page");

if (newItemPage) {
  isModifyPage();
}

/* 
================= 
DETAILS HTML PAGE
=================
*/

function renderDetailedCard(cardInfo) {
  return `<div class="img-container" style="width: 45%;">
  <img src="${cardInfo.imageUrl}" class="card-img-top rounded border border-4 border-warning" alt="Item Picture">
</div>
<div>
  <div>
      <h2>${cardInfo.name}</h2>
      <p class="border border-warning rounded bg-warning-subtle ">${cardInfo.brand}</p>
      <p>${cardInfo.description}</p>
      <p>${cardInfo.price}€</p>
  </div>

  <a href="./newItem.html?modify=true&id=${cardInfo.id}" class="btn btn-warning text-white modify-btn">Modify</a>
</div>
  `;
}

// variables and DOM selectors
const detailPage = document.querySelector("#detail-page");

if (detailPage) {
  let params = new URLSearchParams(document.location.search);

  const ID = params.get("id");

  const savedCardArr = JSON.parse(localStorage.getItem("cardList"));

  const foundCard = savedCardArr.find((cardData) => cardData.id === ID);

  const detailContainer = document.querySelector("#detail-container");
  const detailCard = renderDetailedCard(foundCard);
  detailContainer.innerHTML = detailCard;
}
