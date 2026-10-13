export default function Title({ onStart }: { onStart: () => void }) {
  return (
    <div className="title-card" role="dialog" aria-modal="true" aria-label="Fliporama Roulette" onClick={onStart}>
      <p className="title-logo">ROULETTE</p>
      <button className="title-start" type="button" autoFocus>PRESS START</button>
      <p className="title-note">FREE PLAY / NO CASH VALUE</p>
    </div>
  )
}
