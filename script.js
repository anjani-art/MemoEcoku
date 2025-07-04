// script.js

// --- 1. Konfigurasi dan Inisialisasi Firebase ---
// GANTI DENGAN KONFIGURASI UNIK PROYEK FIREBASE ANDA!
// Anda bisa mendapatkan ini dari Firebase Console -> Project settings -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyCwsvVqHEJpBCZWkqQYIJjSqp_2u0rks6U", // <--- GANTI INI
    authDomain: "catataneco.firebaseapp.com",
    projectId: "catataneco",
    storageBucket: "catataneco.firebasestorage.app",
    messagingSenderId: "672805524230",
    appId: "1:672805524230:web:b50431c1e833efdabac487"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Inisialisasi Firestore
const auth = firebase.auth();   // Inisialisasi Authentication

// --- 2. Variabel Global Aplikasi & Elemen UI Utama ---
let currentUser = null; // Penting untuk melacak user yang sedang login
let confirmationResult; // Digunakan untuk alur autentikasi telepon (OTP)

// Elemen UI Autentikasi (pastikan ID ini ada di index.html Anda)
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const signupEmailButton = document.getElementById('signup-email-button');
const loginEmailButton = document.getElementById('login-email-button');

const authPhoneInput = document.getElementById('auth-phone');
const sendOtpButton = document.getElementById('send-otp-button');
const recaptchaContainer = document.getElementById('recaptcha-container'); // Penting untuk Phone Auth
const otpInputGroup = document.getElementById('otp-input-group'); // Grup input OTP
const authOtpInput = document.getElementById('auth-otp');
const verifyOtpButton = document.getElementById('verify-otp-button');
const authStatusMessage = document.getElementById('auth-status-message'); // Untuk pesan status login/error

// Elemen untuk pemilihan metode autentikasi
const showEmailAuthButton = document.getElementById('show-email-auth');
const showPhoneAuthButton = document.getElementById('show-phone-auth');
const emailAuthSubmenu = document.getElementById('email-auth-submenu');
const phoneAuthSubmenu = document.getElementById('phone-auth-submenu');
const userDisplayName = document.getElementById('user-display-name'); // Tambahkan ini untuk display nama user

// Elemen untuk item menu login/logout
const loginMenuItem = document.getElementById('login-menu-item');
const logoutMenuItem = document.getElementById('logout-menu-item');

// Elemen untuk halaman welcome-guest
const welcomeGuestPage = document.getElementById('welcome-guest-page');
// const goToAuthButton = document.getElementById('go-to-auth-button'); // Tombol ini sudah dihapus dari HTML


// Elemen UI Catatan
const addNoteButton = document.getElementById('add-note-button');
const noteTextInput = document.getElementById('note-text');
const pinnedNotesContainer = document.getElementById('pinned-notes-container');
const otherNotesContainer = document.getElementById('other-notes-container');
const emptyPinnedNotesMessage = document.getElementById('empty-pinned-notes-message');
const emptyOtherNotesMessage = document.getElementById('empty-other-notes-message');

// Elemen UI Keuangan Berkelanjutan
const transactionDescriptionInput = document.getElementById('transaction-description');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionTypeSelect = document.getElementById('transaction-type');
const addTransactionButton = document.getElementById('add-transaction-button');
const transactionListUl = document.getElementById('transaction-list');
const totalIncomeDisplay = document.getElementById('total-income');
const totalExpenseDisplay = document.getElementById('total-expense');
const currentBalanceDisplay = document.getElementById('current-balance');

// Elemen UI Produk Go Green
const productCategoriesGrid = document.getElementById('product-categories-grid');
const productListContainer = document.getElementById('product-list-container');
const productListCategoryTitle = document.getElementById('product-list-category-title');
const productDetailContent = document.getElementById('product-detail-content');

// --- Variabel untuk DOM Menu Samping (DEKLARASI GLOBAL) ---
// Ini penting agar elemen dapat diakses dari fungsi manapun.
const menuToggle = document.getElementById('menu-toggle');
const closeMenu = document.getElementById('close-menu');
const sideMenu = document.getElementById('side-menu');


