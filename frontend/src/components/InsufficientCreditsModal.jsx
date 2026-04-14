import { useNavigate } from 'react-router-dom'

export default function InsufficientCreditsModal({ balance, needed, onClose }) {
  const navigate = useNavigate()

  function goToCredits() {
    onClose()
    navigate('/credits')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="icon">💳</div>
        <h2>Not enough credits</h2>
        <p>
          This action costs <strong>{needed} credits</strong> but you only have{' '}
          <strong>{balance} credits</strong> remaining.
          <br /><br />
          Top up to keep generating content.
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={goToCredits}>Buy Credits</button>
        </div>
      </div>
    </div>
  )
}
