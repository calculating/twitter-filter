import OAuth from "oauth";
import type { ClientRequest, IncomingMessage } from "http";

// Promisify the OAuth library.

export default class extends OAuth.OAuth {
  // @ts-ignore due to method override having different signature
  async getOAuthAccessToken(
    oauth_token: string,
    oauth_token_secret: string,
    oauth_verifier: string
  ): Promise<[string, string, any]> {
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

  async getOAuthRequestToken(): Promise<[string, string, ClientRequest]> {
    return new Promise((resolve, reject) => {
      super.getOAuthRequestToken(
        (error, oauth_token, oauth_token_secret, res) =>
          error
            ? reject(error)
            : resolve([oauth_token, oauth_token_secret, res])
      );
    });
  }

  // @ts-ignore due to method override having different signature
  async get(
    url: string,
    access_token: string,
    access_token_secret: string
  ): Promise<[string, IncomingMessage | undefined]> {
    return new Promise((resolve, reject) => {
      super.get(url, access_token, access_token_secret, (error, data, res) => {
        if (typeof data !== "string") throw new Error("data is not a string");
        error ? reject(error) : resolve([data, res!]);
      });
    });
  }
}
