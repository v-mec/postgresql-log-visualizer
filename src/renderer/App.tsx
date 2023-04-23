import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './contexts';
import { Graph, Home } from './pages';

export default function App() {
  return (
    <ChakraProvider>
      <SettingsProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/graph" element={<Graph />} />
          </Routes>
        </Router>
      </SettingsProvider>
    </ChakraProvider>
  );
}
