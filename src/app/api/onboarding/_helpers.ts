import { db } from '@/lib/db';

export async function markStepComplete(schoolId: string, stepIndex: number) {
  const draft = await db.onboardingDraft.findUnique({ where: { schoolId } });
  if (!draft) return;
  const completed = JSON.parse(draft.completedSteps || '[]') as number[];
  if (!completed.includes(stepIndex)) {
    completed.push(stepIndex);
  }
  await db.onboardingDraft.update({
    where: { schoolId },
    data: { completedSteps: JSON.stringify(completed), currentStep: stepIndex + 1 },
  });
}

export function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
