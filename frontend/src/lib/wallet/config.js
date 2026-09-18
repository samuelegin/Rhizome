import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { monadTestnet } from './chain'

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

if (!walletConnectProjectId && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[wallet] VITE_WALLETCONNECT_PROJECT_ID is not set — injected wallets (MetaMask, ' +
      'Rabby, etc.) still work, but WalletConnect/mobile wallets will not appear. ' +
      'Get a free project id at https://cloud.walletconnect.com.'
  )
}

export const wagmiConfig = getDefaultConfig({
  appName: 'Rhizome',
  projectId: walletConnectProjectId || 'MISSING_WALLETCONNECT_PROJECT_ID',
  chains: [monadTestnet],
  ssr: false,
})