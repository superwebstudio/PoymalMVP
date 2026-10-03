import { useMutation } from '@tanstack/react-query';

interface IdentifyResult {
  species: string | null;
  scientificName: string | null;
  confidence: number | null;
  description: string | null;
}

async function identifyFish(formData: FormData): Promise<IdentifyResult> {
  const response = await fetch('/api/openai/identify', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as { error?: string; code?: string };
    const error = new Error(errorBody.error || 'Failed to identify fish') as Error & {
      code?: string;
    };
    error.code = errorBody.code;
    throw error;
  }

  return response.json() as Promise<IdentifyResult>;
}

export function useCatchMutations() {
  const identifyMutation = useMutation({
    mutationFn: identifyFish,
  });

  return {
    identifyFish: identifyMutation.mutateAsync,
    isIdentifying: identifyMutation.isPending,
  };
}
