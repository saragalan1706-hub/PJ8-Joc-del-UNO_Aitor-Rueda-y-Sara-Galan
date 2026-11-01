const canvas = document.getElementById("dibuix");
const ctx = canvas.getContext("2d");

// __________ MESA __________
function dibuixarMesa() {
    // Pinta de marron la mesa
    ctx.fillStyle = "rgba(110, 62, 41, 0.99)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pinta de verde el tapete
    ctx.fillStyle = "green";
    ctx.fillRect(50, 50, 1410, 575);

    // Pinta el hueco de los descartes
    ctx.strokeStyle = "rgb(136, 231, 136)";
    ctx.beginPath();
    ctx.roundRect(750, 250, 80, 100, 6); // NUEVO (ancho 70 -> 80 para que mida como una carta)
    ctx.stroke();

    // Rectangulo que delimita la zona del jugador
    ctx.setLineDash([8]);
    ctx.strokeStyle = "rgb(136, 231, 136)";
    ctx.strokeRect(zonaJugador.x, zonaJugador.y, zonaJugador.ancho, zonaJugador.alto);
    ctx.strokeRect(zonaRival.x, zonaRival.y, zonaRival.ancho, zonaRival.alto); // NUEVO
    ctx.setLineDash([]);

}

// __________ IMÁGENES CARTAS __________

// Deja las imagenes de las cartas cargadas en orden
const imagenes = {};
for (const nombre of ["dorso", "amarillo", "azul", "verde", "rojo", "comodin"]) {
    const img = new Image();
    img.src = `./img/${nombre}.jpg`;
    imagenes[nombre] = img;
}

// Lo mimso pero con los iconos que hay encima de las cartas
const iconos = {};
for (const nombre of ["reversa", "salto", "cambiocolor"]) {
    const img = new Image();
    img.src = `./img/${nombre}.png`;
    iconos[nombre] = img;
}

// __________ MAZO DE CARTAS __________
function crearCarta(color, tipo, valor = null) {
    return { color, tipo, valor, img: imagenes[color], x: 0, y: 0 };
}

function crearMazo() {
    const colores = ["amarillo", "azul", "verde", "rojo"];
    const cartas = []; // NUEVO (antes llevaba el dorso dentro, ahora el dorso es un objeto aparte)

    // Por cada color le pone un numero a cada carta
    for (const color of colores) {
        for (let n = 1; n <= 9; n++) {
            cartas.push(crearCarta(color, "numero", n));
            cartas.push(crearCarta(color, "numero", n));
        }

        // Crea los +2, añade images a las cartas de reversa y salto de turno
        for (let i = 0; i < 2; i++) {
            cartas.push(crearCarta(color, "mas", 2));
            cartas.push(crearCarta(color, "reversa"));
            cartas.push(crearCarta(color, "salto"));
        }
    }

    // Crea los comodines que no estan asociados a nigun color, como los +4 y los cambiocolor
    for (let i = 0; i < 4; i++) {
        cartas.push(crearCarta("comodin", "cambiocolor"));
        cartas.push(crearCarta("comodin", "mas", 4));
    }
    return cartas;
}

