#Hamac connecté

## Fonctionnement général

Lorsque l'utilisateur s'allonge sur le hamac, le ressort de traction est étiré, ce qui éloigne un aimant d'un capteur à effet Hall. Cet éloignement est détecté par le Raspberry Pi qui déclenche alors la lecture de la playlist partagée.

Si l'utilisateur sort du hamac puis revient moins de 10 minutes après, la musique reprend ou elle s'était arrêtée. Si la pause est plus longue, on démarre un nouveau morceau.

À tout moment, l'utilisateur peut streamer depuis son téléphone en Bluetooth. Ce stream prend la priorité et le hamac est complètement ignoré. Quand le stream est interrompu pendant environ 10 secondes, le hamac reprend la priorité.

