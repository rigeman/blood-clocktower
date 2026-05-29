import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { PageTransition } from "@/components/PageTransition";
import Index from "./pages/Index";
import Lobby from "./pages/Lobby";
import GameBoard from "./pages/GameBoard";
import Characters from "./pages/Characters";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AnimatedRoutes>
            <Route path="/" data-genie-title="Home" data-genie-key="Home" element={<PageTransition transition="fade"><Index /></PageTransition>} />
            <Route path="/lobby" data-genie-title="Lobby" data-genie-key="Lobby" element={<PageTransition transition="slide-up"><Lobby /></PageTransition>} />
            <Route path="/game" data-genie-title="Game" data-genie-key="Game" element={<PageTransition transition="fade"><GameBoard /></PageTransition>} />
            <Route path="/characters" data-genie-title="Characters" data-genie-key="Characters" element={<PageTransition transition="slide-up"><Characters /></PageTransition>} />
            <Route path="*" data-genie-key="NotFound" data-genie-title="Not Found" element={<PageTransition transition="fade"><NotFound /></PageTransition>} />
          </AnimatedRoutes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App
