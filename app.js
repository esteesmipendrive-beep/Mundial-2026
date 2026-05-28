const URL_SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSY9OP3N3MoehCAKTfU83Z__5Ecu0GAukFgCKk1ZYB5hQQxwwK1j9DdlK_64KByH432zf48yc0jGBvI/pub?output=csv";

document.addEventListener("DOMContentLoaded", () => {
    obtenerDatosMundial();
});

async function obtenerDatosMundial() {
    try {
        const respuesta = await fetch(URL_SHEET);
        if (!respuesta.ok) throw new Error("Fallo en la conexión");
        
        const textoCSV = await respuesta.text();
        const jugadores = parsearCSV(textoCSV);
        
        renderizarClasificacion(jugadores);
        renderizarTorneo(jugadores.slice(0, 8)); 
        calcularPremios(jugadores);
        
    } catch (error) {
        console.error(error);
        document.getElementById("cuerpo-tabla").innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">Error de Base de Datos. Revisa las 9 columnas exactas.</td></tr>`;
    }
}

function parsearCSV(texto) {
    const lineas = texto.split("\n");
    let resultado = [];
    
    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;
        
        const col = linea.split(",");
        
        // Mapeo riguroso adaptado a 9 columnas (Capitanes eliminados)
        resultado.push({
            nombre: col[0]?.replace(/"/g, '').trim() || "???",
            equipo: col[1]?.replace(/"/g, '').trim() || "???",
            ptsLiguilla: parseInt(col[2]) || 0,
            ptsDieciseisavos: parseInt(col[3]) || 0,
            ptsOctavos: parseInt(col[4]) || 0,
            ptsCuartos: parseInt(col[5]) || 0,
            ptsSemis: parseInt(col[6]) || 0,
            ptsFinal: parseInt(col[7]) || 0,
            ptsTercero: parseInt(col[8]) || 0
        });
    }
    
    // Ordenamos matemáticamente de mayor a menor según los puntos de la liguilla
    resultado.sort((a, b) => b.ptsLiguilla - a.ptsLiguilla);
    
    // Asignación de Seed
    return resultado.map((jugador, index) => { return { ...jugador, seed: index + 1 }; });
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
            <td><strong>${jugador.nombre}</strong><br><small style="color:#666;">${jugador.equipo}</small></td>
            <td><strong>${jugador.ptsLiguilla} pts</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function obtenerGanadorDoble(jugadorA, jugadorB, colIda, colVuelta) {
    if (!jugadorA || !jugadorB) return { nombre: "---", ptsMostrados: 0 };
    const totalA = jugadorA[colIda] + jugadorA[colVuelta];
    const totalB = jugadorB[colIda] + jugadorB[colVuelta];
    if (totalA === 0 && totalB === 0) return { nombre: "Esperando", ptsMostrados: 0 };
    if (totalA > totalB) return { ...jugadorA, ptsMostrados: totalA };
    if (totalB > totalA) return { ...jugadorB, ptsMostrados: totalB };
    if (jugadorA.seed < jugadorB.seed) return { ...jugadorA, ptsMostrados: totalA };
    return { ...jugadorB, ptsMostrados: totalB };
}

function obtenerGanadorUnico(jugadorA, jugadorB, columna) {
    if (!jugadorA || !jugadorB) return { nombre: "---", ptsMostrados: 0 };
    const ptsA = jugadorA[columna];
    const ptsB = jugadorB[columna];
    if (ptsA === 0 && ptsB === 0) return { nombre: "Esperando", ptsMostrados: 0 };
    if (ptsA > ptsB) return { ...jugadorA, ptsMostrados: ptsA };
    if (ptsB > ptsA) return { ...jugadorB, ptsMostrados: ptsB };
    if (jugadorA.seed < jugadorB.seed) return { ...jugadorA, ptsMostrados: ptsA };
    return { ...jugadorB, ptsMostrados: ptsB };
}

function renderizarTorneo(top8) {
    const contenedor = document.getElementById("contenedor-torneo");
    if (top8.length < 8) return;

    const q1_A = top8[0], q1_B = top8[7], q2_A = top8[3], q2_B = top8[4];
    const q3_A = top8[1], q3_B = top8[6], q4_A = top8[2], q4_B = top8[5];

    const semi1_A = obtenerGanadorDoble(q1_A, q1_B, 'ptsDieciseisavos', 'ptsOctavos');
    const semi1_B = obtenerGanadorDoble(q2_A, q2_B, 'ptsDieciseisavos', 'ptsOctavos');
    const semi2_A = obtenerGanadorDoble(q3_A, q3_B, 'ptsDieciseisavos', 'ptsOctavos');
    const semi2_B = obtenerGanadorDoble(q4_A, q4_B, 'ptsDieciseisavos', 'ptsOctavos');

    const perdedorSemi1 = semi1_A.nombre !== "Esperando" && semi1_A.nombre === q1_A.nombre ? q1_B : (semi1_A.nombre === q1_B.nombre ? q1_A : null);
    const perdedorSemi2 = semi2_A.nombre !== "Esperando" && semi2_A.nombre === q3_A.nombre ? q3_B : (semi2_A.nombre === q3_B.nombre ? q3_A : null);

    const final_A = obtenerGanadorDoble(semi1_A, semi1_B, 'ptsCuartos', 'ptsSemis');
    const final_B = obtenerGanadorDoble(semi2_A, semi2_B, 'ptsCuartos', 'ptsSemis');

    const campeon = obtenerGanadorUnico(final_A, final_B, 'ptsFinal');
    const subcampeon = campeon.nombre === final_A.nombre ? final_B : (campeon.nombre === final_B.nombre ? final_A : {nombre: "---"});
    const tercero = obtenerGanadorUnico(perdedorSemi1, perdedorSemi2, 'ptsTercero');

    contenedor.innerHTML = `
        <div class="bracket-container">
            <div class="bracket-round">
                <div class="round-title">Cuartos</div>
                ${generarHTMLCruceDoble(q1_A, q1_B, 'ptsDieciseisavos', 'ptsOctavos')}
                ${generarHTMLCruceDoble(q2_A, q2_B, 'ptsDieciseisavos', 'ptsOctavos')}
                ${generarHTMLCruceDoble(q3_A, q3_B, 'ptsDieciseisavos', 'ptsOctavos')}
                ${generarHTMLCruceDoble(q4_A, q4_B, 'ptsDieciseisavos', 'ptsOctavos')}
            </div>
            <div class="bracket-round">
                <div class="round-title">Semifinales</div>
                ${generarHTMLCruceDoble(semi1_A, semi1_B, 'ptsCuartos', 'ptsSemis')}
                ${generarHTMLCruceDoble(semi2_A, semi2_B, 'ptsCuartos', 'ptsSemis')}
            </div>
            <div class="bracket-round">
                <div class="round-title">Final</div>
                ${generarHTMLCruceUnico(final_A, final_B, 'ptsFinal')}
                <div class="round-title" style="margin-top:2rem;">3º Puesto</div>
                ${generarHTMLCruceUnico(perdedorSemi1, perdedorSemi2, 'ptsTercero')}
            </div>
        </div>
    `;

    renderizarPodio(campeon.nombre, subcampeon.nombre, tercero.nombre);
}

function generarHTMLCruceDoble(jugadorA, jugadorB, colIda, colVuelta) {
    if (!jugadorA || !jugadorB) return `<div class="matchup"><div class="team">---</div><div class="team">---</div></div>`;
    const totalA = jugadorA[colIda] + jugadorA[colVuelta];
    const totalB = jugadorB[colIda] + jugadorB[colVuelta];
    let ganaA = totalA > totalB || (totalA === totalB && totalA > 0 && jugadorA.seed < jugadorB.seed);
    let ganaB = totalB > totalA || (totalA === totalB && totalB > 0 && jugadorB.seed < jugadorA.seed);
    
    return `<div class="matchup">
        <div class="team ${ganaA ? 'winner' : ''} ${jugadorA.seed<=4 ? 'seed-high':''}">${jugadorA.nombre} <span>${totalA>0?totalA:''}</span></div>
        <div class="team ${ganaB ? 'winner' : ''}">${jugadorB.nombre} <span>${totalB>0?totalB:''}</span></div>
    </div>`;
}

function generarHTMLCruceUnico(jugadorA, jugadorB, columna) {
    if (!jugadorA || !jugadorB) return `<div class="matchup"><div class="team">---</div><div class="team">---</div></div>`;
    const ptsA = jugadorA[columna];
    const ptsB = jugadorB[columna];
    let ganaA = ptsA > ptsB || (ptsA === ptsB && ptsA > 0 && jugadorA.seed < jugadorB.seed);
    let ganaB = ptsB > ptsA || (ptsA === ptsB && ptsB > 0 && jugadorB.seed < jugadorA.seed);
    
    return `<div class="matchup">
        <div class="team ${ganaA ? 'winner' : ''} ${jugadorA.seed<=4 ? 'seed-high':''}">${jugadorA.nombre} <span>${ptsA>0?ptsA:''}</span></div>
        <div class="team ${ganaB ? 'winner' : ''}">${jugadorB.nombre} <span>${ptsB>0?ptsB:''}</span></div>
    </div>`;
}

function renderizarPodio(oro, plata, bronce) {
    const contenedor = document.getElementById("podio-final");
    const enJuego = oro === "---" || oro === "Esperando";
    
    contenedor.innerHTML = `
        <div class="escalon plata">
            <div class="nombre">${enJuego ? 'En juego' : plata}</div>
            <div>2º</div>
        </div>
        <div class="escalon oro">
            <div class="nombre">👑<br>${enJuego ? 'En juego' : oro}</div>
            <div>1º</div>
        </div>
        <div class="escalon bronce">
            <div class="nombre">${enJuego ? 'En juego' : bronce}</div>
            <div>3º</div>
        </div>
    `;
}

function calcularPremios(jugadores) {
    const contenedor = document.getElementById("contenedor-premios");
    
    // 1. Regularidad (Primero de la tabla, índice 0 ya que vienen ordenados)
    const liderLiguilla = jugadores[0]; 

    // 2. Farolillo Rojo (Último de la tabla)
    const farolillo = jugadores[jugadores.length - 1]; 

    // 3. Bombazo y 4. Limón
    let bombazo = { nombre: "---", puntos: 0, jornada: "" };
    let limon = { nombre: "---", puntos: 9999, jornada: "" };

    const fases = ['ptsDieciseisavos', 'ptsOctavos', 'ptsCuartos', 'ptsSemis', 'ptsFinal'];
    const nombresFases = ['Dieciseisavos', 'Octavos', 'Cuartos', 'Semis', 'Final'];

    jugadores.forEach(j => {
        fases.forEach((fase, idx) => {
            if (j[fase] > bombazo.puntos) {
                bombazo = { nombre: j.nombre, puntos: j[fase], jornada: nombresFases[idx] };
            }
            if (j[fase] > 0 && j[fase] < limon.puntos) {
                limon = { nombre: j.nombre, puntos: j[fase], jornada: nombresFases[idx] };
            }
        });
    });

    contenedor.innerHTML = `
        <div class="premio-card">
            <h3>🚀 El Bombazo</h3>
            <p>${bombazo.puntos > 0 ? bombazo.nombre : '---'}</p>
            <small>${bombazo.puntos > 0 ? bombazo.puntos + ' pts en ' + bombazo.jornada : 'Sin datos aún'}</small>
        </div>
        <div class="premio-card">
            <h3>📈 La Regularidad</h3>
            <p>${liderLiguilla.nombre}</p>
            <small>Líder Liguilla (${liderLiguilla.ptsLiguilla} pts)</small>
        </div>
        <div class="premio-card" style="border-top-color: #ffaa00;">
            <h3>🍋 Premio Limón</h3>
            <p>${limon.puntos < 9999 ? limon.nombre : '---'}</p>
            <small>${limon.puntos < 9999 ? limon.puntos + ' pts en ' + limon.jornada : 'Sin datos aún'}</small>
        </div>
        <div class="premio-card" style="border-top-color: #888;">
            <h3>🏮 Farolillo Rojo</h3>
            <p>${farolillo.nombre}</p>
            <small>Último Liguilla (${farolillo.ptsLiguilla} pts)</small>
        </div>
    `;
}
