import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-gray-50 to-white">
          <h1 className="text-3xl font-bold text-gray-900 text-center">DPA Parser Checker</h1>
          <p className="mt-2 text-lg text-gray-600">Tool for checking your parsing before uploading to Clairk</p>
        </div>
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;