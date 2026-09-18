import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Web3Providers from './lib/wallet/Web3Providers.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3Providers>
      <App />
    </Web3Providers>
  </React.StrictMode>,
)
