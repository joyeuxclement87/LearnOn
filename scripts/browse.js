function startChat(name) {
    window.location.href = `messages.html?chat=${encodeURIComponent(name)}&topic=${encodeURIComponent(name)}`;
}

function searchSkills() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const skillCards = document.querySelectorAll('.skill-card');

    skillCards.forEach(card => {
        const skillTitle = card.querySelector('.card-title').textContent.toLowerCase();
        const skillDescription = card.querySelector('.card-text').textContent.toLowerCase();

        const userName = card.querySelector('span').textContent.toLowerCase();

        if (skillTitle.includes(searchInput) || skillDescription.includes(searchInput) || userName.includes(searchInput)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterSkills() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const levelFilter = document.getElementById('levelFilter').value;
    const availabilityFilter = document.getElementById('availabilityFilter').value;
    const skillCards = document.querySelectorAll('.skill-card');

    skillCards.forEach(card => {
        const category = card.getAttribute('data-category');
        const level = card.getAttribute('data-level');
        const availability = card.getAttribute('data-availability');

        if ((categoryFilter === 'All Categories' || category === categoryFilter) &&
            (levelFilter === 'All Levels' || level === levelFilter) &&
            (availabilityFilter === 'All Times' || availability === availabilityFilter)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

