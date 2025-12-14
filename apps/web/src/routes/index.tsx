import { createFileRoute } from '@tanstack/react-router'
import { ExampleComponentsLayout } from '~/client/example/layout'

export const Route = createFileRoute('/')({
  component: ExampleComponentsLayout,
})
