document.addEventListener('DOMContentLoaded', () => {
    const addToCartButtons = document.querySelectorAll('.add-cart-btn');
    const cartCountElement = document.querySelector('.cart-count');

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
                cartCountElement.classList.add('bump');
                markButtonAsAdded(button);

                setTimeout(() => {
                    cartCountElement.classList.remove('bump');
                }, 300);
            }
        });
    });

    function updateCartCount() {
        if (cartCountElement) {
            cartCountElement.textContent = cart.length;
        }
    }

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
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active'); // Optional: for X animation
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }
});
