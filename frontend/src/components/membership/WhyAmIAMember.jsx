import QualificationChecklist from './QualificationChecklist'

function WhyAmIAMember({ rhizomeName, minimumConnections, qualifyingConnections }) {
  const count = qualifyingConnections.length
  const isMember = count >= minimumConnections

  return (
    <section className="why-member">
      <div className="why-member-head">
        <p className="why-member-eyebrow">Why you're a member</p>
        <h3>{rhizomeName}</h3>
        <span className={`membership-status ${isMember ? 'is-member' : 'is-not-member'}`}>
          <i className={`bi ${isMember ? 'bi-check-circle-fill' : 'bi-circle'}`} />
          {isMember ? 'Member' : 'Not yet a member'}
        </span>
      </div>
      <p className="why-member-requirement">
        Membership requirement: {minimumConnections} active connection{minimumConnections === 1 ? '' : 's'} with
        community anchors
      </p>
      <QualificationChecklist qualifyingConnections={qualifyingConnections} minimumConnections={minimumConnections} />
    </section>
  )
}

export default WhyAmIAMember
