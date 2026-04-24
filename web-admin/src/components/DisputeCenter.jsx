import React, { useEffect, useMemo, useState } from 'react'
import {
  submitDispute,
  fetchDisputeByOrder,
  respondDispute,
  fetchOpenDisputes,
  resolveDispute,
} from '../services/api'

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const DisputeCenter = ({ role, orderId }) => {
  const [buyerDescription, setBuyerDescription] = useState('')
  const [buyerEvidence, setBuyerEvidence] = useState('')
  const [sellerDescription, setSellerDescription] = useState('')
  const [sellerEvidence, setSellerEvidence] = useState('')
  const [currentDispute, setCurrentDispute] = useState(null)
  const [openDisputes, setOpenDisputes] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const hasBuyerInput = useMemo(() => Boolean(buyerDescription.trim()), [buyerDescription])
  const hasSellerInput = useMemo(() => Boolean(sellerDescription.trim()), [sellerDescription])

  useEffect(() => {
    if (role === 'buyer' || role === 'seller') {
      if (!orderId) return
      setLoading(true)
      fetchDisputeByOrder(orderId)
        .then((d) => setCurrentDispute(d))
        .catch(() => setCurrentDispute(null))
        .finally(() => setLoading(false))
    }
    if (role === 'admin') {
      setLoading(true)
      fetchOpenDisputes()
        .then((data) => setOpenDisputes(data.disputes || []))
        .catch(() => setOpenDisputes([]))
        .finally(() => setLoading(false))
    }
  }, [role, orderId])

  const handleEvidenceUpload = async (event, setter) => {
    const file = event.target.files?.[0]
    if (!file) return
    const payload = await readFile(file)
    setter(payload)
  }

  const handleSubmitDispute = async () => {
    if (!hasBuyerInput) return
    setErr('')
    try {
      await submitDispute({ order_id: orderId, buyer_description: buyerDescription, buyer_evidence_url: buyerEvidence })
      setErr('Dispute submitted successfully.')
    } catch (error) {
      setErr('Unable to submit dispute. Please try again.')
    }
  }

  const handleSubmitResponse = async () => {
    if (!currentDispute || !hasSellerInput) return
    setErr('')
    try {
      await respondDispute(currentDispute.id, { seller_description: sellerDescription, seller_evidence_url: sellerEvidence })
      setErr('Response submitted successfully.')
    } catch (error) {
      setErr('Unable to submit response. Please try again.')
    }
  }

  const handleResolve = async (disputeId, result) => {
    try {
      await resolveDispute(disputeId, result)
      setOpenDisputes(openDisputes.filter((d) => d.id !== disputeId))
    } catch (error) {
      setErr('Unable to resolve dispute right now.')
    }
  }

  if (role === 'buyer') {
    return (
      <section className='panel'>
        <h3>Dispute center</h3>
        <textarea className='input' rows={4} value={buyerDescription} onChange={(e) => setBuyerDescription(e.target.value)} placeholder='Describe the issue' />
        <input type='file' accept='image/*,video/*' onChange={(e) => handleEvidenceUpload(e, setBuyerEvidence)} />
        <button className='btn btn-dark' disabled={!hasBuyerInput} onClick={handleSubmitDispute}>Submit Dispute</button>
        {buyerEvidence && <div className='helper-text'>Evidence attached</div>}
        {err && <div className='helper-text' style={{ color: 'red' }}>{err}</div>}
      </section>
    )
  }

  if (role === 'seller') {
    return (
      <section className='panel'>
        <h3>Dispute response</h3>
        {currentDispute ? (
          <>
            <div className='helper-text'>Buyer says: {currentDispute.buyer_description}</div>
            {currentDispute.buyer_evidence_url && <div><a href={currentDispute.buyer_evidence_url} target='_blank' rel='noreferrer'>View evidence</a></div>}
            <textarea className='input' rows={4} value={sellerDescription} onChange={(e) => setSellerDescription(e.target.value)} placeholder='Your response' />
            <input type='file' accept='image/*,video/*' onChange={(e) => handleEvidenceUpload(e, setSellerEvidence)} />
            <button className='btn btn-dark' disabled={!hasSellerInput} onClick={handleSubmitResponse}>Submit Response</button>
            {err && <div className='helper-text' style={{ color: 'red' }}>{err}</div>}
          </>
        ) : (
          <div>No open dispute for this order.</div>
        )}
      </section>
    )
  }

  if (role === 'admin') {
    return (
      <section className='panel'>
        <h3>Disputes</h3>
        {loading ? (
          <div>Loading disputes…</div>
        ) : (
          <div className='list'>
            {openDisputes.length ? openDisputes.map((dispute) => (
              <div key={`dispute-${dispute.id}`} className='list-row'>
                <div>
                  <strong>Order #{dispute.order_id}</strong><br />
                  Buyer: {dispute.buyer_description}<br />
                  Seller response: {dispute.seller_description || 'Pending'}
                </div>
                <div className='row2' style={{ gap: 6 }}>
                  <button className='btn btn-dark' onClick={() => handleResolve(dispute.id, 'buyer')}>Resolve in favor of buyer</button>
                  <button className='btn' onClick={() => handleResolve(dispute.id, 'seller')}>Resolve in favor of seller</button>
                </div>
              </div>
            )) : <div>No open disputes.</div>}
          </div>
        )}
      </section>
    )
  }

  return null
}

export default DisputeCenter
