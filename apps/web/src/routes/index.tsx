import { createFileRoute } from '@tanstack/react-router'
import { ChartWorkspaceLayout } from '~/client/charts/layouts'

export const Route = createFileRoute('/')({
  component: RootRouteComponent,
})

function RootRouteComponent() {
  return <ChartWorkspaceLayout />
}
