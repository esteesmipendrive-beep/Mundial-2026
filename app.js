// ENLACE A TU BASE DE DATOS CSV DE GOOGLE DRIVE
const URL_SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSY9OP3N3MoehCAKTfU83Z__5Ecu0GAukFgCKk1ZYB5hQQxwwK1j9DdlK_64KByH432zf48yc0jGBvI/pub?output=csv";

document.addEventListener("DOMContentLoaded", () => {
    obtenerDatosMundial();
});

async function obtenerDatosMundial() {
    try {
        const respuesta = await fetch(URL_SHEET);
        if (!respuesta.ok) throw new Error("Fallo en la conexión con Google Sheets.");
        
        const textoCSV = await respuesta.text();
        const jugadores = parsearCSV(textoCSV);
        
        renderizarClasificacion(jugadores);
        renderizarTorneo(jugadores.slice(0, 8)); // Pasa estrictamente el Top 8 al torneo
        
    } catch (error) {
        console.error("Error crítico de ejecución:", error);
        document.getElementById("cuerpo-tabla").innerHTML = `
            <tr><td colspan="4" style="color: #ff4444; text-align: center; font-weight: bold;">
                Error al leer la base de datos. Comprueba la configuración de tu Excel.
            </td></tr>
        `;
    }
}

function parsearCSV(texto) {
    const lineas = texto.split("\n");
    const resultado = [];
    
    // Iteración desde la fila 1 (ignorando cabeceras)
    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;
        
        const columnas = linea.split(",");
        
        // Mapeo riguroso de las 7 columnas estructurales
        resultado.push({
            nombre: columnas[0]?.replace(/"/g, '').trim() || "Desconocido",
            equipo: columnas[1]?.replace(/"/g, '').trim() || "Sin Equipo",
            capitan: columnas[2]?.replace(/"/g, '').trim() || "Ninguno",
            ptsLiguilla: parseInt(columnas[3]) || 0,
            ptsCuartos: parseInt(columnas[4]) || 0,
            ptsSemis: parseInt(columnas[5]) || 0,
            ptsFinal: parseInt(columnas[6]) || 0
        });
    }
    
    // BLOQUEO DE POSICIONES: Ordenar ÚNICAMENTE por los puntos de la liguilla.
    return resultado.sort((a, b) => b.ptsLiguilla - a.ptsLiguilla);
}

function renderizarClasificacion(jugadores) {
    const tbody = document.getElementById("cuerpo-tabla");
    tbody.innerHTML = "";
    
    if (jugadores.length === 0) return;

    jugadores.forEach((jugador, index) => {
        const tr = document.createElement("tr");
        if (index < 8) tr.className = "zona-clasificacion"; // Resalte para el Top 8
        
        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td><strong>${jugador.nombre}</strong><br><small style="color:#aaa;">${jugador.equipo}</small></td>
            <td>${jugador.capitan}</td>
            <td><strong>${jugador.ptsLiguilla} pts</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

// LÓGICA DE ELIMINATORIAS: Compara puntos para decidir quién avanza
function obtenerGanador(jugadorA, jugadorB, fase) {
    if (jugadorA[fase] === 0 && jugadorB[fase] === 0) {
        return { nombre: "Esperando resultado...", pts: 0 };
    }
    
    if (jugadorA[fase] > jugadorB[fase]) return jugadorA;
    if (jugadorB[fase] > jugadorA[fase]) return jugadorB;
    
    // Control en caso de empate técnico en los cruces
    return { nombre: "EMPATE (Revisar)", pts: jugadorA[fase] }; 
}

function renderizarTorneo(top8) {
    const contenedorTorneo = document.getElementById("contenedor-torneo");
    
    if (top8.length < 8) {
        contenedorTorneo.innerHTML = `<p style="color:#ffcc00; text-align:center;"><em>Se requieren al menos 8 jugadores para generar el cuadro del torneo.</em></p>`;
        return;
    }

    // DEFINICIÓN INAMOVIBLE DE CRUCES DE CUARTOS
    const q1_A = top8[0], q1_B = top8[7]; // 1º vs 8º
    const q2_A = top8[3], q2_B = top8[4]; // 4º vs 5º
    const q3_A = top8[1], q3_B = top8[6]; // 2º vs 7º
    const q4_A = top8[2], q4_B = top8[5]; // 3º vs 6º

    // EVALUACIÓN DE SEMIFINALISTAS
    const semi1_A = obtenerGanador(q1_A, q1_B, 'ptsCuartos');
    const semi1_B = obtenerGanador(q2_A, q2_B, 'ptsCuartos');
    const semi2_A = obtenerGanador(q3_A, q3_B, 'ptsCuartos');
    const semi2_B = obtenerGanador(q4_A, q4_B, 'ptsCuartos');

    // EVALUACIÓN DE FINALISTAS
    const final_A = obtenerGanador(semi1_A, semi1_B, 'ptsSemis');
    const final_B = obtenerGanador(semi2_A, semi2_B, 'ptsSemis');

    // EVALUACIÓN DEL CAMPEÓN
    const campeon = obtenerGanador(final_A, final_B, 'ptsFinal');

    // INYECCIÓN DEL ÁRBOL VISUAL
    contenedorTorneo.innerHTML = `
        <div class="bracket-container">
            <div class="bracket-round">
                <div class="round-title">Cuartos de Final</div>
                ${generarHTMLCruce(q1_A, q1_B, 'ptsCuartos')}
                ${generarHTMLCruce(q2_A, q2_B, 'ptsCuartos')}
                ${generarHTMLCruce(q3_A, q3_B, 'ptsCuartos')}
                ${generarHTMLCruce(q4_A, q4_B, 'ptsCuartos')}
            </div>
            
            <div class="bracket-round">
                <div class="round-title">Semifinales</div>
                ${generarHTMLCruce(semi1_A, semi1_B, 'ptsSemis', !semi1_A.equipo)}
                ${generarHTMLCruce(semi2_A, semi2_B, 'ptsSemis', !semi2_A.equipo)}
            </div>
            
            <div class="bracket-round">
                <div class="round-title">Gran Final</div>
                ${generarHTMLCruce(final_A, final_B, 'ptsFinal', !final_A.equipo)}
                
                <div class="matchup" style="border-color: #ffd700; margin-top: 2rem; text-align: center; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);">
                    <strong style="color: #ffd700; letter-spacing: 1px;">🏆 CAMPEÓN MUNDIAL</strong>
                    <div style="padding: 1rem; font-size: 1.2rem; font-weight: bold;">
                        ${campeon.nombre !== "Esperando resultado..." ? campeon.nombre : "---"}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// UTILIDAD: Generador de tarjetas de partido
function generarHTMLCruce(jugadorA, jugadorB, fase, esVacio = false) {
    if (esVacio) {
        return `
            <div class="matchup">
                <div class="team" style="color: #666;">${jugadorA.nombre}</div>
                <div class="team" style="color: #666;">${jugadorB.nombre}</div>
            </div>`;
    }
    
    // Resalta visualmente al ganador parcial del cruce
    const victoriaA = jugadorA[fase] > jugadorB[fase] ? 'color: #00ff88; font-weight:bold;' : 'color: #aaa;';
    const victoriaB = jugadorB[fase] > jugadorA[fase] ? 'color: #00ff88; font-weight:bold;' : 'color: #aaa;';

    return `
        <div class="matchup">
            <div class="team seed-high" style="${victoriaA}">
                ${jugadorA.nombre} <span>${jugadorA[fase] > 0 ? jugadorA[fase] : ''}</span>
            </div>
            <div class="team" style="${victoriaB}">
                ${jugadorB.nombre} <span>${jugadorB[fase] > 0 ? jugadorB[fase] : ''}</span>
            </div>
        </div>
    `;
}
