"use client";

import { ApiError } from "@/lib/api";
import {
  createAdminGrapeItem,
  deleteAdminGrapeItem,
  fetchAdminGrapeCatalog,
  type GrapeCatalog,
  type GrapeItem,
  type GrapeItemInput,
  updateAdminGrapeItem,
} from "@/lib/grapes";
import { ChevronDown, ChevronUp, Loader2, LogOut, Pencil, Plus, RefreshCcw, Save, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type EditableGrapeItem = GrapeItem & {
  clientKey: string;
};

type EditableCatalog = {
  items: EditableGrapeItem[];
};

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

type Toast = {
  kind: "success" | "error";
  message: string;
};

type GrapeCatalogEditorProps = {
  token: string;
  onSignOut: () => void;
};

function createClientKey(id: number, index: number) {
  return `item-${id}-${index}`;
}

function createNewItem(sortOrder: number): EditableGrapeItem {
  return {
    id: 0,
    clientKey: `new-${Date.now()}-${sortOrder}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
    name: "",
    description: "",
    isOnSale: false,
    imagePath: "",
    imageFocus: "center 50%",
    imageScale: 100,
    sortOrder,
    createdAt: "",
    updatedAt: "",
  };
}

function toItemInput(item: EditableGrapeItem): GrapeItemInput {
  return {
    name: item.name,
    description: item.description,
    isOnSale: item.isOnSale,
    imagePath: item.imagePath,
    imageFocus: item.imageFocus,
    imageScale: item.imageScale,
    sortOrder: item.sortOrder,
  };
}

function toEditableCatalog(catalog: GrapeCatalog): EditableCatalog {
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

function normalizeCatalogItems(items: EditableGrapeItem[]) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}

function isAuthExpired(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function getItemLabel(item: EditableGrapeItem, index: number) {
  return item.name.trim() || `項目 ${index + 1}`;
}

function getSaleLabel(item: EditableGrapeItem) {
  return item.isOnSale ? "販売中" : "販売終了";
}

function getFriendlyErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "入力内容を確認してください。名前、画像パス、説明は空欄にできません。";
    }

    if (error.status === 404) {
      return "対象の品種が見つかりませんでした。画面を再読み込みしてからもう一度お試しください。";
    }

    if (error.status === 409) {
      return "保存内容が競合しました。画面を再読み込みしてから再度お試しください。";
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

function GrapeListRow({
  item,
  index,
  onOpen,
  onMove,
  onToggleSale,
  isMoving,
  isSaving,
}: {
  item: EditableGrapeItem;
  index: number;
  onOpen: (item: EditableGrapeItem) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggleSale: (item: EditableGrapeItem, nextSale: boolean) => void;
  isMoving: boolean;
  isSaving: boolean;
}) {
  const upDisabled = index === 0 || isMoving || item.id === 0;
  const downDisabled = isMoving || item.id === 0;

  return (
    <article className="admin-grape-row">
      <div className="admin-grape-row__controls">
        <button
          type="button"
          className="admin-grape-row__control"
          onClick={() => onMove(index, -1)}
          disabled={upDisabled}
          aria-label="上へ移動"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="admin-grape-row__control"
          onClick={() => onMove(index, 1)}
          disabled={downDisabled}
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
            <span>クリックして内容を編集します</span>
          </span>
        </span>
      </button>
      <div className="admin-grape-row__actions">
        <label className="admin-grape-row__publish">
          <input
            type="checkbox"
            checked={item.isOnSale}
            onChange={(event) => onToggleSale(item, event.target.checked)}
            disabled={isSaving || item.id === 0}
          />
          <span className={`admin-grape-row__status admin-grape-row__status--${item.isOnSale ? "on" : "off"}`}>
            {getSaleLabel(item)}
          </span>
        </label>
        <button
          type="button"
          className="admin-grape-row__edit"
          onClick={() => onOpen(item)}
          aria-label={`${getItemLabel(item, index)} を編集`}
        >
          <Pencil className="h-4 w-4" />
          編集
        </button>
      </div>
    </article>
  );
}

function GrapeItemModal({
  item,
  index,
  onClose,
  onChange,
  onDelete,
  onSave,
  isSaving,
  errorMessage,
}: {
  item: EditableGrapeItem;
  index: number;
  onClose: () => void;
  onChange: (item: EditableGrapeItem) => void;
  onDelete: () => void;
  onSave: () => void;
  isSaving: boolean;
  errorMessage: string | null;
}) {
  return (
    <div className="admin-grape-modal" role="presentation" onClick={onClose}>
      <div
        className="admin-grape-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="grape-item-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-grape-modal__head">
          <div className="grid gap-1">
            <div className="admin-grape-modal__chips">
              <span className="admin-grape-modal__chip">Item {String(index + 1).padStart(2, "0")}</span>
              <span className="admin-grape-modal__chip admin-grape-modal__chip--soft">{getSaleLabel(item)}</span>
            </div>
            <h3 className="section__title" id="grape-item-title">
              {getItemLabel(item, index)}
            </h3>
          </div>
          <button type="button" className="admin-grape-modal__close" onClick={onClose} aria-label="閉じる">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="admin-grape-modal__body">
          {errorMessage ? <div className="admin-grape-modal__error">{errorMessage}</div> : null}
          <div className="admin-grape-modal__form">
            <label className="admin-field admin-field--checkbox">
              <span>販売中</span>
              <input
                type="checkbox"
                checked={item.isOnSale}
                onChange={(event) => onChange({ ...item, isOnSale: event.target.checked })}
              />
            </label>

            <label className="admin-field">
              <span>名前</span>
              <input
                type="text"
                value={item.name}
                onChange={(event) => onChange({ ...item, name: event.target.value })}
                className="admin-input"
                placeholder="例: 竜宝"
              />
            </label>

            <label className="admin-field">
              <span>画像パス</span>
              <input
                type="text"
                value={item.imagePath}
                onChange={(event) => onChange({ ...item, imagePath: event.target.value })}
                className="admin-input"
                placeholder="/img/ryuhou.jpeg"
              />
            </label>

            <label className="admin-field admin-field--full">
              <span>販売種の説明</span>
              <textarea
                value={item.description}
                onChange={(event) => onChange({ ...item, description: event.target.value })}
                className="admin-textarea"
                rows={5}
              />
            </label>
          </div>
        </div>

        <div className="admin-grape-modal__footer">
          <button type="button" className="button-link button-link--secondary" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            削除
          </button>
          <button type="button" className="button-link button-link--primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GrapeCatalogEditor({ token, onSignOut }: GrapeCatalogEditorProps) {
  const [catalog, setCatalog] = useState<EditableCatalog | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [feedback, setFeedback] = useState("");
  const [savingClientKey, setSavingClientKey] = useState<string | null>(null);
  const [orderingClientKey, setOrderingClientKey] = useState<string | null>(null);
  const [editingClientKey, setEditingClientKey] = useState<string | null>(null);
  const [draftItem, setDraftItem] = useState<EditableGrapeItem | null>(null);
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
        const loaded = await fetchAdminGrapeCatalog(token);
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
            message: error instanceof Error ? error.message : "ぶどう情報を読み込めませんでした。",
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

  const openEditor = (item: EditableGrapeItem) => {
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

  const toggleSale = async (item: EditableGrapeItem, nextSale: boolean) => {
    const nextItem = { ...item, isOnSale: nextSale };
    setModalError(null);
    setSavingClientKey(item.clientKey);
    setFeedback("");

    setCatalog((current) => {
      if (!current) {
        return current;
      }

      return {
        items: current.items.map((entry) => (entry.clientKey === item.clientKey ? nextItem : entry)),
      };
    });

    try {
      await updateAdminGrapeItem(token, item.id, toItemInput(nextItem));
      setStatus({ kind: "ready" });
      setFeedback(`${item.name || "品種"}の販売状況を保存しました。`);
      pushToast("success", `${item.name || "品種"}の販売状況を保存しました。`);
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      const message = getFriendlyErrorMessage(error, "販売状況を保存できませんでした。");
      setStatus({
        kind: "error",
        message,
      });
      pushToast("error", message);
      setCatalog((current) => {
        if (!current) {
          return current;
        }

        return {
          items: current.items.map((entry) => (entry.clientKey === item.clientKey ? item : entry)),
        };
      });
    } finally {
      setSavingClientKey(null);
    }
  };

  const saveItem = async (itemOverride?: EditableGrapeItem) => {
    const currentItem = itemOverride ?? draftItem ?? undefined;
    if (!currentItem) {
      return;
    }

    setSavingClientKey(currentItem.clientKey);
    setFeedback("");
    setModalError(null);

    try {
      const saved =
        currentItem.id === 0
          ? await createAdminGrapeItem(token, toItemInput(currentItem))
          : await updateAdminGrapeItem(token, currentItem.id, toItemInput(currentItem));

      setCatalog((current) => {
        if (!current) {
          return current;
        }

        return {
          items: current.items.map((entry) => (entry.clientKey === currentItem.clientKey ? { ...saved, clientKey: entry.clientKey } : entry)),
        };
      });
      setStatus({ kind: "ready" });
      setFeedback(`${saved.name || "品種"}を保存しました。`);
      pushToast("success", `${saved.name || "品種"}を保存しました。`);
      closeEditor();
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      const message = getFriendlyErrorMessage(error, "ぶどう情報を保存できませんでした。");
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

  const removeItem = async (clientKey?: string) => {
    const currentItem =
      catalog?.items.find((item) => item.clientKey === (clientKey ?? editingClientKey)) ??
      draftItem ??
      null;

    if (!currentItem) {
      return;
    }

    setFeedback("");
    setModalError(null);

    try {
      if (currentItem.id !== 0) {
        await deleteAdminGrapeItem(token, currentItem.id);
      }

      setCatalog((current) => {
        if (!current) {
          return current;
        }

        const nextItems = normalizeCatalogItems(
          current.items.filter((entry) => entry.clientKey !== currentItem.clientKey),
        );

        return {
          items: nextItems,
        };
      });

      const nextItems = normalizeCatalogItems(
        (catalog?.items ?? []).filter((entry) => entry.clientKey !== currentItem.clientKey),
      );
      await Promise.all(
        nextItems
          .filter((item) => item.id !== 0)
          .map((item) => updateAdminGrapeItem(token, item.id, toItemInput(item))),
      );
      setStatus({ kind: "ready" });
      setFeedback(`${currentItem.name || "品種"}を削除しました。`);
      pushToast("success", `${currentItem.name || "品種"}を削除しました。`);
      closeEditor();
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      const message = getFriendlyErrorMessage(error, "ぶどう情報を削除できませんでした。");
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

    const sourceItem = current.items[index];
    const targetItem = current.items[targetIndex];
    if (!sourceItem || !targetItem || sourceItem.id === 0 || targetItem.id === 0) {
      return;
    }

    const previous = current;
    setModalError(null);
    const nextItems = [...current.items];
    nextItems[index] = targetItem;
    nextItems[targetIndex] = sourceItem;
    const normalizedItems = normalizeCatalogItems(nextItems);
    setCatalog({ items: normalizedItems });
    setOrderingClientKey(sourceItem.clientKey);
    setFeedback("");

    try {
      await Promise.all(
        normalizedItems
          .filter((item) => item.id !== 0)
          .map((item) => updateAdminGrapeItem(token, item.id, toItemInput(item))),
      );
      setStatus({ kind: "ready" });
      pushToast("success", "表示順を保存しました。");
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      setCatalog(previous);
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
        const loaded = await fetchAdminGrapeCatalog(token);
        setCatalog(toEditableCatalog(loaded));
        setStatus({ kind: "ready" });
      } catch (error) {
        if (isAuthExpired(error)) {
          onSignOut();
          return;
        }

        const message = getFriendlyErrorMessage(error, "ぶどう情報を読み込めませんでした。");
        setStatus({
          kind: "error",
          message,
        });
      }
    })();
  };

  const currentEditingItem =
    editingClientKey && catalog ? catalog.items.find((item) => item.clientKey === editingClientKey) ?? null : null;
  const publishedCount = catalog?.items.filter((item) => item.isOnSale).length ?? 0;

  return (
    <section className="section admin-page">
      <div className="admin-dashboard">
        <div className="admin-dashboard__head">
          <div className="grid gap-1">
            <p className="eyebrow">Admin</p>
            <h1 className="section__title">ぶどう情報の編集</h1>
            {catalog ? (
              <p className="section__lead admin-dashboard__summary">
                <span>{catalog.items.length}品種</span>
                <span>{publishedCount}件が販売中</span>
              </p>
            ) : null}
          </div>
          <button type="button" className="button-link button-link--primary" onClick={addItem} disabled={!catalog}>
            <Plus className="h-4 w-4" />
            品種を追加
          </button>
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
                <h2 className="section__title">公開中のぶどう</h2>
              </div>

              <div className="admin-grape-list">
                {catalog.items.map((item, index) => (
                  <GrapeListRow
                    key={item.clientKey}
                    item={item}
                    index={index}
                    onOpen={openEditor}
                    onMove={moveItem}
                    onToggleSale={toggleSale}
                    isMoving={orderingClientKey === item.clientKey}
                    isSaving={savingClientKey === item.clientKey}
                  />
                ))}
              </div>
            </div>

            <div className="admin-editor-actions">{feedback ? <p className="admin-feedback">{feedback}</p> : null}</div>
          </>
        ) : null}

        {currentEditingItem && draftItem ? (
          <GrapeItemModal
            item={draftItem}
            index={catalog?.items.findIndex((item) => item.clientKey === editingClientKey) ?? 0}
            onClose={closeEditor}
            onChange={(nextItem) => setDraftItem(nextItem)}
            onDelete={() => void removeItem(currentEditingItem.clientKey)}
            onSave={() => void saveItem(draftItem)}
            isSaving={savingClientKey === currentEditingItem.clientKey}
            errorMessage={modalError}
          />
        ) : null}

        {toast ? <div className={`admin-toast admin-toast--${toast.kind}`}>{toast.message}</div> : null}
      </div>
    </section>
  );
}
