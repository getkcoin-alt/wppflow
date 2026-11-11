import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { shouldRetry, retryDelay } from "./services/retryPolicy";
const queryClient = new QueryClient({
  // a busy server is given three more tries (1, 2, 4 seconds) before the red banner; a refusal is shown at once
  defaultOptions: { queries: { retry: shouldRetry, retryDelay, staleTime: 10000 } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
