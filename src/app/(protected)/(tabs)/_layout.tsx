import { router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from "react-native";

import { useAppTheme } from "../../../providers/ThemeProvider";

const HIDDEN_TAB_NAMES = new Set(["spending-calendar"]);

const ICON_MAP: Record<string, { active: string; inactive: string }> = {
  index: { active: "home", inactive: "home-outline" },
  history: { active: "time", inactive: "time-outline" },
  insights: { active: "chatbubbles", inactive: "chatbubbles-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

const LABEL_MAP: Record<string, string> = {
  index: "Home",
  history: "History",
  insights: "Copilot",
  profile: "Profile",
  add: "Add",
};

function triggerTabHaptics() {
  if (Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

type TabRouteItem = {
  key: string;
  name: string;
};

type CustomTabBarProps = {
  state: {
    routes: TabRouteItem[];
    index: number;
  };
  navigation: {
    emit: (e: object) => { defaultPrevented?: boolean };
    navigate: (name: string) => void;
  };
};

/** Single icon + label tab with scale / lift animations. */
function AnimatedTabItem({
  route,
  isFocused,
  onPress,
  onLayout,
  colors,
  captionStyle,
}: {
  route: TabRouteItem;
  isFocused: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
  captionStyle: object;
}) {
  const icons = ICON_MAP[route.name] ?? {
    active: "ellipse",
    inactive: "ellipse-outline",
  };
  const label = LABEL_MAP[route.name] ?? route.name;

  const scale = React.useRef(new Animated.Value(isFocused ? 1.12 : 1)).current;
  const labelOpacity = React.useRef(new Animated.Value(isFocused ? 1 : 0.65)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isFocused ? 1.12 : 1,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        toValue: isFocused ? 1 : 0.58,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused, scale, labelOpacity]);

  const iconColor = isFocused ? colors.primary : colors.textMuted;

  return (
    <Pressable
      onLayout={onLayout}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        Platform.OS === "ios" && pressed && { opacity: 0.72 },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      android_ripple={{
        color: `${colors.primary}30`,
        borderless: false,
        foreground: false,
      }}
    >
      <Animated.View
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale }],
        }}
      >
        <Ionicons
          name={(isFocused ? icons.active : icons.inactive) as keyof typeof Ionicons.glyphMap}
          size={22}
          color={iconColor}
        />
        <Animated.Text
          style={[
            captionStyle,
            {
              color: iconColor,
              marginTop: 2,
              opacity: labelOpacity,
              fontSize: 10,
              fontWeight: isFocused ? "700" : "500",
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

/** Center FAB with pop + haptic on press. */
function AnimatedFabItem({
  isFocused,
  onPress,
  onLayout,
  colors,
}: {
  isFocused: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const glow = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(glow, {
      toValue: isFocused ? 1 : 0,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isFocused, glow]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const ringScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const ringOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] });

  return (
    <View onLayout={onLayout} style={styles.fabWrapper}>
      <Animated.View style={[styles.fabCore, { transform: [{ scale }] }]}>
        <Animated.View
          style={[
            styles.fabRing,
            {
              borderColor: colors.primary,
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
          pointerEvents="none"
        />
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel="Add"
          android_ripple={{ color: "#ffffff55", borderless: false, radius: 26 }}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
            Platform.OS === "ios" && pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      </Animated.View>
      <Text
        style={{
          marginTop: 2,
          fontSize: 10,
          fontWeight: isFocused ? "700" : "500",
          color: isFocused ? colors.primary : colors.textMuted,
        }}
        numberOfLines={1}
      >
        Add
      </Text>
    </View>
  );
}

function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const { colors, resolvedMode, type } = useAppTheme();
  const [layouts, setLayouts] = React.useState<
    Record<string, LayoutRectangle | undefined>
  >({});

  const indicatorLeft = React.useRef(new Animated.Value(0)).current;
  const indicatorWidth = React.useRef(new Animated.Value(48)).current;
  const indicatorOpacity = React.useRef(new Animated.Value(0)).current;

  const tabRoutes = state.routes.filter(
    (route: TabRouteItem) => !HIDDEN_TAB_NAMES.has(route.name)
  );

  const activeRouteName = state.routes[state.index]?.name ?? "";
  const layoutForActive = layouts[activeRouteName];

  React.useEffect(() => {
    if (
      !activeRouteName ||
      activeRouteName === "add" ||
      activeRouteName === "spending-calendar"
    ) {
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
      return;
    }

    const L = layoutForActive;
    if (!L || L.width <= 0) {
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }).start();
      return;
    }

    const pillW = Math.max(36, Math.min(L.width - 6, L.width * 0.72));
    const pillX = L.x + (L.width - pillW) / 2;

    Animated.parallel([
      Animated.spring(indicatorLeft, {
        toValue: pillX,
        friction: 8,
        tension: 68,
        useNativeDriver: false,
      }),
      Animated.spring(indicatorWidth, {
        toValue: pillW,
        friction: 8,
        tension: 68,
        useNativeDriver: false,
      }),
      Animated.timing(indicatorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    activeRouteName,
    layoutForActive?.x,
    layoutForActive?.width,
    layoutForActive?.height,
    indicatorLeft,
    indicatorWidth,
    indicatorOpacity,
  ]);

  const captionStyle = React.useMemo(
    () => ({
      ...type.caption,
    }),
    [type.caption]
  );

  const gradientColors = React.useMemo(() => {
    if (resolvedMode === "dark") {
      return [
        `${colors.surfaceElevated}F2`,
        `${colors.surfaceAlt}EE`,
        `${colors.primary}24`,
      ] as const;
    }
    return [`${colors.surface}FA`, `${colors.surfaceAlt}F5`, `${colors.primary}18`] as const;
  }, [colors.primary, colors.surface, colors.surfaceAlt, colors.surfaceElevated, resolvedMode]);

  const onTabLayout = React.useCallback((routeName: string, e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setLayouts((prev) => ({
      ...prev,
      [routeName]: { x, y, width, height },
    }));
  }, []);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[...gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientShell, { borderColor: `${colors.border}AA` }]}
      >
        <View
          style={[
            styles.glassTint,
            {
              backgroundColor:
                resolvedMode === "dark"
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.55)",
            },
          ]}
        />
        <View style={styles.row}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.slidingPill,
              {
                opacity: indicatorOpacity,
                backgroundColor: `${colors.primary}26`,
                borderColor: `${colors.primary}40`,
                width: indicatorWidth,
                left: indicatorLeft,
              },
            ]}
          />

          {tabRoutes.map((route: TabRouteItem) => {
            const currentName = state.routes[state.index]?.name;
            const isFocused = currentName === route.name;
            const isCenter = route.name === "add";

            const onPress = () => {
              triggerTabHaptics();
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (isCenter) {
              return (
                <AnimatedFabItem
                  key={route.key}
                  isFocused={isFocused}
                  onPress={onPress}
                  onLayout={(e) => onTabLayout(route.name, e)}
                  colors={colors}
                />
              );
            }

            return (
              <AnimatedTabItem
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={onPress}
                onLayout={(e) => onTabLayout(route.name, e)}
                colors={colors}
                captionStyle={captionStyle}
              />
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 18,
    left: 14,
    right: 14,
    alignItems: "center",
  },
  gradientShell: {
    width: "100%",
    minHeight: 60,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 14,
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: "row",
    minHeight: 58,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingBottom: 4,
    paddingTop: 4,
    position: "relative",
  },
  slidingPill: {
    position: "absolute",
    top: 6,
    height: 46,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 2,
  },
  fabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
    zIndex: 3,
  },
  fabCore: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -6,
  },
  fabRing: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 9,
  },
});

function TabsNavigator() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as CustomTabBarProps)} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="add" options={{ title: "Add" }} />
      <Tabs.Screen name="insights" options={{ title: "AI Copilot" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen
        name="spending-calendar"
        options={{
          title: "Spending calendar",
          href: null,
          headerLeft: () => (
            <Pressable onPress={() => router.replace("/")}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <TabsNavigator />;
}
