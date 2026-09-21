import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { decodeEventLog, isAddress } from 'viem'
import { CONTRACT_ADDRESSES, isDeployed } from '../../lib/contracts/addresses'
import { SIGNAL_TYPES, SIGNAL_LABELS, MAX_BOOTSTRAP_MEMBERS } from '../../lib/contracts/config'
import { RHIZOME_FACTORY_ABI, RHIZOME_ABI } from '../../lib/contracts/abis'
import RequireWallet from '../../components/wallet/RequireWallet'

function CreateRhizomeForm() {
  const navigate = useNavigate()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [name, setName] = useState('')
  const [freshnessDays, setFreshnessDays] = useState('30')
  const [minimumConnections, setMinimumConnections] = useState('2')
  const [bootstrapMembers, setBootstrapMembers] = useState(['', '', ''])
  const [status, setStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const factoryDeployed = isDeployed(CONTRACT_ADDRESSES.RHIZOME_FACTORY)
  const filledBootstrapMembers = bootstrapMembers.map((a) => a.trim()).filter(Boolean)
  const invalidBootstrapMember = filledBootstrapMembers.find((a) => !isAddress(a))

  const canSubmit =
    factoryDeployed &&
    name.trim().length > 0 &&
    Number(freshnessDays) > 0 &&
    Number(minimumConnections) > 0 &&
    Number(minimumConnections) <= MAX_BOOTSTRAP_MEMBERS &&
    !invalidBootstrapMember &&
    status !== 'working'

  function updateBootstrapMember(index, value) {
    setBootstrapMembers((prev) => prev.map((a, i) => (i === index ? value : a)))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setStatus('working')

    try {
      setStatusMessage('Creating Rhizome...')
      const createHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.RHIZOME_FACTORY,
        abi: RHIZOME_FACTORY_ABI,
        functionName: 'createRhizome',
        args: [
          name.trim(),
          SIGNAL_TYPES.SHARED_GOVERNANCE,
          BigInt(Number(freshnessDays) * 86400),
          Number(minimumConnections),
        ],
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash })

      let rhizomeAddress = null
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: RHIZOME_FACTORY_ABI, data: log.data, topics: log.topics })
          if (decoded.eventName === 'RhizomeCreated') {
            rhizomeAddress = decoded.args.rhizome
            break
          }
        } catch {
          continue
        }
      }

      if (!rhizomeAddress) {
        throw new Error('Rhizome created, but its address could not be read from the transaction.')
      }

      for (let i = 0; i < filledBootstrapMembers.length; i += 1) {
        setStatusMessage(`Adding bootstrap member ${i + 1} of ${filledBootstrapMembers.length}...`)
        const addHash = await writeContractAsync({
          address: rhizomeAddress,
          abi: RHIZOME_ABI,
          functionName: 'addBootstrapMember',
          args: [filledBootstrapMembers[i]],
        })
        await publicClient.waitForTransactionReceipt({ hash: addHash })
      }

      setStatusMessage('Rhizome created.')
      navigate(`/app/rhizomes/${rhizomeAddress}`)
    } catch (error) {
      setErrorMessage(error.shortMessage || error.message || 'Something went wrong.')
      setStatus('idle')
    }
  }

  if (!factoryDeployed) {
    return <p className="app-empty-note">RhizomeFactory isn't configured yet — creation isn't available.</p>
  }

  return (
    <div className="create-page">
      <h1 className="app-page-title">Create a Rhizome</h1>
      <p className="create-page-tagline">Define the relationship pattern that forms your community.</p>

      <form className="create-form" onSubmit={handleSubmit}>
        <label className="create-field">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Monad Builders"
            disabled={status === 'working'}
          />
        </label>

        <label className="create-field">
          <span>Relationship signal</span>
          <input type="text" value={SIGNAL_LABELS[SIGNAL_TYPES.SHARED_GOVERNANCE]} disabled />
        </label>

        <label className="create-field">
          <span>Freshness period (days)</span>
          <input
            type="number"
            min="1"
            value={freshnessDays}
            onChange={(e) => setFreshnessDays(e.target.value)}
            disabled={status === 'working'}
          />
        </label>

        <label className="create-field">
          <span>Connections required</span>
          <input
            type="number"
            min="1"
            max={MAX_BOOTSTRAP_MEMBERS}
            value={minimumConnections}
            onChange={(e) => setMinimumConnections(e.target.value)}
            disabled={status === 'working'}
          />
        </label>

        <div className="create-field">
          <span>Bootstrap members (up to {MAX_BOOTSTRAP_MEMBERS})</span>
          {bootstrapMembers.map((value, index) => (
            <input
              key={index}
              type="text"
              value={value}
              onChange={(e) => updateBootstrapMember(index, e.target.value)}
              placeholder="0x..."
              className="create-bootstrap-input"
              disabled={status === 'working'}
            />
          ))}
        </div>

        {Number(minimumConnections) > filledBootstrapMembers.length && filledBootstrapMembers.length > 0 && (
          <p className="create-warning">
            {minimumConnections} connections are required, but only {filledBootstrapMembers.length} bootstrap
            member{filledBootstrapMembers.length === 1 ? '' : 's'}{' '}
            {filledBootstrapMembers.length === 1 ? 'is' : 'are'} set — no one will be able to qualify until more
            anchors join.
          </p>
        )}

        {invalidBootstrapMember && <p className="create-error">"{invalidBootstrapMember}" isn't a valid address.</p>}
        {errorMessage && <p className="create-error">{errorMessage}</p>}
        {status === 'working' && <p className="create-status">{statusMessage}</p>}

        <button type="submit" className="create-submit" disabled={!canSubmit}>
          {status === 'working' ? 'Creating...' : 'Create Rhizome'}
        </button>
      </form>

      <p className="create-footnote">Membership will be derived from active verified connections.</p>
    </div>
  )
}

function CreatePage() {
  return (
    <RequireWallet>
      <CreateRhizomeForm />
    </RequireWallet>
  )
}

export default CreatePage
