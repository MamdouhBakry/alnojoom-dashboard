import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "./lib/api";
import { I18nProvider } from "./i18n/I18nProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { FeedbackProvider } from "./components/feedback";
import { App } from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retry network blips, never auth/permission/validation errors.
      retry: (count, err) => count < 2 && (!(err instanceof ApiError) || err.status === 0 || err.status >= 500),
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <FeedbackProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </FeedbackProvider>
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
);
