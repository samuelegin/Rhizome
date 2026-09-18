import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { wagmiConfig } from './config'

const queryClient = new QueryClient()

const rhizomeTheme = darkTheme({
  accentColor: '#ffffff',
  accentColorForeground: '#0a0a0a',
  borderRadius: 'small',
  fontStack: 'system',
  overlayBlur: 'small',
})

function Web3Providers({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rhizomeTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default Web3Providers
