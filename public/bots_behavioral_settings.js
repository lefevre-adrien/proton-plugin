// RIGHT panel: ultra minimal + ApexCharts Candlestick (dark, fixed height, responsive width, no zoom)
(function() {
  window.ProtonPanels = window.ProtonPanels || {};

  window.ProtonPanels.createRight = function() {
    const container = document.createElement('div');
    container.className = 'right-section';

    // Flex column + shrinking inside flex row
    container.style.minWidth = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.height = '100%';

    const fixedHeight = 300; // fixed pixel height for chart

    container.innerHTML = `
      <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
      <p style="margin:0;color:#cfe8ff;opacity:0.9">Chart preview</p>
      <div id="apex-candlestick" style="height:${fixedHeight}px; width:100%;"></div>
    `;

    const chartDiv = container.querySelector('#apex-candlestick');

    // Dynamically load ApexCharts
    function loadApexCharts() {
      return new Promise((resolve, reject) => {
        if (window.ApexCharts) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/apexcharts@3.41.0/dist/apexcharts.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    function initChart() {
      const options = {
        chart: {
          type: 'candlestick',
          height: fixedHeight,   // fixed height
          width: chartDiv.clientWidth, // initial width matches container
          toolbar: { show: false },
          zoom: { enabled: false },
          background: 'transparent'
        },
        series: [{
          data: [
  { x: new Date('2026-01-01').getTime(), y: [100, 110, 95, 105] },
  { x: new Date('2026-01-02').getTime(), y: [105, 112, 100, 108] },
  { x: new Date('2026-01-03').getTime(), y: [108, 115, 104, 110] },
  { x: new Date('2026-01-04').getTime(), y: [110, 118, 107, 115] },
  { x: new Date('2026-01-05').getTime(), y: [115, 120, 110, 118] },
  { x: new Date('2026-01-06').getTime(), y: [118, 122, 115, 120] },
  { x: new Date('2026-01-07').getTime(), y: [120, 125, 117, 123] },
  { x: new Date('2026-01-08').getTime(), y: [123, 128, 120, 126] },
  { x: new Date('2026-01-09').getTime(), y: [126, 130, 123, 129] },
  { x: new Date('2026-01-10').getTime(), y: [129, 134, 127, 132] },
  { x: new Date('2026-01-11').getTime(), y: [132, 138, 130, 136] },
  { x: new Date('2026-01-12').getTime(), y: [136, 140, 132, 138] },
  { x: new Date('2026-01-13').getTime(), y: [138, 142, 135, 140] },
  { x: new Date('2026-01-14').getTime(), y: [140, 145, 138, 143] },
  { x: new Date('2026-01-15').getTime(), y: [143, 148, 140, 145] },
  { x: new Date('2026-01-16').getTime(), y: [145, 150, 142, 148] },
  { x: new Date('2026-01-17').getTime(), y: [148, 153, 145, 150] },
  { x: new Date('2026-01-18').getTime(), y: [150, 155, 147, 152] },
  { x: new Date('2026-01-19').getTime(), y: [152, 158, 150, 155] },
  { x: new Date('2026-01-20').getTime(), y: [155, 160, 152, 158] },
  { x: new Date('2026-01-21').getTime(), y: [158, 162, 155, 160] },
  { x: new Date('2026-01-22').getTime(), y: [160, 165, 157, 162] },
  { x: new Date('2026-01-23').getTime(), y: [162, 168, 160, 165] },
  { x: new Date('2026-01-24').getTime(), y: [165, 170, 162, 168] },
  { x: new Date('2026-01-25').getTime(), y: [168, 172, 165, 170] },
  { x: new Date('2026-01-26').getTime(), y: [170, 175, 168, 172] },
  { x: new Date('2026-01-27').getTime(), y: [172, 178, 170, 175] },
  { x: new Date('2026-01-28').getTime(), y: [175, 180, 172, 178] },
  { x: new Date('2026-01-29').getTime(), y: [178, 185, 175, 180] },
  { x: new Date('2026-01-30').getTime(), y: [180, 188, 178, 185] },
  { x: new Date('2026-01-31').getTime(), y: [185, 190, 182, 188] },
  { x: new Date('2026-02-01').getTime(), y: [188, 192, 185, 190] },
  { x: new Date('2026-02-02').getTime(), y: [190, 195, 188, 192] },
  { x: new Date('2026-02-03').getTime(), y: [192, 198, 190, 195] },
  { x: new Date('2026-02-04').getTime(), y: [195, 200, 192, 198] },
  { x: new Date('2026-02-05').getTime(), y: [198, 202, 195, 200] },
  { x: new Date('2026-02-06').getTime(), y: [200, 205, 198, 202] },
  { x: new Date('2026-02-07').getTime(), y: [202, 208, 200, 205] },
  { x: new Date('2026-02-08').getTime(), y: [205, 210, 202, 208] },
  { x: new Date('2026-02-09').getTime(), y: [208, 215, 205, 210] },
  { x: new Date('2026-02-10').getTime(), y: [210, 218, 208, 215] },
  { x: new Date('2026-02-11').getTime(), y: [215, 220, 210, 218] },
  { x: new Date('2026-02-12').getTime(), y: [218, 225, 215, 220] },
  { x: new Date('2026-02-13').getTime(), y: [220, 228, 218, 225] },
  { x: new Date('2026-02-14').getTime(), y: [225, 230, 220, 228] },
  { x: new Date('2026-02-15').getTime(), y: [228, 235, 225, 230] },
  { x: new Date('2026-02-16').getTime(), y: [230, 238, 228, 235] },
  { x: new Date('2026-02-17').getTime(), y: [235, 240, 230, 238] },
  { x: new Date('2026-02-18').getTime(), y: [238, 245, 235, 240] },
  { x: new Date('2026-02-19').getTime(), y: [240, 248, 238, 245] },
  { x: new Date('2026-02-20').getTime(), y: [245, 250, 240, 248] },
  { x: new Date('2026-02-21').getTime(), y: [248, 255, 245, 250] },
  { x: new Date('2026-02-22').getTime(), y: [250, 258, 248, 255] },
  { x: new Date('2026-02-23').getTime(), y: [255, 260, 250, 258] },
  { x: new Date('2026-02-24').getTime(), y: [258, 265, 255, 260] },
  { x: new Date('2026-02-25').getTime(), y: [260, 268, 258, 265] },
  { x: new Date('2026-02-26').getTime(), y: [265, 270, 260, 268] },
  { x: new Date('2026-02-27').getTime(), y: [268, 275, 265, 270] },
  { x: new Date('2026-02-28').getTime(), y: [270, 278, 268, 275] },
  { x: new Date('2026-03-01').getTime(), y: [275, 280, 270, 278] }
]

        }],
        plotOptions: {
          candlestick: { colors: { upward: '#26a69a', downward: '#ef5350' } }
        },
        xaxis: {
          type: 'datetime',
          labels: { style: { colors: '#eee' } },
          axisBorder: { show: true, color: '#555' },
          axisTicks: { show: true, color: '#555' }
        },
        yaxis: {
          labels: { style: { colors: '#eee' } },
          tooltip: { enabled: false }
        },
        grid: { show: false },
        tooltip: { enabled: false }
      };

      const chart = new ApexCharts(chartDiv, options);
      chart.render();

      // ResizeObserver: only update width (height fixed)
      const ro = new ResizeObserver(() => {
        chart.updateOptions({
          chart: {
            width: chartDiv.clientWidth
          }
        });
      });
      ro.observe(chartDiv);

      // Optional cleanup
      container._protonChartCleanup = () => {
        ro.disconnect();
        chart.destroy();
      };
    }

    loadApexCharts()
      .then(initChart)
      .catch(err => console.error('[Proton] Failed to load ApexCharts', err));

    return container;
  };
})();
