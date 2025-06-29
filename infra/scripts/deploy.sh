#!/bin/bash

# エラー時に停止
set -e

log_info() { echo -e "\033[1;34m$1\033[0m"; }
log_success() { echo -e "\033[1;32m$1\033[0m"; }
log_warning() { echo -e "\033[1;33m$1\033[0m"; }
log_error() { echo -e "\033[1;31m$1\033[0m"; }

DEPLOYMENT_NAME="swa-deployment-$(date +%Y%m%d-%H%M%S)"

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

# デプロイメントトークンを取得してGitHubシークレットに設定する指示を表示
echo ""
echo "✅ Azure Static Web Appのデプロイが完了しました！"
echo ""
echo "次のステップ:"
echo "1. 以下のコマンドでデプロイメントトークンを取得:"
echo "   az staticwebapp secrets list --name \$(az deployment group show --resource-group $RESOURCE_GROUP_NAME --name \$(az deployment group list --resource-group $RESOURCE_GROUP_NAME --query '[0].name' -o tsv) --query 'properties.outputs.staticWebAppId.value' -o tsv | cut -d'/' -f9) --resource-group $RESOURCE_GROUP_NAME --query properties.apiKey -o tsv"
echo ""
echo "2. GitHubリポジトリのSettings > Secrets and variables > Actionsで"
echo "   AZURE_STATIC_WEB_APPS_API_TOKEN という名前でシークレットを追加"
echo ""
echo "3. GitHub Actionsワークフローファイルを.github/workflows/に追加