function dibuixar() {

    let canvas = document.getElementById('dibuix');
    let ctx = canvas.getContext('2d');

    // Fondo marron = mesa
    ctx.fillStyle = "rgba(110, 62, 41, 0.99)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fondo verde = tapete
    ctx.fillStyle = 'green';
    ctx.fillRect(
        50,   // x
        50,   // y
        1410, // Ancho
        575); // Alto

    // Contorno negro
    ctx.strokeStyle = 'black';
    ctx.strokeRect(50, 50, 1410, 575);
}
window.addEventListener('load', dibuixar);