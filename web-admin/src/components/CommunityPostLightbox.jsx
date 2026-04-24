import React from 'react'

const CommunityPostLightbox = ({
  post,
  comments = [],
  draft = '',
  reactionCount,
  onClose,
  onProfile,
  onReact,
  onCommentChange,
  onCommentSubmit,
}) => {
  if (!post) return null

  const mediaGallery = [post.media_url, ...(post.media_gallery || [])].filter(Boolean)
  const totalReactions = Number(reactionCount ?? post.likes_count ?? post.reactions ?? 0)
  const commentCount = Number(post.comments_count || 0) + (comments || []).length

  return (
    <div className='lightbox' onClick={onClose}>
      <div className='lightbox-inner post-detail' onClick={(e) => e.stopPropagation()}>
        <div className='list-row' style={{ marginBottom: 8 }}>
          <strong>Post detail</strong>
          <button type='button' className='btn btn-dark' onClick={onClose}>Close</button>
        </div>
        <div className='detail-meta'>
          <div className='list-row' style={{ cursor: 'pointer' }} onClick={() => onProfile?.(post.user_id)}>
            <img src={post.author_avatar_url || '/assets/default-avatar.png'} alt='Avatar' style={{ width: 40, height: 40, borderRadius: 999, objectFit: 'cover', marginRight: 10 }} />
            <div>
              <div style={{ fontWeight: 700 }}>{post.author_name || `User ${post.user_id}`}</div>
              <div className='helper-text' style={{ marginTop: 0 }}>@{post.author_username || String(post.user_id)}</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>{post.text}</div>
          {mediaGallery.length > 0 && (
            <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
              {mediaGallery.map((media, idx) => (
                media && (media.match(/\.(mp4|mov|webm)(\?|$)/i) ? (
                  <video key={`post-media-${idx}`} src={media} controls style={{ width: '100%', borderRadius: 10 }} />
                ) : (
                  <img key={`post-media-${idx}`} src={media} alt='Post media' style={{ width: '100%', borderRadius: 10 }} />
                ))
              ))}
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <span style={{ marginRight: 12 }}>👍 {totalReactions}</span>
            <span>💬 {commentCount}</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <button type='button' className='btn btn-dark' onClick={() => onReact?.(post.id)}>React</button>
            <span className='helper-text' style={{ marginLeft: 10 }}>Add your reaction</span>
          </div>
          <div className='panel' style={{ marginTop: 12, padding: 12 }}>
            <textarea className='input' rows={3} placeholder='Add a comment' value={draft} onChange={(e) => onCommentChange?.(e.target.value)} />
            <div className='row2' style={{ gap: 10, marginTop: 8 }}>
              <button type='button' className='btn btn-dark' disabled={!draft.trim()} onClick={onCommentSubmit}>Comment</button>
            </div>
            <div className='list' style={{ marginTop: 8 }}>
              {(comments || []).map((c) => (
                <div className='list-row' key={`comment-${c.id}`}>
                  <span><strong>{c.author}</strong>: {c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityPostLightbox
