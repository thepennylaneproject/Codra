import type { ProjectContextRevision } from '@/domain/types';

interface RevisionSelectorProps {
  revisions: ProjectContextRevision[];
  currentId: string | null;
  onSelect: (revisionId: string) => void;
}

function formatRevisionLabel(revision: ProjectContextRevision) {
  const date = new Date(revision.createdAt).toLocaleDateString();
  return `v${revision.version} · ${revision.status} · ${date}`;
}

export function RevisionSelector({ revisions, currentId, onSelect }: RevisionSelectorProps) {
  return (
    <select
      value={currentId ?? ''}
      onChange={(e) => onSelect(e.target.value)}
      className="px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-text-primary focus-standard"
    >
      <option value="" disabled>
        No revisions yet
      </option>
      {revisions.map((revision) => (
        <option key={revision.id} value={revision.id}>
          {formatRevisionLabel(revision)}
        </option>
      ))}
    </select>
  );
}
