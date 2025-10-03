let entornoEspacial = {
    "ambientes": {
        "Marte": {
            "gravedad": 0.38,
            "temperatura": {
                "minima": -140,
                "maxima": 20
            },
            "presion_atmosferica": 610, // en Pascales
            "radiacion": "alta"
        },
        "Europa": {
            "gravedad": 0.13,
            "temperatura": {
                "minima": -160,
                "maxima": -50
            },
            "presion_atmosferica": 0.1, // casi vacío, pero no completamente
            "radiacion": "alta"
        },
        "Ceres": {
            "gravedad": 0.27,
            "temperatura": {
                "minima": -110,
                "maxima": -38
            },
            "presion_atmosferica": 0.03,
            "radiacion": "media"
        }





    },
    "modulos": {
        "hinchable": {
            "tipo": "inflable",
            "rango_temperatura": {
                "minima": -150,
                "maxima": 40
            },
            "gravedad_minima": 0.1,
            "presion_soportada": {
                "minima": 0,
                "maxima": 101000
            },
            "proteccion_radiacion": "alta",
            "compatible_con": []
        },
        "rigido": {
            "tipo": "metálico",
            "rango_temperatura": {
                "minima": -150,
                "maxima": 130
            },
            "gravedad_minima": 0.1,
            "presion_soportada": {
                "minima": 0,
                "maxima": 150000
            },
            "proteccion_radiacion": "muy alta",
            "compatible_con": []
        },
        "ISRU": {
            "tipo": "in-situ",
            "rango_temperatura": {
                "minima": -200,
                "maxima": 80
            },
            "gravedad_minima": 0.1,
            "presion_soportada": {
                "minima": 0,
                "maxima": 200000
            },
            "proteccion_radiacion": "muy alta",
            "compatible_con": []
        }
    }
}

function esCompatible(modulo, ambiente) {
    const mod = entornoEspacial.modulos[modulo];
    const amb = entornoEspacial.ambientes[ambiente];

    const tempOk = amb.temperatura.minima >= mod.rango_temperatura.minima &&
        amb.temperatura.maxima <= mod.rango_temperatura.maxima;

    const gravedadOk = amb.gravedad >= mod.gravedad_minima;

    const presionOk = amb.presion_atmosferica >= mod.presion_soportada.minima &&
        amb.presion_atmosferica <= mod.presion_soportada.maxima;

    const radiacionOk = {
        "media": ["media"],
        "alta": ["media", "alta"],
        "muy alta": ["alta", "muy alta"]
    }[mod.proteccion_radiacion].includes(amb.radiacion);

    return tempOk && gravedadOk && presionOk && radiacionOk;
}

const modulos = Object.keys(entornoEspacial.modulos);
const ambientes = Object.keys(entornoEspacial.ambientes);

modulos.forEach(modulo => {
    ambientes.forEach(ambiente => {
        const compatible = esCompatible(modulo, ambiente);
        if (compatible) {
            entornoEspacial.modulos[modulo].compatible_con.push(ambiente);
        }
        console.log(`¿${modulo} es compatible con ${ambiente}? → ${compatible ? "✅ Sí" : "❌ No"}`);
    });
});

console.log("\nResumen de compatibilidades:");
modulos.forEach(modulo => {
    const compatibles = entornoEspacial.modulos[modulo].compatible_con.join(", ");
    console.log(`🔧 ${modulo} → Compatible con: ${compatibles || "ninguno"}`);
});
