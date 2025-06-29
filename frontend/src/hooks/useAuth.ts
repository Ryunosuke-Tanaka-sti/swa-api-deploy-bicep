import { useState, useEffect } from 'react';

interface UserInfo {
    isAuthenticated: boolean;
    user?: {
        name?: string;
        email?: string;
        login?: string;
    };
}

export const useAuth = () => {
    const [userInfo, setUserInfo] = useState<UserInfo>({ isAuthenticated: false });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch('/.auth/me');

                if (response.ok) {
                    const data = await response.json();

                    if (data.clientPrincipal) {
                        setUserInfo({
                            isAuthenticated: true,
                            user: {
                                name: data.clientPrincipal.userDetails,
                                email: data.clientPrincipal.userDetails,
                                login: data.clientPrincipal.userId
                            }
                        });
                    } else {
                        setUserInfo({ isAuthenticated: false });
                    }
                } else {
                    setUserInfo({ isAuthenticated: false });
                }
            } catch (err) {
                console.error('認証情報の取得に失敗しました:', err);
                setError('認証情報の取得に失敗しました');
                setUserInfo({ isAuthenticated: false });
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    const login = () => {
        window.location.href = '/.auth/login/github';
    };

    const logout = () => {
        window.location.href = '/.auth/logout';
    };

    return {
        ...userInfo,
        loading,
        error,
        login,
        logout
    };
};