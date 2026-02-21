import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsOverview } from "@/components/reports/reports-overview"
import { ReportsCharts } from "@/components/reports/reports-charts"

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <ReportsHeader />
      <ReportsOverview />
      <ReportsCharts />
    </div>
  )
}
