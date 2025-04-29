// script.js
async function getJadwalBola() {
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'YOUR_API_KEY', // Ganti dengan API key kamu dari API-FOOTBALL
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${today}`, options);
  const data = await response.json();

  const jadwalHariIni = data.response;

  const jadwalContainer = document.getElementById('jadwal');

  if (jadwalHariIni.length === 0) {
    jadwalContainer.innerHTML = '<p>Tidak ada jadwal pertandingan hari ini.</p>';
    return;
  }

  jadwalHariIni.forEach(match => {
    const matchEl = document.createElement('div');
    matchEl.className = 'match';

    const matchTime = new Date(match.fixture.date);

    matchEl.innerHTML = `
      <div class="match-time">${matchTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
      <div class="teams">${match.teams.home.name} vs ${match.teams.away.name}</div>
      <div class="countdown" id="countdown-${matchTime.getTime()}"></div>
    `;

    jadwalContainer.appendChild(matchEl);

    const countdownEl = document.getElementById(`countdown-${matchTime.getTime()}`);
    setInterval(() => {
      const now = new Date();
      const distance = matchTime - now;

      if (distance > 0) {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        countdownEl.innerText = `Mulai dalam ${hours}j ${minutes}m ${seconds}d`;
      } else {
        countdownEl.innerText = "Sedang berlangsung atau sudah selesai";
      }
    }, 1000);
  });
}

getJadwalBola();
