import { db, doc } from './firebase-config.js';
import { getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const productContainer = document.getElementById('product-container');

const mainImage = document.getElementById('main-image');
const thumbnailsContainer = document.getElementById('thumbnails-container');
const productTitle = document.getElementById('product-title');
const productPrice = document.getElementById('product-price');
const addToCartBtn = document.getElementById('add-to-cart-btn');
const directWhatsappBtn = document.getElementById('direct-whatsapp-btn');
const themeToggle = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;

let currentProduct = null;
const phoneNumber = "201010442336";

// --- Dark Mode Logic ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlEl.classList.add('dark');
    } else {
        htmlEl.classList.remove('dark');
    }
}
themeToggle.addEventListener('click', () => {
    htmlEl.classList.toggle('dark');
    localStorage.setItem('theme', htmlEl.classList.contains('dark') ? 'dark' : 'light');
});
initTheme();

// --- Fetch Product Details ---
async function fetchProductDetails() {
    if (!productId) {
        showError();
        return;
    }

    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentProduct = { id: docSnap.id, ...docSnap.data() };
            renderProductDetails();
        } else {
            showError();
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        showError();
    }
}

function showError() {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorState.classList.add('flex');
}

function renderProductDetails() {
    loadingState.classList.add('hidden');
    productContainer.classList.remove('hidden');
    
    productTitle.textContent = currentProduct.name;
    productPrice.textContent = `${currentProduct.price} جنيه`;
    const descEl = document.getElementById('product-description');
    if (descEl) {
        descEl.textContent = currentProduct.description || 'تصميم عصري يجمع بين الأناقة والعملية. مصنوعة من مواد عالية الجودة لتلائم إطلالتك اليومية أو في المناسبات الخاصة.';
    }
    
    if (currentProduct.images && currentProduct.images.length > 0) {
        mainImage.src = currentProduct.images[0];
        
        // Render thumbnails
        thumbnailsContainer.innerHTML = '';
        currentProduct.images.forEach((imgSrc, index) => {
            const thumbDiv = document.createElement('div');
            thumbDiv.className = `w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${index === 0 ? 'border-gold-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`;
            
            const img = document.createElement('img');
            img.src = imgSrc;
            img.className = 'w-full h-full object-cover';
            
            thumbDiv.appendChild(img);
            
            thumbDiv.addEventListener('click', () => {
                // Update main image
                mainImage.src = imgSrc;
                // Update active state
                document.querySelectorAll('#thumbnails-container > div').forEach(d => {
                    d.classList.remove('border-gold-500', 'opacity-100');
                    d.classList.add('border-transparent', 'opacity-60');
                });
                thumbDiv.classList.add('border-gold-500', 'opacity-100');
                thumbDiv.classList.remove('border-transparent', 'opacity-60');
            });
            
            thumbnailsContainer.appendChild(thumbDiv);
        });
    } else {
        mainImage.src = 'https://via.placeholder.com/600x800?text=No+Image';
    }
}

// --- Action Buttons ---
addToCartBtn.addEventListener('click', () => {
    // Save to local storage cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...currentProduct, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Redirect to home with cart open, or show toast
    showToast(`تم إضافة "${currentProduct.name}" للسلة بنجاح!`);
    
    setTimeout(() => {
        window.location.href = 'index.html?cart=open';
    }, 1500);
});

directWhatsappBtn.addEventListener('click', () => {
    let message = `مرحباً، أود طلب هذا المنتج فوراً:\n\n`;
    message += `*المنتج:* ${currentProduct.name}\n`;
    message += `*السعر:* ${currentProduct.price} ج.م\n`;
    if(currentProduct.images && currentProduct.images.length > 0) {
        message += `*صورة المنتج:* ${currentProduct.images[0]}\n`;
    }
    message += `\nالرجاء تأكيد الطلب، وشكراً!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
});

// --- Toast System ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast show'; // ensure animation css is applied
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 2000);
}

// Init
fetchProductDetails();
