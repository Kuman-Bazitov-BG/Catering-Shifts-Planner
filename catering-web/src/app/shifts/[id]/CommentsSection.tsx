"use client";

import { useState, useTransition } from "react";
import {
  postComment,
  editComment,
  removeComment,
  type CommentActionResult,
} from "@/lib/comment-actions";
import { Send, Pencil, Trash2, X, Check, AlertCircle } from "lucide-react";

type Comment = {
  id: number;
  userId: number;
  authorName: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
};

function formatCommentDate(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CommentsSection({
  shiftId,
  comments,
  currentUserId,
  isManager,
}: {
  shiftId: number;
  comments: Comment[];
  currentUserId: number;
  isManager: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  function run(action: () => Promise<CommentActionResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if ("error" in res) {
        setError(res.error);
      } else {
        onSuccess?.();
      }
    });
  }

  function handlePost() {
    const body = draft.trim();
    if (!body) return;
    run(() => postComment(shiftId, body), () => setDraft(""));
  }

  function startEdit(comment: Comment) {
    setError(null);
    setEditingId(comment.id);
    setEditDraft(comment.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  function handleSaveEdit(commentId: number) {
    const body = editDraft.trim();
    if (!body) return;
    run(() => editComment(shiftId, commentId, body), () => {
      setEditingId(null);
      setEditDraft("");
    });
  }

  function handleDelete(commentId: number) {
    run(() => removeComment(shiftId, commentId));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment…"
          rows={2}
          className="w-full resize-none rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-amber-500 dark:border-white/10 dark:text-zinc-50"
        />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={pending || !draft.trim()}
            onClick={handlePost}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 px-4 text-sm font-medium text-white shadow-sm shadow-amber-600/30 transition-all hover:from-amber-600 hover:to-orange-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden />
            Post
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {comments.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => {
            const canManage = comment.userId === currentUserId || isManager;
            const isEditing = editingId === comment.id;
            return (
              <li
                key={comment.id}
                className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatCommentDate(comment.createdAt)}
                    {comment.editedAt ? " (edited)" : ""}
                  </span>
                </div>

                {isEditing ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-500 dark:border-white/10 dark:text-zinc-50"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-black/15 px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-white/10"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={pending || !editDraft.trim()}
                        onClick={() => handleSaveEdit(comment.id)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 px-3 text-xs font-medium text-white shadow-sm shadow-amber-600/30 transition-all hover:from-amber-600 hover:to-orange-700 disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {comment.body}
                    </p>
                    {canManage && (
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => startEdit(comment)}
                          className="inline-flex h-7 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleDelete(comment.id)}
                          className="inline-flex h-7 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-black/15 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          No comments yet.
        </p>
      )}
    </div>
  );
}
