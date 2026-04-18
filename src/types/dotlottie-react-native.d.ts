declare module "@lottiefiles/dotlottie-react-native" {
  import type { ComponentType } from "react";
  import type { ViewStyle } from "react-native";

  export const DotLottie: ComponentType<{
    source: string | number | { uri: string };
    loop?: boolean;
    autoplay?: boolean;
    speed?: number;
    style?: ViewStyle;
    onLoad?: () => void;
    onLoadError?: () => void;
  }>;
}
