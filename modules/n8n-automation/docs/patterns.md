# Patrones

Patrones simples para trabajo en n8n.

## Patrones Utiles

- trigger -> fetch -> transform -> write -> notify
- webhook -> validate -> route -> action
- cron -> collect -> summarize -> publish

## Buenas Practicas

- mantener nodos con responsabilidad clara
- documentar credenciales requeridas
- nombrar pasos con verbos concretos
- definir donde termina el flujo y que salida entrega

## Regla

No mezclar aqui detalles internos de los scripts de Airtable salvo que formen parte de una integracion documentada.
