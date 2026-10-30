const canvas = document.getElementById("dibuix");
const ctx = canvas.getContext("2d");

// __________ MESA __________
function dibuixarMesa() {
    ctx.fillStyle = "rgba(110, 62, 41, 0.99)"; // Color marron en las mesa
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Medidas de lo que va a printar

    ctx.fillStyle = "green"; // Color verde del tapete
    ctx.fillRect(50, 50, 1410, 575); // Medidas de lo que va pintar de tapete

    ctx.strokeStyle = "rgb(136, 231, 136)"; // Pinta el rectangulo verde donde se descartan las cartas
    ctx.beginPath(); // Emipeza trazado nuevo
    ctx.roundRect(750, 250, 70, 100, 6); // Defien el rectangulo y pone los bordes redondos
    ctx.stroke(); // Dibuja solo el contorno
}

// __________ IMÁGENES __________
const imagenes = {};
for (const nombre of ["dorso", "amarillo", "azul", "verde", "rojo", "comodin"]) {
    const img = new Image();
    img.src = `./img/${nombre}.jpg`;
    imagenes[nombre] = img;
}

const iconos = {};
for (const nombre of ["reversa", "salto", "cambiocolor"]) {
    const img = new Image();
    img.src = `./img/${nombre}.png`;
    iconos[nombre] = img;
}

// ---------- CARTAS ----------
function crearCarta(color, tipo, valor = null) {
    return { color, tipo, valor, img: imagenes[color], x: 0, y: 0 };
}

function crearMazo() {
    const colores = ["amarillo", "azul", "verde", "rojo"];
    const cartas = [crearCarta("dorso", "dorso")];

    for (const color of colores) {
        // Números del 1 al 9, dos de cada
        for (let n = 1; n <= 9; n++) {
            cartas.push(crearCarta(color, "numero", n));
            cartas.push(crearCarta(color, "numero", n));
        }
        // Dos de cada especial por color
        for (let i = 0; i < 2; i++) {
            cartas.push(crearCarta(color, "mas", 2));
            cartas.push(crearCarta(color, "reversa"));
            cartas.push(crearCarta(color, "salto"));
        }
    }

    // 8 comodines
    for (let i = 0; i < 4; i++) {
        cartas.push(crearCarta("comodin", "cambiocolor"));
        cartas.push(crearCarta("comodin", "mas", 4));
    }
    return cartas;
}

const mazo = crearMazo();

// Baraja desde la posición 1 (el dorso se queda en la 0)
function barajar(cartas) {
    for (let i = cartas.length - 1; i > 1; i--) {
        const j = Math.floor(Math.random() * i) + 1;
        [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
    }
}
barajar(mazo);

const ANCHO = 80, ALTO = 100;
const ICONO = 36;
const monton = { x: 650, y: 250 };
const zonaJugador = { x: 450, y: 480, ancho: 600, alto: 130 };

const cartas = mazo.slice(1);
cartas.forEach(c => {
    c.x = monton.x;
    c.y = monton.y;
});

mazo[0].x = monton.x;
mazo[0].y = monton.y;

// ---------- DIBUJAR UNA CARTA ----------
function dibujarCarta(c) {
    ctx.drawImage(c.img, c.x, c.y, ANCHO, ALTO);

    // ¿Qué texto lleva? (solo las cartas con número, en binario)
    let texto = null;
    if (c.tipo === "numero") texto = c.valor.toString(2);
    if (c.tipo === "mas")    texto = "+" + c.valor.toString(2);

    const centroX = c.x + ANCHO / 2;
    const centroY = c.y + ALTO / 2;

    if (texto) {
        ctx.fillStyle = "black";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(texto, centroX, centroY);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    } else if (iconos[c.tipo]) {
        // Cartas sin número: imagen encima (solo si el archivo cargó bien)
        const icono = iconos[c.tipo];
        if (icono.complete && icono.naturalWidth > 0) {
            ctx.drawImage(icono, centroX - ICONO / 2, centroY - ICONO / 2, ICONO, ICONO);
        }
    }
}

// ---------- DIBUJAR TODO ----------
function redibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dibuixarMesa();

    // Zona del jugador
    ctx.setLineDash([8]);
    ctx.strokeStyle = "rgb(136, 231, 136)";
    ctx.strokeRect(zonaJugador.x, zonaJugador.y, zonaJugador.ancho, zonaJugador.alto);
    ctx.setLineDash([]);

    cartas.forEach(dibujarCarta); // primero todas las cartas

    dibujarCarta(mazo[0]);        // después el dorso
}

// ---------- ARRASTRAR ----------
let arrastrando = null;
let offsetX = 0, offsetY = 0;

function posicion(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener("mousedown", e => {
    const { x, y } = posicion(e);
    for (let i = cartas.length - 1; i >= 0; i--) {
        const c = cartas[i];
        if (x >= c.x && x <= c.x + ANCHO && y >= c.y && y <= c.y + ALTO) {
            arrastrando = c;
            offsetX = x - c.x;
            offsetY = y - c.y;
            cartas.push(cartas.splice(i, 1)[0]);
            break;
        }
    }
});

canvas.addEventListener("mousemove", e => {
    if (!arrastrando) return;
    const { x, y } = posicion(e);
    arrastrando.x = x - offsetX;
    arrastrando.y = y - offsetY;
    redibujar();
});

canvas.addEventListener("mouseup", () => { arrastrando = null; });
canvas.addEventListener("mouseleave", () => { arrastrando = null; });

// Primer dibujo cuando todas las imágenes hayan cargado (o fallado)
const todas = [...Object.values(imagenes), ...Object.values(iconos)];
Promise.all(todas.map(img => new Promise(res => {
    img.onload = res;
    img.onerror = res;   // si falta un icono, la página no se queda en blanco
}))).then(redibujar);