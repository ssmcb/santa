type ParticipantForLottery = {
  id: string;
  name: string;
};

/**
 * Implements a Secret Santa lottery algorithm that ensures:
 * 1. No participant draws themselves
 * 2. Each participant draws exactly one other participant
 * 3. Each participant is drawn by exactly one other participant
 *
 * Uses a derangement algorithm to ensure no one gets themselves.
 */
export function runSecretSantaLottery(
  participants: ParticipantForLottery[]
): Map<string, string> {
  if (participants.length < 3) {
    throw new Error('At least 3 participants are required for Secret Santa');
  }

  const assignments = new Map<string, string>();
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    assignments.clear();
    const available = [...participants.map((p) => p.id)];

    let success = true;

    for (const participant of participants) {
      // Filter out the participant themselves from available recipients
      const validRecipients = available.filter((id) => id !== participant.id);

      if (validRecipients.length === 0) {
        // Dead end - need to restart
        success = false;
        break;
      }

      // Randomly select a recipient
      const randomIndex = Math.floor(Math.random() * validRecipients.length);
      const selectedRecipient = validRecipients[randomIndex];

      assignments.set(participant.id, selectedRecipient);

      // Remove the selected recipient from available pool
      const availableIndex = available.indexOf(selectedRecipient);
      available.splice(availableIndex, 1);
    }

    if (success && assignments.size === participants.length) {
      // Verify no one drew themselves (sanity check)
      for (const [giverId, recipientId] of assignments) {
        if (giverId === recipientId) {
          success = false;
          break;
        }
      }

      if (success) {
        return assignments;
      }
    }

    attempts++;
  }

  throw new Error('Failed to generate valid Secret Santa assignments after maximum attempts');
}

/**
 * Validates that the lottery assignments are valid
 */
export function validateLotteryAssignments(
  participants: ParticipantForLottery[],
  assignments: Map<string, string>
): boolean {
  // Check that everyone is assigned
  if (assignments.size !== participants.length) {
    return false;
  }

  // Check that no one drew themselves
  for (const [giverId, recipientId] of assignments) {
    if (giverId === recipientId) {
      return false;
    }
  }

  // Check that everyone is drawn exactly once
  const recipientCounts = new Map<string, number>();
  for (const recipientId of assignments.values()) {
    recipientCounts.set(recipientId, (recipientCounts.get(recipientId) || 0) + 1);
  }

  for (const participant of participants) {
    if (recipientCounts.get(participant.id) !== 1) {
      return false;
    }
  }

  return true;
}
