// RIGHT panel: ultra minimal + ApexCharts Candlestick (dark, fit, no zoom)
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

    container.innerHTML = `
      <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
      <p style="margin:0;color:#cfe8ff;opacity:0.9">Chart preview</p>
      <div id="apex-candlestick" style="height:300px; min-height:200px; width:100%;"></div>
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
          height: chartDiv.clientHeight, // use actual div height in pixels
          width: chartDiv.clientWidth,
          toolbar: { show: false },
          zoom: { enabled: false },
          background: 'transparent',
        },
        series: [{
          data: [
            { x: new Date('2026-01-20').getTime(), y: [100, 110, 90, 105] },
            { x: new Date('2026-01-21').getTime(), y: [105, 115, 95, 110] },
            { x: new Date('2026-01-22').getTime(), y: [110, 120, 100, 108] },
          ]
        }],
        plotOptions: {
          candlestick: {
            colors: { upward: '#26a69a', downward: '#ef5350' }
          }
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

      // Make chart responsive
      const ro = new ResizeObserver(() => {
        chart.updateOptions({
          chart: {
            width: chartDiv.clientWidth,
            height: chartDiv.clientHeight
          }
        });
      });
      ro.observe(chartDiv);

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
