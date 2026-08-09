import { db, collection, getDocs } from './firebase-config.js';

// --- State & DOM Elements ---
let products = [];
let cart = [];
const phoneNumber = "201010442336";

const htmlEl = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const splashScreen = document.getElementById('splash-screen');
const enterSiteBtn = document.getElementById('enter-site-btn');
const navbar = document.getElementById('navbar');
const productsGrid = document.getElementById('products-grid');
const giftFinderForm = document.getElementById('gift-finder-form');

const cartToggle = document.getElementById('cart-toggle');
const closeCartBtn = document.getElementById('close-cart');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountBadge = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total');
const whatsappCheckoutBtn = document.getElementById('whatsapp-checkout');

// --- Fetch Products from Firebase ---
async function loadProducts() {
    productsGrid.innerHTML = '<div class="col-span-full text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-gold-500"></i><p class="mt-4 text-gray-500">جاري تحميل المنتجات من قاعدة البيانات...</p></div>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];
        querySnapshot.forEach((docSnap) => {
            products.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        productsGrid.innerHTML = '<p class="col-span-full text-center text-red-500 py-10">حدث خطأ أثناء تحميل المنتجات. تأكد من اتصالك بالإنترنت وتوافر الصلاحيات.</p>';
    }
}

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

// --- Splash Screen & Navbar ---
function hideSplash() {
    splashScreen.style.opacity = '0';
    setTimeout(() => {
        splashScreen.style.display = 'none';
        navbar.classList.remove('-translate-y-full', 'opacity-0');
        document.body.style.overflow = 'auto'; 
    }, 1000);
}
document.body.style.overflow = 'hidden'; 
enterSiteBtn.addEventListener('click', hideSplash);
setTimeout(() => { if(splashScreen.style.display !== 'none') hideSplash(); }, 2500);

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('shadow-md');
    } else {
        navbar.classList.remove('shadow-md');
    }
});

// --- Scroll Animations ---
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

function observeElements() {
    document.querySelectorAll('.scroll-anim').forEach(el => observer.observe(el));
}

// --- Render Products ---
function renderProducts(productsToRender = products, container = productsGrid) {
    container.innerHTML = '';
    
    if (productsToRender.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-gray-500 py-10">لا توجد منتجات متاحة حالياً.</p>';
        return;
    }

    productsToRender.forEach((product, index) => {
        const delay = index * 100;
        const mainImage = (product.images && product.images.length > 0) ? product.images[0] : 'https://via.placeholder.com/400x500?text=No+Image';

        const card = document.createElement('div');
        card.className = `product-card bg-white dark:bg-dark-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-300 scroll-anim border border-gray-100 dark:border-gray-800 flex flex-col group`;
        card.style.animationDelay = `${delay}ms`;
        
        card.innerHTML = `
            <div class="product-card-img-container aspect-[4/5] overflow-hidden relative bg-gray-100 dark:bg-dark-900 cursor-pointer" onclick="window.location.href='product.html?id=${product.id}'">
                <img src="${mainImage}" alt="${product.name}" class="product-card-img w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button onclick="event.stopPropagation(); window.addToCart('${product.id}')" class="bg-white text-black px-6 py-3 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-gold-500 hover:text-white">
                        <i class="fa-solid fa-cart-plus ml-2"></i> أضف للسلة
                    </button>
                </div>
            </div>
            <div class="p-6 flex flex-col flex-grow text-center cursor-pointer" onclick="window.location.href='product.html?id=${product.id}'">
                <h3 class="text-xl font-bold mb-2 font-display text-gray-900 dark:text-white">${product.name}</h3>
                <p class="text-gold-600 dark:text-gold-500 font-bold text-xl">${product.price} جنيه</p>
                ${product.images && product.images.length > 1 ? `<div class="mt-4 flex justify-center gap-2">${product.images.slice(0, 3).map(img => `<img src="${img}" class="w-8 h-8 rounded-full border border-gray-200 object-cover">`).join('')}</div>` : ''}
            </div>
        `;
        container.appendChild(card);
    });

    // Make them visible immediately if they render fast, or attach observer
    observeElements();
}

