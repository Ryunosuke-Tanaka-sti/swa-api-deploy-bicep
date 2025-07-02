"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface ApiUserInfo {
  userId: string;
  name: string;
  email: string;
  provider: string;
  roles: string[];
  isAuthenticated: boolean;
}

interface ApiError {
  error: string;
  message: string;
}

export default function HomePage() {
  const { isAuthenticated, user, loading, login, logout } = useAuth();
  const [apiData, setApiData] = useState<ApiUserInfo | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const fetchUserInfo = async () => {
    setApiLoading(true);
    setApiError(null);
    setApiData(null);

    try {
      const response = await fetch("/api/user-info", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 認証情報を含める
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiUserInfo | ApiError = await response.json();

      if ("error" in data) {
        setApiError(data.message || data.error);
      } else {
        setApiData(data);
      }
    } catch (error) {
      console.error("API呼び出しエラー:", error);
      setApiError(
        error instanceof Error ? error.message : "APIの呼び出しに失敗しました"
      );
    } finally {
      setApiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-8">
            Next.js 15 + Azure SWA(feature push and delete Buildテスト)
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            GitHub認証を使用したセキュアなWebアプリケーション
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              認証状態
            </h2>

            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">認証済み</span>
                </div>

                {user && (
                  <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                    <h3 className="font-medium text-gray-800 mb-2">
                      ユーザー情報（クライアント側）
                    </h3>
                    {user.name && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">名前:</span> {user.name}
                      </p>
                    )}
                    {user.email && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">メール:</span>{" "}
                        {user.email}
                      </p>
                    )}
                    {user.login && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">ログイン:</span>{" "}
                        {user.login}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                  <Link
                    href="/protected"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
                  >
                    保護されたページへ
                  </Link>
                  <button
                    onClick={logout}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">未認証</span>
                </div>

                <p className="text-gray-600 mb-6">
                  保護されたコンテンツにアクセスするには、GitHubアカウントでログインしてください。
                </p>

                <button
                  onClick={login}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition duration-200 flex items-center space-x-2 mx-auto"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>GitHubでログイン</span>
                </button>
              </div>
            )}
          </div>

          {/* API情報取得セクション */}

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              API情報取得
            </h2>

            <div className="space-y-4">
              <button
                onClick={fetchUserInfo}
                disabled={apiLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-6 rounded-lg transition duration-200 flex items-center space-x-2 mx-auto"
              >
                {apiLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>取得中...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>サーバーからユーザー情報を取得</span>
                  </>
                )}
              </button>

              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left max-w-md mx-auto">
                  <h3 className="font-medium text-red-800 mb-2">エラー</h3>
                  <p className="text-sm text-red-600">{apiError}</p>
                </div>
              )}

              {apiData && (
                <div
                  className={
                    " rounded-lg p-4 text-left max-w-md mx-auto" +
                    (apiData.isAuthenticated
                      ? " bg-green-50 border border-green-200"
                      : " bg-red-50 border border-red-200")
                  }
                >
                  <h3
                    className={
                      "font-medium  mb-2" +
                      (apiData.isAuthenticated
                        ? " text-green-800"
                        : " text-red-800")
                    }
                  >
                    サーバー側ユーザー情報
                  </h3>
                  <div
                    className={
                      "space-y-1 text-sm " +
                      (apiData.isAuthenticated
                        ? " text-green-700"
                        : " text-red-700")
                    }
                  >
                    <p>
                      <span className="font-medium">認証状態:</span>{" "}
                      {apiData.isAuthenticated ? "認証済み" : "未認証"}
                    </p>
                    <p>
                      <span className="font-medium">ユーザーID:</span>{" "}
                      {apiData.userId}
                    </p>
                    <p>
                      <span className="font-medium">名前:</span> {apiData.name}
                    </p>
                    <p>
                      <span className="font-medium">メール:</span>{" "}
                      {apiData.email}
                    </p>
                    <p>
                      <span className="font-medium">プロバイダー:</span>{" "}
                      {apiData.provider}
                    </p>
                    <p>
                      <span className="font-medium">ロール:</span>{" "}
                      {apiData.roles.length > 0
                        ? apiData.roles.join(", ")
                        : "なし"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-gray-500">
            <p className="text-sm">
              このアプリケーションはAzure Static Web Appsで認証を管理しています
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
