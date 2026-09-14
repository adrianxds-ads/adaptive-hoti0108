# Adaptive HOTI0108 — Segunda pasada de auditoría

Fecha: 2026-09-13
Banco: `data/questions-mf1074.json`
Alcance: 130/130 registros.

## Criterio

Prioridad para estudiar: manual oficial > contenidos oficiales complementarios > plataforma/test.
`validation_status: validated` no se acepta como prueba suficiente.

Estados:
- GREEN: sin contradicción detectada.
- RED: la clave actual contradice el contenido oficial revisado.
- YELLOW: conflicto manual/plataforma o ambigüedad real.
- CLEANUP: clave académica estable, pero texto contaminado.

## Matriz 001–060

- 001–006: GREEN.
- 007: YELLOW — test: 33 OET/8 regiones; manual revisado: 33 OET/7 regiones.
- 008–030: GREEN.
- 031: RED — C Mapas -> A Folletos.
- 032: RED — A Mapa del destino -> C Mapas del destino, carreteras y temáticos.
- 033: RED — C Outbooking -> A Overbooking.
- 034: RED — A Guías turísticas -> C Guías de servicios.
- 035: RED — A Tarjetas de crédito -> D Tarjetas de débito.
- 036: GREEN.
- 037: RED — D Seguro de hogar -> A Seguro de viaje.
- 038–060: GREEN.
## Matriz 061–100

- 061–063: GREEN.
- 064–070: CLEANUP — eliminar el sufijo espurio `Apartado.` sin cambiar la clave.
- 071–076: GREEN.
- 077: YELLOW — plataforma espera C; B también está respaldada por el manual.
- 078–079: GREEN.
- 080: GREEN — corrección A = 7 ya incorporada y documentada.
- 081: GREEN — corrección B = aumento de ingresos reales ya incorporada.
- 082–100: GREEN.

## Matriz 101–130

- 101–105: GREEN.
- 106: YELLOW/acción — la plataforma almacena C, pero el manual revisado indica tono amable, tono bajo y control del volumen; coincide con la opción D del test final equivalente.
- 107–117: GREEN.
- 118: YELLOW — la plataforma penaliza A, pero el manual respalda la definición de A; la clave esperada por plataforma no está demostrada.
- 119–130: GREEN.

## Resultado

- RED confirmadas: 6 -> 031, 032, 033, 034, 035, 037.
- YELLOW documentadas: 4 -> 007, 077, 106, 118.
- CLEANUP: 7 -> 064–070.
- Correcciones previas que se mantienen: 080 y 081.

Clave académica revisada UF0080 · UD4:
`A · C · A · C · D · A · A · B · B · D`
## Siguiente paso de implementación

1. Corregir las seis claves RED y sus `correct_answer_text`.
2. Limpiar los siete artefactos `Apartado.` sin alterar las respuestas.
3. Mantener los cuatro YELLOW con trazabilidad explícita; no convertirlos en una falsa certeza.
4. En 106, separar claramente la clave de plataforma de la respuesta académica del manual.
5. Después del parche, ejecutar validación técnica de las 130 preguntas y del motor.

## Criterio de salida

El banco no se declara fiable hasta que:
- no quede ningún RED sin corregir;
- todos los YELLOW estén documentados;
- cada `correct_answer` exista dentro de A/B/C/D;
- `correct_answer_text` coincida exactamente con la opción elegida;
- el scoring y la visualización del quiz superen pruebas;
- la PWA muestre correctamente los casos críticos 031–037, 077, 080, 081, 106 y 118.

## Implementacion y pruebas

- Se aplicaron las seis correcciones RED al banco de estudio.
- Q106 usa D como clave academica y conserva C como conflicto de plataforma.
- Q007, Q077 y Q118 mantienen trazabilidad explicita.
- Se limpiaron los siete artefactos `Apartado.`.
- Validacion estructural: 130 registros, 130 IDs unicos, indices 1-130 consecutivos.
- `correct_answer` existe en A-D para 130/130.
- `correct_answer_text` coincide exactamente con la opcion elegida para 130/130.
- Sin mojibake U+00C3 ni caracteres de sustitucion U+FFFD.
- `tests/scoring.cjs`: PASS.
- `tests/browser_quiz.py` con Microsoft Edge/Playwright: PASS.
- Browser regression cubre las 130 fichas, scoring, reintentos, reanudacion, conflictos, timeout, layout 360-1280 px y funcionamiento offline.
- Version de app: `0.7-audit2`; cache principal de service worker: `adaptive-hoti0108-v0.8-audit2`.
