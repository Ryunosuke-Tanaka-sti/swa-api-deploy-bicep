import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

interface ClientPrincipal {
    identityProvider: string;
    userId: string;
    userDetails: string;
    userRoles: string[];
}

interface UserInfo {
    userId: string;
    name: string;
    email: string;
    provider: string;
    roles: string[];
    isAuthenticated: boolean;
}

export async function userInfo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Processing user-info request');

    try {
        // x-ms-client-principalヘッダーの取得
        const clientPrincipalHeader = request.headers.get('x-ms-client-principal');
        
        if (!clientPrincipalHeader) {
            context.log('ヘッダーにx-ms-client-principalが確認することができず、認証状態を確認することができませんでした。');
            return {
                status: 200,
                jsonBody: {
                    isAuthenticated: false,
                    userId: null,
                    name: null,
                    email: null,
                    provider: null,
                    roles: []
                }
            };
        }

        // Base64デコード
        const clientPrincipalData = Buffer.from(clientPrincipalHeader, 'base64').toString('utf-8');
        const clientPrincipal: ClientPrincipal = JSON.parse(clientPrincipalData);

        context.log('Client Principal:', clientPrincipal);

        // ユーザー情報の整形
        const userInfo: UserInfo = {
            userId: clientPrincipal.userId,
            name: clientPrincipal.userDetails,
            email: clientPrincipal.userDetails, // 通常はemailが含まれる
            provider: clientPrincipal.identityProvider,
            roles: clientPrincipal.userRoles || [],
            isAuthenticated: true
        };

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            jsonBody: userInfo
        };

    } catch (error) {
        context.log('Applicatoin Crash', error);
        
        return {
            status: 500,
            jsonBody: {
                error: 'Internal server error',
                message: "Application Crash"
            }
        };
    }
}

app.http('user-info', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'user-info',
    handler: userInfo
});