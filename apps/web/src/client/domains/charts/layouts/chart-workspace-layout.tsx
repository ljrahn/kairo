'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  type IProgramExecutionError,
  runProgram,
  type IChart,
} from '@kairo/core'

import { createTimeSeriesChartFromCsv } from '~/shared/utils'
import requestsData from '~/data/charts/requests-errors/requests.csv?raw'
import errorsData from '~/data/charts/requests-errors/errors.csv?raw'
import {
  ChartConfigPanel,
  DynamicChartCanvas,
} from '~/client/charts/components'
import { ExpressionEditor } from '~/client/expressions/components'
import type {
  IChartConfiguration,
  IChartSeriesInstance,
  IChartView,
} from '~/shared/domain/chart'
import { Button } from '~/client/ui/button'

function buildInputCharts(
  configuration: IChartConfiguration,
  chartViews: ReadonlyArray<IChartView>,
): ReadonlyMap<string, IChart> {
  const charts = new Map<string, IChart>()

  configuration.series.forEach((series) => {
    if (!series.programIdentifier) return
    if (series.id.startsWith('derived-')) return

    const view = chartViews.find((v) => v.id === series.chartViewId)
    if (!view) return

    charts.set(series.programIdentifier, view.data.chart)
  })

  return charts
}

function formatProgramError(error: IProgramExecutionError): string {
  if (error.phase === 'parse' || error.phase === 'type-check') {
    const first = error.errors[0]
    if (
      first &&
      'userMessage' in first &&
      typeof first.userMessage === 'string'
    ) {
      return first.userMessage
    }

    return error.errors[0]?.message ?? 'Invalid program.'
  }

  if ('error' in error && error.error) {
    const inner = error.error as { userMessage?: string; message?: string }
    return inner.userMessage ?? inner.message ?? 'Program evaluation failed.'
  }

  return 'Program evaluation failed.'
}

