import OAuth from "oauth";

// Promisify the OAuth library.

export default class extends OAuth.OAuth {
  async getOAuthAccessToken(oauth_token, oauth_token_secret, oauth_verifier) {
    return new Promise((resolve, reject) => {
      super.getOAuthAccessToken(
        oauth_token,
        oauth_token_secret,
        oauth_verifier,
        (error, oauth_access_token, oauth_access_token_secret, results) =>
          error
            ? reject(error)
            : resolve([oauth_access_token, oauth_access_token_secret, results])
      );
    });
  }

  async getOAuthRequestToken() {
    return new Promise((resolve, reject) => {
      super.getOAuthRequestToken(
        (error, oauth_token, oauth_token_secret, res) =>
          error
            ? reject(error)
            : resolve([oauth_token, oauth_token_secret, res])
      );
    });
  }

  async get(url, access_token, access_token_secret) {
    return new Promise((resolve, reject) => {
      super.get(url, access_token, access_token_secret, (error, data, res) =>
        error ? reject(error) : resolve([data, res])
      );
    });
  }
}
