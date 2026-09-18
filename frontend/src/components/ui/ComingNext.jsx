function ComingNext({ title, body }) {
  return (
    <div className="empty-state">
      <i className="bi bi-cone-striped" />
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  )
}

export default ComingNext