import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AppShell from './components/ui/AppShell'
import OverviewPage from './app/overview/OverviewPage'
import NetworkPage from './app/network/NetworkPage'
import RhizomesPage from './app/rhizomes/RhizomesPage'
import ExplorePage from './app/rhizomes/ExplorePage'
import RhizomeDetailPage from './app/rhizomes/RhizomeDetailPage'
import CreatePage from './app/create/CreatePage'
import DemoPage from './app/demo/DemoPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="network" element={<NetworkPage />} />
          <Route path="rhizomes" element={<RhizomesPage />} />
          <Route path="rhizomes/:address" element={<RhizomeDetailPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="demo" element={<DemoPage />} />
        </Route>
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
