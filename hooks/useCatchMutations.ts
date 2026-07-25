import { useMutation } from '@tanstack/react-query';

interface CreateCatchParams {
  formData: FormData;
  userId: string;
}

async function identifyFish(formData: FormData) {
  const res = await fetch('/api/openai/identify', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    const err = new Error(error.error || 'Failed to identify fish') as Error & {
      code?: string;
    };
    err.code = error.code;
    throw err;
  }
  return res.json();
}

async function createCatch(data: any, userId: string) {
  const res = await fetch('/api/catch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to post catch');
  return res.json();
}

export function useCatchMutations() {
  const identifyMutation = useMutation({
    mutationFn: identifyFish,
  });

  const createCatchMutation = useMutation({
    mutationFn: ({ data, userId }: { data: any; userId: string }) => 
      createCatch(data, userId),
  });

  return {
    identifyFish: identifyMutation.mutateAsync,
    createCatch: createCatchMutation.mutateAsync,
    isIdentifying: identifyMutation.isPending,
    isCreating: createCatchMutation.isPending,
  };
}













