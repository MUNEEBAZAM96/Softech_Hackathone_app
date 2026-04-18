import { router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { colors, space } from "../../../constants/theme";

const HIDDEN_TAB_NAMES = new Set(["spending-calendar"]);

function CustomTabBar({ state, descriptors, navigation }: any) {
  const tabRoutes = state.routes.filter(
    (route: { name: string }) => !HIDDEN_TAB_NAMES.has(route.name)
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabRoutes.map((route: any) => {
          const currentName = state.routes[state.index]?.name;
          const isFocused = currentName === route.name;
          const isCenter = route.name === "add";

          const onPress = () => {
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
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.85}
                style={styles.fabWrapper}
              >
                <View style={[styles.fab, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add" size={28} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          }

          const iconMap: Record<string, { active: string; inactive: string }> = {
            index: { active: "home", inactive: "home-outline" },
            history: { active: "time", inactive: "time-outline" },
            insights: { active: "sparkles", inactive: "sparkles-outline" },
            profile: { active: "person", inactive: "person-outline" },
          };

          const icons = iconMap[route.name] ?? { active: "ellipse", inactive: "ellipse-outline" };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tab}
            >
              {isFocused && <View style={[styles.activePill, { backgroundColor: colors.primary + "18" }]} />}
              <Ionicons
                name={(isFocused ? icons.active : icons.inactive) as any}
                size={22}
                color={isFocused ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: space.s24,
    left: space.s16,
    right: space.s16,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 32,
    height: 64,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: space.s8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
  },
  activePill: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="add" options={{ title: "Add" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
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