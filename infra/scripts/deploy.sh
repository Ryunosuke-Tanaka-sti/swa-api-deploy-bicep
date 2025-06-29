#!/bin/bash

# エラー時に停止
set -e

log_info() { echo -e "\033[1;34m$1\033[0m"; }
log_success() { echo -e "\033[1;32m$1\033[0m"; }
log_warning() { echo -e "\033[1;33m$1\033[0m"; }
log_error() { echo -e "\033[1;31m$1\033[0m"; }

DEPLOYMENT_NAME="swa-deployment-$(date +%Y%m%d-%H%M%S)"
GITHUB_ENVIRONMENT="production"

CONFIG_FILE="$(git rev-parse --show-toplevel)/.env"

if [ -f "$CONFIG_FILE" ]; then
    echo "📁 設定ファイル読み込み: $CONFIG_FILE"
    source "$CONFIG_FILE"
else
    echo "⚠️  設定ファイルが見つかりません: $CONFIG_FILE"
    echo "   .env.example をコピーして設定してください"
    exit 1
fi

# 必要な環境変数の確認（機密情報のみ）
required_vars=("GITHUB_CLIENT_ID" "GITHUB_CLIENT_SECRET" "RESOURCE_GROUP_NAME")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "エラー: 環境変数 $var が設定されていません"
        exit 1
    fi
done

# GitHub CLIがインストールされているかチェック
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) がインストールされていません"
    log_error "インストール方法: https://cli.github.com/"
    exit 1
fi

# GitHub CLIの認証チェック
if ! gh auth status &> /dev/null; then
    log_error "GitHub CLIが認証されていません"
    log_error "認証方法: gh auth login"
    exit 1
fi

# リポジトリのルートディレクトリかチェック
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    log_error "Gitリポジトリ内で実行してください"
    exit 1
fi

# 現在のリポジトリ情報を取得（デバッグ用）
CURRENT_REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || echo "unknown")
log_info "📍 対象リポジトリ: $CURRENT_REPO"

# リソースグループ作成（存在しない場合）
log_info ""
log_info "📦 ローカル開発用リソースグループ確認・作成..."
if ! az group show --name $RESOURCE_GROUP_NAME &> /dev/null; then
    log_info "🔧 リソースグループ作成中: $RESOURCE_GROUP_NAME"
    az group create --name $RESOURCE_GROUP_NAME --location $LOCATION
    log_success "✅ リソースグループ作成完了"
else
    log_success "✅ リソースグループ既存: $RESOURCE_GROUP_NAME"
fi

echo "Azure Static Web Appをデプロイ中..."

az deployment group validate \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --template-file infra/bicep/main.bicep \
  --parameters @infra/bicep/parameters.json \
  --parameters githubClientId="$GITHUB_CLIENT_ID" \
  --parameters githubClientSecret="$GITHUB_CLIENT_SECRET"

# Bicepテンプレートでデプロイ（機密情報のみ環境変数から渡す）
az deployment group create \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --template-file infra/bicep/main.bicep \
  --parameters @infra/bicep/parameters.json \
  --parameters githubClientId="$GITHUB_CLIENT_ID" \
  --parameters githubClientSecret="$GITHUB_CLIENT_SECRET" \
  --name ${DEPLOYMENT_NAME}

# 全outputを一度に取得
OUTPUTS=$(az deployment group show \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --name "$DEPLOYMENT_NAME" \
  --query "properties.outputs" -o json)

echo "✅ デプロイ結果を取得しました"

# 各値を抽出
APP_BASE_URL=$(echo "$OUTPUTS" | jq -r '.appBaseUrl.value')
STATIC_WEB_APP_NAME=$(echo "$OUTPUTS" | jq -r '.resourceName.value')
REPOSITORY_URL=$(echo "$OUTPUTS" | jq -r '.repositoryUrl.value')
APP_LOCATION=$(echo "$OUTPUTS" | jq -r '.appLocation.value')
API_LOCATION=$(echo "$OUTPUTS" | jq -r '.apiLocation.value')
OUTPUT_LOCATION=$(echo "$OUTPUTS" | jq -r '.outputLocation.value')

