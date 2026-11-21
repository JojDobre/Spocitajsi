/*
 * Skript pre cudzie weby, ktoré vložili kalkulačku SpočítajSi.
 * Automaticky prispôsobí výšku rámca obsahu kalkulačky.
 * Použitie: <iframe data-spocitajsi src="https://…/cista-mzda/?embed=1"></iframe>
 *           <script async src="https://…/embed.js"></script>
 */
(function () {
  if (window.__spocitajsiEmbed) return;
  window.__spocitajsiEmbed = true;
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.typ !== 'spocitajsi:vyska' || typeof d.vyska !== 'number') return;
    var ramce = document.querySelectorAll('iframe[data-spocitajsi]');
    for (var i = 0; i < ramce.length; i++) {
      if (ramce[i].contentWindow === e.source) {
        ramce[i].style.height = Math.max(200, Math.min(d.vyska, 4000)) + 'px';
      }
    }
  });
})();
