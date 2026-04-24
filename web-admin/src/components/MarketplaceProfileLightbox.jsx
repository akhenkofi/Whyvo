import React from 'react'

const MarketplaceProfileLightbox = ({ profile, onClose, onMessage }) => {
  if (!profile) return null

  return (
    <div className='lightbox' onClick={onClose}>
      <div className='lightbox-inner public-profile' onClick={(e) => e.stopPropagation()}>
        <div className='list-row' style={{ marginBottom: 8, justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{profile.display_name}</div>
            <div className='helper-text'>{profile.marketplace_id}</div>
          </div>
          <button type='button' className='btn btn-dark' onClick={onMessage}>Message</button>
        </div>
        <div className='detail-meta'>
          <div className='list-row' style={{ gap: 12 }}>
            <img src={profile.avatar_url || '/assets/default-avatar.png'} alt='Avatar' style={{ width: 64, height: 64, borderRadius: 999, objectFit: 'cover' }} />
            <div>{profile.bio || 'No bio yet.'}</div>
          </div>
          <div className='panel' style={{ marginTop: 12 }}>
            <strong>Marketplace listings</strong>
            {profile.listings.length ? profile.listings.map((listing) => (
              <div key={`${listing.listing_type}-${listing.listing_id}`} className='list-row'>
                <div>
                  <strong>{listing.title}</strong><br />
                  {listing.listing_type} • {listing.status || 'OPEN'}<br />
                  {listing.price ? `${listing.price} ${listing.currency}` : 'Price on request'}
                  {listing.shipping_summary ? (
                    <>
                      <br />
                      <span className='helper-text'>Ships from {listing.shipping_summary}</span>
                    </>
                  ) : null}
                </div>
              </div>
            )) : <div className='helper-text'>No listings yet.</div>}
          </div>
          <div className='panel' style={{ marginTop: 12 }}>
            <strong>Recent posts</strong>
            {profile.posts.length ? profile.posts.map((post) => (
              <div key={`pp-${post.id}`} className='list-row'>
                <div>
                  <strong>{post.title || 'Post'}</strong><br />
                  <span className='helper-text'>{post.body}</span>
                </div>
              </div>
            )) : <div className='helper-text'>No posts yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketplaceProfileLightbox
