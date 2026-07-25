import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserProfile } from '../_service';
import { clearUserCache, verifyAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { clearSessionCookies } from '@/lib/supabase-auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const user = await getUserProfile(id);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const auth = await verifyAuth(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        if (id !== auth.userId) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: 'Account deletion is not configured' },
                { status: 500 },
            );
        }

        const supabase = createServerSupabaseClient();
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(auth.authId);
        if (authDeleteError) {
            console.error('Unable to delete Supabase identity:', authDeleteError.message);
            return NextResponse.json({ error: 'Unable to delete account' }, { status: 500 });
        }

        // Delete user (cascades will delete catches, likes, etc.)
        await prisma.user.delete({
            where: { id },
        });
        clearUserCache(auth.authId);

        const response = NextResponse.json({ success: true });
        clearSessionCookies(response);
        return response;
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


