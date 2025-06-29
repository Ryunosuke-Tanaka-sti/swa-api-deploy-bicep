'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface ProtectedData {
  userId: string;
  message: string;
  timestamp: string;
  userNumber: number;
}

interface ApiError {
  error: string;
  message: string;
}

export default function ProtectedPage() {
  const { user, loading, logout } = useAuth();
  const [protectedData, setProtectedData] = useState<ProtectedData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const fetchProtectedData = async () => {
    setApiLoading(true);
    setApiError(null);
    setProtectedData(null);

    try {
      const response = await fetch('/api/protected-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProtectedData | ApiError = await response.json();
      
      if ('error' in data) {
        setApiError(data.message || data.error);
      } else {
        setProtectedData(data);
      }
    } catch (error) {
      console.error('保護されたAPI呼び出しエラー:', error);
      setApiError(error instanceof Error ? error.message : '保護されたデータの取得に失敗しました');
    } finally {
      setApiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium text-lg">保護されたエリア</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎉 認証成功！
            </h1>
            <p className="text-xl text-gray-600">
              このページは認証済みユーザーのみがアクセスできます
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              あなたの情報
            </h2>
            
            {user ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.name && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-500 font-medium">名前</div>
                      <div className="text-lg text-gray-900">{user.name}</div>
                    </div>
                  )}
                  {user.email && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-500 font-medium">メールアドレス</div>
                      <div className="text-lg text-gray-900">{user.email}</div>
                    </div>
                  )}
                  {user.login && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-500 font-medium">GitHubユーザー名</div>
                      <div className="text-lg text-gray-900">@{user.login}</div>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-500 font-medium">アクセス日時</div>
                    <div className="text-lg text-gray-900">
                      {new Date().toLocaleString('ja-JP')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">ユーザー情報が見つかりません</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                🔒 セキュリティ情報
              </h3>
              <ul className="text-blue-800 space-y-2">
                <li>• このページはAzure SWAレベルで保護されています</li>
                <li>• 未認証ユーザーは自動的にGitHubログインにリダイレクトされます</li>
                <li>• 認証情報はAzure Static Web Appsで安全に管理されています</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 text-center"
              >
                ホームに戻る
              </Link>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* 保護されたデータ取得セクション */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              🛡️ 保護されたデータ
            </h2>
            
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  サーバー側で認証を確認し、あなた専用のデータを取得します
                </p>
                <button
                  onClick={fetchProtectedData}
                  disabled={apiLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-6 rounded-lg transition duration-200 flex items-center space-x-2 mx-auto"
                >
                  {apiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>データ取得中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>保護されたデータを取得</span>
                    </>
                  )}
                </button>
              </div>

              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-medium text-red-800">エラー</h3>
                  </div>
                  <p className="text-sm text-red-600">{apiError}</p>
                </div>
              )}

              {protectedData && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-medium text-purple-800">取得成功 🎯</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-500 font-medium">ユーザーID</div>
                      <div className="text-lg text-gray-900 font-mono">{protectedData.userId}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-500 font-medium">ユーザー番号</div>
                      <div className="text-lg text-gray-900 font-bold ">
                        #{protectedData.userNumber}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 md:col-span-2">
                      <div className="text-sm text-gray-500 font-medium">パーソナライズメッセージ</div>
                      <div className="text-lg text-gray-900">{protectedData.message}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 md:col-span-2">
                      <div className="text-sm text-gray-500 font-medium">データ生成時刻</div>
                      <div className="text-lg text-gray-900 font-mono">
                        {new Date(protectedData.timestamp).toLocaleString('ja-JP')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-purple-700">
                      💡 このデータはあなたのユーザーIDに基づいて動的に生成され、
                      サーバー側で認証を確認した後にのみ提供されます。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-gray-500">
            <p className="text-sm">
              Azure Static Web Apps + GitHub認証で実現したセキュアなアプリケーション
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}