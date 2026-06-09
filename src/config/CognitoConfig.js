export const CognitoConfig = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
  Region:
    import.meta.env.VITE_COGNITO_REGION ??
    import.meta.env.VITE_AWS_REGION ??
    "us-east-2",
};

export function EstaCognitoConfigurado() {
  return Boolean(CognitoConfig.UserPoolId && CognitoConfig.ClientId);
}
