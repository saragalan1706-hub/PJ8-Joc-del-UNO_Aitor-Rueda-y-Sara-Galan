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
    ctx.roundRect(750, 250, 80, 100, 6); // Hace que mida lo mismo que una carta
    ctx.stroke();

    // Rectangulo que delimita la zona del jugador
    ctx.setLineDash([8]);
    ctx.strokeStyle = "rgb(136, 231, 136)";
    ctx.strokeRect(zonaJugador.x, zonaJugador.y, zonaJugador.ancho, zonaJugador.alto);
    ctx.strokeRect(zonaRival.x, zonaRival.y, zonaRival.ancho, zonaRival.alto);
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
    const cartas = []; // Hace del dorso un objeto aparte

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
    for (let i = cartas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
    }
}

// Tamaño de las cartas e iconos + posicion del mazo
const ANCHO = 80, ALTO = 100;
const ICONO = 36;
const monton = { x: 650, y: 250 };
const descarte = { x: 750, y: 250 };
const zonaJugador = { x: 450, y: 480, ancho: 600, alto: 130 };
const zonaRival   = { x: 450, y: 60,  ancho: 600, alto: 130 };

const robar = crearMazo();
barajar(robar);

const dorso = crearCarta("dorso", "dorso");
dorso.x = monton.x;
dorso.y = monton.y;

const descartes = []; // Las cartas jugadas se quedan ahi 
const jugadores = [{ mano: [] }, { mano: [] }];
let turno = 0;

// __________ REPARTICION DE CARTAS __________

// 7 cartas aleatorias a cada jugador
for (const j of jugadores) {
    for (let i = 0; i < 7; i++) j.mano.push(robar.pop());
}

// Reparte las cartas de una mano en fila, centradas en su zona
function colocarMano(mano, zona) {
    const sep = Math.min(ANCHO + 10, (zona.ancho - ANCHO) / Math.max(mano.length - 1, 1));
    const total = sep * (mano.length - 1) + ANCHO;
    const x0 = zona.x + (zona.ancho - total) / 2;
    mano.forEach((c, i) => {
        c.x = x0 + i * sep;
        c.y = zona.y + (zona.alto - ALTO) / 2;
    });
}

// El jugador con turno abajo, el otro arriba
function recolocarManos() {
    colocarMano(jugadores[turno].mano, zonaJugador);
    colocarMano(jugadores[1 - turno].mano, zonaRival);
}

// __________ DIBUJAR UNA CARTA Y EN LA CARTA __________

function dibujarCarta(c, bocaArriba = true) {
    // Si va boca abajo solo se dibuja el dorso
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

    if (robar.length) dibujarCarta(dorso); // El montón siempre tapado
    descartes.forEach(c => dibujarCarta(c)); // Descartes boca arriba
    jugadores[1 - turno].mano.forEach(c => dibujarCarta(c, false)); // El rival: solo dorsos
    jugadores[turno].mano.forEach(c => dibujarCarta(c)); // El que juega: boca arriba
    if (arrastrando) dibujarCarta(arrastrando);
}

// __________ DRAG AND DROP __________
let arrastrando = null;
let origen = null;
let offsetX = 0, offsetY = 0; // Guardan en qué punto de la carta la agarraste

// Detecta dentro del canvas el cursos
function posicion(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// Dice si un punto está dentro de un rectángulo {x, y, ancho, alto}
function dentro(x, y, r) {
    return x >= r.x && x <= r.x + r.ancho && y >= r.y && y <= r.y + r.alto;
}
const cajaMonton   = { x: monton.x,   y: monton.y,   ancho: ANCHO, alto: ALTO };
const cajaDescarte = { x: descarte.x, y: descarte.y, ancho: ANCHO, alto: ALTO };

canvas.addEventListener("mousedown", e => {
    const { x, y } = posicion(e);
    const mano = jugadores[turno].mano; // Solo se pueden coger cartas de la mano con turno

    // Recorre las cartas de la última a la primera. Así se revisa primero la que está más arriba (la que ves encima), que es la que quieres coger.
    for (let i = mano.length - 1; i >= 0; i--) {
        const c = mano[i];
        if (x >= c.x && x <= c.x + ANCHO && y >= c.y && y <= c.y + ALTO) {
            arrastrando = mano.splice(i, 1)[0]; // La carta sale de la mano
            origen = "mano";
            offsetX = x - c.x; // Distancia entre el click y la esquina de la carta
            offsetY = y - c.y;
            return;
        }
    }

    // Si no has cogido ninguna carta de la mano, mira si robas del montón
    if (robar.length && dentro(x, y, cajaMonton)) {
        arrastrando = robar.pop();
        arrastrando.x = monton.x;
        arrastrando.y = monton.y;
        origen = "monton";
        offsetX = x - monton.x;
        offsetY = y - monton.y;
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

// Al soltar, decide a qué array va la carta según dónde esté su centro
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
canvas.addEventListener("mouseup", soltar);
canvas.addEventListener("mouseleave", soltar);

// __________ BOTÓN CAMBIAR TURNO __________

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
}))).then(() => { recolocarManos(); redibujar(); });

// _________ REINICIO DE PARTIDA ___________

document.getElementById("btnReiniciar").addEventListener("click", () => {
    // Vacia le monton de robar
    robar.length = 0;
    robar.push(...crearMazo());
    barajar(robar);
    // Vacia el monton de descartes
    descartes.length = 0;
    jugadores.forEach(j => j.mano.length = 0);
    // Reparte 7 cartas a cada jugador
    for (const j of jugadores) {
        for (let i = 0; i < 7; i++) j.mano.push(robar.pop());
    }
    // recalcula dónde se colocan las cartas de cada mano en el canvas y vuelve a dibujar todo para que se vea el estado nuevo.
    turno = 0;
    recolocarManos();
    redibujar();
});

