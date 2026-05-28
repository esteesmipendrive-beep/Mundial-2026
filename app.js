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
        renderizarTorneo(jugadores.slice(0, 8)); 
        
    } catch (error) {
        console.error("Error crítico de ejecución:", error);
        document.getElementById("cuerpo-tabla").innerHTML = `
            <tr><td colspan="4" style="color: #ff4444; text-align: center; font-weight: bold;">
                Error al leer la base de datos. Verifica que tienes las 10 columnas con los nombres reales del Mundial.
            </td></tr>
        `;
    }
}

function parsearCSV(texto) {
    const lineas = texto.split("\n");
    let resultado = [];
    
    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;
        
        const col = linea.split(",");
        
        // Mapeo riguroso adaptado a las fases reales del Mundial 2026
        resultado.push({
            nombre: col[0]?.replace(/"/g, '').trim() || "Desconocido",
            equipo: col[1]?.replace(/"/g, '').trim() || "Sin Equipo",
            capitan: col[2]?.replace(/"/g, '').trim() || "Ninguno",
            ptsLiguilla: parseInt(col[3]) || 0,
            ptsDieciseisavos: parseInt(col[4]) || 0, // Antes Cuartos Ida
            ptsOctavos: parseInt(col[5]) || 0,       // Antes Cuartos Vuelta
            ptsCuartos: parseInt(col[6]) || 0,       // Antes Semis Ida
            ptsSemis: parseInt(col[7]) || 0,         // Antes Semis Vuelta
            ptsFinal: parseInt(col[8]) || 0,
            ptsTercero: parseInt(col[9]) || 0
        });
    }
    
    // Ordenamos por liguilla de mayor a menor
    resultado.sort((a, b) => b.ptsLiguilla - a.ptsLiguilla);

    // Asignamos Seed inamovible
    resultado = resultado.map((jugador, index) => {
        return { ...jugador, seed: index + 1 };
    });

    return resultado;
}

function renderizarClasificacion(jugadores) {
    const tbody = document.getElementById("cuerpo-tabla");
    tbody.innerHTML = "";
    if (jugadores.length === 0) return;

    jugadores.forEach((jugador, index) => {
        const tr = document.createElement("tr");
        if (index < 8) tr.className = "zona-clasificacion"; 
        
        tr.innerHTML = `
            <td><strong>${jugador.seed}</strong></td>
            <td><strong>${jugador.nombre}</strong><br><small style="color:#aaa;">${jugador.equipo}</small></td>
            <td>${jugador.capitan}</td>
            <td><strong>${jugador.ptsLiguilla} pts</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

// Sumatorio de dos fases reales para simular Ida y Vuelta
function obtenerGanadorDoble(jugadorA, jugadorB, colIda, colVuelta) {
    if (!jugadorA || !jugadorB) return { nombre: "---", ptsMostrados: 0 };
    
    const totalA = jugadorA[colIda] + jugadorA[colVuelta];
    const totalB = jugadorB[colIda] + jugadorB[colVuelta];

    if (totalA === 0 && totalB === 0) return { nombre: "Esperando...", ptsMostrados: 0 };

    if (totalA > totalB) return { ...jugadorA, ptsMostrados: totalA };
    if (totalB > totalA) return { ...jugadorB, ptsMostrados: totalB };

    // Desempate: Mejor posición en la liguilla
    if (jugadorA.seed < jugadorB.seed) return { ...jugadorA, ptsMostrados: totalA + ' (L)' };
    if (jugadorB.seed < jugadorA.seed) return { ...jugadorB, ptsMostrados: totalB + ' (L)' };

    // Desempate de seguridad
    if (jugadorA[colVuelta] > jugadorB[colVuelta]) return { ...jugadorA, ptsMostrados: totalA + ' (V)' };
    if (jugadorB[colVuelta] > jugadorA[colVuelta]) return { ...jugadorB, ptsMostrados: totalB + ' (V)' };

    return { nombre: "EMPATE ABSOLUTO", ptsMostrados: totalA }; 
}

function obtenerGanadorUnico(jugadorA, jugadorB, columna) {
    if (!jugadorA || !jugadorB) return { nombre: "---", ptsMostrados: 0 };
    
    const ptsA = jugadorA[columna];
    const ptsB = jugadorB[columna];

    if (ptsA === 0 && ptsB === 0) return { nombre: "Esperando...", ptsMostrados: 0 };
    if (ptsA > ptsB) return { ...jugadorA, ptsMostrados: ptsA };
    if (ptsB > ptsA) return { ...jugadorB, ptsMostrados: ptsB };
    
    if (jugadorA.seed < jugadorB.seed) return { ...jugadorA, ptsMostrados: ptsA + ' (L)' };
    if (jugadorB.seed < jugadorA.seed) return { ...jugadorB, ptsMostrados: ptsB + ' (L)' };

    return { nombre: "EMPATE", ptsMostrados: ptsA };
}

function renderizarTorneo(top8) {
    const contenedorTorneo = document.getElementById("contenedor-torneo");
    if (top8.length < 8) return;

    // Vuestros Cuartos de Final
    const q1_A = top8[0], q1_B = top8[7];
    const q2_A = top8[3], q2_B = top8[4];
    const q3_A = top8[1], q3_B = top8[6];
    const q4_A = top8[2], q4_B = top8[5];

    // Vuestras Semifinales (Evaluando Dieciseisavos + Octavos reales)
    const semi1_A = obtenerGanadorDoble(q1_A, q1_B, 'ptsDieciseisavos', 'ptsOctavos');
    const semi1_B = obtenerGanadorDoble(q2_A, q2_B, 'ptsDieciseisavos', 'ptsOctavos');
    const semi2_A = obtenerGanadorDoble(q3_A, q3_B, 'ptsDieciseisavos', 'ptsOctavos');
    const semi2_B = obtenerGanadorDoble(q4_A, q4_B, 'ptsDieciseisavos', 'ptsOctavos');

    const perdedorSemi1 = semi1_A.nombre !== "Esperando..." && semi1_A.nombre === q1_A.nombre || semi1_A.nombre === q1_B.nombre ? 
                          (semi1_A.nombre === q1_A.nombre ? q1_B : q1_A) : { nombre: "Perdedor S1" };
    
    const perdedorSemi2 = semi2_A.nombre !== "Esperando..." && semi2_A.nombre === q3_A.nombre || semi2_A.nombre === q3_B.nombre ? 
                          (semi2_A.nombre === q3_A.nombre ? q3_B : q3_A) : { nombre: "Perdedor S2" };

    // Vuestra Final (Evaluando Cuartos + Semis reales)
    const final_A = obtenerGanadorDoble(semi1_A, semi1_B, 'ptsCuartos', 'ptsSemis');
    const final_B = obtenerGanadorDoble(semi2_A, semi2_B, 'ptsCuartos', 'ptsSemis');

    // Campeón y Tercero (Partido Único)
    const campeon = obtenerGanadorUnico(final_A, final_B, 'ptsFinal');
    const tercero = obtenerGanadorUnico(perdedorSemi1, perdedorSemi2, 'ptsTercero');

    // Títulos de ronda actualizados para mostrar las fases reales
    contenedorTorneo.innerHTML = `
        <div class="bracket-container">
            <div class="bracket-round">
                <div class="round-title">Nuestros Cuartos<br><span style="font-size:0.75rem; color:#888;">(Dieciseisavos + Octavos)</span></div>
                ${generarHTMLCruceDoble(q1_A, q1_B, 'ptsDieciseisavos', 'ptsOctavos')}
                ${generarHTMLCruceDoble(q2_A, q2_B, 'ptsDieciseisavos', 'ptsOctavos')}
                ${generarHTMLCruceDoble(q3_A, q3_B, 'ptsDieciseisavos', 'ptsOctavos')}
                ${generarHTMLCruceDoble(q4_A, q4_B, 'ptsDieciseisavos', 'ptsOctavos')}
            </div>

            <div class="bracket-round">
                <div class="round-title">Nuestras Semis<br><span style="font-size:0.75rem; color:#888;">(Cuartos + Semis reales)</span></div>
                ${generarHTMLCruceDoble(semi1_A, semi1_B, 'ptsCuartos', 'ptsSemis', !semi1_A.ptsLiguilla)}
                ${generarHTMLCruceDoble(semi2_A, semi2_B, 'ptsCuartos', 'ptsSemis', !semi2_A.ptsLiguilla)}
            </div>
            
            <div class="bracket-round">
                <div class="round-title">Nuestra Final<br><span style="font-size:0.75rem; color:#888;">(Final Real)</span></div>
                ${generarHTMLCruceUnico(final_A, final_B, 'ptsFinal', !final_A.ptsLiguilla)}
                
                <div class="matchup champion-card">
                    <strong>🏆 CAMPEÓN MUNDIAL</strong>
                    <div class="champion-name">${campeon.nombre !== "Esperando..." ? campeon.nombre : "---"}</div>
                </div>

                <div class="round-title" style="margin-top: 2rem;">Tercer Puesto<br><span style="font-size:0.75rem; color:#888;">(Consolación Real)</span></div>
                ${generarHTMLCruceUnico(perdedorSemi1, perdedorSemi2, 'ptsTercero', !perdedorSemi1.ptsLiguilla)}
            </div>
        </div>
    `;
}

function generarHTMLCruceDoble(jugadorA, jugadorB, colIda, colVuelta, esVacio = false) {
    if (esVacio) {
        return `
            <div class="matchup">
                <div class="team empty">${jugadorA.nombre}</div>
                <div class="team empty">${jugadorB.nombre}</div>
            </div>`;
    }
    
    const totalA = jugadorA[colIda] + jugadorA[colVuelta];
    const totalB = jugadorB[colIda] + jugadorB[colVuelta];

    let ganaA = totalA > totalB || (totalA === totalB && jugadorA.seed < jugadorB.seed);
    let ganaB = totalB > totalA || (totalA === totalB && jugadorB.seed < jugadorA.seed);

    if (totalA === 0 && totalB === 0) { ganaA = false; ganaB = false; }

    return `
        <div class="matchup">
            <div class="team seed-high ${ganaA ? 'winner' : ''}">
                ${jugadorA.nombre} <span>${totalA > 0 ? totalA : ''}</span>
            </div>
            <div class="team ${ganaB ? 'winner' : ''}">
                ${jugadorB.nombre} <span>${totalB > 0 ? totalB : ''}</span>
            </div>
        </div>
    `;
}

function generarHTMLCruceUnico(jugadorA, jugadorB, columna, esVacio = false) {
    if (esVacio) {
        return `
            <div class="matchup">
                <div class="team empty">${jugadorA.nombre}</div>
                <div class="team empty">${jugadorB.nombre}</div>
            </div>`;
    }

    const ptsA = jugadorA[columna];
    const ptsB = jugadorB[columna];

    let ganaA = ptsA > ptsB || (ptsA === ptsB && ptsA > 0 && jugadorA.seed < jugadorB.seed);
    let ganaB = ptsB > ptsA || (ptsA === ptsB && ptsB > 0 && jugadorB.seed < jugadorA.seed);

    if (ptsA === 0 && ptsB === 0) { ganaA = false; ganaB = false; }

    return `
        <div class="matchup">
            <div class="team seed-high ${ganaA ? 'winner' : ''}">
                ${jugadorA.nombre} <span>${ptsA > 0 ? ptsA : ''}</span>
            </div>
            <div class="team ${ganaB ? 'winner' : ''}">
                ${jugadorB.nombre} <span>${ptsB > 0 ? ptsB : ''}</span>
            </div>
        </div>
    `;
}
