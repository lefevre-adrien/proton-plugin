// RIGHT panel: ultra minimal + Lightweight Chart — fixed (wait for DOM, no overflow, minimal visuals)
(function() {
  window.ProtonPanels = window.ProtonPanels || {};

  window.ProtonPanels.createRight = function() {
    const container = document.createElement('div');
    container.className = 'right-section';

    // Make sure the panel itself can shrink in flex layouts
    container.style.minWidth = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.height = '100%';

    container.innerHTML = `
      <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
      <p style="margin:0;color:#cfe8ff;opacity:0.9">Chart preview</p>
      <div id="tradingview-chart" style="flex:1; min-height:0; width:100%; overflow:hidden;"></div>
    `;

    const chartDiv = container.querySelector('#tradingview-chart');

    function loadLightweightCharts() {
      return new Promise((resolve, reject) => {
        if (window.LightweightCharts) return resolve();
        const script = document.createElement('script');
        // pinned version — you said you're using older, keep it consistent
        script.src = 'https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js';
        script.onload = () => {
          // microtask to ensure global is set
          setTimeout(() => {
            if (window.LightweightCharts) resolve();
            else reject(new Error('LightweightCharts global not found'));
          }, 0);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Helper: wait until element has a measured size (attached to DOM)
    function waitForSize(el, timeout = 2000) {
      return new Promise((resolve, reject) => {
        const start = performance.now();
        function check() {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (w > 0 && h > 0) return resolve({ w, h });
          if (performance.now() - start > timeout) return reject(new Error('Timed out waiting for element size'));
          requestAnimationFrame(check);
        }
        requestAnimationFrame(check);
      });
    }

    // Init chart after library loads AND container is attached & sized
    loadLightweightCharts()
      .then(() => waitForSize(chartDiv))
      .then(({ w, h }) => {
        const LW = window.LightweightCharts;

        // create chart with minimal visuals
        const chart = LW.createChart(chartDiv, {
          width: w,
          height: h,
          layout: {
            // transparent so the panel background shows through (panel has #222)
            backgroundColor: 'transparent',
            textColor: '#eee',
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false }
          },
          rightPriceScale: {
            borderVisible: true,
            borderColor: 'rgba(255,255,255,0.06)',
            scaleMargins: { top: 0.12, bottom: 0.12 }
          },
          timeScale: {
            borderVisible: true,
            borderColor: 'rgba(255,255,255,0.06)',
            fixRightEdge: true,
            lockVisibleTimeRangeOnResize: true,
            rightOffset: 6
          },
          handleScroll: {
            mouseWheel: false,
            pressedMouseMove: false,
            horzTouchDrag: false,
            vertTouchDrag: false
          },
          handleScale: {
            axisPressedMouseMove: false,
            pinch: false,
            mouseWheel: false
          },
          crosshair: { mode: 0 }
        });

        // minimised axis styling — keep axes but subtle
        chart.applyOptions({
          priceScale: { borderVisible: true },
          timeScale: { borderVisible: true },
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        // example data (replace with your data)
        candleSeries.setData([
          { time: '2026-01-20', open: 100, high: 110, low: 90, close: 105 },
          { time: '2026-01-21', open: 105, high: 115, low: 95, close: 110 },
          { time: '2026-01-22', open: 110, high: 120, low: 100, close: 108 },
        ]);

        // Keep chart sized to container (responsive) — observe chartDiv's size
        const ro = new ResizeObserver(entries => {
          for (const entry of entries) {
            const cr = entry.contentRect;
            chart.applyOptions({ width: Math.max(1, Math.floor(cr.width)), height: Math.max(1, Math.floor(cr.height)) });
          }
        });
        ro.observe(chartDiv);

        // return a cleanup handle (optional) — attach to container for later use
        container._protonChartCleanup = () => {
          ro.disconnect();
          try { chart.remove(); } catch (e) {}
        };
      })
      .catch(err => {
        console.error('[Proton] Failed to load or init LightweightCharts', err);
      });

    return container;
  };
})();
