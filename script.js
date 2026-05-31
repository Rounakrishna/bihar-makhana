document.addEventListener('DOMContentLoaded', () => {
    const addToCartButtons = document.querySelectorAll('.add-cart-btn');
    const cartCountElement = document.querySelector('.cart-count');
    const cartLinks = document.querySelectorAll('.cart-icon');

    // Initialize cart from localStorage
    let cart = JSON.parse(localStorage.getItem('biharMakhanaCart')) || [];

    // Filter out potential null/invalid items from previous bugs
    cart = cart.filter(item => item && item.name && item.price);
    localStorage.setItem('biharMakhanaCart', JSON.stringify(cart));

    updateCartCount();

    // Check initialized buttons state
    addToCartButtons.forEach(button => {
        const productId = button.getAttribute('data-id');
        if (cart.some(item => item.id === productId)) {
            markButtonAsAdded(button);
        }

        button.addEventListener('click', (e) => {
            e.preventDefault();

            const productId = button.getAttribute('data-id');
            const product = {
                id: productId,
                name: button.getAttribute('data-name'),
                price: parseInt(button.getAttribute('data-price')),
                image: button.getAttribute('data-image'),
                quantity: 1
            };

            // Check if already in cart
            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                // If requested, we could increment quantity here. 
                // For now, if "Added" state is strictly visual for "in cart", we just ensure it's there.
                // Or we can just alert/notify.
                // existingItem.quantity++; 
            } else {
                cart.push(product);
                localStorage.setItem('biharMakhanaCart', JSON.stringify(cart));
                updateCartCount();

                // Visual Feedback
                if (cartCountElement) {
                    cartCountElement.classList.add('bump');
                }
                markButtonAsAdded(button);

                setTimeout(() => {
                    if (cartCountElement) {
                        cartCountElement.classList.remove('bump');
                    }
                }, 300);
            }
        });
    });

    function updateCartCount() {
        if (cartCountElement) {
            cartCountElement.textContent = cart.length;
        }
    }

    cartLinks.forEach((cartLink) => {
        cartLink.setAttribute('role', 'link');
        cartLink.setAttribute('tabindex', '0');
        cartLink.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                window.location.href = 'cart.html';
            }
        });
    });

    function markButtonAsAdded(button) {
        button.innerHTML = '<i class="fa-solid fa-check"></i>';
        button.classList.add('added');
        // button.style.cursor = 'default'; // Let them click again if logic changes to allow adding more

        // Add visual "Added" badge
        const productCard = button.closest('.product-card');
        if (!productCard) return;

        const productImage = productCard.querySelector('.product-image');
        let badge = productImage.querySelector('.added-badge');

        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'added-badge';
            badge.innerHTML = '<i class="fa-solid fa-check"></i> Added';
            productImage.appendChild(badge);

            // Trigger animation
            setTimeout(() => badge.classList.add('show'), 10);
        } else {
            badge.classList.add('show');
        }
    }
    // Mobile Hamburger Menu
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        const closeMenu = () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        };

        const toggleMenu = () => {
            const willOpen = !navLinks.classList.contains('active');
            navLinks.classList.toggle('active', willOpen);
            hamburger.classList.toggle('active', willOpen);
            hamburger.setAttribute('aria-expanded', String(willOpen));
            document.body.classList.toggle('menu-open', willOpen);
        };

        hamburger.setAttribute('role', 'button');
        hamburger.addEventListener('click', toggleMenu);
        hamburger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleMenu();
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('click', (event) => {
            if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
                closeMenu();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMenu();
            }
        });
    }
});
