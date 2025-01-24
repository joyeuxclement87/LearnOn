function setupForm(formId, onSuccess) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('invalid');
                isValid = false;
            } else {
                input.classList.remove('invalid');
            }
        });

        if (!isValid) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            onSuccess();
        } catch (error) {
            console.error('Auth error:', error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.getAttribute('data-original-text');
        }
    });

    // Store original button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.setAttribute('data-original-text', submitBtn.innerHTML);
    }
}

// Initialize forms
document.addEventListener('DOMContentLoaded', () => {
    setupForm('loginForm', () => window.location.href = 'dashboard.html');
    setupForm('registerForm', () => window.location.href = 'dashboard.html');
});
