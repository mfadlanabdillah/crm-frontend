import { stripHtml } from '@crm/app-kit'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@crm/auth'
import type { CreateReplyRequest } from '@crm/api-client'
import { Alert, Button, Card, SegmentedControl } from '@crm/ui'
import { useReplyToCase } from '../queries/useReplyToCase'
import { draftKey, useDraftsStore } from '../store/drafts'

export function ReplyComposer({ caseId }: { caseId: string }) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const key = draftKey(session?.user.id ?? '', caseId)
  // Dibaca sekali saat mount; komponen di-remount per case lewat `key`.
  const [initialDraft] = useState(() => useDraftsStore.getState().drafts[key])
  const [visibility, setVisibility] = useState<CreateReplyRequest['visibility']>(
    initialDraft?.visibility ?? 'customer',
  )
  const [sent, setSent] = useState(false)
  const mutation = useReplyToCase(caseId)

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialDraft?.body ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      const body = current.getHTML()
      const { setDraft, clearDraft } = useDraftsStore.getState()
      if (stripHtml(body).length === 0) clearDraft(key)
      else setDraft(key, { body, visibility })
    },
    editorProps: {
      attributes: {
        class: 'tiptap rounded-b-lg border-x border-b border-border-subtle bg-surface-raised',
        'aria-label': t('cases.detail.replyPlaceholder'),
      },
    },
  })

  useEffect(() => {
    editor?.setEditable(!mutation.isPending)
  }, [editor, mutation.isPending])

  const submit = () => {
    if (!editor) return
    const body = editor.getHTML()
    if (stripHtml(body).length === 0) return

    setSent(false)
    mutation.mutate(
      { body, visibility },
      {
        onSuccess: () => {
          editor.commands.clearContent()
          useDraftsStore.getState().clearDraft(key)
          setSent(true)
        },
      },
    )
  }

  return (
    <Card as="section" padded={false}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-3 py-2">
        <SegmentedControl
          aria-label={t('cases.detail.visibility')}
          value={visibility}
          options={[
            { value: 'customer', label: t('cases.detail.customerVisibility') },
            { value: 'internal', label: t('cases.detail.internal') },
          ]}
          onChange={(option) => {
            setVisibility(option)
            const draft = useDraftsStore.getState().drafts[key]
            if (draft) useDraftsStore.getState().setDraft(key, { ...draft, visibility: option })
          }}
        />

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Bold"
            aria-pressed={editor?.isActive('bold') ?? false}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Italic"
            aria-pressed={editor?.isActive('italic') ?? false}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Bullet list"
            aria-pressed={editor?.isActive('bulletList') ?? false}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <EditorContent editor={editor} />

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle px-3 py-2">
        {mutation.isError ? (
          <Alert className="text-xs">{mutation.error.message}</Alert>
        ) : (
          <p role="status" className="text-xs text-ink-muted">
            {mutation.isPending
              ? t('cases.detail.sending')
              : sent
                ? t('cases.detail.replySent')
                : visibility === 'internal'
                  ? t('cases.detail.internalNote')
                  : null}
          </p>
        )}
        <Button
          size="sm"
          onClick={submit}
          disabled={mutation.isPending}
          aria-busy={mutation.isPending}
        >
          <Send className="size-4" aria-hidden="true" />
          {t('cases.detail.send')}
        </Button>
      </div>
    </Card>
  )
}
