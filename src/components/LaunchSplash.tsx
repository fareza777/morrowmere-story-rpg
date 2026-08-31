export function LaunchSplash() {
  return (
    <div
      className="launch-splash"
      aria-hidden="true"
      style={{ animationDuration: '0.85s', animationDelay: '0.12s' }}
    >
      <img src="/assets/icons/app-icon.webp" alt="" />
      <div><strong>MORROWMERE</strong><span>A Sword &amp; Sorcery Chronicle</span></div>
    </div>
  );
}
