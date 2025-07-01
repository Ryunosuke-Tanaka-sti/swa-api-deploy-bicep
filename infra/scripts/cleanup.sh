#!/bin/bash

# エラー時に停止
set -e

log_info() { echo -e "\033[1;34m$1\033[0m"; }
log_success() { echo -e "\033[1;32m$1\033[0m"; }
log_warning() { echo -e "\033[1;33m$1\033[0m"; }
log_error() { echo -e "\033[1;31m$1\033[0m"; }


CONFIG_FILE="$(git rev-parse --show-toplevel)/.env" 2>/dev/null || CONFIG_FILE=".env"

if [ -f "$CONFIG_FILE" ]; then
    log_info "📁 設定ファイル読み込み: $CONFIG_FILE"
    source "$CONFIG_FILE"
else
    log_error "⚠️  設定ファイルが見つかりません: $CONFIG_FILE"
    log_error "   .env.example をコピーして設定してください"
    exit 1
fi

# 必要な環境変数の確認
required_vars=("RESOURCE_GROUP_NAME" "STATIC_WEB_APP_NAME")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "エラー: 環境変数 $var が設定されていません"
        exit 1
    fi
done

log_info "🎯 削除対象: $STATIC_WEB_APP_NAME (リソースグループ: $RESOURCE_GROUP_NAME)"

# Azure CLIがインストールされているかチェック
if ! command -v az &> /dev/null; then
    log_error "Azure CLI (az) がインストールされていません"
    log_error "インストール方法: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Azure CLIの認証チェック
if ! az account show &> /dev/null; then
    log_error "Azure CLIが認証されていません"
    log_error "認証方法: az login"
    exit 1
fi

# リソースグループの存在確認
log_info ""
log_info "📦 リソースグループの確認..."
if ! az group show --name $RESOURCE_GROUP_NAME &> /dev/null; then
    log_warning "⚠️  リソースグループ '$RESOURCE_GROUP_NAME' が見つかりません"
    log_warning "   削除する必要がありません"
    exit 0
else
    log_success "✅ リソースグループ確認: $RESOURCE_GROUP_NAME"
fi

# Static Web Appリソースの存在確認
log_info ""
log_info "🔍 Azure Static Web App リソースを確認中..."

# 指定されたリソースの存在確認
if az staticwebapp show \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --output none 2>/dev/null; then
    
        # リソース詳細の取得
    SWA_DETAILS=$(az staticwebapp show \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query "{name:name, defaultHostname:defaultHostname, sku:sku.name, location:location}" \
        -o json)
    
    log_success "✅ 削除対象リソースが見つかりました:"
    echo "$SWA_DETAILS" | jq -r '"  • 名前: \(.name)"'
    echo "$SWA_DETAILS" | jq -r '"  • URL: \(.defaultHostname)"'
    echo "$SWA_DETAILS" | jq -r '"  • プラン: \(.sku)"'
    echo "$SWA_DETAILS" | jq -r '"  • リージョン: \(.location)"'
    
    RESOURCE_EXISTS=true
else
    log_warning "⚠️  指定されたAzure Static Web App '$STATIC_WEB_APP_NAME' が見つかりません"
    log_warning "   リソースグループ: $RESOURCE_GROUP_NAME"
    log_info "削除する必要がありません"
    exit 0
fi

# 確認プロンプト
log_warning ""
log_warning "⚠️  以下の操作を実行します:"
log_warning "   1. Azure Static Web App '$STATIC_WEB_APP_NAME' の削除"
log_warning "   2. リソースグループ '$RESOURCE_GROUP_NAME' は保持します"
log_warning "   3. GitHub環境設定は保持します"
log_warning ""

read -p "続行しますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "操作をキャンセルしました"
    exit 0
fi

# === Azure Static Web App リソースの削除 ===

log_info ""
log_info "🗑️  Azure Static Web App リソースを削除中..."

log_info "🔧 削除中: $STATIC_WEB_APP_NAME"

if az staticwebapp delete \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --yes 2>/dev/null; then
    log_success "✅ 削除完了: $STATIC_WEB_APP_NAME"
else
    log_error "❌ 削除失敗: $STATIC_WEB_APP_NAME"
    exit 1
fi

log_success "✅ Azure Static Web App リソースの削除が完了しました"

# === 削除完了サマリー ===

log_success ""
log_success "🎉 クリーンアップが完了しました！"
log_success ""
log_success "📋 実行内容サマリー:"
log_success "  ✅ Azure Static Web App削除: $STATIC_WEB_APP_NAME"
log_success "  ✅ リソースグループ保持: $RESOURCE_GROUP_NAME"
log_success "  ✅ GitHub環境設定保持: 変更なし"
log_success ""
log_success "📌 注意事項:"
log_success "  • リソースグループ '$RESOURCE_GROUP_NAME' は保持されています"
log_success "  • GitHub環境設定はそのまま残っているので、再デプロイ可能です"
log_success ""
log_success "🚀 Azure リソースのクリーンアップ完了！"