import { Environment } from 'src/app/models/env';

export const environment: Environment = {
  production: false,
  title: 'Summarizer', /* Title of the application */
  serviceUrl: 'http://localhost:8000', /* URL of the summarization-server URL */
  ssoIssuer: "okta_sso_issuer", /* Okta SSO issuer */
  ssoClientId: 'okta_client_id', /* Okta  client id */
  redirectUrl:'http://localhost:4200/login/callback', /* URL to redirect after SSO login */
  contactUs: 'contact_us_link', /* Contact us URL */
  authSchema: 'okta', /* okta, basic */
  sessionKey: 'app-session', /* session key in local storage*/
};
