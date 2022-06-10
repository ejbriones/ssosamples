const jwtServiceConfig = {
  signIn: 'api/auth/sign-in',
  signUp: 'api/auth/sign-up',
  accessToken: 'https://sg-sso.ebsproject.org:9443/oauth2/userinfo',
  checkSession: 'https://sg-sso.ebsproject.org:9443/oidc/checksession',
  updateUser: 'api/auth/user/update',
  logOff:'https://sg-sso.ebsproject.org:9443/oidc/logout'
};

export default jwtServiceConfig;
