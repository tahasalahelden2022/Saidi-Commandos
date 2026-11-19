import type { HeroId } from '../types/game';

interface HeroPortraitProps {
  id: HeroId;
  alive: boolean;
}

export function HeroPortrait({ id, alive }: HeroPortraitProps) {
  const opacity = alive ? 1 : 0.42;

  if (id === 'hamdan') {
    return (
      <svg width="38" height="38" viewBox="0 0 42 42" fill="none" style={{ opacity }} aria-hidden="true">
        <rect x="1" y="1" width="40" height="40" rx="9" fill="#162133" stroke="#d9a441" strokeWidth="1.6" />
        {/* Cobalt-blue gallabiya shoulders */}
        <path d="M4 41C6 30 12 26 21 26C30 26 36 30 38 41" fill="#3f6299" />
        {/* Draped cream fringed shawl */}
        <path d="M12 26C15 30 27 30 30 26L28 32C23 34 19 34 14 32L12 26Z" fill="#efdfc2" />
        <rect x="23" y="29" width="4.5" height="12" rx="1" fill="#efdfc2" />
        {/* Neck, ears & face */}
        <rect x="17" y="22" width="8" height="6" rx="2" fill="#b47548" />
        <circle cx="14.3" cy="19.2" r="1.7" fill="#b47548" />
        <circle cx="27.7" cy="19.2" r="1.7" fill="#b47548" />
        <path d="M14.8 15.8H27.2V22.2C27.2 25 24.5 26.8 21 26.8C17.5 26.8 14.8 25 14.8 22.2V15.8Z" fill="#ca8d5b" />
        {/* Nose bridge & tip */}
        <path d="M21 17.5V20.5" stroke="#a6693f" strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="21" cy="20.7" rx="1.2" ry="0.7" fill="#b47247" />
        {/* Sculpted square jaw 5-o'clock stubble & thick handlebar mustache */}
        <path d="M14.8 20.6C15.1 24.8 17.6 26.8 21 26.8C24.4 26.8 26.9 24.8 27.2 20.6L26 22.2C24.2 23.2 17.8 23.2 16 22.2L14.8 20.6Z" fill="rgba(26,16,10,0.45)" />
        <path d="M15.8 22.3C17.8 20.6 24.2 20.6 26.2 22.3" stroke="#17100b" strokeWidth="2.3" strokeLinecap="round" />
        {/* Expressive eyes with glossy glints & fierce brows */}
        <ellipse cx="18" cy="18.2" rx="1.8" ry="1.25" fill="#faf5ec" />
        <ellipse cx="24" cy="18.2" rx="1.8" ry="1.25" fill="#faf5ec" />
        <circle cx="18" cy="18.2" r="0.95" fill="#3a2010" />
        <circle cx="24" cy="18.2" r="0.95" fill="#3a2010" />
        <circle cx="18.35" cy="17.85" r="0.35" fill="#ffffff" />
        <circle cx="24.35" cy="17.85" r="0.35" fill="#ffffff" />
        <path d="M15.4 16.1L19.7 17.2" stroke="#17100b" strokeWidth="1.85" strokeLinecap="round" />
        <path d="M26.6 16.1L22.3 17.2" stroke="#17100b" strokeWidth="1.85" strokeLinecap="round" />
        {/* Crisp white folded Saidi turban */}
        <ellipse cx="21" cy="11.8" rx="9" ry="5.5" fill="#f4efe6" />
        <path d="M12.5 13.4C16.8 10.4 22.8 10 29.2 12.4" stroke="#cbc2b2" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M13.2 11.2C18.2 13.8 24.6 13.4 28.8 10.6" stroke="#cbc2b2" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === 'salem') {
    return (
      <svg width="38" height="38" viewBox="0 0 42 42" fill="none" style={{ opacity }} aria-hidden="true">
        <rect x="1" y="1" width="40" height="40" rx="9" fill="#1e2419" stroke="#6ee7b7" strokeWidth="1.5" />
        {/* Weathered sage-olive V-neck gallabiya */}
        <path d="M5 41C7 31 13 27 21 27C29 27 35 31 37 41" fill="#687a56" />
        <path d="M17.5 27L21 35L24.5 27Z" fill="#ebe1cc" />
        <path d="M17 27L21 35.5L25 27" stroke="#49573b" strokeWidth="1.4" />
        {/* Lean neck, ears & gaunt face */}
        <rect x="17.5" y="22.5" width="7" height="5.5" rx="2" fill="#ae7245" />
        <circle cx="14.8" cy="19.3" r="1.5" fill="#ae7245" />
        <circle cx="27.2" cy="19.3" r="1.5" fill="#ae7245" />
        {/* Wild spiky black hair behind & above headband */}
        <path d="M12 16L10 11L15 11.5L17 7L21 10L25 6.5L27 11.5L32 10.5L30 16L31 20H11L12 16Z" fill="#150f0b" />
        <path d="M15.2 16.2H26.8V21.5C26.8 24.5 24.2 26.8 21 26.8C17.8 26.8 15.2 24.5 15.2 21.5V16.2Z" fill="#c28554" />
        {/* Jaw stubble + nose & mouth */}
        <path d="M15.5 21.5C15.8 24.6 18.2 26.6 21 26.6C23.8 26.6 26.2 24.6 26.5 21.5V23.2C25.5 25.4 23.4 26.8 21 26.8C18.6 26.8 16.5 25.4 15.5 23.2Z" fill="rgba(26,18,12,0.28)" />
        <path d="M21 18V20.8" stroke="#9b623b" strokeWidth="1.15" strokeLinecap="round" />
        <path d="M19.3 24.2C20.4 24.7 21.6 24.7 22.7 24.2" stroke="#7c422c" strokeWidth="1.1" strokeLinecap="round" />
        {/* Cream wrapped headband */}
        <path d="M13.5 13.3C17 12 25 12 28.5 13.3V16.4C25 15.4 17 15.4 13.5 16.4V13.3Z" fill="#e6dbc2" />
        {/* Fierce brows, expressive eyes with glints & thin curved mustache */}
        <ellipse cx="18.2" cy="18.7" rx="1.65" ry="1.2" fill="#faf5ec" />
        <ellipse cx="23.8" cy="18.7" rx="1.65" ry="1.2" fill="#faf5ec" />
        <circle cx="18.2" cy="18.7" r="0.9" fill="#3a2010" />
        <circle cx="23.8" cy="18.7" r="0.9" fill="#3a2010" />
        <circle cx="18.5" cy="18.4" r="0.32" fill="#ffffff" />
        <circle cx="24.1" cy="18.4" r="0.32" fill="#ffffff" />
        <path d="M15.8 16.8L19.6 17.7" stroke="#150f0b" strokeWidth="1.65" strokeLinecap="round" />
        <path d="M26.2 16.8L22.4 17.7" stroke="#150f0b" strokeWidth="1.65" strokeLinecap="round" />
        <path d="M17.2 22.8C19 21.6 23 21.6 24.8 22.8" stroke="#150f0b" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="38" height="38" viewBox="0 0 42 42" fill="none" style={{ opacity }} aria-hidden="true">
      <rect x="1" y="1" width="40" height="40" rx="9" fill="#2b171b" stroke="#f59e0b" strokeWidth="1.5" />
      {/* Deep burgundy gallabiya + dark-brown open vest */}
      <path d="M5 41C7 31 13 27 21 27C29 27 35 31 37 41" fill="#6e2a38" />
      <path d="M18.5 27L21 34L23.5 27Z" fill="#f2ead9" />
      <path d="M11 27.5H17.5V41H11V27.5ZM24.5 27.5H31V41H24.5V27.5Z" fill="#3e2d21" />
      {/* Neck, ears & face */}
      <rect x="17.2" y="22.5" width="7.6" height="5.5" rx="2" fill="#b4794f" />
      <circle cx="14.5" cy="19.2" r="1.55" fill="#b4794f" />
      <circle cx="27.5" cy="19.2" r="1.55" fill="#b4794f" />
      <path d="M15 16.2H27V22C27 24.8 24.4 26.8 21 26.8C17.6 26.8 15 24.8 15 22V16.2Z" fill="#cc9364" />
      {/* Nose & mouth */}
      <path d="M21 17.8V20.6" stroke="#a66c44" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M19.3 24.1C20.4 24.6 21.6 24.6 22.7 24.1" stroke="#7d432e" strokeWidth="1.15" strokeLinecap="round" />
      {/* Keen eyes with glints, brows & neat mustache */}
      <ellipse cx="18.2" cy="18.5" rx="1.7" ry="1.22" fill="#faf5ec" />
      <ellipse cx="23.8" cy="18.5" rx="1.7" ry="1.22" fill="#faf5ec" />
      <circle cx="18.2" cy="18.5" r="0.92" fill="#3a2010" />
      <circle cx="23.8" cy="18.5" r="0.92" fill="#3a2010" />
      <circle cx="18.5" cy="18.15" r="0.33" fill="#ffffff" />
      <circle cx="24.1" cy="18.15" r="0.33" fill="#ffffff" />
      <path d="M16 16.5L19.6 17.4" stroke="#1a120d" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M26 16.5L22.4 17.4" stroke="#1a120d" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17.4 22.5C19.2 21.7 22.8 21.7 24.6 22.5" stroke="#1a120d" strokeWidth="1.8" strokeLinecap="round" />
      {/* Cream-olive wrapped turban */}
      <ellipse cx="21" cy="11.8" rx="8.8" ry="5.4" fill="#e5ddc5" />
      <path d="M12.8 13.3C17 10.4 22.8 10 29 12.4" stroke="#bdb398" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 11.2C18.2 13.6 24.5 13.2 28.5 10.6" stroke="#bdb398" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
