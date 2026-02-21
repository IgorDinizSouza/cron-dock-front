
import { View, Text, Svg, Path, Rect, Circle, StyleSheet } from "@react-pdf/renderer";

export type DentalPdfHeaderProps = {
  title: string;
  rightText?: string;
  primary?: string;        
  accentBg?: string;         
};

export default function DentalPdfHeaderNew({
  title,
  rightText,
  primary = "#06B6D4",
  accentBg = "#E6F6FD",
}: DentalPdfHeaderProps) {
  return (
    <View style={s.bannerWrap}>
      <View style={[s.bannerBg, { backgroundColor: primary }]} />
      <Svg style={s.bannerWave} viewBox="0 0 600 40" preserveAspectRatio="none">
        <Path d="M0,10 C120,40 240,0 360,20 C480,40 540,10 600,20 L600,40 L0,40 Z" fill={accentBg} />
      </Svg>

      {/* bolinhas decorativas */}
      <Svg style={s.bannerDots} viewBox="0 0 120 40">
        <Circle cx="14" cy="12" r="4" fill="#FFFFFF" />
        <Circle cx="42" cy="22" r="2.5" fill="#FFFFFF" />
        <Circle cx="70" cy="10" r="3" fill="#FFFFFF" />
            <Circle cx="90" cy="2" r="8" fill="#FFFFFF" />
      </Svg>


      <View style={s.bannerContent}>
        <Text style={s.bannerTitle}>{title}</Text>
        {rightText ? <Text style={s.clinicName}>{rightText}</Text> : <Text />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bannerWrap: { height: 110, position: "relative", marginBottom: 12 },
  bannerBg: { borderRadius: 12, height: 90 },
  bannerWave: { position: "absolute", left: 0, right: 0, bottom: 0, height: 40 },
  bannerDots: { position: "absolute", top: 10, left: 14, width: 120, height: 40 },
  bannerPlus: { position: "absolute", top: 16, right: 18, width: 16, height: 16 },
  bannerContent: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bannerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  clinicName: { color: "#FFFFFF", fontSize: 12, textAlign: "right" },
});