// --- 3. Fungsi Utility Aplikasi ---
function showAuthMessage(message, isError = false) {
    if (authStatusMessage) {
        authStatusMessage.textContent = message;
        authStatusMessage.style.color = isError ? 'var(--error-color)' : 'var(--primary-color)';
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    const targetPageElement = document.getElementById(pageId + '-page');
    if (targetPageElement) {
        targetPageElement.classList.add('active');
        targetPageElement.style.display = 'block';
        const sideMenu = document.getElementById('side-menu');
        if (sideMenu) {
            sideMenu.classList.remove('active');
        }
    } else {
        console.error(`Page with ID ${pageId}-page not found.`);
    }
}

// Fungsi untuk menampilkan submenu autentikasi tertentu
function showAuthSubmenu(submenuId) {
    // Sembunyikan semua submenu terlebih dahulu
    document.querySelectorAll('.auth-submenu').forEach(submenu => {
        submenu.classList.remove('active');
        submenu.style.display = 'none'; // Pastikan disembunyikan secara visual
    });

    // Sembunyikan juga tombol pilihan autentikasi
    // Ini penting agar tombol email/telepon muncul hanya saat pertama kali di halaman auth
    if (showEmailAuthButton) showEmailAuthButton.style.display = 'none';
    if (showPhoneAuthButton) showPhoneAuthButton.style.display = 'none';


    const targetSubmenu = document.getElementById(submenuId);
    if (targetSubmenu) {
        targetSubmenu.classList.add('active');
        targetSubmenu.style.display = 'block'; // Tampilkan submenu yang dituju
    }
}


// --- 4. Listener Status Autentikasi Firebase (`onAuthStateChanged`) ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log('User signed in:', user.email || user.phoneNumber, 'UID:', user.uid);
        
        // Tampilkan nama user di beranda
        if (userDisplayName) {
            userDisplayName.textContent = user.email ? user.email.split('@')[0] : (user.phoneNumber || 'Pengguna');
        }

        showAuthMessage(`Selamat datang, ${user.email || user.phoneNumber || 'Pengguna'}!`, false);
        showPage('home'); // Arahkan ke halaman utama setelah login
        loadUserData(currentUser.uid); // Muat data user

        // Kontrol visibilitas menu samping
        if (loginMenuItem) loginMenuItem.style.display = 'none'; // Sembunyikan 'Login/Daftar'
        if (logoutMenuItem) logoutMenuItem.style.display = 'list-item'; // Tampilkan 'Logout'
    } else {
        currentUser = null;
        console.log('User signed out.');
        // Arahkan ke halaman welcome-guest jika belum login
        showPage('welcome-guest');
        showAuthMessage('Silakan masuk atau daftar.', false); // Pesan ini muncul di halaman auth saat diakses
        clearUserData(); // Bersihkan data lokal saat logout

        // Kontrol visibilitas menu samping
        if (loginMenuItem) loginMenuItem.style.display = 'list-item'; // Tampilkan 'Login/Daftar'
        if (logoutMenuItem) logoutMenuItem.style.display = 'none'; // Sembunyikan 'Logout'
    }
});


// --- 5. Fungsi Autentikasi ---
async function signupWithEmail() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    if (!email || !password) {
        showAuthMessage('Email dan password harus diisi.', true);
        return;
    }
    if (password.length < 6) {
        showAuthMessage('Password minimal 6 karakter.', true);
        return;
    }
    try {
        showAuthMessage('Mendaftar...', false);
        await auth.createUserWithEmailAndPassword(email, password);
        // User created, onAuthStateChanged akan handle redirect
    } catch (error) {
        showAuthMessage(`Error Daftar: ${error.message}`, true);
        console.error('Signup Error:', error);
    }
}

async function loginWithEmail() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    if (!email || !password) {
        showAuthMessage('Email dan password harus diisi.', true);
        return;
    }
    try {
        showAuthMessage('Masuk...', false);
        await auth.signInWithEmailAndPassword(email, password);
        // User signed in, onAuthStateChanged akan handle redirect
    } catch (error) {
        showAuthMessage(`Error Masuk: ${error.message}`, true);
        console.error('Login Error:', error);
    }
}

// Autentikasi Telepon - Inisialisasi reCAPTCHA
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(recaptchaContainer, {
    'size': 'normal', // atau 'invisible' jika ingin otomatis
    'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        // showAuthMessage('reCAPTCHA terverifikasi. Siap kirim OTP.', false);
    },
    'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        showAuthMessage('Verifikasi reCAPTCHA kadaluarsa. Coba lagi.', true);
    }
}, auth);
window.recaptchaVerifier.rendered = false; // Flag untuk melacak apakah sudah dirender

