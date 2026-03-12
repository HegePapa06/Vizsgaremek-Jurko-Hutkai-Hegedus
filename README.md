# Vizsgaremek-Jurkó-Hutkai-Hegedüs

<p align="center">
 <img width="192" height="245" alt="image" src="https://github.com/user-attachments/assets/9e3b6ed2-c262-4da0-ba87-7068217d3209" />
</p>

### <p align="center">DrivePro</p>
### <p align="center">Készítette: Hegedüs Ákos, Jurkó Levente. Hutkai Soma <br> Szoftver fejlesztő és -tesztelő vizsgaremek</p>
  

## Projekt célja
A DrivePro webalkalmazás célja az, hogy a jelenlegi autósiskolai oktatást megreformáljuk, modernizáljuk. Mivel sok helyen még mindig füzetbe írják az órákat illetve a haladásokat van rá esély arra, hogy a tanár elfelejti beírni az órát, vagy a tanuló felejti el, hogy van órája és nem megy el rá. Ezért gondoltunk arra, hogy készítünk egy olyan webalkalmazást, ahol a tanuló iletve a tanár tudja követni az órákat, könnyebben és gördülékenyebben follyon az órák beírása, követése, illetve a plussz óra vásárlás is. Az olyalunkon a jövőben lehetlesz különleges órákat is venni. Ez azt jeelenti, hogy a tanuló nem csak sima vezetést tud majd tanulni, hanem jégen is és még több szimulációban megfelelő biztonsági körülmények között. 

## Frontend tudnivalók

A projekt frontendje Angular keretrendszerrel készült, amely modern, reszponzív felhasználói felületet biztosít. A forráskód a `Frontend/` mappában található, ahol az alkalmazás főbb komponensei (pl. bejelentkezés, regisztráció, profil, órarend, oktatók, vásárlás) külön almappákban helyezkednek el. Az Angular CLI segítségével könnyen telepíthető és buildelhető a projekt, a fejlesztéshez és futtatáshoz Node.js szükséges. A frontend a backend REST API-jával kommunikál, a felhasználói autentikáció JWT tokenen alapul. A dizájn letisztult, mobilbarát, a stílusokat CSS fájlokban találod. A fejlesztéshez ajánlott a VS Code használata, valamint a böngésző fejlesztői eszközei a hibakereséshez. A buildelt alkalmazás statikus fájlként szolgálható ki akár Nginx-en vagy más webszerveren keresztül.

Hutkai Soma és Jurkó Levente ketten fejlesztették a frontendet. A frontenden domináló színek a prémium érzetet keltik. A weboldal könnyen kezelhető, illetve kezdőbarát. A főoldalon szerepelnek azok a feltételek, amelyek szükségesek a jogosítvány szerzéshez. 

## Backend tudnivalók

Hegedüs Ákos fejlesztette a backendet. A backend Node.js és Express keretrendszerre épül, amely REST API-kat szolgáltat a frontend számára. Az alkalmazás fő feladatai közé tartozik a felhasználók regisztrációja, bejelentkezése, jogosultságkezelése, valamint az órák, oktatók, vásárlások és profiladatok kezelése. Az adatok tárolására MySQL adatbázist használ, amelyhez a kapcsolódást és a modellek kezelését a `models/` és `config/db.js` fájlok biztosítják. A jogosultságokat és a végpontok védelmét middleware-ek (például JWT alapú hitelesítés) látják el. A fájlfeltöltéshez a Multer csomag van integrálva, a feltöltött fájlok az `uploads/` könyvtárba kerülnek. A backend támogatja az ütemezett feladatokat is, például automatikus adatkarbantartást vagy értesítéseket, amelyeket a `utils/cron.js` kezel. A szerver konfigurációja környezeti változókkal szabályozható, így könnyen testreszabható fejlesztői, teszt és éles környezetben is. A kód felépítése moduláris, a különböző funkciók (auth, user, lesson, shop, teacher) saját controller és route fájlokban találhatók, ami átláthatóvá és könnyen bővíthetővé teszi a rendszert. A biztonság érdekében minden jelszó titkosítva kerül tárolásra, a bemeneti adatok validálása minden végponton megtörténik, és a rendszer naplózza a fontosabb eseményeket. A backend könnyen telepíthető, futtatható helyben vagy szerveren, és alkalmas nagyobb terhelés kiszolgálására is.

## Adatbázis tudnivalók

Az alkalmazás adatainak tárolására MySQL adatbázist használunk, amely dokumentum-orientált megközelítést biztosít, így rugalmasan kezelhetők a különböző típusú adatok. Az adatbázisban külön kollekciók tárolják a felhasználók, órák, oktatók, vásárlások, leiratkozások és egyéb entitások adatait. A kapcsolódást a szerver oldali konfigurációs fájlok és környezeti változók szabályozzák, így az adatbázis elérhetősége könnyen módosítható fejlesztői, teszt vagy éles környezetben. Az adatok biztonsága érdekében minden érzékeny információ, például a jelszavak, titkosítva kerülnek tárolásra, és a rendszer gondoskodik a megfelelő jogosultságok kezeléséről is. Az adatbázisban indexek segítik a gyors keresést a gyakran lekérdezett mezőkön, például e-mail címen vagy azonosítókon. A mentések rendszeresen készülnek, hogy adatvesztés esetén gyorsan helyre lehessen állítani a rendszert. A MySQL lehetőséget ad a horizontális skálázásra is, így a rendszer nagyobb terhelés esetén is megbízhatóan működik. Az adatbázis szerkezete könnyen bővíthető, így új funkciók vagy adatok hozzáadása nem igényel jelentős átalakítást.

