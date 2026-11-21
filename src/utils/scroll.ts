export function scrollAppToTop(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  } catch {
    window.scrollTo(0, 0);
  }
  document.documentElement.scrollTop = 0;
  if (document.body) {
    document.body.scrollTop = 0;
  }
  const appScroll = document.getElementById('app-scroll');
  if (appScroll) {
    appScroll.scrollTop = 0;
  }
}