// Autentikasi Telepon - Kirim OTP
if (sendOtpButton) {
    sendOtpButton.addEventListener('click', () => {
        const phoneNumber = authPhoneInput.value.trim();
        if (!phoneNumber) {
            showAuthMessage('Harap masukkan nomor telepon.', true);
            return;
        }
        // Pastikan format internasional, cth: +628123456789
        if (!phoneNumber.startsWith('+')) {
            showAuthMessage('Format nomor telepon harus diawali dengan kode negara (cth: +628...).', true);
            return;
        }

        showAuthMessage('Mengirim kode OTP...', false);
        const appVerifier = window.recaptchaVerifier;
        auth.signInWithPhoneNumber(phoneNumber, appVerifier)
            .then((result) => {
                confirmationResult = result;
                showAuthMessage('Kode OTP telah dikirim. Masukkan kode di bawah.', false);
                if (otpInputGroup) otpInputGroup.style.display = 'block';
                if (verifyOtpButton) verifyOtpButton.style.display = 'block';
                if (sendOtpButton) sendOtpButton.style.display = 'none';
            })
            .catch((error) => {
                showAuthMessage(`Error Kirim OTP: ${error.message}`, true);
                console.error('Send OTP Error:', error);
                // Reset reCAPTCHA jika ada error
                if (window.recaptchaVerifier) {
                    window.recaptchaVerifier.render().then(function(widgetId) {
                        grecaptcha.reset(widgetId);
                    });
                }
            });
    });
}

// Autentikasi Telepon - Verifikasi OTP
if (verifyOtpButton) {
    verifyOtpButton.addEventListener('click', async () => {
        const otp = authOtpInput.value.trim();
        if (!otp) {
            showAuthMessage('Harap masukkan kode OTP.', true);
            return;
        }
        if (otp.length !== 6) {
            showAuthMessage('Kode OTP terdiri dari 6 digit.', true);
            return;
        }

        try {
            showAuthMessage('Memverifikasi OTP...', false);
            await confirmationResult.confirm(otp);
            // User signed in, onAuthStateChanged akan handle redirect
        } catch (error) {
            showAuthMessage(`Error Verifikasi OTP: ${error.message}`, true);
            console.error('Verify OTP Error:', error);
        }
    });
}

// Logout User
async function logoutUser() {
    try {
        await auth.signOut();
        // onAuthStateChanged akan menangani pengalihan ke halaman auth
        showAuthMessage('Anda telah keluar.', false);
    } catch (error) {
        showAuthMessage(`Error keluar: ${error.message}`, true);
        console.error('Logout Error:', error);
    }
}


// --- 6. Fungsi Firestore untuk Data User ---
async function loadUserData(userId) {
    if (!userId) return;
    try {
        const userDocRef = db.collection('users').doc(userId);
        const doc = await userDocRef.get();

        if (doc.exists) {
            const userData = doc.data();
            console.log('User data loaded:', userData);
            // Panggil fungsi render/load data spesifik
            renderNotes(userData.notes || []);
            renderTransactions(userData.transactions || []);
            calculateSummary(userData.transactions || []);
        } else {
            console.log('No user data found for:', userId);
            // Inisialisasi dengan data kosong jika tidak ada data
            renderNotes([]);
            renderTransactions([]);
            calculateSummary([]);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showAuthMessage('Gagal memuat data pengguna.', true);
    }
}

async function saveUserData(dataToSave) {
    if (!currentUser) {
        console.error('No current user to save data.');
        showAuthMessage('Tidak ada pengguna yang masuk untuk menyimpan data.', true);
        return;
    }
    try {
        await db.collection('users').doc(currentUser.uid).set(dataToSave, { merge: true });
        console.log('User data saved successfully.');
    } catch (error) {
        console.error('Error saving user data:', error);
        showAuthMessage('Gagal menyimpan data pengguna.', true);
    }
}

function clearUserData() {
    // Bersihkan tampilan UI terkait data user
    if (pinnedNotesContainer) pinnedNotesContainer.innerHTML = '';
    if (otherNotesContainer) otherNotesContainer.innerHTML = '';
    if (transactionListUl) transactionListUl.innerHTML = '';
    if (totalIncomeDisplay) totalIncomeDisplay.textContent = 'Rp 0';
    if (totalExpenseDisplay) totalExpenseDisplay.textContent = 'Rp 0';
    if (currentBalanceDisplay) currentBalanceDisplay.textContent = 'Rp 0';
    // Sembunyikan pesan "Belum ada catatan" jika user logout
    if (emptyPinnedNotesMessage) emptyPinnedNotesMessage.style.display = 'block';
    if (emptyOtherNotesMessage) emptyOtherNotesMessage.style.display = 'block';
}


// --- 7. Fungsi untuk Catatan & Pengingat ---
async function addNote() {
    if (!currentUser) {
        showAuthMessage('Anda harus masuk untuk menambahkan catatan.', true);
        return;
    }
    const noteText = noteTextInput.value.trim();
    if (!noteText) {
        showAuthMessage('Catatan tidak boleh kosong.', true);
        return;
    }

    try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const doc = await userDocRef.get();
        const existingNotes = doc.exists ? (doc.data().notes || []) : [];

        const newNote = {
            id: Date.now().toString(), // ID unik berdasarkan timestamp
            text: noteText,
            pinned: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Timestamp server
        };

        const updatedNotes = [...existingNotes, newNote];
        await saveUserData({ notes: updatedNotes });
        noteTextInput.value = ''; // Bersihkan input
        renderNotes(updatedNotes); // Render ulang catatan
    } catch (error) {
        showAuthMessage('Gagal menambahkan catatan.', true);
        console.error('Error adding note:', error);
    }
}

