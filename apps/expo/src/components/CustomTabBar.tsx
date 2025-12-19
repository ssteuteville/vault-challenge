import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

const TAB_CONFIG = {
  sharing: {
    icon: (focused: boolean) =>
      (focused ? "share" : "share-outline") as keyof typeof Ionicons.glyphMap,
    label: "Sharing",
    color: "#9333EA", // Purple
  },
  browse: {
    icon: (focused: boolean) =>
      (focused ? "search" : "search-outline") as keyof typeof Ionicons.glyphMap,
    label: "Browse",
    color: "#10B981", // Green
  },
  borrowing: {
    icon: (focused: boolean) =>
      (focused
        ? "library"
        : "library-outline") as keyof typeof Ionicons.glyphMap,
    label: "Borrowing",
    color: "#F59E0B", // Orange
  },
};

const MAX_LABEL_LENGTH = Math.max(
  ...Object.values(TAB_CONFIG).map((config) => config.label.length),
);
const FIXED_TAB_WIDTH = 24 + 8 + MAX_LABEL_LENGTH * 7 + 16;

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.tabBar}>
        {state.routes.map(
          (
            route: { key: string; name: string; params?: object | undefined },
            index: number,
          ) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            const { options } = descriptor;
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];

            const isThirdTab = index === 2;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            const containerAnimatedStyle = useAnimatedStyle(() => {
              return {
                width: FIXED_TAB_WIDTH,
              };
            });

            const iconAnimatedStyle = useAnimatedStyle(() => {
              return {
                transform: [
                  {
                    scale: withTiming(isFocused ? 1.1 : 1, { duration: 200 }),
                  },
                ],
              };
            });

            const labelAnimatedStyle = useAnimatedStyle(() => {
              return {
                opacity: withTiming(isFocused ? 1 : 0, { duration: 200 }),
                transform: [
                  {
                    translateX: withTiming(
                      isFocused ? 0 : isThirdTab ? 8 : -8,
                      { duration: 200 },
                    ),
                  },
                ],
              };
            });

            const indicatorAnimatedStyle = useAnimatedStyle(() => {
              return {
                width: FIXED_TAB_WIDTH,
              };
            });

            // Determine alignment for each tab
            const tabButtonStyle = [
              styles.tabButton,
              index === 0
                ? styles.tabButtonLeft
                : index === 1
                  ? styles.tabButtonCenter
                  : styles.tabButtonRight,
            ];

            return (
              <AnimatedPressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={tabButtonStyle}
              >
                <Animated.View
                  style={[styles.tabContent, containerAnimatedStyle]}
                >
                  {isFocused && (
                    <Animated.View
                      style={[
                        styles.activeIndicator,
                        indicatorAnimatedStyle,
                        { backgroundColor: config.color },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.iconLabelContainer,
                      index === 1 && styles.iconLabelContainerCenter,
                      isThirdTab && styles.iconLabelContainerRight,
                    ]}
                  >
                    <Animated.View style={iconAnimatedStyle}>
                      <Ionicons
                        name={config.icon(isFocused)}
                        size={24}
                        color={isFocused ? config.color : "#9CA3AF"}
                      />
                    </Animated.View>
                    <AnimatedText
                      style={[
                        styles.tabLabel,
                        labelAnimatedStyle,
                        { color: isFocused ? config.color : "transparent" },
                      ]}
                      numberOfLines={1}
                    >
                      {config.label}
                    </AnimatedText>
                  </View>
                </Animated.View>
              </AnimatedPressable>
            );
          },
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "stretch",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#2A2A2A",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 64,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 0,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tabButtonLeft: {
    alignSelf: "flex-start",
  },
  tabButtonCenter: {
    alignSelf: "center",
  },
  tabButtonRight: {
    alignSelf: "flex-end",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 48,
    overflow: "visible",
  },
  iconLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  iconLabelContainerCenter: {
    justifyContent: "center",
  },
  iconLabelContainerRight: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
  },
  activeIndicator: {
    position: "absolute",
    height: 48,
    borderRadius: 24,
    opacity: 0.15,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
