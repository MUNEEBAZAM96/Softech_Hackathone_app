import { View } from "react-native";

import CopilotChatSection from "../../../components/insights/CopilotChatSection";
import { useAppTheme } from "../../../providers/ThemeProvider";

/** Chat-first insights: full-screen AI Copilot (see `CopilotChatSection`). */
export default function InsightsScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CopilotChatSection />
    </View>
  );
}
