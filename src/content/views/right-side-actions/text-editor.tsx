import { useAppDispatch, useAppSelector } from '@/store'
import { logout } from '@/store/slices/authSlice'
import { getBoardColumns, getWorkSpaceBoards, getWorkspaceMembers, getWorkspaces } from '@/store/slices/workspaceSlice'
import { clearAttachments, createAttachmentAction } from '@/store/slices/attachment.slice'
import { createTaskAction } from '@/store/slices/task.slice'
import { CheckCircle2, Copy, Check, ExternalLink, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import CustomSelect from './Form/CustomSelect'
import MultiSelect from './Form/MultiSelect'
import UserMenuBar from './Form/UserMenuBar'
import type { UserMenuItem } from './Form/UserMenuBar'

const APP_BASE_URL = 'https://dev.taskgrid.xyz'

interface TextEditorProps {
  captureCanvas: () => File | null
  onClose?: () => void
}

const TextEditor = ({ captureCanvas, onClose }: TextEditorProps) => {
  const dispatch = useAppDispatch()

  const { access_token, user, userInfo } = useAppSelector((state) => state.auth)
  const { workspaces, loading, workSpaceBoards, workSpaceColumns, workspaceMembers } = useAppSelector(
    (state) => state.workspace
  )
  const { attachments } = useAppSelector((state) => state.attachment)

  const allWorkspaces = [...(workspaces.myWorkspaces ?? []), ...(workspaces.guestWorkspaces ?? [])]

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')
  const [selectedBoardId, setSelectedBoardId] = useState<string>('')
  const [selectedColumnId, setSelectedColumnId] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [selectedMembersIds, setSelectedMembersIds] = useState<string[]>([])
  const [memberDropdownOpen, setMemberDropdownOpen] = useState<boolean>(false)
  const [priority, setPriority] = useState<number>(0)
  const [successModal, setSuccessModal] = useState<{ taskUrl: string; taskTitle: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (access_token) {
      dispatch(getWorkspaces())
    }
  }, [access_token])

  const flattenedWorkspaceMembers = useMemo(() => {
    return [
      ...(workspaceMembers?.admins ?? []),
      ...(workspaceMembers?.managers ?? []),
      ...(workspaceMembers?.members ?? []),
      ...(workspaceMembers?.guests ?? []),
      ...(workspaceMembers?.clients ?? []),
    ]
  }, [workspaceMembers])

  const memberOptions = useMemo(
    () =>
      flattenedWorkspaceMembers.map((m) => ({
        value: m.user?._id,
        label: m.user?.name,
        sublabel: m.user?.email,
        avatar: m.user?.avatar,
        avatarThumbnail: m.user?.avatarThumbnail,
      })),
    [flattenedWorkspaceMembers]
  )

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId)
    dispatch(getWorkSpaceBoards(workspaceId))
    dispatch(getWorkspaceMembers(workspaceId))
  }

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId)
    dispatch(getBoardColumns(boardId))
  }

  const handleCreateIssue = async () => {
    if (!selectedBoardId || !selectedColumnId || !title.trim()) return
    setIsSubmitting(true)
    try {
      const file = captureCanvas()

      let attachmentIds: string[] = attachments.map((a) => a._id) ?? []

      if (file) {
        const createdAttachment = await dispatch(
          createAttachmentAction({
            file,
            workspaceId: selectedWorkspaceId,
            boardId: selectedBoardId,
            taskId: null,
          })
        ).unwrap()
        attachmentIds = [...createdAttachment.map((a) => a._id)]
      }

      const task = await dispatch(
        createTaskAction({
          boardId: selectedBoardId,
          columnId: selectedColumnId,
          title: title.trim(),
          description: description.trim(),
          startDate: null,
          dueDate: null,
          members: selectedMembersIds,
          estimate: null,
          priority,
          labels: [],
          complexity: 0,
          dependencies: [],
          checklist: [],
          links: [],
          blockers: [],
          goal: null,
          sprint: null,
          position: 'bottom',
          attachments: attachmentIds,
        })
      ).unwrap()

      if (task) {
        const workspaceSlug = allWorkspaces.find((ws) => ws.id === selectedWorkspaceId)?.url ?? selectedWorkspaceId
        const taskUrl = `${APP_BASE_URL}/${workspaceSlug}/projects/${selectedBoardId}?task=${task.taskId}`
        setSuccessModal({ taskUrl, taskTitle: task.title })
        navigator.clipboard.writeText(taskUrl).catch(() => {})
        setTitle('')
        setDescription('')
        setSelectedColumnId('')
        setSelectedBoardId('')
        setSelectedWorkspaceId('')
        setSelectedMembersIds([])
        setPriority(0)
        clearAttachments()
      }
    } catch (err) {
      console.error('Failed to create issue:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyUrl = () => {
    if (!successModal) return
    navigator.clipboard.writeText(successModal.taskUrl).then(() => {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        handleCloseModal()
      }, 1000)
    })
  }

  const handleCloseModal = () => {
    setSuccessModal(null)
    setCopied(false)
    onClose?.()
  }

  const userMenuItems: UserMenuItem[] = []

  return (
    <>
      <div style={textEditorStyle}>
        <div style={{ flexShrink: 0, flex: 1 }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Create Issue</h3>
            <UserMenuBar
              userName={user?.name}
              userEmail={user?.email}
              avatar={userInfo?.avatar}
              avatarThumbnail={userInfo?.avatarThumbnail || user?.avatar}
              menuItems={userMenuItems}
              onSignOut={() => dispatch(logout())}
            />
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', marginBottom: '10px' }}
          >
            {/* Workspace + Board row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Workspace</label>
                <CustomSelect
                  value={selectedWorkspaceId}
                  onValueChange={handleWorkspaceChange}
                  disabled={loading || allWorkspaces.length === 0}
                  placeholder={loading ? 'Loading...' : 'Select workspace'}
                  groups={[
                    {
                      label: 'My Workspaces',
                      options: workspaces.myWorkspaces.map((ws) => ({ value: ws.id, label: ws.name })),
                    },
                    {
                      label: 'Guest Workspaces',
                      options: workspaces.guestWorkspaces.map((ws) => ({ value: ws.id, label: ws.name })),
                    },
                  ]}
                />
              </div>

              <div>
                <label style={labelStyle}>Board</label>
                <CustomSelect
                  value={selectedBoardId}
                  onValueChange={handleBoardChange}
                  disabled={loading || !workSpaceBoards?.boards?.length}
                  placeholder={loading ? 'Loading...' : 'Select board'}
                  options={(workSpaceBoards?.boards ?? []).map((b) => ({ value: b._id, label: b.title }))}
                  emptyMessage="No boards found"
                />
              </div>
            </div>

            {/* Column */}
            <div>
              <label style={labelStyle}>Select Status</label>
              <CustomSelect
                value={selectedColumnId}
                onValueChange={setSelectedColumnId}
                disabled={loading || !workSpaceColumns?.length}
                placeholder={loading ? 'Loading...' : 'Select status'}
                options={(workSpaceColumns ?? []).map((c) => ({ value: c._id, label: c.title }))}
                emptyMessage="No columns found"
              />
            </div>

            {/* Priority */}
            <div>
              <label style={labelStyle}>Priority</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {PRIORITY_OPTIONS.map((opt) => {
                  const isActive = priority === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: `1.5px solid ${isActive ? opt.color : '#e2e8f0'}`,
                        background: isActive ? opt.bg : 'white',
                        color: isActive ? opt.color : '#64748b',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: opt.color,
                          flexShrink: 0,
                        }}
                      />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Members */}
            <div>
              <label style={labelStyle}>Members</label>
              <MultiSelect
                value={selectedMembersIds}
                onChange={setSelectedMembersIds}
                options={memberOptions}
                disabled={loading || memberOptions.length === 0}
                placeholder={loading ? 'Loading...' : 'Select members'}
                open={memberDropdownOpen}
                onOpenChange={setMemberDropdownOpen}
              />
            </div>
          </div>

          {/* Issue form */}
          <div>
            <textarea
              placeholder="Issue Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ ...commonTextAreaStyle, ...textAreaStyle }}
            />
            <textarea
              placeholder="Write a description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...commonTextAreaStyle }}
            />
          </div>
        </div>

        {/* Bottom actions */}
        <div>
          <button
            style={buttonStyle}
            disabled={!access_token || !selectedBoardId || !selectedColumnId || !title.trim() || isSubmitting}
            onClick={handleCreateIssue}
          >
            {isSubmitting ? 'Creating...' : 'Create Issue'}
          </button>
        </div>
      </div>

      {/* Success modal */}
      {successModal && (
        <div style={successOverlayStyle}>
          <div style={successModalStyle}>
            <button style={closeButtonStyle} onClick={handleCloseModal} aria-label="Close">
              <X size={16} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#22c55e' }}>
                <CheckCircle2 size={40} strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Issue Created!</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>{successModal.taskTitle}</p>
              </div>
              <div style={urlBoxStyle}>
                <span style={{ fontSize: '11px', color: '#475569', wordBreak: 'break-all', lineHeight: 1.4 }}>
                  {successModal.taskUrl}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button style={copyButtonStyle} onClick={handleCopyUrl}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
                <a
                  href={successModal.taskUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={openButtonStyle}
                  onClick={handleCloseModal}
                >
                  <ExternalLink size={13} />
                  Open
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TextEditor

const PRIORITY_OPTIONS = [
  { value: 0, label: 'No priority', color: '#94a3b8', bg: '#f1f5f9' },
  { value: 1, label: 'Urgent', color: '#ef4444', bg: '#fef2f2' },
  { value: 2, label: 'High', color: '#f97316', bg: '#fff7ed' },
  { value: 3, label: 'Medium', color: '#f59e0b', bg: '#fffbeb' },
  { value: 4, label: 'Low', color: '#3b82f6', bg: '#eff6ff' },
] as const

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 500,
  color: '#64748b',
  marginBottom: '4px',
} as const

const commonTextAreaStyle = {
  resize: 'none',
  width: '100%',
  border: 'none',
  outline: 'none',
  padding: '4px',
  fontWeight: 600,
  color: '#0f172a',
} as const

const textAreaStyle = {
  fieldSizing: 'content',
  minHeight: '1lh',
  resize: 'none',
  width: '100%',
} as const

const textEditorStyle = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  justifyContent: 'space-between',
  height: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
} as const

const buttonStyle = {
  width: '100%',
  border: 'none',
  outline: 'none',
  padding: '8px',
  fontWeight: 600,
  backgroundColor: 'black',
  borderRadius: '6px',
  color: 'white',
  cursor: 'pointer',
  opacity: 1,
} as const

const successOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.80)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 222222222222222222,
  borderRadius: '12px',
} as const

const successModalStyle = {
  position: 'relative',
  background: '#ffffff',
  borderRadius: '14px',
  padding: '24px 20px 20px',
  width: '260px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
} as const

const closeButtonStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#94a3b8',
  padding: '2px',
  display: 'flex',
  alignItems: 'center',
} as const

const urlBoxStyle = {
  width: '100%',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '8px 10px',
  boxSizing: 'border-box' as const,
}

const copyButtonStyle = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  padding: '7px 0',
  borderRadius: '8px',
  border: '1.5px solid #e2e8f0',
  background: '#f8fafc',
  color: '#334155',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
} as const

const openButtonStyle = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  padding: '7px 0',
  borderRadius: '8px',
  border: 'none',
  background: '#0f172a',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
} as const