async function togglePinNote(noteId) {
    if (!currentUser) return;
    try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const doc = await userDocRef.get();
        const existingNotes = doc.exists ? (doc.data().notes || []) : [];

        const updatedNotes = existingNotes.map(note =>
            note.id === noteId ? { ...note, pinned: !note.pinned } : note
        );
        await saveUserData({ notes: updatedNotes });
        renderNotes(updatedNotes);
    } catch (error) {
        showAuthMessage('Gagal mengubah status semat catatan.', true);
        console.error('Error toggling pin:', error);
    }
}

async function deleteNote(noteId) {
    if (!currentUser) return;
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;

    try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const doc = await userDocRef.get();
        const existingNotes = doc.exists ? (doc.data().notes || []) : [];

        const updatedNotes = existingNotes.filter(note => note.id !== noteId);
        await saveUserData({ notes: updatedNotes });
        renderNotes(updatedNotes);
    } catch (error) {
        showAuthMessage('Gagal menghapus catatan.', true);
        console.error('Error deleting note:', error);
    }
}

function renderNotes(notes) {
    if (!pinnedNotesContainer || !otherNotesContainer) return;

    pinnedNotesContainer.innerHTML = '';
    otherNotesContainer.innerHTML = '';

    const pinned = notes.filter(note => note.pinned);
    const other = notes.filter(note => !note.pinned);

    if (pinned.length === 0) {
        emptyPinnedNotesMessage.style.display = 'block';
    } else {
        emptyPinnedNotesMessage.style.display = 'none';
        pinned.forEach(note => {
            const noteElement = createNoteElement(note);
            pinnedNotesContainer.appendChild(noteElement);
        });
    }

    if (other.length === 0) {
        emptyOtherNotesMessage.style.display = 'block';
    } else {
        emptyOtherNotesMessage.style.display = 'none';
        other.forEach(note => {
            const noteElement = createNoteElement(note);
            otherNotesContainer.appendChild(noteElement);
        });
    }
}

