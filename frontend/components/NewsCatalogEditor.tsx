"use client";

import { ApiError } from "@/lib/api";
import {
  createAdminNewsItem,
  deleteAdminNewsItem,
  fetchAdminNewsCatalog,
  type NewsCatalog,
  reorderAdminNewsCatalog,
  type NewsItem,
  type NewsItemInput,
  updateAdminNewsItem,
} from "@/lib/news";
import { ChevronDown, ChevronUp, Loader2, LogOut, Plus, RefreshCcw, Save, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type EditableNewsItem = NewsItem & {
  clientKey: string;
};

type EditableCatalog = {
  items: EditableNewsItem[];
};

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

type Toast = {
  kind: "success" | "error";
  message: string;
};

type NewsCatalogEditorProps = {
  token: string;
  onSignOut: () => void;
};

function isAuthExpired(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function createClientKey(id: number, index: number) {
  return `news-${id}-${index}`;
}

function createNewItem(sortOrder: number): EditableNewsItem {
  return {
    id: 0,
    clientKey: `new-${Date.now()}-${sortOrder}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
    date: "",
    title: "",
    sortOrder,
    createdAt: "",
    updatedAt: "",
  };
}

function toItemInput(item: EditableNewsItem): NewsItemInput {
  return {
    date: item.date,
    title: item.title,
    sortOrder: item.sortOrder,
  };
}

function toEditableCatalog(catalog: NewsCatalog): EditableCatalog {
  const items = [...catalog.items].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id - right.id;
  });

  return {
    items: items.map((item, index) => ({
      ...item,
      clientKey: createClientKey(item.id, index),
    })),
  };
}

function normalizeCatalogItems(items: EditableNewsItem[]) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}

function getFriendlyErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "入力内容を確認してください。日付とタイトルは空欄にできません。";
    }

    if (error.status === 404) {
      return "対象のお知らせが見つかりませんでした。画面を再読み込みしてからやり直してください。";
    }

    if (error.status === 422) {
      return "入力内容を確認してください。日付とタイトルを入力してから保存してください。";
    }

    if (error.status >= 500) {
      return "サーバー側で問題が発生しました。少し時間をおいて再度お試しください。";
    }
  }

  if (error instanceof TypeError) {
    return "通信できませんでした。ネットワーク接続を確認してから再度お試しください。";
  }

  return fallback;
}

function getItemLabel(item: EditableNewsItem, index: number) {
  return item.title.trim() || `お知らせ ${String(index + 1).padStart(2, "0")}`;
}

function getDateLabel(date: string) {
  return date.trim() ? date.trim().replaceAll("-", "/") : "日付未設定";
}

function isNewsItemValid(item: EditableNewsItem) {
  return item.date.trim() !== "" && item.title.trim() !== "";
}

function NewsListRow({
  item,
  index,
  onOpen,
  onMove,
  isMoving,
}: {
  item: EditableNewsItem;
  index: number;
  onOpen: (item: EditableNewsItem) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  isMoving: boolean;
}) {
  return (
    <article className="admin-grape-row">
      <div className="admin-grape-row__controls">
        <button
          type="button"
          className="admin-grape-row__control"
          onClick={() => onMove(index, -1)}
          disabled={index === 0 || isMoving}
          aria-label="上へ移動"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="admin-grape-row__control"
          onClick={() => onMove(index, 1)}
          disabled={isMoving}
          aria-label="下へ移動"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    <button type="button" className="admin-grape-row__main" onClick={() => onOpen(item)}>
      <span className="admin-grape-row__order">{String(index + 1).padStart(2, "0")}</span>
      <span className="admin-grape-row__body">
        <span className="admin-grape-row__title">{getItemLabel(item, index)}</span>
        <span className="admin-grape-row__meta">
          <span>{getDateLabel(item.date)}</span>
        </span>
      </span>
    </button>
      <div className="admin-grape-row__actions">
        <button
          type="button"
          className="admin-grape-row__edit"
          onClick={() => onOpen(item)}
          aria-label={`${getItemLabel(item, index)} を編集`}
        >
          編集
        </button>
      </div>
    </article>
  );
}

function NewsItemModal({
  item,
  index,
  onClose,
  onChange,
  onDelete,
  onSave,
  isSaving,
  modalError,
}: {
  item: EditableNewsItem;
  index: number;
  onClose: () => void;
  onChange: (item: EditableNewsItem) => void;
  onDelete: () => void;
  onSave: () => void;
  isSaving: boolean;
  modalError: string | null;
}) {
  return (
    <div className="admin-grape-modal" role="presentation" onClick={onClose}>
      <div
        className="admin-grape-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-item-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-grape-modal__head">
          <div className="grid gap-1">
            <div className="admin-grape-modal__chips">
              <span className="admin-grape-modal__chip">Item {String(index + 1).padStart(2, "0")}</span>
              <span className="admin-grape-modal__chip admin-grape-modal__chip--soft">{getDateLabel(item.date)}</span>
            </div>
            <h3 className="section__title" id="news-item-title">
              {getItemLabel(item, index)}
            </h3>
          </div>
          <button type="button" className="admin-grape-modal__close" onClick={onClose} aria-label="閉じる">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="admin-grape-modal__body">
          {modalError ? <div className="admin-grape-modal__error">{modalError}</div> : null}
          <div className="admin-grape-modal__form">
            <label className="admin-field">
              <span>日付</span>
              <input
                type="date"
                value={item.date}
                onChange={(event) => onChange({ ...item, date: event.target.value })}
                className="admin-input"
              />
            </label>

            <label className="admin-field">
              <span>内容</span>
              <input
                type="text"
                value={item.title}
                onChange={(event) => onChange({ ...item, title: event.target.value })}
                className="admin-input"
                placeholder="例: サイトをリニューアルオープンいたしました。"
              />
            </label>
          </div>
        </div>

        <div className="admin-grape-modal__footer">
          <button type="button" className="button-link button-link--secondary" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            削除
          </button>
          <button
            type="button"
            className="button-link button-link--primary"
            onClick={onSave}
            disabled={isSaving || !isNewsItemValid(item)}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewsCatalogEditor({ token, onSignOut }: NewsCatalogEditorProps) {
  const [catalog, setCatalog] = useState<EditableCatalog | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [feedback, setFeedback] = useState("");
  const [orderingClientKey, setOrderingClientKey] = useState<string | null>(null);
  const [savingClientKey, setSavingClientKey] = useState<string | null>(null);
  const [editingClientKey, setEditingClientKey] = useState<string | null>(null);
  const [draftItem, setDraftItem] = useState<EditableNewsItem | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const pushToast = (kind: Toast["kind"], message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ kind, message });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2500);
  };

  const closeEditor = () => {
    setEditingClientKey(null);
    setDraftItem(null);
    setModalError(null);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setStatus({ kind: "loading" });
      try {
        const loaded = await fetchAdminNewsCatalog(token);
        if (cancelled) {
          return;
        }

        setCatalog(toEditableCatalog(loaded));
        setStatus({ kind: "ready" });
      } catch (error) {
        if (isAuthExpired(error)) {
          onSignOut();
          return;
        }

        if (!cancelled) {
          setStatus({
            kind: "error",
            message: error instanceof Error ? error.message : "お知らせを読み込めませんでした。",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [onSignOut, token]);

  const openEditor = (item: EditableNewsItem) => {
    setFeedback("");
    setModalError(null);
    setEditingClientKey(item.clientKey);
    setDraftItem({ ...item });
  };

  const addItem = () => {
    setFeedback("");
    setModalError(null);
    if (!catalog) {
      return;
    }

    const nextSortOrder = catalog.items.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
    const nextItem = createNewItem(nextSortOrder);
    setCatalog({
      items: [...catalog.items, nextItem],
    });
    openEditor(nextItem);
  };

  const saveCurrentItem = async () => {
    const currentItem =
      catalog?.items.find((item) => item.clientKey === editingClientKey) ??
      draftItem ??
      null;

    if (!currentItem || !catalog) {
      return;
    }

    setSavingClientKey(currentItem.clientKey);
    setFeedback("");
    setModalError(null);

    try {
      let savedItem: NewsItem;
      if (currentItem.id === 0) {
        const response = await createAdminNewsItem(token, toItemInput(currentItem));
        savedItem = response.item;
      } else {
        const response = await updateAdminNewsItem(token, currentItem.id, toItemInput(currentItem));
        savedItem = response.item;
      }

      const nextItems = catalog.items.map((entry) =>
        entry.clientKey === currentItem.clientKey ? { ...savedItem, clientKey: entry.clientKey } : entry,
      );
      setCatalog({ items: normalizeCatalogItems(nextItems) });
      setStatus({ kind: "ready" });
      const successMessage = `${currentItem.title || "お知らせ"}を保存しました。`;
      setFeedback(successMessage);
      pushToast("success", successMessage);
      closeEditor();
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      const message = getFriendlyErrorMessage(error, "お知らせを保存できませんでした。");
      setStatus({
        kind: "error",
        message,
      });
      setModalError(message);
      pushToast("error", message);
    } finally {
      setSavingClientKey(null);
    }
  };

  const removeItem = async () => {
    const currentItem =
      catalog?.items.find((item) => item.clientKey === editingClientKey) ??
      draftItem ??
      null;

    if (!currentItem) {
      return;
    }

    setFeedback("");
    setModalError(null);

    try {
      if (currentItem.id !== 0) {
        await deleteAdminNewsItem(token, currentItem.id);
      }

      setCatalog((current) =>
        current
          ? {
              items: current.items.filter((entry) => entry.clientKey !== currentItem.clientKey),
            }
          : current,
      );
      const successMessage = `${currentItem.title || "お知らせ"}を削除しました。`;
      setStatus({ kind: "ready" });
      setFeedback(successMessage);
      pushToast("success", successMessage);
      closeEditor();
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      const message = getFriendlyErrorMessage(error, "お知らせを削除できませんでした。");
      setStatus({
        kind: "error",
        message,
      });
      setModalError(message);
      pushToast("error", message);
    }
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const current = catalog;
    if (!current) {
      return;
    }

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.items.length) {
      return;
    }

    const nextItems = [...current.items];
    const sourceItem = nextItems[index];
    const targetItem = nextItems[targetIndex];
    if (!sourceItem || !targetItem) {
      return;
    }

    nextItems[index] = targetItem;
    nextItems[targetIndex] = sourceItem;
    setFeedback("");
    const normalized = normalizeCatalogItems(nextItems);
    setCatalog({ items: normalized });
    setOrderingClientKey(sourceItem.clientKey);

    try {
      const saved = await reorderAdminNewsCatalog(token, {
        items: normalized
          .filter((item) => item.id !== 0)
          .map((item) => ({
            id: item.id,
            sortOrder: item.sortOrder,
          })),
      });

      setCatalog((currentCatalog) =>
        currentCatalog
          ? {
              items: normalizeCatalogItems(
                currentCatalog.items.map((item) => {
                  const savedItem = saved.items.find((entry) => entry.id === item.id);
                  return savedItem ? { ...savedItem, clientKey: item.clientKey } : item;
                }),
              ),
            }
          : currentCatalog,
      );
      setStatus({ kind: "ready" });
      pushToast("success", "表示順を保存しました。");
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      setCatalog(current);
      const message = getFriendlyErrorMessage(error, "表示順を保存できませんでした。");
      setStatus({
        kind: "error",
        message,
      });
      pushToast("error", message);
    } finally {
      setOrderingClientKey(null);
    }
  };

  const handleRetry = () => {
    setFeedback("");
    setStatus({ kind: "loading" });
    setCatalog(null);
    closeEditor();
    void (async () => {
      try {
        const loaded = await fetchAdminNewsCatalog(token);
        setCatalog(toEditableCatalog(loaded));
        setStatus({ kind: "ready" });
      } catch (error) {
        if (isAuthExpired(error)) {
          onSignOut();
          return;
        }

        setStatus({
          kind: "error",
          message: error instanceof Error ? error.message : "お知らせを読み込めませんでした。",
        });
      }
    })();
  };

  const currentEditingItem =
    editingClientKey && catalog ? catalog.items.find((item) => item.clientKey === editingClientKey) ?? null : null;

  return (
    <section className="section admin-page">
      <div className="admin-dashboard">
        <div className="admin-dashboard__head">
          <div className="grid gap-1">
            <p className="eyebrow">Admin</p>
            <h1 className="section__title">お知らせの編集</h1>
            {catalog ? (
              <p className="section__lead admin-dashboard__summary">
                <span>{catalog.items.length}件</span>
              </p>
            ) : null}
          </div>
          <div className="admin-editor-actions">
            <button type="button" className="button-link button-link--primary" onClick={addItem} disabled={!catalog}>
              <Plus className="h-4 w-4" />
              お知らせを追加
            </button>
          </div>
        </div>

        {status.kind === "loading" ? (
          <div className="admin-login-state">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-strong)]" />
            <p className="m-0">読み込み中...</p>
          </div>
        ) : null}

        {status.kind === "error" ? (
          <div className="admin-error-panel">
            <p className="admin-error">{status.message}</p>
            <div className="admin-error-panel__actions">
              <button type="button" className="button-link button-link--primary" onClick={handleRetry}>
                <RefreshCcw className="h-4 w-4" />
                再試行
              </button>
              <button type="button" className="button-link button-link--secondary" onClick={onSignOut}>
                <LogOut className="h-4 w-4" />
                ログアウト
              </button>
            </div>
          </div>
        ) : null}

        {catalog && status.kind !== "error" ? (
          <>
            <div className="admin-editor-section">
              <div className="section__head">
                <p className="eyebrow">Catalog</p>
                <h2 className="section__title">公開中のお知らせ</h2>
              </div>

              <div className="admin-grape-list">
                {catalog.items.length > 0 ? (
                  catalog.items.map((item, index) => (
                    <NewsListRow
                      key={item.clientKey}
                      item={item}
                      index={index}
                      onOpen={openEditor}
                      onMove={moveItem}
                      isMoving={orderingClientKey === item.clientKey}
                    />
                  ))
                ) : (
                  <div className="card card__body">
                    <p className="m-0">まだお知らせはありません。上の「お知らせを追加」から作成できます。</p>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-editor-actions">{feedback ? <p className="admin-feedback">{feedback}</p> : null}</div>
          </>
        ) : null}

        {currentEditingItem && draftItem ? (
          <NewsItemModal
            item={draftItem}
            index={catalog?.items.findIndex((item) => item.clientKey === editingClientKey) ?? 0}
            onClose={closeEditor}
            onChange={(nextItem) => {
              setDraftItem(nextItem);
              setCatalog((current) => {
                if (!current) {
                  return current;
                }

                return {
                  items: current.items.map((entry) => (entry.clientKey === nextItem.clientKey ? nextItem : entry)),
                };
              });
            }}
            onDelete={removeItem}
            onSave={() => void saveCurrentItem()}
            isSaving={savingClientKey === currentEditingItem.clientKey}
            modalError={modalError}
          />
        ) : null}

        {toast ? <div className={`admin-toast admin-toast--${toast.kind}`}>{toast.message}</div> : null}
      </div>
    </section>
  );
}