// Hace que las cartas aparezcan de manerra aleatoria
function barajar(cartas) {
    for (let i = cartas.length - 1; i > 0; i--) {          // NUEVO (ya no hay dorso que proteger en la posición 0)
        const j = Math.floor(Math.random() * (i + 1));     // NUEVO
        [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
    }
}

// Tamaño de las cartas e iconos + posicion del mazo
const ANCHO = 80, ALTO = 100;
const ICONO = 36;
const monton = { x: 650, y: 250 };
const descarte = { x: 750, y: 250 };                                  // NUEVO
const zonaJugador = { x: 450, y: 480, ancho: 600, alto: 130 };        // abajo: jugador con turno
const zonaRival   = { x: 450, y: 60,  ancho: 600, alto: 130 };        // NUEVO (arriba: el otro jugador, boca abajo)

const robar = crearMazo();   // NUEVO (el montón de robar; sustituye a "mazo" y "cartas")
barajar(robar);              // NUEVO

const dorso = crearCarta("dorso", "dorso"); // NUEVO (la carta que tapa el montón)
dorso.x = monton.x;                          // NUEVO
dorso.y = monton.y;                          // NUEVO

const descartes = [];                                  // NUEVO (cartas ya tiradas, se quedan ahí)
const jugadores = [{ mano: [] }, { mano: [] }];        // NUEVO (jugador 1 y 2)
let turno = 0;                                         // NUEVO (0 = jugador 1, 1 = jugador 2)

// NUEVO: 7 cartas aleatorias a cada jugador
for (const j of jugadores) {
    for (let i = 0; i < 7; i++) j.mano.push(robar.pop());
}

// NUEVO: reparte las cartas de una mano en fila, centradas en su zona
function colocarMano(mano, zona) {
    const sep = Math.min(ANCHO + 10, (zona.ancho - ANCHO) / Math.max(mano.length - 1, 1));
    const total = sep * (mano.length - 1) + ANCHO;
    const x0 = zona.x + (zona.ancho - total) / 2;
    mano.forEach((c, i) => {
        c.x = x0 + i * sep;
        c.y = zona.y + (zona.alto - ALTO) / 2;
    });
}

// NUEVO: el jugador con turno abajo, el otro arriba
function recolocarManos() {
    colocarMano(jugadores[turno].mano, zonaJugador);
    colocarMano(jugadores[1 - turno].mano, zonaRival);
}

// __________ DIBUJAR UNA CARTA Y EN LA CARTA __________
function dibujarCarta(c, bocaArriba = true) { // NUEVO (parámetro bocaArriba)
    // NUEVO: si va boca abajo solo se dibuja el dorso
    if (!bocaArriba) {
        ctx.drawImage(imagenes.dorso, c.x, c.y, ANCHO, ALTO);
        return;
    }

    ctx.drawImage(c.img, c.x, c.y, ANCHO, ALTO); // Dibuja la carta

    // Empiezan sin texto y si son numero o +, escribe un numero en binario
    let texto = null;
    if (c.tipo === "numero") texto = c.valor.toString(2);
    if (c.tipo === "mas")    texto = "+" + c.valor.toString(2);

    // Calcula el centro de la carta
    const centroX = c.x + ANCHO / 2;
    const centroY = c.y + ALTO / 2;

    // Dibuja el texto si es del tipo tetxo
    if (texto) {
        ctx.fillStyle = "black";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(texto, centroX, centroY);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }
    // Si no es del tipo texto, pone una iamgen
    else if (iconos[c.tipo]) {
        const icono = iconos[c.tipo];
        if (icono.complete && icono.naturalWidth > 0) {
            ctx.drawImage(icono, centroX - ICONO / 2, centroY - ICONO / 2, ICONO, ICONO);
        }
    }
}

// __________ DIBUJAR TODO __________
function redibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dibuixarMesa();

    if (robar.length) dibujarCarta(dorso);                                   // NUEVO (el montón siempre tapado)
    descartes.forEach(c => dibujarCarta(c));                                 // NUEVO (descartes boca arriba)
    jugadores[1 - turno].mano.forEach(c => dibujarCarta(c, false));          // NUEVO (el rival: solo dorsos)
    jugadores[turno].mano.forEach(c => dibujarCarta(c));                     // NUEVO (el que juega: boca arriba)
    if (arrastrando) dibujarCarta(arrastrando);                              // NUEVO (la que llevas, encima de todo)
}

// __________ DRAG AND DROP __________
let arrastrando = null;
let origen = null;                // NUEVO ("mano" o "monton": de dónde viene la carta)
let offsetX = 0, offsetY = 0; // Guardan en qué punto de la carta la agarraste