export default function ChartWorkspaceLayout() {
  const requestsChart = useMemo(
    () =>
      createTimeSeriesChartFromCsv(requestsData, {
        name: 'Daily Costs 2020-1',
        unit: 'USD',
        source: 'sample',
      }),
    [],
  )

  const errorsChart = useMemo(
    () =>
      createTimeSeriesChartFromCsv(errorsData, {
        name: 'Daily Revenue 2020-1',
        unit: 'USD',
        source: 'sample',
      }),
    [],
  )

  const baseChartViews = useMemo<ReadonlyArray<IChartView>>(
    () => [
      {
        id: 'sample-requests',
        data: requestsChart,
        createdAt: new Date('2020-01-01T00:00:00Z'),
        updatedAt: new Date('2020-01-01T00:00:00Z'),
      },
      {
        id: 'sample-errors',
        data: errorsChart,
        createdAt: new Date('2020-01-01T00:00:00Z'),
        updatedAt: new Date('2020-01-01T00:00:00Z'),
      },
    ],
    [requestsChart, errorsChart],
  )

  const [derivedChartViews, setDerivedChartViews] = useState<
    ReadonlyArray<IChartView>
  >([])

  const chartViews = useMemo<ReadonlyArray<IChartView>>(
    () => [...baseChartViews, ...derivedChartViews],
    [baseChartViews, derivedChartViews],
  )

  const [configuration, setConfiguration] = useState<IChartConfiguration>(
    () => ({
      id: 'sample-requests-vs-errors',
      name: 'Requests vs Errors',
      description:
        'Sample configuration for experimenting with chart settings and programs.',
      series: [
        {
          id: 'requests',
          chartViewId: 'sample-requests',
          programIdentifier: 'Requests',
          label: 'Requests',
          color: '#2563eb',
          type: 'bar',
          axisId: 'left',
          visible: true,
          strokeWidth: undefined,
          lineStyle: 'solid',
          barGroup: 'group-1',
        } as IChartSeriesInstance,
        {
          id: 'errors',
          chartViewId: 'sample-errors',
          programIdentifier: 'Errors',
          label: 'Errors',
          color: '#2063ac',
          type: 'bar',
          axisId: 'left',
          visible: true,
          strokeWidth: undefined,
          lineStyle: 'solid',
          barGroup: 'group-1',
        } as IChartSeriesInstance,
      ],
      xAxis: {
        label: 'Time',
        format: 'HH:mm',
      },
      yAxes: [
        {
          id: 'left',
          label: 'Amount',
          unit: 'USD',
          scale: 'linear',
          min: undefined,
          max: undefined,
        },
      ],
      legend: {
        show: true,
        position: 'bottom',
      },
      grid: {
        showX: true,
        showY: true,
      },
      createdAt: new Date('2020-01-01T00:00:00Z'),
      updatedAt: new Date('2020-01-01T00:00:00Z'),
    }),
  )

  const [programSource, setProgramSource] = useState<string>(
    () => 'SuccessRequests = Requests - Errors;',
  )
  const [programError, setProgramError] = useState<string | null>(null)

  const handleRunProgram = useCallback(() => {
    const charts = buildInputCharts(configuration, baseChartViews)

    const result = runProgram(programSource, {
      charts,
      now: () => new Date(),
    })

    console.log(result)

    if (result.isErr()) {
      setProgramError(formatProgramError(result.error))
      setDerivedChartViews([])

      setConfiguration((prev) => ({
        ...prev,
        series: prev.series.filter(
          (series) => !series.id.startsWith('derived-'),
        ),
      }))

      return
    }

    setProgramError(null)

    const { derivedCharts } = result.value.context
    const now = new Date()

    const newDerivedViews: IChartView[] = Array.from(
      derivedCharts.entries(),
    ).map(([identifier, chart]) => ({
      id: `derived-${identifier}`,
      data: {
        chart,
        metadata: {
          name: identifier,
          source: 'expression',
        },
      },
      createdAt: now,
      updatedAt: now,
    }))

    setDerivedChartViews(newDerivedViews)

    setConfiguration((prev) => {
      const baseSeries = prev.series.filter(
        (series) => !series.id.startsWith('derived-'),
      )

      const derivedSeries: IChartSeriesInstance[] = newDerivedViews.map(
        (view) => ({
          id: view.id,
          chartViewId: view.id,
          programIdentifier: view.data.metadata.name,
          label: view.data.metadata.name,
          color: undefined,
          type: 'line',
          visible: true,
          strokeWidth: 2,
          lineStyle: 'solid',
          barGroup: undefined,
        }),
      )

      return {
        ...prev,
        series: [...baseSeries, ...derivedSeries],
      }
    })
  }, [baseChartViews, configuration, programSource])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <svg
                className="h-5 w-5 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Kairo</h1>
              <p className="text-xs text-muted-foreground">
                Chart Calculation Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            New Chart
          </Button>
          <Button variant="outline" size="sm">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Data
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Expression Editor */}
        <div className="flex w-[460px] flex-shrink-0 flex-col border-r bg-card p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Expression Editor</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Write expressions to create derived charts
            </p>
          </div>

          <ExpressionEditor
            value={programSource}
            onChange={setProgramSource}
            onRun={handleRunProgram}
            error={programError}
          />

          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <div className="mb-2 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Available Identifiers
            </div>
            <div className="flex flex-wrap gap-2">
              <code className="rounded bg-background px-2 py-1 text-xs font-mono">
                Requests
              </code>
              <code className="rounded bg-background px-2 py-1 text-xs font-mono">
                Errors
              </code>
            </div>
            <div className="mt-3 text-[0.7rem] text-muted-foreground">
              <div className="font-medium">Examples:</div>
              <div className="mt-1 space-y-1 font-mono">
                <div>Success = Requests - Errors;</div>
                <div>Smoothed = moving_avg(Requests, 7d);</div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Chart Visualization */}
        <div className="flex min-w-0 flex-1 flex-col overflow-auto">
          <div className="flex-1 p-6">
            <DynamicChartCanvas
              configuration={configuration}
              chartViews={chartViews}
              containerClassName="h-full"
            />
          </div>
        </div>

        {/* Right Panel - Configuration */}
        <aside className="w-[360px] flex-shrink-0 border-l bg-card p-6 overflow-auto">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Chart Configuration</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Customize series, axes, and display options
            </p>
          </div>
          <ChartConfigPanel
            configuration={configuration}
            chartViews={chartViews}
            onChange={setConfiguration}
          />
        </aside>
      </div>
    </div>
  )
}
