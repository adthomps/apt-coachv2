import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DialogSize = 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<DialogSize, string> = {
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[720px]',
  xl: 'sm:max-w-[900px]',
};

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** md ≈ light forms, lg ≈ block editors, xl ≈ session edits. Default lg for parity. */
  size?: DialogSize;
  /** Form body. */
  children: React.ReactNode;
  /** Primary submit action. */
  submitLabel: string;
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  canSubmit?: boolean;
  /** Optional secondary action (e.g. Save Draft). */
  secondaryAction?: React.ReactNode;
  cancelLabel?: string;
  contentClassName?: string;
}

/**
 * Shared shell for all CRUD modals.
 * Standardizes width, padding, header, body scroll, and footer alignment
 * across Exercise / Workout / Program / Session dialogs.
 */
const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  size = 'lg',
  children,
  submitLabel,
  onSubmit,
  isSubmitting,
  canSubmit = true,
  secondaryAction,
  cancelLabel = 'Cancel',
  contentClassName,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          SIZE_CLASS[size],
          'max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden',
          contentClassName,
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-1">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">{children}</div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 sm:justify-between gap-2">
          <div>{secondaryAction}</div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {cancelLabel}
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
