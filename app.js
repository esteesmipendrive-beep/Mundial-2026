const URL_SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSY9OP3N3MoehCAKTfU83Z__5Ecu0GAukFgCKk1ZYB5hQQxwwK1j9DdlK_64KByH432zf48yc0jGBvI/pub?output=csv";
const FALLBACK_IMG = "https://via.placeholder.com/60/2a2a2a/00ff88?text=FC";

document.addEventListener("DOMContentLoaded", () => {
    obtenerDatosMundial();
});

async function obtenerDatosMundial() {
    try {
        const respuesta = await fetch(URL_SHEET);
        if (!respuesta.ok) throw new Error("Fallo en la conexión");
        
        const textoCSV = await respuesta.text();
        const jugadores = parsearCSV(textoCSV);
        
        asignarEstadosLogicos(jugadores);
        renderizarClasificacion(jugadores);
        
        const clasificadosTorneo = jugadores.filter(j => j.seed <= 8).sort((a, b) => a.seed - b.seed);
        renderizarTorneo(clasificadosTorneo); 
        
        calcularPremios(jugadores);
        
    } catch (error) {
        console.error(error);
        document.getElementById("cuerpo-tabla").innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error de Base de Datos. Revisa tu Excel.</td></tr>`;
    }
}

function parsearCSV(texto) {
    const lineas = texto.split("\n");
    let resultado = [];
    
    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;
        
        const col = linea.split(",");
        
        const ptsLiguilla = parseInt(col[2]) || 0;
        const ptsDieciseisavos = parseInt(col[3]) || 0;
        const ptsOctavos = parseInt(col[4]) || 0;
        const ptsCuartos = parseInt(col[5]) || 0;
        const ptsSemis = parseInt(col[6]) || 0;
        const ptsFinal = parseInt(col[7]) || 0;
        const ptsTercero = parseInt(col[8]) || 0;

        const ptsTotales = ptsLiguilla + ptsDieciseisavos + ptsOctavos + ptsCuartos + ptsSemis + ptsFinal + ptsTercero;
        
        resultado.push({
            nombre: col[0]?.replace(/"/g, '').trim() || "???",
            equipo: col[1]?.replace(/"/g, '').trim() || "???",
            ptsLiguilla: ptsLiguilla,
            ptsDieciseisavos: ptsDieciseisavos,
            ptsOctavos: ptsOctavos,
            ptsCuartos: ptsCuartos,
            ptsSemis: ptsSemis,
            ptsFinal: ptsFinal,
            ptsTercero: ptsTercero,
            ptsTotales: ptsTotales,
            logo: col[9]?.replace(/"/g, '').trim() || FALLBACK_IMG
        });
    }
    
    resultado.sort((a, b) => b.ptsLiguilla - a.ptsLiguilla);
    resultado.forEach((j, index) => j.seed = index + 1);
    resultado.sort((a, b) => b.ptsTotales - a.ptsTotales);

    return resultado;
}

function asignarEstadosLogicos(jugadores) {
    jugadores.forEach((j, i) => {
        if (j.seed > 8) {
            marcarEstado(j, "❌ Eliminado", "#ff4444", "rgba(255, 68, 68, 0.1)");
        } else {
            marcarEstado(j, "⏳ En Cuartos", "var(--fifa-purple)", "rgba(75, 8, 161, 0.1)");
        }
    });

    const top8 = jugadores.filter(j => j.seed <= 8).sort((a,b) => a.seed - b.seed);
    if (top8.length < 8) return;

    const crucesQ = [[0,7], [3,4], [1,6], [2,5]];
    const semis = [];

    crucesQ.forEach(cruce => {
        const jA = top8[cruce[0]], jB = top8[cruce[1]];
        const totA = jA.ptsDieciseisavos + jA.ptsOctavos;
        const totB = jB.ptsDieciseisavos + jB.ptsOctavos;

        if (totA === 0 && totB === 0) return;

        let ganaA = totA > totB || (totA === totB && totA > 0 && jA.seed < jB.seed);
        let ganaB = totB > totA || (totA === totB && totB > 0 && jB.seed < jA.seed);

        if (ganaA) {
            semis.push(jA);
            marcarEstado(jB, "Caída en Cuartos", "#888", "#eeeeee");
            marcarEstado(jA, "🔥 En Semis", "var(--fifa-purple)", "rgba(75, 8, 161, 0.1)");
        } else if (ganaB) {
            semis.push(jB);
            marcarEstado(jA, "Caída en Cuartos", "#888", "#eeeeee");
            marcarEstado(jB, "🔥 En Semis", "var(--fifa-purple)", "rgba(75, 8, 161, 0.1)");
        }
    });

    if (semis.length === 4) {
        const crucesS = [[semis[0], semis[1]], [semis[2], semis[3]]];
        const finalistas = [], terceros = [];

        crucesS.forEach(cruce => {
            const jA = cruce[0], jB = cruce[1];
            const totA = jA.ptsCuartos + jA.ptsSemis;
            const totB = jB.ptsCuartos + jB.ptsSemis;

            if (totA === 0 && totB === 0) return;

            let ganaA = totA > totB || (totA === totB && totA > 0 && jA.seed < jB.seed);
            let ganaB = totB > totA || (totA === totB && totB > 0 && jB.seed < jA.seed);

            if (ganaA) {
                finalistas.push(jA); terceros.push(jB);
                marcarEstado(jA, "⭐ Finalista", "var(--fifa-purple)", "rgba(75, 8, 161, 0.1)");
                marcarEstado(jB, "Lucha por 3º", "#cd7f32", "rgba(205, 127, 50, 0.1)");
            } else if (ganaB) {
                finalistas.push(jB); terceros.push(jA);
                marcarEstado(jB, "⭐ Finalista", "var(--fifa-purple)", "rgba(75, 8, 161, 0.1)");
                marcarEstado(jA, "Lucha por 3º", "#cd7f32", "rgba(205, 127, 50, 0.1)");
            }
        });

        if (finalistas.length === 2) {
            const fA = finalistas[0], fB = finalistas[1];
            if (fA.ptsFinal > 0 || fB.ptsFinal > 0) {
                let ganaA = fA.ptsFinal > fB.ptsFinal || (fA.ptsFinal === fB.ptsFinal && fA.ptsFinal > 0 && fA.seed < fB.seed);
                if (ganaA) {
                    marcarEstado(fA, "🏆 CAMPEÓN", "#b8860b", "rgba(255, 215, 0, 0.2)");
                    marcarEstado(fB, "🥈 Subcampeón", "#666666", "rgba(192, 192, 192, 0.3)");
                } else {
                    marcarEstado(fB, "🏆 CAMPEÓN", "#b8860b", "rgba(255, 215, 0, 0.2)");
                    marcarEstado(fA, "🥈 Subcampeón", "#666666", "rgba(192, 192, 192, 0.3)");
                }
            }
        }

        if (terceros.length === 2) {
            const tA = terceros[0], tB = terceros[1];
            if (tA.ptsTercero > 0 || tB.ptsTercero > 0) {
                let ganaA = tA.ptsTercero > tB.ptsTercero || (tA.ptsTercero === tB.ptsTercero && tA.ptsTercero > 0 && tA.seed < tB.seed);
                if (ganaA) {
                    marcarEstado(tA, "🥉 3º Puesto", "#8b4513", "rgba(205, 127, 50, 0.2)");
                    marcarEstado(tB, "4º Puesto", "#888888", "#eeeeee");
                } else {
                    marcarEstado(tB, "🥉 3º Puesto", "#8b4513", "rgba(205, 127, 50, 0.2)");
                    marcarEstado(tA, "4º Puesto", "#888888", "#eeeeee");
                }
            }
        }
    }
}

function marcarEstado(j, texto, color, fondo) {
    j.estadoStr = texto;
    j.estadoColor = color;
    j.estadoBg = fondo;
}

function renderizarClasificacion(jugadores) {
    const tbody = document.getElementById("cuerpo-tabla");
    tbody.innerHTML = "";
    if (jugadores.length === 0) return;

    jugadores.forEach((jugador, index) => {
        const tr = document.createElement("tr");
        if (jugador.seed <= 8) {
            tr.className = "zona-clasificacion";
        } else {
            tr.className = "zona-eliminacion";
        }

        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>
                <div class="team-info">
                    <img src="${jugador.logo}" class="escudo-tabla" onerror="this.src='${FALLBACK_IMG}'" alt="Escudo">
                    <div>
                        <strong>${jugador.nombre}</strong><br>
                        <small style="color:#666;">${jugador.equipo}</small>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge-estado" style="color: ${jugador.estadoColor}; background-color: ${jugador.estadoBg};">
                    ${jugador.estadoStr}
                </span>
            </td>
            <td style="color:#888;">${jugador.ptsLiguilla} pts</td>
            <td><strong style="font-size: 1.1rem; color: var(--fifa-purple);">${jugador.ptsTotales} pts</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function obtenerGanadorDoble(jugadorA, jugadorB, colIda, colVuelta) {
    if (!jugadorA || !jugadorB) return { nombre: "---", ptsMostrados: 0, logo: FALLBACK_IMG };
    const totalA = jugadorA[colIda] + jugadorA[colVuelta];
    const totalB = jugadorB[colIda] + jugadorB[colVuelta];
    if (totalA === 0 && totalB === 0) return { nombre: "Esperando", ptsMostrados: 0, logo: FALLBACK_IMG };
    
    let ganaA = totalA > totalB || (totalA === totalB && totalA > 0 && jugadorA.seed < jugadorB.seed);
    let ganaB = totalB > totalA || (totalA === totalB && totalB > 0 && jugadorB.seed < jugadorA.seed);

    if (ganaA) return { ...jugadorA, ptsMostrados: totalA };
    if (ganaB) return { ...jugadorB, ptsMostrados: totalB };
    return { nombre: "Esperando", ptsMostrados: 0, logo: FALLBACK_IMG };
}

function obtenerPerdedorDoble(jugadorA, jugadorB, colIda, colVuelta) {
    if (!jugadorA || !jugadorB || jugadorA.nombre === "---" || jugadorB.nombre === "---") return { nombre: "Esperando", ptsMostrados: 0, logo: FALLBACK_IMG };
    const totalA = jugadorA[colIda] + jugadorA[colVuelta];
    const totalB = jugadorB[colIda] + jugadorB[colVuelta];
    if (totalA === 0 && totalB === 0) return { nombre: "Esperando", ptsMostrados: 0, logo: FALLBACK_IMG };
    
    let ganaA = totalA > totalB || (totalA === totalB && totalA > 0 && jugadorA.seed < jugadorB.seed);
    let ganaB = totalB > totalA || (totalA === totalB && totalB > 0 && jugadorB.seed < jugadorA.seed);

    if (ganaA) return jugadorB;
    if (ganaB) return jugadorA;
    return { nombre: "Esperando", ptsMostrados: 0, logo: FALLBACK_IMG };
}

function obtenerGanadorUnico(jugadorA, jugadorB, columna) {
    if (!jugadorA || !jugadorB) return { nombre: "---", ptsMostrados: 0, logo: FALLBACK_IMG };
    const ptsA = jugadorA[columna];
    const ptsB = jugadorB[columna];
    if (ptsA === 0 && ptsB === 0) return { nombre: "Esperando", ptsMostrados: 0, logo: FALLBACK_IMG };
    
    let ganaA = ptsA > ptsB || (ptsA === ptsB && ptsA > 0 && jugadorA.seed < jugadorB.seed);
    let ganaB = ptsB > ptsA || (ptsA === ptsB && ptsB > 0 && jugadorB.seed < jugadorA.seed);

    if (ganaA) return { ...jugadorA, ptsMostrados: ptsA };
    if (ganaB) return { ...jugadorB, ptsMostrados: ptsB };
    return { nombre: "Esperando", ptsMostrados: 0, logo: FALLBACK_IMG };
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

    const perdedorSemi1 = obtenerPerdedorDoble(semi1_A, semi1_B, 'ptsCuartos', 'ptsSemis');
    const perdedorSemi2 = obtenerPerdedorDoble(semi2_A, semi2_B, 'ptsCuartos', 'ptsSemis');

    const final_A = obtenerGanadorDoble(semi1_A, semi1_B, 'ptsCuartos', 'ptsSemis');
    const final_B = obtenerGanadorDoble(semi2_A, semi2_B, 'ptsCuartos', 'ptsSemis');

    const campeon = obtenerGanadorUnico(final_A, final_B, 'ptsFinal');
    const subcampeon = campeon.nombre === final_A.nombre ? final_B : (campeon.nombre === final_B.nombre ? final_A : {nombre: "---", logo: FALLBACK_IMG});
    const tercero = obtenerGanadorUnico(perdedorSemi1, perdedorSemi2, 'ptsTercero');

    contenedor.innerHTML = `
        <div class="bracket-symmetrical">
            <div class="bracket-col round-qf-left">
                <div class="round-header">CUARTOS</div>
                <div class="col-content">
                    ${generarHtmlEncuentro(q1_A, q1_B, 'ptsDieciseisavos', 'ptsOctavos')}
                    ${generarHtmlEncuentro(q2_A, q2_B, 'ptsDieciseisavos', 'ptsOctavos')}
                </div>
            </div>

            <div class="bracket-col round-sf-left">
                <div class="round-header">SEMIFINALES</div>
                <div class="col-content sf-content">
                    ${generarHtmlEncuentro(semi1_A, semi1_B, 'ptsCuartos', 'ptsSemis')}
                </div>
            </div>

            <div class="bracket-col round-final">
                <div class="round-header" style="background:var(--gold); color:white;">FINAL</div>
                <div class="col-content final-content">
                    ${generarHtmlFinal(final_A, final_B, 'ptsFinal', true)}
                </div>
                
                <div class="tercer-puesto-wrapper">
                    <div class="round-header badge-tercero">3º PUESTO</div>
                    ${generarHtmlFinal(perdedorSemi1, perdedorSemi2, 'ptsTercero', false)}
                </div>
            </div>

            <div class="bracket-col round-sf-right">
                <div class="round-header">SEMIFINALES</div>
                <div class="col-content sf-content">
                    ${generarHtmlEncuentro(semi2_A, semi2_B, 'ptsCuartos', 'ptsSemis')}
                </div>
            </div>

            <div class="bracket-col round-qf-right">
                <div class="round-header">CUARTOS</div>
                <div class="col-content">
                    ${generarHtmlEncuentro(q3_A, q3_B, 'ptsDieciseisavos', 'ptsOctavos')}
                    ${generarHtmlEncuentro(q4_A, q4_B, 'ptsDieciseisavos', 'ptsOctavos')}
                </div>
            </div>
        </div>
    `;

    // AÑADIDO: Renderizado de premios en el podio
    renderizarPodio(campeon, subcampeon, tercero);
}

function generarHtmlEncuentro(jugadorA, jugadorB, colIda, colVuelta) {
    if (!jugadorA || !jugadorB) return `<div class="matchup-container">---</div>`;
    const totA = jugadorA[colIda] + jugadorA[colVuelta];
    const totB = jugadorB[colIda] + jugadorB[colVuelta];
    
    let ganaA = (totA > 0 || totB > 0) && (totA > totB || (totA === totB && jugadorA.seed < jugadorB.seed));
    let ganaB = (totA > 0 || totB > 0) && (totB > totA || (totA === totB && jugadorB.seed < jugadorA.seed));

    return `
    <div class="matchup-container">
        <div class="team-row ${ganaA ? 'winner' : ''} ${ganaB && totB>0 ? 'eliminated':''}">
            <div class="team-name-badge">
                <img src="${jugadorA.logo}" class="escudo-bracket" onerror="this.style.display='none'">
                <span class="t-name-label">${jugadorA.nombre}</span>
            </div>
            <span class="points-badge">${totA > 0 ? totA : '-'}</span>
        </div>
        <div class="team-row ${ganaB ? 'winner' : ''} ${ganaA && totA>0 ? 'eliminated':''}">
            <div class="team-name-badge">
                <img src="${jugadorB.logo}" class="escudo-bracket" onerror="this.style.display='none'">
                <span class="t-name-label">${jugadorB.nombre}</span>
            </div>
            <span class="points-badge">${totB > 0 ? totB : '-'}</span>
        </div>
    </div>`;
}

function generarHtmlFinal(jugadorA, jugadorB, columna, isFinal) {
    if (!jugadorA || !jugadorB) return `<div class="matchup-container">---</div>`;
    const ptsA = jugadorA[columna] || 0;
    const ptsB = jugadorB[columna] || 0;
    
    let ganaA = (ptsA > 0 || ptsB > 0) && (ptsA > ptsB || (ptsA === ptsB && jugadorA.seed < jugadorB.seed));
    let ganaB = (ptsA > 0 || ptsB > 0) && (ptsB > ptsA || (ptsA === ptsB && jugadorB.seed < jugadorA.seed));

    return `
    <div class="matchup-container ${isFinal ? 'final-matchup' : ''}">
        <div class="team-row ${ganaA ? 'winner' : ''} ${ganaB && ptsB>0 ? 'eliminated':''}">
            <div class="team-name-badge">
                <img src="${jugadorA.logo}" class="escudo-bracket" onerror="this.style.display='none'">
                <span class="t-name-label">${jugadorA.nombre}</span>
            </div>
            <span class="points-badge gold-pts">${ptsA > 0 ? ptsA : '-'}</span>
        </div>
        <div class="team-row ${ganaB ? 'winner' : ''} ${ganaA && ptsA>0 ? 'eliminated':''}">
            <div class="team-name-badge">
                <img src="${jugadorB.logo}" class="escudo-bracket" onerror="this.style.display='none'">
                <span class="t-name-label">${jugadorB.nombre}</span>
            </div>
            <span class="points-badge gold-pts">${ptsB > 0 ? ptsB : '-'}</span>
        </div>
    </div>`;
}

// AQUÍ ESTÁN INYECTADOS LOS BILLETES DE PREMIO ENCIMA DEL PODIO
function renderizarPodio(oro, plata, bronce) {
    const contenedor = document.getElementById("podio-final");
    const enJuego = oro.nombre === "---" || oro.nombre === "Esperando";
    
    contenedor.innerHTML = `
        <div class="escalon plata">
            <div class="prize-amount">10€</div>
            ${!enJuego ? `<img src="${plata.logo}" class="escudo-podio" onerror="this.style.display='none'">` : ''}
            <div class="nombre">${enJuego ? 'En juego' : plata.nombre}</div>
            <div class="tag-medal">2º</div>
        </div>
        <div class="escalon oro">
            <div class="prize-amount" style="color: var(--gold); font-size: 1.5rem;">120€</div>
            ${!enJuego ? `<img src="${oro.logo}" class="escudo-podio" onerror="this.style.display='none'">` : ''}
            <div class="nombre">👑<br>${enJuego ? 'En juego' : oro.nombre}</div>
            <div class="tag-medal">1º</div>
        </div>
        <div class="escalon bronce">
            <div class="prize-amount" style="color: transparent;">-</div>
            ${!enJuego ? `<img src="${bronce.logo}" class="escudo-podio" onerror="this.style.display='none'">` : ''}
            <div class="nombre">${enJuego ? 'En juego' : bronce.nombre}</div>
            <div class="tag-medal">3º</div>
        </div>
    `;
}

function calcularPremios(jugadores) {
    const contenedor = document.getElementById("contenedor-premios");
    const liderGeneral = jugadores[0]; 
    let farolillo = jugadores.reduce((prev, current) => (prev.seed > current.seed) ? prev : current);

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
        <div class="premio-card vip-card">
            <h3>🏆 Campeón General</h3>
            <p>${liderGeneral.nombre}</p>
            <small>Líder Absoluto (${liderGeneral.ptsTotales} pts)</small>
        </div>
        <div class="premio-card" style="border-top-color: #ffaa00;">
            <h3>🍋 Premio Limón</h3>
            <p>${limon.puntos < 9999 ? limon.nombre : '---'}</p>
            <small>${limon.puntos < 9999 ? limon.puntos + ' pts en ' + limon.jornada : 'Sin datos aún'}</small>
        </div>
        <div class="premio-card" style="border-top-color: #888;">
            <h3>🏮 Farolillo Rojo</h3>
            <p>${farolillo.nombre}</p>
            <small>Último en Liguilla (${farolillo.ptsLiguilla} pts)</small>
        </div>
    `;
}
