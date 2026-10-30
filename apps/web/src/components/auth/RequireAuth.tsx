import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/auth-context';
import type { ReactNode } from 'react';

export default function RequireAuth({
    children,
}: {
    children: ReactNode
}) {
    const { isAuthenticated } = useAuth()
    const location = useLocation()

    if (!isAuthenticated) {
        return (
            <Navigate
                to='/login'
                replace
                state={{ from: `${location.pathname}${location.search}` }}
            />
        )
    }

    return children
}