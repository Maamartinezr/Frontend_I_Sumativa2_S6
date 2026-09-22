// Semana 6 - Logica optimizada con JavaScript, Bootstrap y Fetch API.
// El sitio carga productos desde JSON, permite buscar y administra el carrito sin recargar la pagina.
document.addEventListener("DOMContentLoaded", () => {
  const state = {
    catalog: [],
    launches: [],
    filteredCatalog: [],
    cart: []
  };

  const formatPrice = (value) => new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);

  const selectors = {
    cartCount: document.querySelector("#cartCount"),
    cartItems: document.querySelector("#cartItems"),
    cartTotal: document.querySelector("#cartTotal"),
    clearCartButton: document.querySelector("#clearCart"),
    interactionMessage: document.querySelector("#interactionMessage"),
    toggleDealButton: document.querySelector("#toggleDeal"),
    dealDetails: document.querySelector("#dealDetails"),
    contactForm: document.querySelector("#contactForm"),
    formFeedback: document.querySelector("#formFeedback"),
    reloadProductsButton: document.querySelector("#reloadProducts"),
    dynamicProducts: document.querySelector("#dynamicProducts"),
    fetchStatus: document.querySelector("#fetchStatus"),
    catalogGrid: document.querySelector("#catalogGrid"),
    catalogStatus: document.querySelector("#catalogStatus"),
    catalogCounter: document.querySelector("#catalogCounter"),
    searchForm: document.querySelector("#searchForm"),
    searchInput: document.querySelector("#searchInput"),
    categoryFilter: document.querySelector("#categoryFilter")
  };

  const updateMessage = (message) => {
    selectors.interactionMessage.textContent = message;
  };

  const setStatus = (element, message, type = "info") => {
    element.className = `alert alert-${type} border-0`;
    element.textContent = message;
  };

  const createCard = (product, options = {}) => {
    const column = document.createElement("div");
    column.className = "col";
    const productLabel = product.typeLabel || product.category || "Producto";

    column.innerHTML = `
      <article class="card surface-card product-card h-100">
        <div class="product-media">
          <img src="${product.image}" class="card-img-top" alt="${product.alt}" loading="lazy">
          <span class="product-type-badge">${productLabel}</span>
        </div>
        <div class="card-body">
          <p class="small text-uppercase text-soft fw-bold mb-1">${product.platform}</p>
          <h3 class="h5 card-title">${product.name}</h3>
          <p class="card-text">${product.description}</p>
        </div>
        <div class="card-footer bg-transparent border-secondary d-flex justify-content-between align-items-center gap-3">
          <strong class="text-warning">${formatPrice(product.price)}</strong>
          <button class="btn btn-sm btn-cyan" type="button" data-product-id="${product.id}" data-source="${options.source || "catalog"}" aria-label="Agregar ${product.name} al carrito">Agregar</button>
        </div>
      </article>
    `;

    const card = column.querySelector(".card");
    card.addEventListener("mouseover", () => {
      card.classList.add("product-focus");
      updateMessage(`Estas revisando ${product.name}. Puedes sumarlo a tu compra con el boton Agregar.`);
    });

    card.addEventListener("mouseout", () => {
      card.classList.remove("product-focus");
    });

    return column;
  };

  const renderCatalog = (products) => {
    selectors.catalogGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    products.forEach((product) => {
      fragment.appendChild(createCard(product, { source: "catalog" }));
    });

    selectors.catalogGrid.appendChild(fragment);
    selectors.catalogCounter.textContent = `${products.length} producto(s)`;

    if (products.length === 0) {
      setStatus(selectors.catalogStatus, "No encontramos productos con esa busqueda. Prueba con otra palabra o categoria.", "warning");
      return;
    }

    setStatus(selectors.catalogStatus, "Catalogo cargado correctamente con productos disponibles para compra.", "success");
  };

  const renderLaunches = (products) => {
    selectors.dynamicProducts.innerHTML = "";
    const fragment = document.createDocumentFragment();

    products.forEach((product) => {
      fragment.appendChild(createCard(product, { source: "launch" }));
    });

    selectors.dynamicProducts.appendChild(fragment);
    setStatus(selectors.fetchStatus, "Novedades cargadas correctamente.", "success");
  };

  const renderCart = () => {
    selectors.cartCount.textContent = state.cart.length;
    selectors.cartItems.innerHTML = "";

    if (state.cart.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "list-group-item bg-transparent cart-empty px-0";
      emptyItem.textContent = "El carrito esta vacio.";
      selectors.cartItems.appendChild(emptyItem);
      selectors.cartTotal.textContent = "$0";
      return;
    }

    const fragment = document.createDocumentFragment();

    state.cart.forEach((item, index) => {
      const listItem = document.createElement("li");
      listItem.className = "list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center gap-3";

      const itemName = document.createElement("span");
      itemName.className = "cart-item-name";
      itemName.textContent = item.name;

      const removeButton = document.createElement("button");
      removeButton.className = "btn btn-sm btn-outline-warning";
      removeButton.type = "button";
      removeButton.textContent = "Quitar";
      removeButton.setAttribute("aria-label", `Quitar ${item.name} del carrito`);
      removeButton.addEventListener("click", () => {
        state.cart.splice(index, 1);
        renderCart();
        updateMessage(`${item.name} fue eliminado del carrito.`);
      });

      listItem.appendChild(itemName);
      listItem.appendChild(removeButton);
      fragment.appendChild(listItem);
    });

    selectors.cartItems.appendChild(fragment);
    const total = state.cart.reduce((sum, item) => sum + item.price, 0);
    selectors.cartTotal.textContent = formatPrice(total);
  };

  const findProduct = (id, source) => {
    const collection = source === "launch" ? state.launches : state.catalog;
    return collection.find((product) => product.id === id);
  };

  const addProductToCart = (id, source) => {
    const product = findProduct(id, source);
    if (!product) return;

    state.cart.push(product);
    renderCart();
    updateMessage(`${product.name} fue agregado a tu carrito.`);
  };

  const applySearch = () => {
    const term = selectors.searchInput.value.trim().toLowerCase();
    const category = selectors.categoryFilter.value;

    state.filteredCatalog = state.catalog.filter((product) => {
      const text = `${product.name} ${product.platform} ${product.description} ${product.typeLabel}`.toLowerCase();
      const matchesText = text.includes(term);
      const matchesCategory = category === "todas" || product.category === category;
      return matchesText && matchesCategory;
    });

    renderCatalog(state.filteredCatalog);
  };

  const loadCatalog = async () => {
    try {
      setStatus(selectors.catalogStatus, "Cargando catalogo de productos...", "info");
      const response = await fetch("assets/data/catalogo.json", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("No se pudo cargar el catalogo.");
      }

      state.catalog = await response.json();
      state.filteredCatalog = [...state.catalog];
      renderCatalog(state.filteredCatalog);
    } catch (error) {
      console.error(error);
      selectors.catalogGrid.innerHTML = "";
      selectors.catalogCounter.textContent = "0 producto(s)";
      setStatus(
        selectors.catalogStatus,
        "No pudimos cargar el catalogo. Abre el sitio con Live Server y verifica que assets/data/catalogo.json exista.",
        "danger"
      );
    }
  };

  const loadLaunches = async () => {
    try {
      setStatus(selectors.fetchStatus, "Cargando novedades...", "info");
      const response = await fetch("assets/data/lanzamientos.json", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los lanzamientos.");
      }

      state.launches = await response.json();
      renderLaunches(state.launches);
    } catch (error) {
      console.error(error);
      selectors.dynamicProducts.innerHTML = "";
      setStatus(
        selectors.fetchStatus,
        "No se pudieron cargar las novedades. Abre el sitio con Live Server y verifica que assets/data/lanzamientos.json exista.",
        "danger"
      );
    }
  };

  selectors.catalogGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-id]");
    if (!button) return;
    addProductToCart(Number(button.dataset.productId), button.dataset.source);
  });

  selectors.dynamicProducts.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-id]");
    if (!button) return;
    addProductToCart(Number(button.dataset.productId), button.dataset.source);
  });

  selectors.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applySearch();
  });

  selectors.clearCartButton.addEventListener("click", () => {
    state.cart.length = 0;
    renderCart();
    updateMessage("El carrito fue vaciado.");
  });

  selectors.toggleDealButton.addEventListener("click", () => {
    const isHidden = selectors.dealDetails.classList.toggle("d-none");
    selectors.toggleDealButton.textContent = isHidden ? "Ver detalle" : "Ocultar detalle";
    updateMessage(isHidden ? "Se oculto el detalle de la oferta." : "Se mostro informacion adicional de la oferta.");
  });

  selectors.contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(selectors.contactForm);
    const name = formData.get("customerName").trim();
    const email = formData.get("customerEmail").trim();
    const interest = formData.get("customerInterest");

    if (!name || !email || !interest) {
      selectors.formFeedback.className = "mt-3 mb-0 text-warning";
      selectors.formFeedback.textContent = "Completa nombre, correo e interes para enviar la solicitud.";
      return;
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validEmail) {
      selectors.formFeedback.className = "mt-3 mb-0 text-warning";
      selectors.formFeedback.textContent = "Ingresa un correo valido para continuar.";
      return;
    }

    selectors.formFeedback.className = "mt-3 mb-0 text-info";
    selectors.formFeedback.textContent = `Gracias, ${name}. Te enviaremos novedades sobre ${interest}.`;
    selectors.contactForm.reset();
  });

  selectors.reloadProductsButton.addEventListener("click", loadLaunches);

  renderCart();
  loadCatalog();
  loadLaunches();
});
