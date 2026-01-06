'use client'

import { useRef, useEffect } from 'react'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
} from '@codemirror/view'
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import {
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'

import { cn } from '~/client/lib/utils'
import { Button } from '~/client/ui/button'
import { Label } from '~/client/ui/label'

export interface IExpressionEditorProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onRun?: () => void
  readonly error?: string | null
  readonly className?: string
}

export function ExpressionEditor({
  value,
  onChange,
  onRun,
  error,
  className,
}: IExpressionEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)

  const onChangeRef = useRef(onChange)
  const onRunRef = useRef(onRun)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onRunRef.current = onRun
  }, [onRun])

  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      history(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle),
      javascript(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const doc = update.state.doc.toString()
          if (doc !== value) {
            onChangeRef.current?.(doc)
          }
        }
      }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
        {
          key: 'Mod-Enter',
          run: () => {
            if (onRunRef.current) {
              onRunRef.current()
              return true
            }

            return false
          },
        },
      ]),
    ]

    const state = EditorState.create({
      doc: value,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const current = view.state.doc.toString()
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Program Expression
        </Label>

        <Button size="sm" type="button" onClick={onRun} className="h-8">
          <svg
            className="mr-2 h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Run
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[0.65rem] font-mono text-muted-foreground">
            ⌘↵
          </kbd>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 shadow-sm">
        <div
          ref={containerRef}
          className="min-h-[180px] max-h-[280px] overflow-auto px-3 py-2.5 font-mono text-[0.85rem]"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-[0.75rem] leading-relaxed text-destructive">
            {error}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpressionEditor
