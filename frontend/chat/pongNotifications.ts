import type { PongNotificationMetadata } from '../utils/chatState';

export function isPongNotificationMetadata(
  metadata: unknown,
): metadata is PongNotificationMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'kind' in metadata &&
    'game' in metadata &&
    (metadata as { kind?: unknown }).kind === 'pong_notification' &&
    (metadata as { game?: unknown }).game === 'pong'
  );
}

export function buildPongNotificationLabel(metadata: PongNotificationMetadata) {
  if (metadata.event === 'invite_accepted') {
    return 'Invite Accepted';
  }

  if (metadata.event === 'invite_declined') {
    return 'Invite Declined';
  }

  if (metadata.event === 'opponent_left') {
    return 'Player Left';
  }

  if (metadata.event === 'opponent_disconnected') {
    return 'Match Ended';
  }

  return 'Match Result';
}

export function buildPongNotificationCopy(metadata: PongNotificationMetadata) {
  if (metadata.event === 'invite_accepted') {
    return 'The Pong invite was accepted.';
  }

  if (metadata.event === 'invite_declined') {
    return 'The Pong invite was declined.';
  }

  if (metadata.event === 'opponent_left') {
    const opponent_usr = metadata.endedByUsername ?? 'A player';
    return `${opponent_usr} left the match.`;
  }

  if (metadata.event === 'opponent_disconnected') {
    const opponent_usr = metadata.endedByUsername ?? 'A player';
    return `${opponent_usr} disconnected and did not return in time.`;
  }

  const finalScore = metadata.finalScore;
  if (!finalScore || !metadata.winnerUsername) {
    return 'The Pong match finished.';
  }

  return `${metadata.winnerUsername} won ${finalScore.p1}-${finalScore.p2}.`;
}
