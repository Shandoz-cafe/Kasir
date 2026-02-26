// LOYVERSE POS CLONE - MAIN LOGIC
class LoyversePOS {
    constructor() {
        this.cart = [];
        this.products = [
            {id:1, name:'Burger Special', price:25000, stock:50, img:'🍔'},
            {id:2, name:'Mie Acih Pedas', price:18000, stock:30, img:'🍜'},
            {id:3, name:'Es Teh Manis', price:8000, stock:100, img:'🥤'},
            {id:4, name:'Seblak Power', price:22000, stock:25, img:'🌶️'}
        ];
        this.init();
    }

    init() {
        this.renderProducts();
        this.updateStats();
        this.bindEvents();
        setInterval(() => this.updateStats(), 60000);
    }

    bindEvents() {
        // Product search
        document.getElementById('productSearch').addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });

        // Tab switching
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.dataset.tab);
            });
        });

        // Discount change
        document.getElementById('discountInput').addEventListener('input', () => {
            this.updateCartTotal();
        });
    }

    renderProducts() {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = this.products.map(product => `
            <div class="product-card" onclick="pos.addToCart(${product.id})">
                <div style="font-size: 48px; margin-bottom: 10px;">${product.img}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">Rp ${product.price.toLocaleString()}</div>
            </div>
        `).join('');
    }

    searchProducts(query) {
        const filtered = this.products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase())
        );
        const grid = document.getElementById('productGrid');
        grid.innerHTML = filtered.map(product => `
            <div class="product-card" onclick="pos.addToCart(${product.id})">
                <div style="font-size: 48px;">${product.img}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">Rp ${product.price.toLocaleString()}</div>
            </div>
        `).join('');
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        const existing = this.cart.find(item => item.productId === productId);
        
        if (existing) {
            if (product.stock > existing.qty) {
                existing.qty++;
            } else {
                alert('Stok habis!');
                return;
            }
        } else {
            this.cart.push({productId, ...product, qty: 1});
        }
        
        this.renderCart();
        this.updateCartTotal();
    }

    renderCart() {
        const cartItems = document.getElementById('cartItems');
        cartItems.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item">
                <div>
                    <div class="cart-item-name">${item.name}</div>
                    <div>Rp ${item.price.toLocaleString()} × ${item.qty}</div>
                </div>
                <div>
                    <div class="cart-item-price">Rp ${(item.price * item.qty).toLocaleString()}</div>
                    <button onclick="pos.removeFromCart(${index})" style="background:none;border:none;font-size:20px;cursor:pointer;">×</button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('cartItemCount').textContent = `(${this.cart.length})`;
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.renderCart();
        this.updateCartTotal();
    }

    updateCartTotal() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discount = parseInt(document.getElementById('discountInput').value) || 0;
        const finalTotal = subtotal * (100 - discount) / 100;
        
        document.getElementById('subtotal').textContent = `Rp ${subtotal.toLocaleString()}`;
        document.getElementById('finalTotal').textContent = `Rp ${finalTotal.toLocaleString()}`;
    }

    processPayment(type) {
        if (this.cart.length === 0) {
            alert('Keranjang kosong!');
            return;
        }
        
        const total = parseInt(document.getElementById('finalTotal').textContent.replace(/Rp |,/g, ''));
        const receipt = this.generateReceipt(total, type);
        
        // Show print modal
        document.getElementById('receiptPreview').textContent = receipt;
        document.getElementById('printModal').classList.add('active');
        
        // Clear cart
        this.cart = [];
        this.renderCart();
        this.updateCartTotal();
    }

    generateReceipt(total, paymentType) {
        const date = new Date().toLocaleString('id-ID');
        return `CAFE BANDUNG
Jl. Braga No. 123 - Bandung
===================
${date}

${this.cart.map(item => `${item.name.padEnd(15)}x${item.qty}`.slice(0,20)).join('
')}

===================
     TOTAL: Rp ${total.toLocaleString()}
     ${paymentType.toUpperCase()}
===================
Terima kasih!
Kasir: ${firebaseUser?.email || 'Staff'}
       `;
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        event.target.closest('.menu-item').classList.add('active');
    }

    updateStats() {
        // Simulated stats
        document.getElementById('todaySales').textContent = 'Rp 1.250.000';
        document.getElementById('orderCount').textContent = '23';
        document.getElementById('cashRegister').textContent = 'Rp 950.000';
    }
}

// GLOBAL VARS
const pos = new LoyversePOS();

// UTILITY FUNCTIONS
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function closePrintModal() {
    document.getElementById('printModal').classList.remove('active');
}

function printReceipt() {
    // Use printer.js for thermal printing
    printThermalReceipt(document.getElementById('receiptPreview').textContent);
    closePrintModal();
}

function clearCart() {
    pos.cart = [];
    pos.renderCart();
    pos.updateCartTotal();
    document.getElementById('discountInput').value = 0;
}

function logout() {
    firebase.auth().signOut();
}
