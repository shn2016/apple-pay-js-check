export default function StatusCard({ label, value, tone = 'neutral', hint }) {
  return (
    <section className={`status-card status-card--${tone}`}>
      <p className="status-card__label">{label}</p>
      <p className="status-card__value">{value}</p>
      {hint ? <p className="status-card__hint">{hint}</p> : null}
    </section>
  );
}
