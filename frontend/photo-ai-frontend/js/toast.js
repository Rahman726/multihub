// ===================== DOM =====================
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// ===================== TOAST =====================
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}