// Initial Load
loadProducts();
observeElements();

// --- Gift Finder Quiz ---
giftFinderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Since we removed category from admin, just shuffle or return all to simulate for now
    const shuffled = [...products].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    productsGrid.innerHTML = '<div class="col-span-full text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-gold-500"></i><p class="mt-4 text-gray-500">نبحث لك عن الأفضل...</p></div>';
    
    setTimeout(() => {
        renderProducts(shuffled.length > 0 ? shuffled : products);
        document.querySelectorAll('#products-grid .scroll-anim').forEach(el => el.classList.add('is-visible'));
    }, 800);
});

// --- Shopping Cart Logic ---
// Load cart from localStorage
const savedCart = localStorage.getItem('cart');
if (savedCart) {
    cart = JSON.parse(savedCart);
    // Give it a tiny delay to ensure DOM is ready
    setTimeout(() => updateCartUI(), 100);
}

// Check for cart=open param
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('cart') === 'open') {
    setTimeout(() => openCart(), 500);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

function openCart() {
    cartDrawer.classList.remove('translate-x-full');
    cartOverlay.classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartDrawer.classList.add('translate-x-full');
    cartOverlay.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
}

cartToggle.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// EXPOSE TO WINDOW FOR INLINE ONCLICK HANDLERS
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    showToast(`تمت إضافة "${product.name}" للسلة`);
}

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

window.updateQuantity = function(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            window.removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.textContent = totalItems;
    
    if (totalItems === 0) {
        cartItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-500 empty-cart-msg">
                <i class="fa-solid fa-bag-shopping text-6xl mb-4 text-gray-300 dark:text-gray-600"></i>
                <p>الحقيبة فارغة حالياً</p>
            </div>
        `;
        whatsappCheckoutBtn.disabled = true;
    } else {
        whatsappCheckoutBtn.disabled = false;
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="flex gap-4 bg-gray-50 dark:bg-dark-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 items-center">
                <img src="${item.images && item.images.length > 0 ? item.images[0] : ''}" alt="${item.name}" class="w-20 h-20 object-cover rounded-xl shadow-sm">
                <div class="flex-1">
                    <h4 class="font-bold text-gray-900 dark:text-white mb-1 text-sm">${item.name}</h4>
                    <p class="text-gold-500 font-bold mb-2">${item.price} ج.م</p>
                    <div class="flex items-center gap-3 bg-white dark:bg-dark-800 w-fit rounded-full px-2 py-1 shadow-sm border border-gray-100 dark:border-gray-700">
                        <button onclick="window.updateQuantity('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gold-500 transition-colors"><i class="fa-solid fa-minus text-xs"></i></button>
                        <span class="font-bold text-sm w-4 text-center">${item.quantity}</span>
                        <button onclick="window.updateQuantity('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gold-500 transition-colors"><i class="fa-solid fa-plus text-xs"></i></button>
                    </div>
                </div>
                <button onclick="window.removeFromCart('${item.id}')" class="text-gray-400 hover:text-red-500 transition-colors p-2">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalEl.textContent = `${totalAmount.toLocaleString()} جنيه`;
}

// --- WhatsApp Checkout ---
whatsappCheckoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;

    let message = "مرحباً، أود طلب المنتجات التالية من متجر Baggy Girls:\n\n";
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} (الكمية: ${item.quantity}) - ${item.price * item.quantity} ج.م\n`;
        if (item.images && item.images.length > 0) {
            message += `صورة المنتج: ${item.images[0]}\n`;
        }
        message += `\n`;
    });
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `*الإجمالي: ${totalAmount.toLocaleString()} ج.م*\n\n`;
    message += "الرجاء تأكيد الطلب، وشكراً!";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
});

// --- Toast Notification System ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 3000);
}
