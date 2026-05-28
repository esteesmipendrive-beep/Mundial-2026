// ATENCIÓN: Reemplaza esta URL por tu enlace exacto de "Publicar en la web" como CSV
const URL_SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSY9OP3N3MoehCAKTfU83Z__5Ecu0GAukFgCKk1ZYB5hQQxwwK1j9DdlK_64KByH432zf48yc0jGBvI/pub?output=csv";

document.addEventListener("DOMContentLoaded", () => {
    obtenerDatosMundial();
});

async function obtenerDatosMundial() {
    try {
        const respuesta = await fetch(URL_SHEET);
        if (!respuesta.ok) throw new Error("Fallo al conectar con Google Sheets.");
        
        const textoCSV = await respuesta.text();
        const jugadores = parsearCSV(textoCSV);
        
        renderizarClasificacion(jugadores);
        renderizarTorneo(jugadores.slice(0, 8)); // Extrae rigurosamente los 8 primeros
        
    } catch (error) {
        console.error("Error crítico:", error);
        document.getElementById("cuerpo-tabla").innerHTML = `
            <tr><td colspan="4" style="color: #ff4444; text-align: center; font-weight: bold;">
                Error al cargar los datos. Verifica el enlace de Google Drive en el código.
            </td></tr>
        `;
    }
}

function parsearCSV(texto) {
    const lineas = texto.split("\n");
    const resultado = [];
    
    // Bucle que ignora la fila de cabeceras (índice 0)
    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;
        
        const columnas = linea.split(",");
        
        // Mapeo exacto sin columna "Posición":
        // 0: Manager | 1: Equipo | 2: Capitán | 3: Puntos
        resultado.push({
            nombre: columnas[0]?.replace(/"/g, '').trim() || "Desconocido",
            equipo: columnas[1]?.replace(/"/g, '').trim() || "Sin Equipo",
            capitan: columnas[2]?.replace(/"/g, '').trim() || "Ninguno",
            puntos: parseInt(columnas[3]) || 0
        });
    }
    
    // Ordena la matriz matemáticamente en orden descendente según los puntos
    return resultado.sort((a, b) => b.puntos - a.puntos);
}

function renderizarClasificacion(jugadores) {
    const tbody = document.getElementById("cuerpo-tabla");
    tbody.innerHTML = "";
    
    if (jugadores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">El archivo CSV está vacío o mal formateado.</td></tr>`;
        return;
    }

    jugadores.forEach((jugador, index) => {
        const tr = document.createElement("tr");
        
        // Aplica el corte visual a los clasificados
        if (index < 8) {
            tr.className = "zona-clasificacion";
        }
        
        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td><strong>${jugador.nombre}</strong><br><small style="color:#aaa;">${jugador.equipo}</small></td>
            <td>${jugador.capitan}</td>
            <td><strong>${jugador.puntos} pts</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarTorneo(top8) {
    const contenedorTorneo = document.getElementById("contenedor-torneo");
    
    // Condición de seguridad: Si no hay 8 jugadores, no se forma el cuadro
    if (top8.length < 8) {
        contenedorTorneo.innerHTML = `<p style="color: #ffcc00;"><em>Sistema en espera: Se necesitan 8 clasificados para calcular los cruces de Cuartos de Final.</em></p>`;
        return;
    }
    
    // Generación matemática de los cruces
    contenedorTorneo.innerHTML = `
        <div class="cuartos-final">
            <h3>Cruces Confirmados por Posición</h3>
            <ul>
                <li>⚔️ <strong>Cruce 1:</strong> ${top8[0].nombre} (1º) vs ${top8[7].nombre} (8º)</li>
                <li>⚔️ <strong>Cruce 2:</strong> ${top8[3].nombre} (4º) vs ${top8[4].nombre} (5º)</li>
                <li>⚔️ <strong>Cruce 3:</strong> ${top8[1].nombre} (2º) vs ${top8[6].nombre} (7º)</li>
                <li>⚔️ <strong>Cruce 4:</strong> ${top8[2].nombre} (3º) vs ${top8[5].nombre} (6º)</li>
            </ul>
        </div>
    `;
}
