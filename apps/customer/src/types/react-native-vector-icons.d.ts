declare module "react-native-vector-icons/Ionicons" {
  import type { ComponentType } from "react";
  import type { ColorValue, StyleProp, TextStyle } from "react-native";

  export interface IoniconsProps {
    name: string;
    size?: number;
    color?: ColorValue;
    style?: StyleProp<TextStyle>;
  }

  const Ionicons: ComponentType<IoniconsProps>;
  export default Ionicons;
}
