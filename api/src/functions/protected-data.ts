import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

interface ClientPrincipal {
    identityProvider: string;
    userId: string;
    userDetails: string;
    userRoles: string[];
}

interface ProtectedData {
    userId: string;
    message: string;
    timestamp: string;
    userNumber: number;
}

// 認証チェック用のヘルパー関数
function checkAuthentication(request: HttpRequest, context: InvocationContext): ClientPrincipal | null {
    const clientPrincipalHeader = request.headers.get('x-ms-client-principal');
    
    if (!clientPrincipalHeader) {
        context.log('認証ヘッダーが見つかりませんでした');
        return null;
    }

    try {
        const clientPrincipalData = Buffer.from(clientPrincipalHeader, 'base64').toString('utf-8');
        return JSON.parse(clientPrincipalData);
    } catch (error) {
        context.log('Client principalの解析に失敗しました:', error);
        return null;
    }
}

// 軽量なユーザー固有データ生成
function generateUserData(userId: string): ProtectedData {
    // userIdをベースにした簡単なシード値
    const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
        userId,
        message: `こんにちは、ユーザー${userId}さん！`,
        timestamp: new Date().toISOString(),
        userNumber: seed % 1000 // 0-999の範囲のユーザー番号
    };
}

export async function protectedData(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('protected-dataリクエストを処理中');

    try {
        // 認証チェック
        const clientPrincipal = checkAuthentication(request, context);
        
        if (!clientPrincipal) {
            return {
                status: 401,
                headers: {
                    'Content-Type': 'application/json'
                },
                jsonBody: {
                    error: 'Unauthorized',
                    message: '保護されたデータにアクセスするには認証が必要です'
                }
            };
        }

        context.log('認証済みユーザー:', clientPrincipal.userId);

        // 軽量なダミーデータを生成
        const userData = generateUserData(clientPrincipal.userId);
        context.log('生成されたユーザーデータ:', userData);

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            jsonBody: userData
        };

    } catch (error) {
        context.log('protected-dataリクエストの処理中にエラー:', error);
        
        return {
            status: 500,
            jsonBody: {
                error: 'Internal server error',
                message: "Application Crash"
            }
        };
    }
}

app.http('protected-data', {
    methods: ['GET'],
    authLevel: 'anonymous',  // SWAのManaged Functionsのため
    route: 'protected-data',
    handler: protectedData
});