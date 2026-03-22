/**
 * Simple AI Content Generator
 * Generates content without external API keys
 */

export function generateLandingPage(data: {
  name: string;
  location: string;
  highlights: string;
  price: string;
}): string {
  const { name, location, highlights, price } = data;

  return `# ${name} – Vaš Idealni Dom v ${location}

## Doživite Nepozabne Počitnice v Srcu Narave

${name} vam ponuja popolno kombinacijo udobja, miru in naravnih lepot. Nahajamo se v ${location}, kjer lahko pobegnete od mestnega hrupa in se prepustite sprostitvi.

### Zakaj Izbrati Nas?

✓ **${highlights || 'Odlična lokacija'}** – ${highlights ? 'Edinstvena izkušnja ob ' + highlights : 'Vse kar potrebujete za popoln oddih'}

✓ **Ugodna cena** – Že od ${price || '100'}€ na noč, vključno z vsemi storitvami

✓ **Domače vzdušje** – Osebna pozornost in gostoljubnost

✓ **Mir in narava** – Popoln pobeg od vsakdanjega stresa

### Kaj Vas Čaka?

- Prostore in svetle sobe z moderno opremo
- Brezplačen WiFi in parkirišče
- Zunanja terasa z razgledom
- Možnost organizacije izletov
- Tradicionalna lokalna kuhinja na zahtevo

### Lokacija

${name} se nahaja v ${location}, le nekaj minut hoje od:
- Najbližje trgovine (5 min)
- Restavracij in kavarn (3 min)
- Naravnih znamenitosti (10 min)
- Javnega prevoza (2 min)

### Posebna Ponudba

Rezervirajte vsaj 3 noči in prejmite **brezplačen zajtrk** ali **pozni check-out**!

---

## Rezervirajte Svoj Termin Danes!

Ne zamudite priložnosti za nepozabne počitnice v ${name}.

📞 Pokličite nas: +386 40 XXX XXX
📧 Pišite nam: info@${name.toLowerCase().replace(/ /g, '')}.si
🌐 Obiščite našo spletno stran

**${name}** – Kjer se gostje počutijo kot doma.

---

*Cene so informativne in se lahko spremenijo. Za točno ponudbo nas kontaktirajte.*`;
}

export function generateEmail(data: {
  guestName: string;
  propertyName: string;
  location: string;
  checkIn: string;
}): string {
  const { guestName, propertyName, location, checkIn } = data;

  return `Zadeva: Dobrodošli v ${propertyName}! 🏨

Dragi ${guestName || 'gost'},

Z velikim veseljem vas pričakujemo v ${propertyName} v ${location}!

Vaša rezervacija:
📅 Datum prihoda: ${checkIn || 'po dogovoru'}
📍 Naslov: ${location}

Pred prihodom vam sporočamo:
✓ Check-in je možen od 14:00 dalje
✓ Brezplačno parkirišče je na voljo
✓ WiFi je na voljo v celotnem objektu

Naš nasvet za vaš obisk:
Obiščite lokalni trg zjutraj – prava turistična izkušnja z domačimi izdelki!

Veselimo se vašega obiska!

Lep pozdrav,
Ekipa ${propertyName}

---
${propertyName} | ${location}
📞 +386 40 XXX XXX | 📧 info@${propertyName.toLowerCase().replace(/ /g, '')}.si`;
}

export function generateRoomDescription(data: {
  name: string;
  size: string;
  features: string;
  price: string;
}): string {
  const { name, size, features, price } = data;

  return `# ${name || 'Premium Soba'}

## Udobje in Stil v Vsaki Podrobnosti

Prostorna ${size || '35m²'} soba z moderno opremo in pozornostjo do detajlov. Popolna izbira za ${features?.includes('družina') ? 'družine' : 'pare ali poslovne popotnike'}.

### Lastnosti Sobe

✓ **Velikost:** ${size || '35m²'} prostora
✓ **Postelja:** King size ali dve ločeni postelji
✓ **Kopalnica:** Tuš kabina, sušilec za lase, brezplačni toaletni pripomočki
✓ **Tehnologija:** Brezplačen WiFi, TV z ravnim zaslonom, mednarodni kanali
✓ **Udobje:** Klimatska naprava, ogrevanje, zvočna izolacija

### Posebnosti

${features || 'Razgled na vrt, delovna miza, mini bar'}

### Cena

Od ${price || '100'}€ na noč, vključno z:
- Zajtrkom
- WiFi-jem
- Parkiriščem
- Turistično takso

---

*Za več informacij ali posebno ponudbo nas kontaktirajte.*`;
}

export function generateSocialPost(data: {
  name: string;
  location: string;
  highlights: string;
}): string {
  const { name, location, highlights } = data;

  return `🌟 ${name} – ${location} 🌟

Iščete popoln pobeg od vsakdanjika? ${name} v ${location} je prava izbira! ✨

${highlights ? `👉 ${highlights}` : '👉 Narava, mir in nepozabne izkušnje'}

✅ Ugodne cene
✅ Prijazno osebje
✅ Odlična lokacija

📞 Rezervirajte: +386 40 XXX XXX
🌐 Več informacij v opisu profila

#potovanje #počitnice #${location?.replace(' ', '') || 'slovenia'} #namestitev #popotovanje`;
}
