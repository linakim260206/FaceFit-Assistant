param location string = resourceGroup().location
param webAppName string = 'facefit-${uniqueString(resourceGroup().id)}'

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: webAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
  tags: {
    'azd-service-name': 'web'
  }
}

output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppApiToken string = listSecrets(staticWebApp.id, staticWebApp.apiVersion).properties.apiKey
