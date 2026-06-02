export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

export function formatCredits(amount: number): string {
  return amount.toLocaleString('zh-CN');
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '等待中',
    processing: '生成中',
    completed: '已完成',
    failed: '失败',
    queued: '排队中',
  };
  return map[status] || status;
}
