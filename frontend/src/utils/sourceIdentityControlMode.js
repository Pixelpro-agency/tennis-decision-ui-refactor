export function getSourceIdentityControlMode({
    sourceIdentityStatus,
    manualConfirmationApplied,
    pendingIdentityIncomplete,
    canConfirmIdentity
} = {}) {
    if (sourceIdentityStatus === 'mismatch') {
        return 'hidden';
    }
    
    if (manualConfirmationApplied) {
        return 'manual-confirmed';
    }
    
    if (pendingIdentityIncomplete) {
        return 'pending-incomplete';
    }
    
    if (canConfirmIdentity) {
        return 'confirm-available';
    }
    
    return 'hidden';
}