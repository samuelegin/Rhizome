import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'
import { truncateAddress } from '../../lib/formatters'

/**
 * Thin wrapper around RainbowKit's ConnectButton.Custom so the connect
 * button reads as part of Rhizome's own pill-button system (see
 * .btn-primary / .btn-ghost in App.css) rather than RainbowKit's
 * default styling.
 */
function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, openAccountModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain

        if (!ready) {
          return (
            <button className="btn-primary" disabled aria-hidden="true" style={{ opacity: 0 }}>
              Connect wallet
            </button>
          )
        }

        if (!connected) {
          return (
            <button className="btn-primary" onClick={openConnectModal} type="button">
              Connect wallet
            </button>
          )
        }

        if (chain.unsupported) {
          return (
            <button className="btn-primary wrong-network" onClick={openChainModal} type="button">
              Wrong network
            </button>
          )
        }

        return (
          <button className="btn-ghost wallet-pill" onClick={openAccountModal} type="button">
            <span className="wallet-pill-dot" aria-hidden="true" />
            {account.ensName || truncateAddress(account.address)}
          </button>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}

export default ConnectButton