function createNoteElement(note) {
    const div = document.createElement('div');
    div.classList.add('note-item');
    if (note.pinned) {
        div.classList.add('pinned');
    }
    div.innerHTML = `
        <p class="note-content">${note.text}</p>
        <div class="note-actions">
            <button class="pin-button" data-id="${note.id}" aria-label="Pin/Unpin Note">
                <i class="${note.pinned ? 'fas fa-thumbtack pinned' : 'far fa-thumbtack'}"></i>
            </button>
            <button class="delete-button" data-id="${note.id}" aria-label="Delete Note">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    div.querySelector('.pin-button').addEventListener('click', () => togglePinNote(note.id));
    div.querySelector('.delete-button').addEventListener('click', () => deleteNote(note.id));
    return div;
}


// --- 8. Fungsi untuk Keuangan Berkelanjutan ---
async function addTransaction() {
    if (!currentUser) {
        showAuthMessage('Anda harus masuk untuk menambahkan transaksi.', true);
        return;
    }
    const description = transactionDescriptionInput.value.trim();
    const amount = parseFloat(transactionAmountInput.value);
    const type = transactionTypeSelect.value;

    if (!description || isNaN(amount) || amount <= 0) {
        showAuthMessage('Deskripsi dan jumlah harus valid.', true);
        return;
    }

    try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const doc = await userDocRef.get();
        const existingTransactions = doc.exists ? (doc.data().transactions || []) : [];

        const newTransaction = {
            id: Date.now().toString(),
            description,
            amount,
            type,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const updatedTransactions = [...existingTransactions, newTransaction];
        await saveUserData({ transactions: updatedTransactions });
        
        transactionDescriptionInput.value = '';
        transactionAmountInput.value = '';
        transactionTypeSelect.value = 'income';
        
        renderTransactions(updatedTransactions);
        calculateSummary(updatedTransactions);
    } catch (error) {
        showAuthMessage('Gagal menambahkan transaksi.', true);
        console.error('Error adding transaction:', error);
    }
}

async function deleteTransaction(transactionId) {
    if (!currentUser) return;
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

    try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const doc = await userDocRef.get();
        const existingTransactions = doc.exists ? (doc.data().transactions || []) : [];

        const updatedTransactions = existingTransactions.filter(t => t.id !== transactionId);
        await saveUserData({ transactions: updatedTransactions });
        renderTransactions(updatedTransactions);
        calculateSummary(updatedTransactions);
    } catch (error) {
        showAuthMessage('Gagal menghapus transaksi.', true);
        console.error('Error deleting transaction:', error);
    }
}

function renderTransactions(transactions) {
    if (!transactionListUl) return;
    transactionListUl.innerHTML = '';
    
    if (transactions.length === 0) {
        const li = document.createElement('li');
        li.classList.add('empty-message');
        li.textContent = 'Belum ada transaksi.';
        transactionListUl.appendChild(li);
        return;
    }

    // Urutkan transaksi dari yang terbaru
    const sortedTransactions = [...transactions].sort((a, b) => {
        // Konversi Firestore Timestamp ke milidetik jika perlu, atau pastikan formatnya sama
        const timeA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
        const timeB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
        return timeB - timeA; // Terbaru di atas
    });

    sortedTransactions.forEach(t => {
        const li = document.createElement('li');
        li.classList.add('transaction-item', t.type);
        const amountDisplay = t.type === 'expense' ? `- Rp ${t.amount.toLocaleString('id-ID')}` : `+ Rp ${t.amount.toLocaleString('id-ID')}`;
        
        // Format tanggal jika createdAt adalah Firestore Timestamp
        const date = t.createdAt ? (t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt)) : new Date();
        const formattedDate = date.toLocaleDateString('id-ID', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        li.innerHTML = `
            <div class="transaction-details">
                <h4>${t.description}</h4>
                <p>${formattedDate}</p>
            </div>
            <span class="transaction-amount-display">${amountDisplay}</span>
            <button class="delete-button" data-id="${t.id}" aria-label="Hapus Transaksi">
                <i class="fas fa-trash"></i>
            </button>
        `;
        li.querySelector('.delete-button').addEventListener('click', () => deleteTransaction(t.id));
        transactionListUl.appendChild(li);
    });
}


function calculateSummary(transactions) {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else if (t.type === 'expense') {
            totalExpense += t.amount;
        }
    });

    const currentBalance = totalIncome - totalExpense;

    if (totalIncomeDisplay) totalIncomeDisplay.textContent = `Rp ${totalIncome.toLocaleString('id-ID')}`;
    if (totalExpenseDisplay) totalExpenseDisplay.textContent = `Rp ${totalExpense.toLocaleString('id-ID')}`;
    if (currentBalanceDisplay) currentBalanceDisplay.textContent = `Rp ${currentBalance.toLocaleString('id-ID')}`;
}


// --- 9. Fungsi untuk Saran Produk Go Green (Diambil dari script Anda) ---
const greenProductsData = [
    {
        id: 'dpr001',
        category: 'Dapur',
        name: 'Pencuci Piring Refill',
        description: 'Sabun cuci piring konsentrat yang bisa diisi ulang, mengurangi limbah plastik.',
        sertifikasi: ['Eco-label', 'Bebas Paraben'],
        bahan_baku: ['Minyak kelapa', 'Ekstrak jeruk'],
        proses_produksi: 'Produksi minim limbah, tanpa uji hewan.',
        dampak_lingkungan: 'Mengurangi limbah plastik sekali pakai, biodegradable.',
        diy_tips: 'Gunakan sisa air bilasan untuk menyiram tanaman non-konsumsi.',
        link_pembelian: 'https://shopee.co.id/sabun-cuci-piring-refill-i.12345678.9012345678'
    },
    {
        id: 'dpr002',
        category: 'Dapur',
        name: 'Spons Cuci Piring Loofah',
        description: 'Spons alami dari serat loofah, dapat terurai secara hayati.',
        sertifikasi: ['Vegan', 'Komposibel'],
        bahan_baku: ['Serat Loofah alami'],
        proses_produksi: 'Budidaya loofah berkelanjutan, tanpa bahan kimia.',
        dampak_lingkungan: 'Alternatif ramah lingkungan untuk spons plastik, mengurangi mikroplastik.',
        diy_tips: 'Bilas bersih setelah digunakan dan keringkan untuk memperpanjang usia.',
        link_pembelian: 'https://shopee.co.id/spons-loofah-alami-i.98765432.1098765432'
    },
    {
        id: 'prd001',
        category: 'Perawatan Diri',
        name: 'Sabun Batang Organik',
        description: 'Sabun mandi alami tanpa kemasan plastik, dibuat dari bahan organik.',
        sertifikasi: ['BPOM', 'Organik Bersertifikat'],
        bahan_baku: ['Minyak zaitun', 'Minyak kelapa', 'Shea butter'],
        proses_produksi: 'Cold process, minim energi, buatan tangan.',
        dampak_lingkungan: 'Bebas mikroplastik, kemasan minimalis, biodegradable.',
        diy_tips: 'Gunakan jaring sabun untuk busa lebih banyak dan hemat sabun.',
        link_pembelian: 'https://shopee.co.id/sabun-organik-batang-i.11223344.5566778899'
    },
    {
        id: 'prd002',
        category: 'Perawatan Diri',
        name: 'Sikat Gigi Bambu',
        description: 'Sikat gigi dengan gagang bambu yang dapat terurai, bulu sikat dari nylon bebas BPA.',
        sertifikasi: ['Bebas BPA', 'Vegan'],
        bahan_baku: ['Bambu Moso', 'Nylon-6'],
        proses_produksi: 'Gagang bambu dari sumber berkelanjutan.',
        dampak_lingkungan: 'Mengurangi limbah plastik dari sikat gigi konvensional.',
        diy_tips: 'Setelah bulu sikat habis, lepas bulu sikat dan gunakan gagang bambu untuk label tanaman atau kerajinan.',
        link_pembelian: 'https://shopee.co.id/sikat-gigi-bambu-i.22334455.6677889900'
    },
    {
        id: 'pkn001',
        category: 'Pakaian',
        name: 'Tas Belanja Lipat Reusable',
        description: 'Tas belanja kain yang ringan dan dapat dilipat, pengganti kantong plastik.',
        sertifikasi: ['OEKO-TEX'],
        bahan_baku: ['Katun organik', 'Poliester daur ulang (RPET)'],
        proses_produksi: 'Jahitan tangan, pewarna alami.',
        dampak_lingkungan: 'Mengurangi penggunaan kantong plastik sekali pakai secara signifikan.',
        diy_tips: 'Selalu bawa di tas Anda agar tidak lupa saat berbelanja.',
        link_pembelian: 'https://shopee.co.id/tas-belanja-reusable-i.33445566.7788990011'
    },
    {
        id: 'kms001',
        category: 'Kemasan',
        name: 'Beeswax Wrap (Pembungkus Makanan)',
        description: 'Alternatif pembungkus plastik yang dapat digunakan kembali, terbuat dari kain katun berlapis beeswax.',
        sertifikasi: ['Food Grade', 'Zero Waste'],
        bahan_baku: ['Kain katun', 'Beeswax', 'Minyak jojoba', 'Resin pohon'],
        proses_produksi: 'Handmade, tanpa bahan kimia berbahaya.',
        dampak_lingkungan: 'Mengurangi limbah plastik, dapat terurai secara hayati.',
        diy_tips: 'Cuci dengan air dingin dan sabun ringan, keringkan, dan gunakan kembali.',
        link_pembelian: 'https://shopee.co.id/beeswax-wrap-i.44556677.8899001122'
    },
    {
        id: 'kebun001',
        category: 'Pertanian & Kebun',
        name: 'Pupuk Kompos Organik',
        description: 'Pupuk alami dari sisa-sisa organik, menyuburkan tanah tanpa bahan kimia.',
        sertifikasi: ['Organik Bersertifikat'],
        bahan_baku: ['Sisa makanan', 'Daun kering', 'Rumput'],
        proses_produksi: 'Proses dekomposisi alami (kompos rumah tangga).',
        dampak_lingkungan: 'Mengurangi limbah organik ke TPA, meningkatkan kesuburan tanah alami.',
        diy_tips: 'Buat sendiri di rumah dengan wadah kompos sederhana.',
        link_pembelian: 'https://shopee.co.id/pupuk-kompos-organik-i.55667788.9900112233'
    }
];

const productCategories = [
    { name: 'Dapur', icon: 'fas fa-utensils' },
    { name: 'Perawatan Diri', icon: 'fas fa-spa' },
    { name: 'Pakaian', icon: 'fas fa-tshirt' },
    { name: 'Kemasan', icon: 'fas fa-box' },
    { name: 'Pertanian & Kebun', icon: 'fas fa-seedling' }
];

function renderProductCategories() {
    if (!productCategoriesGrid) return;
    productCategoriesGrid.innerHTML = '';
    productCategories.forEach(category => {
        const card = document.createElement('div');
        card.classList.add('category-card'); // Menggunakan class 'category-card'
        card.dataset.category = category.name;
        card.innerHTML = `
            <i class="${category.icon}"></i>
            <h3>${category.name}</h3>
        `;
        productCategoriesGrid.appendChild(card);

        card.addEventListener('click', () => {
            renderProductsByCategory(category.name);
            showPage('product-list');
        });
    });
}

function renderProductsByCategory(categoryName) {
    if (!productListContainer || !productListCategoryTitle) return;

    productListContainer.innerHTML = '';
    productListCategoryTitle.textContent = `Produk Kategori: ${categoryName}`;

    const filteredProducts = greenProductsData.filter(p => p.category === categoryName);

    if (filteredProducts.length === 0) {
        productListContainer.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Belum ada produk di kategori ini.</p>';
    } else {
        filteredProducts.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            productItem.dataset.id = product.id;
            productItem.innerHTML = `
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 80)}...</p>
            `;
            productListContainer.appendChild(productItem);

            productItem.addEventListener('click', () => {
                showProductDetail(product.id);
                showPage('product-detail');
            });
        });
    }
}

function showProductDetail(productId) {
    if (!productDetailContent) return;

    const product = greenProductsData.find(p => p.id === productId);
    if (!product) {
        productDetailContent.innerHTML = '<p style="text-align: center; color: var(--error-color);">Produk tidak ditemukan.</p>';
        return;
    }

    productDetailContent.innerHTML = `
        <h2>${product.name}</h2>
        <p>${product.description}</p>

        <h3>Sertifikasi</h3>
        <ul>
            ${product.sertifikasi.map(s => `<li>${s}</li>`).join('')}
        </ul>

        <h3>Bahan Baku Utama</h3>
        <ul>
            ${product.bahan_baku.map(b => `<li>${b}</li>`).join('')}
        </ul>

        <h3>Proses Produksi</h3>
        <p>${product.proses_produksi}</p>

        <h3>Dampak Lingkungan</h3>
        <p>${product.dampak_lingkungan}</p>

        <h3>Tips DIY & Penggunaan Berkelanjutan</h3>
        <p>${product.diy_tips}</p>

        <h3>Link Pembelian</h3>
        <p><a href="${product.link_pembelian}" target="_blank" class="product-detail-link">Beli di Shopee</a></p>
    `;
}


// --- 10. Inisialisasi Aplikasi Saat DOM Siap ---
document.addEventListener('DOMContentLoaded', () => {
    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }

    // Pastikan semua halaman tersembunyi di awal, kecuali halaman welcome-guest
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none'; 
    });
    // Set halaman welcome-guest sebagai default yang terlihat di awal
    if (welcomeGuestPage) {
        welcomeGuestPage.style.display = 'block';
        welcomeGuestPage.classList.add('active'); // Pastikan juga aktif
    }


    // --- Inisialisasi reCAPTCHA Verifier (PENTING untuk Autentikasi Telepon) ---
    if (recaptchaContainer && typeof grecaptcha !== 'undefined') {
        window.recaptchaVerifier.render().then(function(widgetId) {
            window.recaptchaVerifier.rendered = true; // Set flag setelah dirender
            console.log('reCAPTCHA rendered with widget ID:', widgetId);
        });
    } else {
        console.warn('reCAPTCHA container atau grecaptcha tidak ditemukan. Autentikasi telepon mungkin tidak berfungsi.');
    }

    // Event listener untuk tombol autentikasi
    if (signupEmailButton) {
        signupEmailButton.addEventListener('click', signupWithEmail);
    }
    if (loginEmailButton) {
        loginEmailButton.addEventListener('click', loginWithEmail);
    }

    // Event listener untuk tombol pilihan autentikasi
    if (showEmailAuthButton) {
        showEmailAuthButton.addEventListener('click', () => {
            showAuthSubmenu('email-auth-submenu');
        });
    }
    if (showPhoneAuthButton) {
        showPhoneAuthButton.addEventListener('click', () => {
            showAuthSubmenu('phone-auth-submenu');
            // Pastikan recaptcha ditampilkan/dirender jika belum saat beralih ke phone auth
            if (recaptchaContainer && typeof grecaptcha !== 'undefined' && !window.recaptchaVerifier.rendered) {
                 window.recaptchaVerifier.render().then(function(widgetId) {
                    window.recaptchaVerifier.rendered = true;
                    console.log('reCAPTCHA rendered (on phone auth switch):', widgetId);
                });
            }
        });
    }

    // Event listener untuk tombol "Masuk atau Daftar" di halaman welcome-guest
    // BAGIAN INI TIDAK AKAN DIEKSEKUSI KARENA TOMBOL SUDAH DIHAPUS DARI HTML
    // if (goToAuthButton) {
    //     goToAuthButton.addEventListener('click', () => {
    //         showPage('auth');
    //         if (showEmailAuthButton) showEmailAuthButton.style.display = 'block';
    //         if (showPhoneAuthButton) showPhoneAuthButton.style.display = 'block';
    //         showAuthSubmenu('email-auth-submenu');
    //     });
    // }


    // Event listener untuk tombol tambah catatan
    if (addNoteButton) {
        addNoteButton.addEventListener('click', addNote);
    }

    // Event listener untuk tombol tambah transaksi
    if (addTransactionButton) {
        addTransactionButton.addEventListener('click', addTransaction);
    }

    // --- Event listener untuk tombol toggle menu samping ---
    // Pastikan menuToggle, closeMenu, dan sideMenu sudah dideklarasikan di bagian variabel global.
    // JIKA ANDA MELIHAT BARIS 'const ... = document.getElementById(...);' DI SINI, HARAP HAPUS BARIS TERSEBUT.
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            console.log('Tombol menu toggle telah diklik!'); // Debugging: pastikan klik terdeteksi
            if (sideMenu) {
                sideMenu.classList.add('active'); // KODE YANG BENAR: 'add' untuk membuka
                console.log('Class "active" ditambahkan ke side-menu.'); // Debugging: konfirmasi class
            } else {
                console.log('Elemen side-menu tidak ditemukan di JS!'); // Debugging: pesan jika elemen tidak ada
            }
        });
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', () => {
            if (sideMenu) {
                sideMenu.classList.remove('active');
                console.log('Class "active" dihapus dari side-menu.'); // Debugging: konfirmasi tutup
            }
        });
    }

    // --- Event listener untuk navigasi di menu samping dan kartu ---
    // Home category cards (perhatikan ID atau kelas yang digunakan di HTML)
    const homeCategoryCards = document.querySelectorAll('#home-page .card');
    document.querySelectorAll('#side-menu ul li a').forEach(element => {
        // Hanya tambahkan event listener ke link navigasi biasa, bukan logout button
        if (element.id !== 'logout-button') { 
            element.addEventListener('click', (event) => {
                event.preventDefault(); // Mencegah perilaku default link
                const pageId = element.dataset.page;
                if (pageId) {
                    showPage(pageId);
                    // Tambahan khusus untuk halaman produk jika navigasi langsung
                    if (pageId === 'products') {
                        renderProductCategories();
                    }
                    // Jika navigasi ke halaman auth dari menu, pastikan tombol pilihan auth ditampilkan
                    if (pageId === 'auth') {
                        if (showEmailAuthButton) showEmailAuthButton.style.display = 'block';
                        if (showPhoneAuthButton) showPhoneAuthButton.style.display = 'block';
                        showAuthSubmenu('email-auth-submenu'); // Tampilkan email sebagai default
                    }
                }
            });
        }
    });

    if (homeCategoryCards) {
        homeCategoryCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const targetPage = e.currentTarget.dataset.page;
                // Jika card adalah untuk produk, render kategori produk
                if (targetPage === 'products') {
                    renderProductCategories(); // Pastikan kategori produk dirender saat masuk halaman produk
                }
                showPage(targetPage);
            });
        });
    }

    // --- Event listener untuk tombol kembali (back buttons) ---
    const backButtons = document.querySelectorAll('.back-button');
    if (backButtons) {
        backButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const targetPage = button.dataset.target;
                if (targetPage) {
                    showPage(targetPage);
                    // Logika tambahan jika kembali ke halaman tertentu perlu memuat ulang konten
                    if (targetPage === 'product-list') {
                        const categoryTitleElement = document.getElementById('product-list-category-title');
                        if (categoryTitleElement) {
                            const categoryTitle = categoryTitleElement.textContent;
                            const category = categoryTitle.replace('Produk Kategori: ', ''); // Asumsi format
                            renderProductsByCategory(category);
                        } else {
                            // Fallback jika title tidak ditemukan, kembali ke halaman kategori utama
                            renderProductCategories();
                            showPage('products');
                        }
                    }
                }
            });
        });
    }

    // --- Event listener untuk tombol logout di menu samping ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }

    // Inisialisasi tampilan kategori produk saat halaman dimuat pertama kali
    renderProductCategories();

    // Catatan: Panggilan `renderNotes()`, `calculateSummary()`, `renderTransactions()`
    // tidak lagi perlu dilakukan di sini secara langsung, karena `loadUserData()` yang dipanggil oleh
    // `onAuthStateChanged` akan menanganinya setelah user terautentikasi.
    // Halaman awal akan ditentukan oleh `onAuthStateChanged` (auth-page atau home-page).
});