# 結果を表示
log_success ""
log_success "Azure Static Web Appのデプロイが完了しました！"
log_success "アプリのベースURL: $APP_BASE_URL"
log_success "リソース名: $STATIC_WEB_APP_NAME"
log_success "リポジトリURL: $REPOSITORY_URL"
log_success "アプリの場所: $APP_LOCATION"
log_success "APIの場所: $API_LOCATION"
log_success "出力の場所: $OUTPUT_LOCATION"

# === 新機能: デプロイトークンの取得とGitHub Environment設定 ===

log_info ""
log_info "🔑 Azure Static Web Appsのデプロイトークンを取得中..."

# デプロイトークンを取得
DEPLOY_TOKEN=$(az staticwebapp secrets list \
  --name "$STATIC_WEB_APP_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --query "properties.apiKey" -o tsv)

if [ -z "$DEPLOY_TOKEN" ]; then
    log_error "デプロイトークンの取得に失敗しました"
    exit 1
fi

log_success "✅ デプロイトークンを取得しました"

# GitHub環境の作成と設定
log_info ""
log_info "🌍 GitHub環境 '$GITHUB_ENVIRONMENT' を設定中..."

# 注意: GitHub CLIは現在のGitリポジトリを自動認識します
# このスクリプトはGitリポジトリ内で実行する必要があります

# Environment変数の設定
log_info ""
log_info "📝 Environment変数を設定中..."

# app_location
if gh variable set APP_LOCATION --body "$APP_LOCATION" --env "$GITHUB_ENVIRONMENT" 2>/dev/null; then
    log_success "✅ 変数 'app_location' を設定: $APP_LOCATION"
else
    log_error "❌ 変数 'app_location' の設定に失敗しました"
fi

# api_location
if gh variable set API_LOCATION --body "$API_LOCATION" --env "$GITHUB_ENVIRONMENT" 2>/dev/null; then
    log_success "✅ 変数 'api_location' を設定: $API_LOCATION"
else
    log_error "❌ 変数 'api_location' の設定に失敗しました"
fi

# output_location
if gh variable set OUTPUT_LOCATION --body "$OUTPUT_LOCATION" --env "$GITHUB_ENVIRONMENT" 2>/dev/null; then
    log_success "✅ 変数 'output_location' を設定: $OUTPUT_LOCATION"
else
    log_error "❌ 変数 'output_location' の設定に失敗しました"
fi

# デプロイトークンをシークレットに設定
log_info ""
log_info "🔐 デプロイトークンをシークレットに設定中..."

# 注意: gh secret setは現在のGitリポジトリの指定した環境にシークレットを設定します
if gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$DEPLOY_TOKEN" --env "$GITHUB_ENVIRONMENT" 2>/dev/null; then
    log_success "✅ シークレット 'deploy_token' を設定しました"
else
    log_error "❌ シークレット 'deploy_token' の設定に失敗しました"
    log_warning "⚠️  手動で設定してください:"
    log_warning "   リポジトリ設定 > Environments > $GITHUB_ENVIRONMENT > Secrets"
    log_warning "   シークレット名: deploy_token"
    log_warning "   値: [デプロイトークン]"
fi

# 最終結果サマリー
log_success ""
log_success "🎉 すべての設定が完了しました！"
log_success ""
log_success "📋 設定内容サマリー:"
log_success "  - Azure Static Web App: $STATIC_WEB_APP_NAME"
log_success "  - アプリURL: $APP_BASE_URL"
log_success "  - GitHub環境: $GITHUB_ENVIRONMENT"
log_success "  - 設定された変数:"
log_success "    • app_location: $APP_LOCATION"
log_success "    • api_location: $API_LOCATION"
log_success "    • output_location: $OUTPUT_LOCATION"
log_success "  - 設定されたシークレット:"
log_success "    • deploy_token: [設定済み]"
log_success ""
log_success "🚀 GitHub Actionsでのデプロイが可能になりました！"