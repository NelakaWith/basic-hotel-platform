"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ButtonVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
  children?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  loading,
  loadingLabel,
  children,
  onConfirm,
  onCancel,
  onOpenChange,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    if (loading) return;
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange?.(false);
    }
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (!loading ? onOpenChange?.(next) : undefined)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={!!loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={!!loading}
          >
            {loading ? loadingLabel ?? `${confirmLabel}...` : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
