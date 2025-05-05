const API_KEY = "91e0016be448e559f0b48b3798c95f59";

const PRIORITY_LEAGUES = {
    2: "LIGA CHAMPIONS",
    39: "LIGA INGGRIS",
    135: "LIGA ITALIA",
    140: "LIGA SPANYOL",
    1016: "LIGA INDONESIA" // Liga Indonesia tetap ada di sini
};

const BIG_TEAMS = [
    "Manchester United", "Manchester City", "Liverpool", "Arsenal", "Chelsea", "Tottenham",
    "Real Madrid", "Barcelona", "Atletico Madrid",
    "AC Milan", "Inter", "Juventus", "Napoli",
    "Bayern Munich", "Paris Saint Germain", "Borussia Dortmund",
    "Persib", "Persija", "Arema", "Persebaya"
];

const dateInput = document.createElement("input");
dateInput.type = "date";
dateInput.valueAsDate = new Date();
dateInput.addEventListener("change", () => fetchMatches());
document.querySelector(".controls").appendChild(dateInput);

const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.placeholder = "Cari tim...";
searchInput.addEventListener("input", () => fetchMatches());
document.querySelector(".controls").appendChild(searchInput);

async function fetchMatches() {
    const today = new Date();
    const promises = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const url = `https://v3.football.api-sports.io/fixtures?date=${dateStr}`;
        promises.push(
            fetch(url, {
                headers: { "x-apisports-key": API_KEY }
            }).then(res => res.json())
        );
    }

    try {
        const results = await Promise.all(promises);
        const allMatches = results.flatMap(r => r.response);
        console.log("[DEBUG] Total Matches fetched:", allMatches.length);
        displayMatches(groupMatches(allMatches));
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('schedule-container').innerHTML = "<p>Gagal memuat jadwal.</p>";
    }
}

function groupMatches(matches) {
    const grouped = {
        "BIG MATCH": { upcoming: [], finished: [] },
        "LIGA INDONESIA": { upcoming: [], finished: [] },
        "LIGA ITALIA": { upcoming: [], finished: [] },
        "LIGA SPANYOL": { upcoming: [], finished: [] },
        "LIGA INGGRIS": { upcoming: [], finished: [] },
        "SEMUA JADWAL": { upcoming: [], finished: [] }
    };

    matches.forEach(match => {
        const home = match.teams.home.name;
        const away = match.teams.away.name;
        const leagueId = match.league.id;
        const isFinished = match.fixture.status.short === "FT";
        const isBigTeam = BIG_TEAMS.includes(home) || BIG_TEAMS.includes(away);
        const isUCL = leagueId === 2;

        const filter = searchInput.value.toLowerCase();
        if (filter && !home.toLowerCase().includes(filter) && !away.toLowerCase().includes(filter)) return;

        let added = false;

        // Big Match atau Liga Utama yang penting
        if (isUCL || (BIG_TEAMS.includes(home) && BIG_TEAMS.includes(away))) {
            grouped["BIG MATCH"][isFinished ? "finished" : "upcoming"].push(match);
            added = true;
        }

        // Memastikan Liga Indonesia dimasukkan dengan benar
        else if (leagueId === 1016) {
            grouped["LIGA INDONESIA"][isFinished ? "finished" : "upcoming"].push(match);
            added = true;
        }

        // Memastikan Liga Utama lainnya dimasukkan
        else if (PRIORITY_LEAGUES[leagueId]) {
            const key = PRIORITY_LEAGUES[leagueId];
            grouped[key][isFinished ? "finished" : "upcoming"].push(match);
            added = true;
        }

        // Jika tidak cocok dengan yang di atas, masuk ke "SEMUA JADWAL"
        if (!added) {
            grouped["SEMUA JADWAL"][isFinished ? "finished" : "upcoming"].push(match);
        }
    });

    return grouped;
}

function displayMatches(groupedMatches) {
    const container = document.getElementById('schedule-container');
    container.innerHTML = "";

    const order = ["BIG MATCH", "LIGA INDONESIA", "LIGA ITALIA", "LIGA SPANYOL", "LIGA INGGRIS", "SEMUA JADWAL"];

    order.forEach(category => {
        if (!groupedMatches[category]) return;

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

                const time = new Date(kickoff);
                const formattedTime = time.toLocaleTimeString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                });

                card.innerHTML = `
                    <div class="team">
                        <img src="${homeLogo}" alt="${home}" class="team-logo">
                        <span class="team-name">${home}</span>
                        <strong>vs</strong>
                        <span class="team-name">${away}</span>
                        <img src="${awayLogo}" alt="${away}" class="team-logo">
                    </div>
                    <p>Kick-off: ${formattedTime} WIB</p>
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
