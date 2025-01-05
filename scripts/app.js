console.log("LearnOn is ready!");
document.getElementById("skill-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const teachSkills = document.getElementById("teach-skills").value;
    const learnSkills = document.getElementById("learn-skills").value;

    if (teachSkills && learnSkills) {
        console.log("Skills to Teach:", teachSkills);
        console.log("Skills to Learn:", learnSkills);
        alert("Profile saved successfully!");
    } else {
        alert("Please fill out both fields.");
    }
});
async function loadMatches() {
    try {
        const response = await fetch("./data/mock-data.json");
        const matches = await response.json();

        const container = document.getElementById("matches-container");
        container.innerHTML = ""; // Clear existing matches

        matches.forEach(match => {
            const card = document.createElement("div");
            card.classList.add("match-card");

            card.innerHTML = `
                <h4>${match.name}</h4>
                <p><strong>Teaches:</strong> ${match.teaches}</p>
                <p><strong>Wants to Learn:</strong> ${match.wantsToLearn}</p>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading matches:", error);
    }
}

// Load matches when the page loads
document.addEventListener("DOMContentLoaded", loadMatches);
