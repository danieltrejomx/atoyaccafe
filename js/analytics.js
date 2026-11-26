/**
 * ATOYAC · Google Analytics 4 (GA4) Tracking & Conversion Events
 * ===============================================================
 * Registra visitas a la página (page_view) y conversiones clave:
 * - click_whatsapp: Clics hacia WhatsApp (pedidos, reclamar café, barra)
 * - click_instagram: Clics hacia el perfil de Instagram (@atoyaccafemx)
 * - click_ubereats: Clics hacia Uber Eats
 * - view_dish: Visualización del detalle de un platillo en el menú
 * - select_category: Navegación entre categorías del menú
 */

(function () {
  // ID de Medición de Google Analytics 4 (GA4)
  // Por defecto usa el ID del proyecto Firebase de ATOYAC (G-LFBG314FL9)
  const GA_ID = window.GA_MEASUREMENT_ID || 'G-LFBG314FL9';

  // 1. Cargar gtag.js dinámicamente si no existe
  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }

  // 2. Inicializar dataLayer y función gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    send_page_view: true,
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname
  });

  // Función utilitaria global para disparar eventos personalizados
  window.trackEvent = function (eventName, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...params
      });
    }
  };

  // 3. Listener inteligente para capturar clics en WhatsApp, Instagram y Uber Eats
  document.addEventListener('click', function (e) {
    const target = e.target.closest('a, button');
    if (!target) return;

    const href = target.getAttribute('href') || '';
    const text = (target.innerText || target.getAttribute('aria-label') || target.getAttribute('title') || '').trim();

    // Evento: Clic a WhatsApp
    if (href.includes('wa.me') || href.includes('whatsapp.com') || target.classList.contains('btn-step-wa') || target.id === 'modalDishWaBtn') {
      window.trackEvent('click_whatsapp', {
        event_category: 'conversion',
        event_label: text || 'WhatsApp CTA',
        link_url: href,
        button_id: target.id || target.className || 'wa_button'
      });
      return;
    }

    // Evento: Clic a Instagram
    if (href.includes('instagram.com') || target.classList.contains('btn-step-ig')) {
      window.trackEvent('click_instagram', {
        event_category: 'social',
        event_label: text || 'Instagram Profile',
        link_url: href
      });
      return;
    }

    // Evento: Clic a Uber Eats
    if (href.includes('ubereats.com') || target.classList.contains('btn-cierre-uber')) {
      window.trackEvent('click_ubereats', {
        event_category: 'delivery',
        event_label: text || 'Uber Eats CTA',
        link_url: href
      });
      return;
    }
  }, true);

})();
