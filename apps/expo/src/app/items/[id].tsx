import { SafeAreaView, Text, View } from "react-native";
import { Stack, useGlobalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function ItemDetail() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useQuery(
    trpc.item.byId.queryOptions({ id: id ?? "" }),
  );

  return (
    <SafeAreaView className="bg-background flex-1">
      <Stack.Screen
        options={{
          title: item?.title ?? "Item",
          headerStyle: {
            backgroundColor: "#18181B",
          },
          headerTintColor: "#FAFAFA",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
        }}
      />
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-muted-foreground/10 mb-6 h-20 w-20 items-center justify-center rounded-full">
          <Text className="text-4xl">🚧</Text>
        </View>
        <Text className="text-foreground mb-2 text-center text-2xl font-bold">
          Coming Soon
        </Text>
        <Text className="text-muted-foreground text-center text-base leading-6">
          Item details are being built. Check back soon!
        </Text>
      </View>
    </SafeAreaView>
  );
}
