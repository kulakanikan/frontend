/**
 * Home / Dashboard Screen
 * Thin route file - delegates rendering to feature component.
 */
import { DashboardScreen } from "@/src/features/dashboard/components/dashboard-screen";

export default function HomeTab() {
  return <DashboardScreen />;
}
