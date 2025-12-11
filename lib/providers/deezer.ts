import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export interface DeezerProfile {
  id: number;
  name: string;
  email?: string;
  picture?: string;
  picture_medium?: string;
}

export default function Deezer<P extends DeezerProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "deezer",
    name: "Deezer",
    type: "oauth",
    authorization: {
      url: "https://connect.deezer.com/oauth/auth.php",
      params: {
        app_id: options.clientId,
        redirect_uri: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000"}/api/auth/callback/deezer`,
        perms: options.authorization?.params?.scope || "basic_access,email,offline_access,manage_library,delete_library",
        response_type: "code",
      },
    },
    token: {
      url: "https://connect.deezer.com/oauth/access_token.php",
      async request(context: any) {
        const { provider, params } = context;
        
        // Deezer token endpoint requires GET with query params
        const tokenUrl = new URL(provider.token?.url as string);
        tokenUrl.searchParams.set("app_id", provider.clientId as string);
        tokenUrl.searchParams.set("secret", provider.clientSecret as string);
        tokenUrl.searchParams.set("code", params.code as string);
        tokenUrl.searchParams.set("output", "json");

        const tokenResponse = await fetch(tokenUrl.toString());
        const data = await tokenResponse.json();

        return {
          tokens: {
            access_token: data.access_token,
            expires_in: data.expires,
          },
        };
      },
    },
    userinfo: {
      url: "https://api.deezer.com/user/me",
      async request(context: any) {
        const { provider, tokens } = context;
        const response = await fetch(`${provider.userinfo?.url}?access_token=${tokens.access_token}`);
        const profile = await response.json();
        return profile;
      },
    },
    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name,
        email: profile.email,
        image: profile.picture_medium || profile.picture || undefined,
      };
    },
    style: {
      logo: "https://e-cdns-files.dzcdn.net/cache/images/common/favicon/apple-touch-icon-57x57.png",
      bg: "#8f00fe",
      text: "#fff",
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
}
