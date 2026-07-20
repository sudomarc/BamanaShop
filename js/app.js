/**
 * js/app.js - BamanaShop Core Interactive Features
 * Handled features:
 * 1. Shopping Cart State, UI rendering, calculations & simulated checkout
 * 2. Search & Category filtering
 * 3. Light / Dark theme toggling with localStorage persistence
 * 4. Image Lightbox for product cards
 * 5. Validated Contact Form with dynamic toast notifications
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let cart = JSON.parse(localStorage.getItem('bamanashop_cart')) || [];
    let currentTheme = localStorage.getItem('bamanashop_theme') || 'light';

    // Apply persisted theme immediately
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // --- Dom Elements ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartBadge = document.getElementById('cart-badge');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const toastContainer = document.getElementById('toast-container');

    // Filters & Search
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.produit-card');

    // Contact Form
    const contactForm = document.getElementById('contact-form');

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');

    // --- Helper functions ---

    // Toast Notification System
    function showToast(message, type = 'info') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Slide out and remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toast-slide-in 0.3s ease reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // --- 1. Cart Management ---

    // Save cart state to local storage
    function saveCart() {
        localStorage.setItem('bamanashop_cart', JSON.stringify(cart));
        updateCartUI();
    }

    // Update Cart UI components
    function updateCartUI() {
        if (!cartBadge || !cartItemsContainer || !cartTotalPrice) return;

        // Total quantity count
        const totalQty = cart.reduce((total, item) => total + item.quantity, 0);
        cartBadge.textContent = totalQty;

        // Render Cart items
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Votre panier est vide.</p>';
            cartTotalPrice.textContent = '0,00 €';
        } else {
            cartItemsContainer.innerHTML = '';
            let grandTotal = 0;

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                grandTotal += itemTotal;

                const itemRow = document.createElement('div');
                itemRow.className = 'cart-item';
                itemRow.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${item.price.toFixed(2)} €</div>
                        <div class="cart-item-quantity">
                            <button class="qty-btn qty-decrease" data-id="${item.id}">-</button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn qty-increase" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="remove-item-btn" data-id="${item.id}">Retirer</button>
                `;
                cartItemsContainer.appendChild(itemRow);
            });

            cartTotalPrice.textContent = `${grandTotal.toFixed(2)} €`;
        }
    }

    // Add to Cart
    function addToCart(id, name, price, image) {
        const parsedId = parseInt(id);
        const parsedPrice = parseFloat(price);

        const existingItem = cart.find(item => item.id === parsedId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: parsedId,
                name: name,
                price: parsedPrice,
                image: image,
                quantity: 1
            });
        }
        saveCart();
        showToast(`"${name}" ajouté au panier !`, 'success');
    }

    // Change Cart Item Quantity
    function changeQuantity(id, action) {
        const parsedId = parseInt(id);
        const item = cart.find(item => item.id === parsedId);
        if (!item) return;

        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                cart = cart.filter(item => item.id !== parsedId);
            }
        }
        saveCart();
    }

    // Remove item entirely
    function removeItem(id) {
        const parsedId = parseInt(id);
        const item = cart.find(item => item.id === parsedId);
        if (item) {
            cart = cart.filter(item => item.id !== parsedId);
            saveCart();
            showToast(`"${item.name}" retiré du panier.`, 'info');
        }
    }

    // Clear cart
    function clearCart(quiet = false) {
        cart = [];
        saveCart();
        if (!quiet) {
            showToast('Panier vidé.', 'info');
        }
    }

    // Event Delegation inside Cart Drawer
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            if (!id) return;

            if (e.target.classList.contains('qty-increase')) {
                changeQuantity(id, 'increase');
            } else if (e.target.classList.contains('qty-decrease')) {
                changeQuantity(id, 'decrease');
            } else if (e.target.classList.contains('remove-item-btn')) {
                removeItem(id);
            }
        });
    }

    // Purchase listener from main cards
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.produit-card');
            if (!card) return;

            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name');
            const price = card.getAttribute('data-price');
            const image = card.querySelector('img').getAttribute('src');

            addToCart(id, name, price, image);
        });
    });

    // Cart Modal toggles
    if (cartBtn && cartModal) {
        cartBtn.addEventListener('click', () => {
            cartModal.classList.add('active');
        });
    }

    if (closeCartBtn && cartModal) {
        closeCartBtn.addEventListener('click', () => {
            cartModal.classList.remove('active');
        });
    }

    // Click outside cart modal to close
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.classList.remove('active');
        }
    });

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Votre panier est déjà vide !', 'info');
                return;
            }
            if (confirm('Voulez-vous vraiment vider l\'ensemble de votre panier ?')) {
                clearCart();
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Votre panier est vide. Ajoutez des pièces avant de passer commande !', 'info');
                return;
            }

            showToast('Simulation d\'achat réussie ! Merci pour votre confiance.', 'success');
            clearCart(true);
            if (cartModal) {
                cartModal.classList.remove('active');
            }
        });
    }

    // --- 2. Theme Toggling ---
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            const targetTheme = isDark ? 'dark' : 'light';
            localStorage.setItem('bamanashop_theme', targetTheme);
            showToast(`Mode ${targetTheme === 'dark' ? 'Sombre' : 'Clair'} activé !`, 'info');
        });
    }

    // --- 3. Product Search and Category Filters ---
    function filterProducts() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const activeCategory = activeFilterBtn ? activeFilterBtn.getAttribute('data-category') : 'all';

        productCards.forEach(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            const category = card.getAttribute('data-category');
            const desc = card.querySelector('.description').textContent.toLowerCase();

            const matchesSearch = name.includes(query) || desc.includes(query);
            const matchesCategory = activeCategory === 'all' || category === activeCategory;

            if (matchesSearch && matchesCategory) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterProducts();
        });
    });

    // --- 4. Image Lightbox ---
    document.querySelectorAll('.lightbox-trigger').forEach(img => {
        img.addEventListener('click', (e) => {
            if (!lightbox || !lightboxImg || !lightboxCaption) return;
            lightbox.style.display = "block";
            lightboxImg.src = e.target.src;
            lightboxCaption.textContent = e.target.alt;
            setTimeout(() => {
                lightbox.classList.add('active');
            }, 50);
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            if (!lightbox) return;
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightbox.style.display = "none";
            }, 300);
        });
    }

    // Click outside lightbox to close
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
                lightbox.classList.remove('active');
                setTimeout(() => {
                    lightbox.style.display = "none";
                }, 300);
            }
        });
    }

    // --- 5. Contact Form Validation ---
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            if (!name || !email || !message) {
                showToast('Veuillez remplir tous les champs du formulaire.', 'info');
                return;
            }

            // Simple validation check
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                showToast('Veuillez saisir une adresse e-mail valide.', 'info');
                return;
            }

            // Success simulation
            showToast('Votre message a bien été envoyé ! Nous vous répondrons dans les plus brefs délais.', 'success');
            contactForm.reset();
        });
    }

    // Init Cart view on page load
    updateCartUI();
});
