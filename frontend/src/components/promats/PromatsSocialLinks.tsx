type Props = {
  socials: Record<string, string>;
  label: string;
  className?: string;
};

// Sosyal linkler tamamen site_settings.socials'ten gelir — hard-code default YOK.
const SOCIAL_ORDER: Array<{ key: string; icon: string; aria: string }> = [
  { key: 'facebook', icon: 'icon-facebook', aria: 'Facebook' },
  { key: 'instagram', icon: 'icon-instagram', aria: 'Instagram' },
  { key: 'whatsapp', icon: 'icon-whatsapp', aria: 'WhatsApp' },
  { key: 'youtube', icon: 'icon-youtube', aria: 'YouTube' },
  { key: 'linkedin', icon: 'icon-linkedin', aria: 'LinkedIn' },
  { key: 'twitter', icon: 'icon-twitter', aria: 'Twitter' },
];

export default function PromatsSocialLinks({ socials, label, className = 'text-center social-media' }: Props) {
  const items = SOCIAL_ORDER.filter((item) => socials[item.key]?.trim());
  if (!items.length) return null;

  return (
    <div className={className}>
      {label ? <span className="promats-social-label">{label}</span> : null}
      <ul className="icons-top icons-dark">
        {items.map((item) => (
          <li key={item.key}>
            <a
              href={socials[item.key]}
              target="_blank"
              rel="noreferrer"
              aria-label={`Promats ${item.aria}`}
              className={`promats-social-link promats-social-link--${item.key}`}
            >
              <span className={item.icon} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
