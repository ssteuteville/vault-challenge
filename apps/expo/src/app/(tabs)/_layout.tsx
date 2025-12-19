import { Tabs } from "expo-router";
import { CustomTabBar } from "~/components/CustomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="sharing"
        options={{
          title: "Sharing",
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
        }}
      />
      <Tabs.Screen
        name="borrowing"
        options={{
          title: "Borrowing",
        }}
      />
    </Tabs>
  );
}

