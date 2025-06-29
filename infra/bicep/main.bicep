@description('Static Web App名')
param staticWebAppName string

@description('デプロイするリージョン')
param location string = resourceGroup().location

@description('GitHubリポジトリのURL')
param repositoryUrl string

@description('デプロイ対象のブランチ')
param branch string = 'main'

@description('フロントエンドのソースフォルダパス')
param appLocation string = 'frontend'

@description('APIのソースフォルダパス')
param apiLocation string = 'api'

@description('ビルド出力フォルダパス')
param outputLocation string = 'out'

@description('GitHub OAuth App のClient ID')
param githubClientId string

@description('GitHub OAuth App のClient Secret')
@secure()
param githubClientSecret string

// Static Web App リソース
resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    buildProperties: {
      appLocation: appLocation
      apiLocation: apiLocation
      outputLocation: outputLocation
      skipGithubActionWorkflowGeneration: false
    }
    stagingEnvironmentPolicy: 'Enabled'
  }
}

// アプリケーション設定（GitHub OAuth用の環境変数）
resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2022-03-01' = {
  name: 'appsettings'
  parent: staticWebApp
  properties: {
    GITHUB_CLIENT_ID: githubClientId
    GITHUB_CLIENT_SECRET: githubClientSecret
  }
}

resource functionAppSettings 'Microsoft.Web/staticSites/config@2022-03-01' = {
  parent: staticWebApp
  name: 'functionappsettings'
  properties: {
    // 最小限の設定（Programming Model v4では自動認識）
    FUNCTIONS_EXTENSION_VERSION: '~4'
    FUNCTIONS_WORKER_RUNTIME: 'node'
    
    // Node.js バージョン指定（オプション）
    WEBSITE_NODE_DEFAULT_VERSION: '~18'
    
    // カスタム設定（必要に応じて）
    // MY_CUSTOM_SETTING: 'value'
  }
}

// アウトプット
@description('Static Web Appsのエンドポイント')
output appBaseUrl string = 'https://${staticWebApp.properties.defaultHostname}'

@description('Static Web Appsの名前')
output resourceName string = staticWebAppName

@description('GitHubリポジトリのURL')
output repositoryUrl string = repositoryUrl

@description('フロントエンドのソースフォルダパス')
output appLocation string = appLocation

@description('APIのソースフォルダパス')
output apiLocation string = apiLocation

@description('ビルド出力フォルダパス')
output outputLocation string = outputLocation
