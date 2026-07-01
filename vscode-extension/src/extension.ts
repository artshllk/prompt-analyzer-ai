import * as vscode from 'vscode'
import {
  analyze,
  errorMessage,
  DeepclarioApiError,
  type QAPair,
  type Tone,
  type AnalyzeResult,
} from './api'

const TOKEN_KEY = 'deepclario.token'
const MAX_CLARIFY = 1 // keep the in-editor flow tight; one follow-up max
const CONNECT_URL = 'https://deepclario.com/extension/connect'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('deepclario.improvePrompt', () =>
      improvePrompt(context),
    ),
    vscode.commands.registerCommand('deepclario.connectAccount', () =>
      connectAccount(context),
    ),
    vscode.commands.registerCommand('deepclario.disconnectAccount', () =>
      disconnectAccount(context),
    ),
  )
}

export function deactivate() {}

/* ---------- config helpers ---------- */

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('deepclario')
  return {
    tone: cfg.get<Tone>('tone', 'professional'),
    baseUrl: cfg.get<string>('apiBaseUrl', 'https://deepclario.com'),
  }
}

/* ---------- the improve flow ---------- */

async function improvePrompt(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    vscode.window.showInformationMessage('Open a file and select a prompt to improve.')
    return
  }

  const selection = editor.selection
  const selectedText = editor.document.getText(selection).trim()
  if (!selectedText) {
    vscode.window.showInformationMessage('Select the prompt text you want to improve.')
    return
  }
  if (selectedText.length > 4000) {
    vscode.window.showWarningMessage('That selection is too long (max 4000 characters).')
    return
  }

  const { tone, baseUrl } = getConfig()
  const token = (await context.secrets.get(TOKEN_KEY)) || null

  const result = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Deepclario: improving your prompt…' },
    async () => runAnalysis({ baseUrl, prompt: selectedText, tone, token }),
  )

  if (!result) return // errors are surfaced inside runAnalysis

  if (result.type !== 'improved') {
    // Should not happen (runAnalysis resolves clarifications), but guard.
    vscode.window.showInformationMessage('Deepclario could not produce a rewrite. Try again.')
    return
  }

  await presentResult(editor, selection, result.improvedPrompt, result.scoreBeforeImprovement, result.clarityScoreAfter)
}

/**
 * Runs analyze and resolves any clarifying question through an input box,
 * up to MAX_CLARIFY turns. Returns an improved result, or undefined if the
 * user cancelled or an error was shown.
 */
async function runAnalysis(args: {
  baseUrl: string
  prompt: string
  tone: Tone
  token: string | null
}): Promise<AnalyzeResult | undefined> {
  const history: QAPair[] = []

  // Loop: analyze → maybe ask a question → answer → analyze again.
  // The engine forces an improvement once it has enough turns, and we cap
  // at MAX_CLARIFY regardless.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let result: AnalyzeResult
    try {
      result = await analyze({ ...args, priorAnswers: history })
    } catch (err) {
      const code = err instanceof DeepclarioApiError ? err.code : 'server_error'
      const msg = errorMessage(code)
      if (code === 'monthly_limit' || code === 'rate_limited') {
        const pick = await vscode.window.showWarningMessage(msg, 'Upgrade to Pro', 'Dismiss')
        if (pick === 'Upgrade to Pro') {
          vscode.env.openExternal(vscode.Uri.parse('https://deepclario.com/pricing'))
        }
      } else {
        vscode.window.showErrorMessage(`Deepclario: ${msg}`)
      }
      return undefined
    }

    if (result.type === 'improved') return result

    // Clarifying. Stop asking past the cap - send a "no more detail"
    // answer so the engine commits to a rewrite.
    if (history.length >= MAX_CLARIFY) {
      history.push({
        question: result.question,
        answer: 'No additional detail - use reasonable assumptions.',
        turn: history.length + 1,
      })
      continue
    }

    const answer = await vscode.window.showInputBox({
      title: 'Deepclario needs one detail',
      prompt: result.question,
      placeHolder: 'Answer in a sentence or two (Esc to skip)',
      ignoreFocusOut: true,
    })

    // Skipped/cancelled → let the engine improve with assumptions.
    history.push({
      question: result.question,
      answer: answer && answer.trim() ? answer.trim() : 'No additional detail - use reasonable assumptions.',
      turn: history.length + 1,
    })
  }
}

/**
 * Shows the rewrite and lets the user replace the selection, copy it, or
 * dismiss. Uses a modal so the choice is deliberate; the full rewrite is
 * shown in the modal detail.
 */
async function presentResult(
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  improved: string,
  before: number,
  after: number,
) {
  const pick = await vscode.window.showInformationMessage(
    `Prompt improved — clarity ${before} → ${after}.`,
    { modal: true, detail: improved },
    'Replace selection',
    'Copy',
  )

  if (pick === 'Replace selection') {
    await editor.edit(edit => edit.replace(selection, improved))
    vscode.window.showInformationMessage('Deepclario: prompt replaced.')
  } else if (pick === 'Copy') {
    await vscode.env.clipboard.writeText(improved)
    vscode.window.showInformationMessage('Deepclario: rewrite copied to clipboard.')
  }
}

/* ---------- account connect / disconnect ---------- */

async function connectAccount(context: vscode.ExtensionContext) {
  const openPick = await vscode.window.showInformationMessage(
    'Connect your Deepclario account for higher limits and Pro.',
    'Open connect page',
    'I have a code',
  )
  if (openPick === 'Open connect page') {
    await vscode.env.openExternal(vscode.Uri.parse(CONNECT_URL))
  } else if (openPick !== 'I have a code') {
    return
  }

  const code = await vscode.window.showInputBox({
    title: 'Paste your Deepclario connection code',
    prompt: `Get it from ${CONNECT_URL}`,
    placeHolder: 'dc_...',
    ignoreFocusOut: true,
    validateInput: v =>
      v.trim().startsWith('dc_') ? null : 'A Deepclario code starts with "dc_".',
  })
  if (!code) return

  await context.secrets.store(TOKEN_KEY, code.trim())
  vscode.window.showInformationMessage('Deepclario: account connected.')
}

async function disconnectAccount(context: vscode.ExtensionContext) {
  await context.secrets.delete(TOKEN_KEY)
  vscode.window.showInformationMessage('Deepclario: account disconnected.')
}
