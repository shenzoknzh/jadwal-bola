const API_KEY = "91e0016be448e559f0b48b3798c95f59";

// Konfigurasi liga prioritas
const PRIORITY_LEAGUES = {
    "big_match": [],
    39: "LIGA INGGRIS",
    135: "LIGA ITALIA",
    140: "LIGA SPANYOL",
    1016: "LIGA INDONESIA" // Pastikan ID Liga Indonesia sudah benar
};

// Tim-tim besar untuk deteksi big match
const BIG_TEAMS = [
    "Manchester United", "Manchester City", "Liverpool", "Arsenal", "Chelsea", "Tottenham",
    "Real Madrid", "Barcelona", "Atletico Madrid",
    "AC Milan", "Inter", "Juventus", "Napoli",
    "Bayern Munich", "Paris Saint-Germain", "Chelsea", "BVB Dortmund", "Porto", 
    "PSV Eindhoven", "Benfica", "Arsenal", // Tim-tim besar dari Liga Champions
    "Persib", "Persija", "Arema", "Persebaya",
    "Flamengo", "Boca Juniors", "Al Ahly", "Al-Hilal", "Celtic", "Rangers", "Galatasaray", "Fenerbahçe",
    "Fluminense", "River Plate", "Corinthians Paulista", "São Paulo FC",
    // Menambahkan tim yang masuk final kompetisi 2024/25
    "Al-Ahli", "Kawasaki Frontale", // AFC Champions League Final
    "Paris Saint-Germain", "Arsenal", // UEFA Champions League Final
    "Tottenham Hotspur", // UEFA Europa League Final
    "Fiorentina", // UEFA Conference League Final
    "Chelsea" // UEFA Conference League Final
];

async function fetchMatches() {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7); // 7 hari ke depan

    const tenDaysFromNow = new Date(today);
    tenDaysFromNow.setDate(today.getDate() + 10); // 10 hari ke depan (untuk rentang tanggal lebih luas)

    // Format tanggal dalam format YYYY-MM-DD
    const startDate = sevenDaysFromNow.toISOString().split('T')[0];
    const endDate = tenDaysFromNow.toISOString().split('T')[0];

    // Mengambil jadwal dari API untuk rentang tanggal 7 hingga 10 hari mendatang
    const url = `https://v3.football.api-sports.io/fixtures?date=${startDate}&end_date=${endDate}`;

    try {
        const response = await fetch(url, {
            headers: {
                "x-apisports-key": API_KEY
            }
        });

        const data = await response.json();
        console.log(data);  // Tampilkan data yang diterima dari API untuk debugging

        // Pastikan ada data pertandingan yang diterima
        if (!data || !data.response || data.response.length === 0) {
            document.getElementById('schedule-container').innerHTML = "<p>Jadwal pertandingan tidak ditemukan.</p>";
            return; // Menghentikan eksekusi jika tidak ada data
        }

        const matches = data.response;
        displayMatches(groupMatches(matches)); // Menampilkan jadwal yang dikelompokkan
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('schedule-container').innerHTML = "<p>Gagal memuat jadwal.</p>";
    }
}

function groupMatches(matches) {
    const grouped = {
        "BIG MATCH": [],
        "LIGA INGGRIS": [],
        "LIGA ITALIA": [],
        "LIGA SPANYOL": [],
        "LIGA INDONESIA": [],  // Pastikan kategori Liga Indonesia ada
        "LAINNYA": []
    };

    matches.forEach(match => {
        const home = match.teams.home.name;
        const away = match.teams.away.name;
        const leagueId = match.league.id;

        // Deteksi apakah ini adalah pertandingan BIG MATCH
        const isBigMatch = BIG_TEAMS.includes(home) && BIG_TEAMS.includes(away);
        if (isBigMatch) {
            grouped["BIG MATCH"].push(match);  // Menambahkan ke BIG MATCH
        } else if (PRIORITY_LEAGUES[leagueId]) {
            // Menambahkan pertandingan ke kategori yang sesuai
            grouped[PRIORITY_LEAGUES[leagueId]].push(match);
        } else {
            grouped["LAINNYA"].push(match);
        }
    });

    return grouped;
}

function displayMatches(groupedMatches) {
    const container = document.getElementById('schedule-container');
    container.innerHTML = "";

    const order = ["BIG MATCH", "LIGA INGGRIS", "LIGA ITALIA", "LIGA SPANYOL", "LIGA INDONESIA", "LAINNYA"];

    order.forEach(category => {
        if (groupedMatches[category].length > 0) {
            const section = document.createElement('section');
            section.className = 'match-section';

            const title = document.createElement('h2');
            title.textContent = category;
            section.appendChild(title);

            if (groupedMatches[category].length === 0) {
                const empty = document.createElement('p');
                empty.textContent = "Tidak ada pertandingan.";
                section.appendChild(empty);
            } else {
                groupedMatches[category].forEach(match => {
                    const card = document.createElement('div');
                    card.className = 'match-card';
                    card.setAttribute('data-kickoff', match.fixture.date);

                    const home = match.teams.home.name;
                    const away = match.teams.away.name;
                    const kickoff = match.fixture.date;
                    const homeLogo = match.teams.home.logo;
                    const awayLogo = match.teams.away.logo;

                    card.innerHTML = `
                        <div class="team">
                            <img src="${homeLogo}" alt="${home}" class="team-logo">
                            <span class="team-name">${home}</span>
                            <strong>vs</strong>
                            <span class="team-name">${away}</span>
                            <img src="${awayLogo}" alt="${away}" class="team-logo">
                        </div>
                        <p>Kick-off: ${new Date(new Date(kickoff).getTime() + (7 * 60 * 60 * 1000)).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB</p>

                        <div class="countdown">Loading...</div>
                    `;

                    section.appendChild(card);
                });
            }

            container.appendChild(section);
        }
    });

    updateCountdowns();
}

function updateCountdowns() {
    const now = new Date().getTime() + (7 * 60 * 60 * 1000); // WIB

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

        card.querySelector('.countdown').innerText = `${hours}j ${minutes}m ${seconds}s`;
    });
}

fetchMatches();
setInterval(updateCountdowns, 1000);
