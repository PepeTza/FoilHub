import { Button } from './Button';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-sm"
    >
      <p className="text-text-secondary">
        Página <span className="font-semibold text-text-primary">{page}</span> de{' '}
        <span className="font-semibold text-text-primary">{totalPages}</span>{' '}
        <span className="text-text-muted">({total} en total)</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
