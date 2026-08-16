// BamanaShop Client Application JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    let cart = JSON.parse(localStorage.getItem('bamana_cart')) || [];
    let activeCategory = 'all';
    let searchQuery = '';

    // DOM Elements
    const themeToggleBtn = document.getElementById('theme-toggle');
    const cartBtn = document.getElementById('cart-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartCountBadge = document.getElementById('cart-count');
    const cartDrawerCount = document.getElementById('cart-drawer-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.produit-card');
    const noResultsMsg = document.getElementById('no-results');
    const toastContainer = document.getElementById('toast-container');

    // 1. Theme Management (Light / Dark)
    const savedTheme = localStorage.getItem('bamana_theme') || 'light';
    setTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            showToast(`Thème ${newTheme === 'dark' ? 'Sombre' : 'Clair'} activé`);
        });
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('bamana_theme', theme);
        if (themeToggleBtn) {
            themeToggleBtn.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    // 2. Cart Drawer Management
    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    function openCart() {
        cartDrawer.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 3. Cart Logic
    function updateCartUI() {
        localStorage.setItem('bamana_cart', JSON.stringify(cart));

        const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountBadge.textContent = totalItemCount;
        cartDrawerCount.textContent = totalItemCount;

        const totalCost = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalPrice.textContent = `${totalCost.toFixed(2)} €`;

        renderCartItems();
    }

    function renderCartItems() {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="no-results">Votre panier est vide.</p>';
            return;
        }

        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.img}" alt="${item.name}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\' viewBox=\'0 0 60 60\'><rect width=\'100%\' height=\'100%\' fill=\'%23d97706\'/></svg>';">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${(item.price * item.quantity).toFixed(2)} €</div>
                    <div class="cart-item-qty">
                        <button class="qty-btn dec-btn" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn inc-btn" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="btn-text remove-item" data-id="${item.id}" title="Supprimer">&times;</button>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // Event listeners for item buttons
        cartItemsContainer.querySelectorAll('.inc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                changeQuantity(id, 1);
            });
        });

        cartItemsContainer.querySelectorAll('.dec-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                changeQuantity(id, -1);
            });
        });

        cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                removeFromCart(id);
            });
        });
    }

    function addToCart(product) {
        const existingIndex = cart.findIndex(item => item.id === product.id);
        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCartUI();
        showToast(`"${product.name}" ajouté au panier !`);
    }

    function changeQuantity(id, delta) {
        const index = cart.findIndex(item => item.id === id);
        if (index > -1) {
            cart[index].quantity += delta;
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
            updateCartUI();
        }
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
        showToast('Article retiré du panier.');
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                cart = [];
                updateCartUI();
                showToast('Panier vidé.');
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Votre panier est vide.');
                return;
            }
            alert('Ceci est une démonstration vitrine. Aucune commande réelle n\'a été passée.');
            cart = [];
            updateCartUI();
            closeCart();
        });
    }

    // Attach Add To Cart to Product Buttons
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            const product = {
                id: button.getAttribute('data-id'),
                name: button.getAttribute('data-name'),
                price: parseFloat(button.getAttribute('data-price')),
                img: button.getAttribute('data-img')
            };
            addToCart(product);
        });
    });

    // 4. Search and Filter Functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterProducts();
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.getAttribute('data-category');
            filterProducts();
        });
    });

    function filterProducts() {
        let visibleCount = 0;

        productCards.forEach(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            const category = card.getAttribute('data-category');

            const matchesCategory = activeCategory === 'all' || category === activeCategory;
            const matchesSearch = name.includes(searchQuery);

            if (matchesCategory && matchesSearch) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        if (noResultsMsg) {
            if (visibleCount === 0) {
                noResultsMsg.classList.remove('hidden');
            } else {
                noResultsMsg.classList.add('hidden');
            }
        }
    }

    // 5. Toast System
    function showToast(message) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initial Cart Setup
    updateCartUI();
});
