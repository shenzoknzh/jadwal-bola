
const API_KEY = "91e0016be448e559f0b48b3798c95f59"; // <=== Ganti dengan API key kamu

async function fetchMatches() {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://v3.football.api-sports.io/fixtures?date=${today}`;

    try {
        const response = await fetch(url, {
            headers: {
                "x-apisports-key": API_KEY
            }
        });

        const data = await response.json();
        const matches = data.response;

        displayMatches(matches);
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('schedule-container').innerHTML = "<p>Gagal memuat jadwal.</p>";
    }
}

function updateCountdowns() {
    const now = new Date().getTime();

    document.querySelectorAll('.match-card').forEach(card => {
        const kickoffTime = new Date(card.getAttribute('data-kickoff')).getTime();
        const distance = kickoffTime - now;

        if (distance <= 0) {
            card.querySelector('.countdown').innerText = "Sedang Berlangsung!";
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        card.querySelector('.countdown').innerText = `${hours}j ${minutes}m ${seconds}d`;
    });
}

function displayMatches(matches) {
    const container = document.getElementById('schedule-container');
    container.innerHTML = "";

    if (matches.length === 0) {
        container.innerHTML = "<p>Tidak ada pertandingan hari ini.</p>";
        return;
    }

    matches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card';

        const home = match.teams.home.name;
        const away = match.teams.away.name;
        const kickoff = match.fixture.date;

        card.setAttribute('data-kickoff', kickoff);

        card.innerHTML = `
            <h2>${home} vs ${away}</h2>
            <p>Kick-off: ${new Date(kickoff).toLocaleTimeString('id-ID')}</p>
            <div class="countdown">Loading...</div>
        `;

        container.appendChild(card);
    });

    updateCountdowns();
}

fetchMatches();
setInterval(updateCountdowns, 1000);
