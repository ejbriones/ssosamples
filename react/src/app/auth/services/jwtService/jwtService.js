import FuseUtils from '@fuse/utils/FuseUtils';
import axios from 'axios';
import { decode } from 'draft-js/lib/DraftOffsetKey';
import jwtDecode from 'jwt-decode';
import jwtServiceConfig from './jwtServiceConfig';

/* eslint-disable camelcase */

class JwtService extends FuseUtils.EventEmitter {
  init() {
    this.setInterceptors();
    this.handleAuthentication();
  }

  setInterceptors = () => {
    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (err) => {
        return new Promise((resolve, reject) => {
          if (err.response.status === 401 && err.config && !err.config.__isRetryRequest) {
            // if you ever get an unauthorized response, logout the user
            this.emit('onAutoLogout', 'Invalid access_token');
            this.setSession(null);
          }
          throw err;
        });
      }
    );
  };


  handleAuthentication = () => {
    const id_token = this.getIdToken();

    if (!id_token) {
      this.emit('onNoAccessToken');

      return;
    }

    if (this.isAuthTokenValid(id_token)) {
      const accessTokens = {
        id_token: this.getIdToken(),
        access_token: this.getAccessToken()
      }
      this.setSession(accessTokens);
      this.emit('onAutoLogin', true);
    } else {
      this.setSession(null);
      this.emit('onAutoLogout', 'access_token expired');
    }
  };

  createUser = (data) => {
    return new Promise((resolve, reject) => {
      axios.post(jwtServiceConfig.signUp, data).then((response) => {
        if (response.data.user) {
          this.setSession(response.data.access_token);
          resolve(response.data.user);
          this.emit('onLogin', response.data.user);
        } else {
          reject(response.data.error);
        }
      });
    });
  };

  signInWithEmailAndPassword = (email, password) => {
    return new Promise((resolve, reject) => {
      axios
        .get(jwtServiceConfig.signIn, {
          data: {
            email,
            password,
          },
        })
        .then((response) => {
          if (response.data.user) {
            this.setSession(response.data.access_token);
            resolve(response.data.user);
            this.emit('onLogin', response.data.user);
          } else {
            reject(response.data.error);
          }
        });
    });
  };

  //customization for connect to WSO2
  signInWithOAuth2 = (code) => {
    return new Promise((resolve, reject) => {

      let axiosConfig = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Access-Control-Allow-Origin": "*"
        },
        auth: {
          username: process.env.REACT_APP_AUTH_CONFIG_CLIENT_ID,
          password: process.env.REACT_APP_AUTH_CONFIG_CLIENT_SECRET
        }
      };

      axios
        .post(`${process.env.REACT_APP_AUTH_CONFIG_TOKEN_URL}?grant_type=authorization_code&code=${code}&redirect_uri=${process.env.REACT_APP_AUTH_CONFIG_CALLBACK_URL}&scope=openid`, null, axiosConfig)
        .then((response) => {
          if (response.data) {
            this.setSession(response.data);
            resolve(response.data);
            this.emit('onLogin', this.userDataFromToken());
          } else {
            this.logout();
            reject(new Error('Failed to login with token.'));
          }
        })
        .catch((error) => {
          this.logout();
          reject(new Error('Failed to login with token.'));
        });
    });
  };

  userDataFromToken = () => {

    if (this.isAuthTokenValid(this.getIdToken())) {
      const decoded = jwtDecode(this.getIdToken());
      const user = {
        role: ['admin'],
        data: {
          displayName: decoded['http://wso2.org/claims/fullname'],
          photoURL: 'assets/images/avatars/generic.png',
          email: decoded['http://wso2.org/claims/emailaddress'],
          shortcuts: ['apps.calendar', 'apps.mailbox', 'apps.contacts', 'apps.tasks'],
          loginRedirectUrl: '/'
        }
      }
      return user;
    } else {
      return null
    }
  }


  signInWithToken = () => {

    return new Promise((resolve, reject) => {
      const userData = this.userDataFromToken();
      if (userData) {
        resolve(userData);
      } else {
        this.logout();
        reject(new Error('Token is not valid'))
      }
    });
  };

  updateUserData = (user) => {
    return axios.post(jwtServiceConfig.updateUser, {
      user,
    });
  };

  setSession = (access_tokens) => {
    if (access_tokens) {
      localStorage.setItem('jwt_access_token', access_tokens.access_token);
      localStorage.setItem('jwt_id_token', access_tokens.id_token);
      //  axios.defaults.headers.common.Authorization = `Bearer ${access_tokens.id_token}`;
    } else {
      localStorage.removeItem('jwt_access_token');
      localStorage.removeItem('jwt_id_token');
      // delete axios.defaults.headers.common.Authorization;
    }
  };

  logout = () => {   
    this.setSession(null);
    this.emit('onLogout', 'Logged out');
  };

  logoutWso2 = () => {      
      axios.post(`${jwtServiceConfig.logOff}?id_token_hint=${this.getIdToken()}&post_logout_redirect_uri=${'http://localhost:3000/sign-out'}`)
  
  }

  isAuthTokenValid = (access_token) => {
    if (!access_token) {
      return false;
    }
    const decoded = jwtDecode(access_token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      console.warn('access token expired');
      return false;
    }

    return true;
  };

  getIdToken = () => {
    return window.localStorage.getItem('jwt_id_token');
  };

  getAccessToken = () => {
    return window.localStorage.getItem('jwt_access_token');
  }

  checkAuthenticatorSession = () => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${jwtServiceConfig.checkSession}?client_id=${process.env.REACT_APP_AUTH_CONFIG_CLIENT_ID}`, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        })
        .then((response) => {      
          resolve(true);
        })
        .catch((error) => {      
          reject(new Error('Failed to login with token.'));
        });
    });
  }
}

const instance = new JwtService();

export default instance;
