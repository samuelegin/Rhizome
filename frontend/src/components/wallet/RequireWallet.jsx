import { useAccount } from 'wagmi'
import ConnectButton from './ConnectButton'

function RequireWallet({ children }) {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="empty-state">
        <i className="bi bi-wallet2" />
        <h2>Connect your wallet</h2>
        <p>Connect a wallet to see your connections and which Rhizomes they qualify you for.</p>
        <ConnectButton />
      </div>
    )
  }

  return children
}

export default RequireWallet