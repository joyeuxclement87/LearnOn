document.addEventListener('DOMContentLoaded', () => {
    initializeBrowseListeners();
});

function initializeBrowseListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const levelFilter = document.getElementById('levelFilter');
    const availabilityFilter = document.getElementById('availabilityFilter');

    if (searchInput) searchInput.addEventListener('input', searchSkills);
    if (categoryFilter || levelFilter || availabilityFilter) {
        [categoryFilter, levelFilter, availabilityFilter].forEach(filter => {
            if (filter) filter.addEventListener('change', filterSkills);
        });
    }
}

function searchSkills() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const skillItems = document.querySelectorAll('.skill-item');

    skillItems.forEach(item => {
        const skillName = item.querySelector('.skill-name').textContent.toLowerCase();
        if (skillName.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterSkills() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const levelFilter = document.getElementById('levelFilter').value;
    const availabilityFilter = document.getElementById('availabilityFilter').value;
    const skillItems = document.querySelectorAll('.skill-item');

    skillItems.forEach(item => {
        const skillCategory = item.getAttribute('data-category');
        const skillLevel = item.getAttribute('data-level');
        const skillAvailability = item.getAttribute('data-availability');

        if ((categoryFilter === '' || skillCategory === categoryFilter) &&
            (levelFilter === '' || skillLevel === levelFilter) &&
            (availabilityFilter === '' || skillAvailability === availabilityFilter)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}
