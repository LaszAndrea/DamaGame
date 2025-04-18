# ♟️ Dáma Játék – WebSocket Alapú Multiplayer

Ez a projekt egy valós idejű **kétjátékos dáma játék**, amely **WebSocket kapcsolaton keresztül** működik. A játék webes felületen keresztül játszható, és **chat funkciót is biztosít** a játékosok között.

---

## 🌐 Technológiák

- **HTML**
- **CSS**
- **JavaScript**
- **WebSocket** (Node.js alapú backend, ha van külön – opcionálisan bővíthető)

---

## 🕹️ Funkciók

- ♟️ **Két játékos** játszhat egymással egyidőben.
- 🚫 **Harmadik fél nem csatlakozhat**, ha a játék már folyamatban van.
- 💬 Beépített **chat** a játékosok közötti kommunikációhoz.
- 🔄 Valós idejű szinkronizáció WebSocketen keresztül.
- 🎨 Egyszerű, letisztult UI HTML, CSS segítségével.

---

## 🛠️ Használat

1. Indítsd el a WebSocket szervert (ha van külön Node.js backend).
2. Nyisd meg a játékot két különböző böngészőfülben / gépen.
3. Játssz dáma játékot valós időben, chatelhetsz is közben!

---

## 🔒 Megjegyzések

- Jelenleg a játék csak **két játékost enged be** egyidőben.
- A chat kizárólag **az aktuálisan játszó felhasználók** között működik.
- A játékszabályokat figyelembe veszi a lépések validálása.
