export const msalConfig = {
  auth: {
    clientId: "b2726b1d-f31a-4734-8c94-916164c6832b",
    authority: "https://login.microsoftonline.com/323130a0-43a9-4684-ae81-a01bd802414e/v2.0",
    //redirectUri: "https://chatbot.techants.au",
    redirectUri: "https://localhost:8080",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["api://b2726b1d-f31a-4734-8c94-916164c6832b/access_as_user"],
  prompt: "select_account", 
};
