import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { shouldRetry, retryDelay } from "./services/retryPolicy";
const queryClient = new QueryClient({
  // a busy server is given two more tries (3 and 6 seconds apart) before the red banner; a refusal is shown at once. Data is "fresh" for
  // 30 s: coming back to a tab or to a screen within that time does not ask again (the live updates keep what matters current)
  defaultOptions: { queries: { retry: shouldRetry, retryDelay, staleTime: 30000 } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
