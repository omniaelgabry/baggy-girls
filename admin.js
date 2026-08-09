import { db, storage, collection, addDoc, getDocs, deleteDoc, doc, ref, uploadBytesResumable, getDownloadURL, deleteObject } from './firebase-config.js';

// DOM Elements
const form = document.getElementById('add-product-form');
const nameInput = document.getElementById('product-name');
const priceInput = document.getElementById('product-price');
const imagesInput = document.getElementById('product-images');
const fileCountMsg = document.getElementById('file-count-msg');
const imagePreviews = document.getElementById('image-previews');
const submitBtn = document.getElementById('submit-btn');
const tbody = document.getElementById('products-tbody');
const loadingOverlay = document.getElementById('loading-overlay');
const emptyState = document.getElementById('empty-state');
const refreshBtn = document.getElementById('refresh-btn');

let selectedFiles = [];

// Handle file selection & preview
imagesInput.addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length === 0) {
        fileCountMsg.textContent = 'لم يتم اختيار صور';
        imagePreviews.innerHTML = '';
        return;
    }
    
    fileCountMsg.textContent = `تم اختيار ${selectedFiles.length} صورة/صور`;
    imagePreviews.innerHTML = '';
    
    selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-16 h-16 object-cover rounded-lg shadow-sm border border-gray-200';
            imagePreviews.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// Upload images securely via our own Vercel Backend
async function uploadToUploadThing(files) {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    // إرسال الصور للخادم الخاص بنا الذي سيقوم بالرفع السري
    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        let errorMsg = "فشل الرفع.";
        try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
    }

    const result = await response.json();
    
    // UploadThing returns an array of uploaded file data: [{ url: "..." }, ...]
    // or our API returns { data: [{ url: "..." }] }
    let dataArray = Array.isArray(result) ? result : (result.data || result);
    
    if (dataArray && dataArray.length > 0) {
        return dataArray.map(res => res.url || res.data?.url || res);
    } else {
        throw new Error("الرفع نجح ولكن لم يتم العثور على روابط للصور.");
    }
}

// Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
        alert('الرجاء اختيار صورة واحدة على الأقل');
        return;
    }

    // Set loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> جاري الرفع...';
    submitBtn.disabled = true;
    
    try {
        // 1. Upload Images to UploadThing directly
        const imageUrls = await uploadToUploadThing(selectedFiles);
        
        // 2. Save to Firestore
        await addDoc(collection(db, "products"), {
            name: nameInput.value,
            price: Number(priceInput.value),
            images: imageUrls,
            createdAt: new Date().toISOString()
        });
        
        alert('تمت إضافة المنتج بنجاح!');
        
        // Reset form
        form.reset();
        selectedFiles = [];
        imagePreviews.innerHTML = '';
        fileCountMsg.textContent = 'لم يتم اختيار صور';
        
        // Refresh Table
        fetchProducts();
        
    } catch (error) {
        console.error("Error adding product: ", error);
        alert('حدث خطأ أثناء الإضافة: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});

// Fetch and display products
async function fetchProducts() {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');
    tbody.innerHTML = '';
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        
        if (querySnapshot.empty) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            loadingOverlay.classList.add('hidden');
            loadingOverlay.classList.remove('flex');
            return;
        }
        
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        
        querySnapshot.forEach((docSnap) => {
            const product = docSnap.data();
            const id = docSnap.id;
            
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 transition-colors group';
            
            // Generate images HTML
            let imagesHtml = '';
            if (product.images && product.images.length > 0) {
                // Show first image, indicate if more
                imagesHtml = `<div class="relative w-12 h-12 inline-block">
                    <img src="${product.images[0]}" class="w-12 h-12 rounded-lg object-cover shadow-sm">
                    ${product.images.length > 1 ? `<div class="absolute -bottom-2 -right-2 bg-dark-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">+${product.images.length - 1}</div>` : ''}
                </div>`;
            } else {
                imagesHtml = `<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400"><i class="fa-solid fa-image"></i></div>`;
            }
            
            tr.innerHTML = `
                <td class="p-4">
                    <div class="flex items-center gap-4">
                        ${imagesHtml}
                        <span class="font-bold text-gray-900">${product.name}</span>
                    </div>
                </td>
                <td class="p-4 font-bold text-gold-600">${product.price} ج.م</td>
                <td class="p-4 text-center">
                    <button class="delete-btn text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100" data-id="${id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Attach delete events
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذه الخطوة.')) {
                    await deleteProduct(id);
                }
            });
        });
        
    } catch (error) {
        console.error("Error fetching products: ", error);
        alert('حدث خطأ أثناء جلب المنتجات.');
    } finally {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
    }
}

// Delete product from Firestore
async function deleteProduct(id) {
    try {
        // Note: In a production app, you should also delete the associated images from Storage
        // For simplicity here, we're just deleting the document from Firestore.
        // To delete images, we would need to store the Storage References or parse URLs.
        
        await deleteDoc(doc(db, "products", id));
        fetchProducts(); // Refresh list
    } catch (error) {
        console.error("Error deleting document: ", error);
        alert('حدث خطأ أثناء الحذف.');
    }
}

// Initialize
refreshBtn.addEventListener('click', fetchProducts);
fetchProducts();
