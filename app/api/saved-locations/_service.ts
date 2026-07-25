import prisma from '@/lib/prisma';

export async function getSavedLocations(userId: string) {
    try {
        const savedLocations = await prisma.savedLocation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return savedLocations;
    } catch (error) {
        console.error('Get saved locations error:', error);
        return [];
    }
}

