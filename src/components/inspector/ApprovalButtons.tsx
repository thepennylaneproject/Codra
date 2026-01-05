import { useState } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ArtifactVersion } from '@/types/architect';
import { versionManager } from '@/lib/artifacts/version-manager';
import { useAuth } from '@/hooks/useAuth';
import { analytics } from '@/lib/analytics';
import { useToast } from '@/new/components/Toast';

interface ApprovalButtonsProps {
  version: ArtifactVersion;
  onStatusChange: (status: ArtifactVersion['approvalStatus']) => void;
}

export function ApprovalButtons({ version, onStatusChange }: ApprovalButtonsProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  const handleUpdate = async (status: ArtifactVersion['approvalStatus'], note?: string) => {
    setIsUpdating(true);
    try {
      const success = await versionManager.updateVersionStatus(version.id, {
        status,
        userId: user?.id,
        rejectionNote: note
      });

      if (success) {
        onStatusChange(status);
        analytics.track(status === 'approved' ? 'artifact_approved' : 'artifact_rejected', {
          versionId: version.id,
          artifactId: version.artifactId,
          status
        });
        toast.success(`Artifact ${status.replace('_', ' ')}`);
        setShowRejectNote(false);
      } else {
        toast.error('Failed to update status');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (version.approvalStatus === 'approved') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-xs font-semibold">
        <Check size={14} /> Approved
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showRejectNote ? (
        <div className="space-y-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <textarea
            className="w-full h-20 p-2 text-xs border rounded bg-white"
            placeholder="What needs to change? (Optional)"
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowRejectNote(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => handleUpdate('changes_requested', rejectionNote)}
              disabled={isUpdating}
            >
              Send Request
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            onClick={() => handleUpdate('approved')}
            disabled={isUpdating}
          >
            <Check size={14} /> Approve
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            onClick={() => setShowRejectNote(true)}
            disabled={isUpdating}
          >
            <RotateCcw size={14} /> Request Changes
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="text-rose-600 hover:text-rose-700 gap-1.5"
            onClick={() => handleUpdate('rejected')}
            disabled={isUpdating}
          >
            <X size={14} /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}