## Továbbfejlesztési lehetősségek

- Fizetés illetve elektronikus számla: Az oldalon jelen pillanat nem lehet fizetni, mivel nem tudunk biztosítani a jelenlegi állapotában a projektben elektronikus számla generálást.
- Chatoldal létrehozása: Ahhoz, hogy a tanuló és a tanár között még ennél is gördulékenyebben follyon a kommunikáció, a jövőben fejlesztésre kerül egy chat ablak rész.
- Különleges órák vásárlása: Az oldalon szeretnénk létrehozni egy olyan fület, ahol mindenki tud venni olyan órát, ahol természeti illetve mesterségek hátrányokkal nézhetnek szembe a vezetőink megfelelő biztonsági intézkedésekel.
- Ne csak B-s jogosítványt lehessen csináli: Szeretnénk azt, hogy az oldalon ne scak B-s jogosítványt lehessen tanulni, hanem aki kamionozni szeretne vagy mezőgazdász akar lenni, itt ő is tudjon tanulni nálunk.
- Email küldése: Jelen pillanatban a tanuló illetv a tanár még nem kap emailt arról, hoyg az órarendben változás történt, ezért ezt is a jövőben bele szeretnénk építeni.

## Szoftvertesztelés
Az oldalon a főbb tesztelések, amelyeket meg szeretnénk említeni: 
- Fekete dobozos tesztelés: Bejelentkezési felület.

  Teszt eset: Bemenet: Helyes e-mail cím, de rossz jelszó. Várt eredmény: "Helytelen jelszó" hibaüzenet, és a felhasználó maradjon a
  login oldalon.

  A rendszer elutasította a belépést, nem generált JWT tokent, így a titkosított tartalmak elérhetetlenek maradtak.

- Egységteszt: Jelentkezés elfogadása

  Teszt eset: Az API meghívása után az adatbázisban a Request táblában a státusz pending-ről accepted-re változik-e, és az adott diák
  megjelenik-e az oktató listájában.

  A kapcsolat létrejött, a Sequelize sikeresen frissítette a rekordot, és a válaszban a szerver a módosított objektumot küldte vissza.

- Unit teszt: Pótóra-számítást végző logika

  Teszt eset: Ha a tanulónak 32 órája van, de csak 1 pótórát vásárolt, a rendszernek false értékkel kell visszatérnie az újabb óra
  foglalásakor.

  Eredmény: A függvény pontosan számolta ki a különbséget (32 - 30 = 2), és mivel 2 > 1, a validáció sikeresen megállította a
  folyamatot.

## Szoftver- és rendszerkövetelmények

### 1. Projekt áttekintés
- **Cél:** Webalkalmazás felhasználói regisztrációval, bejelentkezéssel, oktatói/óra-kezeléssel, vásárlási folyamattal és fájlfeltöltéssel.
- **Fő komponensek:** Node/Express alapú REST API (`Backend/`), Angular alapú kliens (`Frontend/`), MongoDB adatbázis, fájlfeltöltések (`uploads/`), ütemezett feladatok (`utils/cron.js`).

### 2. Funkcionális követelmények
- Felhasználókezelés: regisztráció, bejelentkezés (JWT), profilkezelés
- Jogosultságok: szerepkör-alapú hozzáférés (felhasználó, oktató, admin)
- Órakezelés: órák CRUD, jelentkezés
- Vásárlás: termékek, vásárlási folyamat
- Fájlfeltöltés: képek, dokumentumok kezelése
- Ütemezett feladatok: automatikus műveletek cron-nal

### 3. Nem-funkcionális követelmények
- Teljesítmény: 100+ egyidejű kérés, <500ms válaszidő
- Skalálhatóság: stateless REST API, horizontális skálázhatóság
- Biztonság: HTTPS, bcrypt, JWT, input validáció, CORS, fájlfeltöltés ellenőrzés
- Megbízhatóság: monitoring, logolás, automatikus újraindítás

### 4. Rendszerkövetelmények — szoftver
- **Backend:** Node.js 18+, npm/yarn, Express, MongoDB 4.4+, multer, jsonwebtoken, bcrypt, dotenv
- **Frontend:** Node.js, Angular CLI, modern böngészők
- **Fejlesztői eszközök:** Git, VS Code
- **Egyéb:** Reverse proxy (Nginx), TLS, PM2/Docker/CI

### 5. Rendszerkövetelmények — hardver
- **Fejlesztői gép:** 4 mag, 8 GB RAM (ajánlott 16 GB), 20 GB szabad hely
- **Teszt/staging:** 2 vCPU, 4 GB RAM, 20–50 GB tárhely
- **Production:** 2–4 vCPU, 8–16 GB RAM, SSD, napi mentés

### 6. Konfigurációs változók
- PORT, MONGO_URI, JWT_SECRET, UPLOAD_DIR, NODE_ENV

### 7. Adatbázis
- MongoDB, indexelés, biztonságos hozzáférés

### 8. Telepítés
- Backend: npm install, környezeti változók, pm2/systemd
- Frontend: ng build --prod, statikus fájlok CDN/Nginx
- uploads/ könyvtár védelme

### 9. Mentés és helyreállítás
- Napi adatbázis és fájl mentés, helyreállítási terv

### 10. Logolás, monitorozás
- API logok, health endpoint, riasztások

### 11. Tesztelés
- Unit, integrációs, E2E tesztek, CI pipeline

### 12. API végpontok
- auth, user, lesson, shop, teacher routes, fájlfeltöltés

### 13. Biztonsági ajánlások
- HTTPS, erős JWT, bcrypt, input validáció, rate limit

### 14. Dokumentáció
- README, deploy/rollback lépések, verziókezelés
