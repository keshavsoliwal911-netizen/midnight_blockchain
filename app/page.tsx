import Link from 'next/link';

export default function HomePage() {
  return <main className="shell">
    <nav className="topbar"><span className="brand">QUIET RSVP / MIDNIGHT</span><span className="eyebrow">PREPROD</span></nav>
    <section className="hero">
      <div><div className="eyebrow">A private guest list</div><h1>Know who is coming. Keep it theirs.</h1><p className="lede">Quiet RSVP lets hosts publish a party commitment while guests prove their invitation and submit an RSVP without putting their identity or answer on-chain.</p><div className="actions"><Link className="button" href="/party">Open RSVP desk</Link><a className="button alt" href="#privacy">Read the boundary</a></div></div>
      <div className="panel"><div className="eyebrow">The public ledger sees</div><h2>Just enough.</h2><p>Event commitment, deadline, capacity, anonymous invitation commitments, and salted RSVP commitments. No names. No individual answers.</p><p className="private">Your wallet secret stays in your browser and is required to change your RSVP.</p></div>
    </section>
    <section id="privacy" className="grid"><div className="panel"><div className="eyebrow">01 / Host</div><h2>Make the room</h2><p>Create the event, keep its details in the invitation you share, and add guests by secret commitment.</p></div><div className="panel"><div className="eyebrow">02 / Guest</div><h2>Bring your proof</h2><p>Your invitation secret proves eligibility inside the circuit. The chain sees only a commitment.</p></div><div className="panel"><div className="eyebrow">03 / Boundary</div><h2>Reveal less</h2><p>Only aggregate counts cross the boundary. Individual RSVP choices remain committed, even to the host.</p></div></section>
  </main>;
}
