import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "~/utils/api";

import "../styles.css";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      {/*
          The Stack component displays the current page.
          Tab navigation is handled by (tabs)/_layout.tsx
          This Stack handles nested routes like /items/[id]
        */}
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#18181B",
          },
          headerTintColor: "#FAFAFA",
          contentStyle: {
            backgroundColor: colorScheme == "dark" ? "#09090B" : "#FFFFFF",
          },
        }}
      />
      <StatusBar />
    </QueryClientProvider>
  );
}