// Detecta dentro del canvas el cursos
function posicion(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// NUEVO: dice si un punto está dentro de un rectángulo {x, y, ancho, alto}
function dentro(x, y, r) {
    return x >= r.x && x <= r.x + r.ancho && y >= r.y && y <= r.y + r.alto;
}
const cajaMonton   = { x: monton.x,   y: monton.y,   ancho: ANCHO, alto: ALTO }; // NUEVO
const cajaDescarte = { x: descarte.x, y: descarte.y, ancho: ANCHO, alto: ALTO }; // NUEVO

canvas.addEventListener("mousedown", e => {
    const { x, y } = posicion(e);
    const mano = jugadores[turno].mano; // NUEVO (solo se pueden coger cartas de la mano con turno)

    // Recorre las cartas de la última a la primera. Así se revisa primero la que está más arriba (la que ves encima), que es la que quieres coger.
    for (let i = mano.length - 1; i >= 0; i--) { // NUEVO (antes recorría "cartas")
        const c = mano[i];
        if (x >= c.x && x <= c.x + ANCHO && y >= c.y && y <= c.y + ALTO) {
            arrastrando = mano.splice(i, 1)[0]; // NUEVO (la carta sale de la mano)
            origen = "mano";                    // NUEVO
            offsetX = x - c.x; // Distancia entre el click y la esquina de la carta
            offsetY = y - c.y;
            return;                             // NUEVO
        }
    }

    // NUEVO: si no has cogido ninguna carta de la mano, mira si robas del montón
    if (robar.length && dentro(x, y, cajaMonton)) {
        arrastrando = robar.pop();              // NUEVO (la carta sale del montón)
        arrastrando.x = monton.x;               // NUEVO
        arrastrando.y = monton.y;               // NUEVO
        origen = "monton";                      // NUEVO
        offsetX = x - monton.x;                 // NUEVO
        offsetY = y - monton.y;                 // NUEVO
    }
});

// Si no se hace click en ninguna carta no la arrastara
canvas.addEventListener("mousemove", e => {
    if (!arrastrando) return;
    const { x, y } = posicion(e);
    arrastrando.x = x - offsetX;
    arrastrando.y = y - offsetY;
    redibujar();
});

// NUEVO: al soltar, decide a qué array va la carta según dónde esté su centro
function soltar() {
    if (!arrastrando) return;
    const c = arrastrando;
    const cx = c.x + ANCHO / 2, cy = c.y + ALTO / 2;

    if (origen === "mano" && dentro(cx, cy, cajaDescarte)) {
        c.x = descarte.x;
        c.y = descarte.y;
        descartes.push(c);                       // se queda en los descartes
    } else if (dentro(cx, cy, zonaJugador)) {
        jugadores[turno].mano.push(c);           // robada, o mano reordenada
    } else if (origen === "monton") {
        robar.push(c);                           // soltada en otro sitio: vuelve al montón
    } else {
        jugadores[turno].mano.push(c);           // vuelve a la mano
    }

    arrastrando = null;
    recolocarManos();
    redibujar();
}

// Si sueltas el boton o salir del canvas, la carta no se movera
canvas.addEventListener("mouseup", soltar);      // NUEVO (antes: arrastrando = null)
canvas.addEventListener("mouseleave", soltar);   // NUEVO (antes: arrastrando = null)

// __________ BOTÓN CAMBIAR TURNO __________
// NUEVO
btnTurno.addEventListener("click", () => {
    turno = 1 - turno;       // 0 pasa a 1 y 1 pasa a 0
    recolocarManos();
    redibujar();
});

// Esepra a las imagenes y las dibuja
const todas = [...Object.values(imagenes), ...Object.values(iconos)];
Promise.all(todas.map(img => new Promise(res => {
    img.onload = res;
    img.onerror = res;
}))).then(() => { recolocarManos(); redibujar(); }); // NUEVO (antes: .then(redibujar))