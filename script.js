
// Fitur tambahan:
// - Filter tanggal
// - Pencarian tim
// - Pertandingan selesai di bawah per kategori

const API_KEY = "91e0016be448e559f0b48b3798c95f59";

const PRIORITY_LEAGUES = {
    "big_match": [],
    39: "LIGA INGGRIS",
    135: "LIGA ITALIA",
    140: "LIGA SPANYOL",
    1016: "LIGA INDONESIA"
};

const BIG_TEAMS = [
    "Manchester United", "Manchester City", "Liverpool", "Arsenal", "Chelsea", "Tottenham",
    "Real Madrid", "Barcelona", "Atletico Madrid",
    "AC Milan", "Inter", "Juventus", "Napoli",
    "Persib", "Persija", "Arema", "Persebaya"
];

const dateInput = document.createElement("input");
dateInput.type = "date";
dateInput.valueAsDate = new Date();
dateInput.addEventListener("change", () => fetchMatches(dateInput.value));
document.body.insertBefore(dateInput, document.getElementById("schedule-container"));

const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.placeholder = "Cari tim...";
searchInput.addEventListener("input", () => fetchMatches(dateInput.value));
document.body.insertBefore(searchInput, document.getElementById("schedule-container"));

async function fetchMatches(date = new Date().toISOString().split('T')[0]) {
    const url = `https://v3.football.api-sports.io/fixtures?date=${date}`;

    try {
        const response = await fetch(url, {
            headers: {
                "x-apisports-key": API_KEY
            }
        });

        const data = await response.json();
        const matches = data.response;

        displayMatches(groupMatches(matches));
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('schedule-container').innerHTML = "<p>Gagal memuat jadwal.</p>";
    }
}

function groupMatches(matches) {
    const grouped = {
        "BIG MATCH": { upcoming: [], finished: [] },
        "LIGA INGGRIS": { upcoming: [], finished: [] },
        "LIGA ITALIA": { upcoming: [], finished: [] },
        "LIGA SPANYOL": { upcoming: [], finished: [] },
        "LIGA INDONESIA": { upcoming: [], finished: [] },
        "LAINNYA": { upcoming: [], finished: [] }
    };

    matches.forEach(match => {
        const home = match.teams.home.name;
        const away = match.teams.away.name;
        const leagueId = match.league.id;
        const isBigMatch = BIG_TEAMS.includes(home) && BIG_TEAMS.includes(away);
        const isFinished = match.fixture.status.short === "FT";
        const filter = searchInput.value.toLowerCase();
        if (filter && !home.toLowerCase().includes(filter) && !away.toLowerCase().includes(filter)) return;

        let groupKey = "LAINNYA";
        if (isBigMatch) groupKey = "BIG MATCH";
        else if (PRIORITY_LEAGUES[leagueId]) groupKey = PRIORITY_LEAGUES[leagueId];

        if (isFinished) grouped[groupKey].finished.push(match);
        else grouped[groupKey].upcoming.push(match);
    });

    return grouped;
}

function displayMatches(groupedMatches) {
    const container = document.getElementById('schedule-container');
    container.innerHTML = "";

    const order = ["BIG MATCH", "LIGA INGGRIS", "LIGA ITALIA", "LIGA SPANYOL", "LIGA INDONESIA", "LAINNYA"];

    order.forEach(category => {
        const section = document.createElement('section');
        section.className = 'match-section';

        const title = document.createElement('h2');
        title.textContent = category;
        section.appendChild(title);

        const allMatches = [
            ...groupedMatches[category].upcoming,
            ...groupedMatches[category].finished
        ];

        if (allMatches.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = "Tidak ada pertandingan.";
            section.appendChild(empty);
        } else {
            allMatches.forEach(match => {
                const card = document.createElement('div');
                card.className = 'match-card';
                card.setAttribute('data-kickoff', match.fixture.date);

                const home = match.teams.home.name;
                const away = match.teams.away.name;
                const kickoff = match.fixture.date;
                const homeLogo = match.teams.home.logo;
                const awayLogo = match.teams.away.logo;
                const status = match.fixture.status.short;

                let countdownText = "Loading...";
                if (status === "FT") countdownText = "Pertandingan Selesai";

                card.innerHTML = `
                    <div class="team">
                        <img src="${homeLogo}" alt="${home}" class="team-logo">
                        <span class="team-name">${home}</span>
                        <strong>vs</strong>
                        <span class="team-name">${away}</span>
                        <img src="${awayLogo}" alt="${away}" class="team-logo">
                    </div>
                    <p>Kick-off: ${new Date(new Date(kickoff).getTime() + (7 * 60 * 60 * 1000)).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>
                    <div class="countdown">${countdownText}</div>
                `;

                section.appendChild(card);
            });
        }

        container.appendChild(section);
    });

    updateCountdowns();
}

function updateCountdowns() {
    const now = new Date().getTime() + (7 * 60 * 60 * 1000);

    document.querySelectorAll('.match-card').forEach(card => {
        const countdownEl = card.querySelector('.countdown');
        if (!countdownEl || countdownEl.innerText === "Pertandingan Selesai") return;

        const kickoffTime = new Date(card.getAttribute('data-kickoff')).getTime();
        const distance = kickoffTime - now;

        if (distance <= 0) {
            countdownEl.innerText = "Sedang Berlangsung!";
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownEl.innerText = `${hours}j ${minutes}m ${seconds}d`;
    });
}

fetchMatches();
setInterval(updateCountdowns, 1000);
